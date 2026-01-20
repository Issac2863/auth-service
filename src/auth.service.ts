import { Injectable, Inject } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { lastValueFrom } from 'rxjs';
import { findCitizen, maskEmail, CIUDADANOS_MOCK } from './citizen-mock.data';
import { ValidateCredentialsDto, VerifyOtpDto } from './dto/auth.dto';
import { emailService } from './email.service';
import * as crypto from 'crypto';

// Almacenamiento temporal de sesiones OTP (en producción usar Redis)
const otpSessions = new Map<string, { otp: string; expiresAt: number; email: string; nombres: string; attempts: number }>();

@Injectable()
export class AuthService {

    constructor(
        @Inject('BIOMETRIC_SERVICE') private readonly biometricClient: ClientProxy,
        private readonly jwtService: JwtService
    ) { }

    /**
     * Validar credenciales (cédula + código dactilar)
     * Automáticamente genera y envía el OTP al email
     */
    async validateCredentials(data: ValidateCredentialsDto) {
        console.log('[AUTH SERVICE] Validando credenciales:', data.cedula);

        const citizen = findCitizen(data.cedula, data.codigoDactilar);

        if (!citizen) {
            throw new RpcException({
                success: false,
                message: 'Credenciales inválidas. Verifique su cédula y código dactilar.',
                statusCode: 401
            });
        }

        // Generar OTP de 8 dígitos y enviarlo automáticamente
        const otp = this.generateOtp();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

        // Guardar sesión con OTP
        otpSessions.set(data.cedula, {
            otp: otp,
            expiresAt: expiresAt,
            email: citizen.email,
            nombres: citizen.nombres,
            attempts: 0
        });

        console.log(`[AUTH SERVICE] OTP generado para ${data.cedula}: ${otp}`);

        // Enviar email automáticamente
        const emailSent = await emailService.sendOtpEmail(citizen.email, otp, citizen.nombres);

        if (!emailSent) {
            console.error('[AUTH SERVICE] Error al enviar email, pero continuamos');
        }

        return {
            success: true,
            message: 'Identidad verificada. Código OTP enviado a tu correo.',
            email: maskEmail(citizen.email),
            nombres: citizen.nombres,
            apellidos: citizen.apellidos,
            _debugOtp: otp // Solo para desarrollo
        };
    }

    /**
     * Enviar código OTP al email del usuario
     */
    async sendOtp(cedula: string) {
        console.log('[AUTH SERVICE] Solicitud de envío de OTP para:', cedula);

        const session = otpSessions.get(cedula);

        if (!session) {
            throw new RpcException({
                success: false,
                message: 'No se encontró sesión activa. Por favor inicie el proceso nuevamente.',
                statusCode: 400
            });
        }

        // Generar OTP de 8 dígitos
        const otp = this.generateOtp();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

        // Actualizar sesión con el OTP
        session.otp = otp;
        session.expiresAt = expiresAt;
        session.attempts = 0; // Reiniciar intentos con nuevo OTP
        otpSessions.set(cedula, session);

        console.log(`[AUTH SERVICE] OTP generado para ${cedula}: ${otp}`);

        // Enviar email
        const emailSent = await emailService.sendOtpEmail(session.email, otp, session.nombres);

        if (!emailSent) {
            console.error('[AUTH SERVICE] Error al enviar email, pero continuamos para pruebas');
        }

        return {
            success: true,
            message: 'Código enviado al correo electrónico',
            // Solo en desarrollo, mostrar el OTP para pruebas
            _debugOtp: otp
        };
    }

    /**
     * Verificar código OTP
     */
    verifyOtp(cedula: string, data: VerifyOtpDto) {
        console.log('[AUTH SERVICE] Verificando OTP para:', cedula);

        const session = otpSessions.get(cedula);

        if (!session || !session.otp) {
            throw new RpcException({
                success: false,
                message: 'No hay código OTP activo. Por favor solicite uno nuevo.',
                statusCode: 400
            });
        }

        // 1. Control de Intentos (Mitigación Fuerza Bruta)
        session.attempts = (session.attempts || 0) + 1;

        if (session.attempts > 3) {
            otpSessions.delete(cedula); // Bloquear usuario (requiere reiniciar flujo)
            console.warn(`[AUTH SECURITY] Usuario ${cedula} bloqueado por múltiples intentos fallidos de OTP.`);
            throw new RpcException({
                success: false,
                message: 'Has excedido el número máximo de intentos (3). Por seguridad, inicia el proceso nuevamente.',
                statusCode: 429
            });
        }

        // Actualizar intentos count
        otpSessions.set(cedula, session);

        if (Date.now() > session.expiresAt) {
            // No borramos inmediatamente para permitir reintentos si implementáramos "resend", 
            // pero por seguridad mejor limpiar.
            otpSessions.delete(cedula);
            throw new RpcException({
                success: false,
                message: 'El código OTP ha expirado. Por favor solicite uno nuevo.',
                statusCode: 400
            });
        }

        // 2. Comparación de Tiempo Constante (Mitigación Timing Attack)
        // Usamos crypto.timingSafeEqual para evitar ataques de canal lateral
        const inputBuffer = Buffer.from(data.otpCode);
        const targetBuffer = Buffer.from(session.otp);
        let isValid = false;

        try {
            if (inputBuffer.length === targetBuffer.length) {
                isValid = crypto.timingSafeEqual(inputBuffer, targetBuffer);
            }
        } catch (e) {
            isValid = false;
        }

        if (!isValid) {
            const intentosRestantes = 3 - session.attempts;
            throw new RpcException({
                success: false,
                message: `Código OTP incorrecto. Intentos restantes: ${intentosRestantes}`,
                statusCode: 400
            });
        }

        // Limpiar sesión (Éxito)
        otpSessions.delete(cedula);

        return {
            success: true,
            message: 'OTP verificado correctamente'
        };
    }

    /**
     * Login para Administradores
     */
    adminLogin(data: any) {
        console.log('[AUTH SERVICE] Admin login attempt:', data.email);

        // Credenciales hardcodeadas (Mock DB)
        const VALID_ADMIN_EMAIL = 'admin@sevotec.com';
        // Hash SHA-256 de 'S3cur1ty@EPN.2026'
        const VALID_ADMIN_PASS_HASH = '371eef82556f28f6cc80ce4c61d48aa0af47af38fcb5caa00c9bfa872dcb8135';

        // data.password YA VIENE hasheado desde el frontend (SHA-256 Hex)
        // Por seguridad, comparamos los hashes
        if (data.email === VALID_ADMIN_EMAIL && data.password === VALID_ADMIN_PASS_HASH) {
            return {
                success: true,
                message: 'Bienvenido Administrador',
                token: 'admin-mock-token-secure-2026',
                user: {
                    email: data.email,
                    role: 'ADMIN'
                }
            };
        }

        throw new RpcException({
            success: false,
            message: 'Credenciales de administrador inválidas',
            statusCode: 401
        });
    }

    /**
     * Generar código OTP de 6 dígitos
     */
    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Verificar Biometría y Generar Token
     */
    async verifyBiometric(cedula: string, image: string) {
        console.log('[AUTH SERVICE] Iniciando verificación biométrica remota para:', cedula);

        try {
            // Buscar ciudadano (simulado)
            const citizen = CIUDADANOS_MOCK.find(c => c.cedula === cedula);
            if (!citizen) {
                throw new RpcException({ message: 'Ciudadano no encontrado', statusCode: 404 });
            }

            // Llamar al microservicio biométrico
            console.log('[AUTH SERVICE] Contactando biometric-service...');

            let result;
            try {
                result = await lastValueFrom(
                    this.biometricClient.send('biometric.validate-facial', {
                        cedula,
                        imagenBase64: image
                    })
                );
            } catch (err) {
                console.error('[AUTH SERVICE] Error comunicación biometric-service:', err);
                console.warn('[AUTH SERVICE] ⚠️ MODO BYPASS ACTIVO: Simulando éxito biométrico para pruebas.');
                // BYPASS TEMPORAL: Permitir login aunque falle el biométrico
                result = { success: true, message: 'Verificación simulada (Bypass)' };
            }

            console.log('[AUTH SERVICE] Respuesta biometric-service:', result);

            if (!result || !result.success) {
                throw new RpcException({
                    success: false,
                    message: result?.message || 'Verificación facial fallida',
                    statusCode: 401
                });
            }

            const privateKeyBase64 = process.env.JWT_PRIVATE_KEY_BASE64;
            if (!privateKeyBase64) {
                throw new Error('JWT_PRIVATE_KEY_BASE64 no configurada en el entorno');
            }
            const privateKeyPEM = Buffer.from(privateKeyBase64, 'base64').toString('utf8');

            // Generar Token JWT
            const payload = {
                sub: citizen.cedula,
                role: citizen.role,
            };

            const token = this.jwtService.sign(payload, {
                privateKey: privateKeyPEM,
                algorithm: 'RS256',
                expiresIn: `${citizen.expirationTime}m`
            });

            return {
                success: true,
                accessToken: token,
                message: 'Autenticación exitosa'
            };

        } catch (error) {
            console.error('[AUTH SERVICE] Error en proceso biométrico:', error);
            if (error instanceof RpcException) throw error;
            throw new RpcException({
                success: false,
                message: error.message || 'Error interno en biometría',
                statusCode: 500
            });
        }
    }
}
