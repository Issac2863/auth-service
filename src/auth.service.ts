import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { findCitizen, maskEmail, CIUDADANOS_MOCK } from './citizen-mock.data';
import { ValidateCredentialsDto, VerifyOtpDto } from './dto/auth.dto';
import { emailService } from './email.service';

import * as crypto from 'crypto';

// Almacenamiento temporal de sesiones OTP (en producción usar Redis)
const otpSessions = new Map<string, { otp: string; expiresAt: number; email: string; nombres: string; attempts: number }>();

@Injectable()
export class AuthService {

    /**
     * Validar credenciales (cédula + código dactilar)
     */
    validateCredentials(data: ValidateCredentialsDto) {
        console.log('[AUTH SERVICE] Validando credenciales:', data.cedula);

        const citizen = findCitizen(data.cedula, data.codigoDactilar);

        if (!citizen) {
            throw new RpcException({
                success: false,
                message: 'Credenciales inválidas. Verifique su cédula y código dactilar.',
                statusCode: 401
            });
        }

        // Guardar info del ciudadano para enviar OTP después
        // NO generamos OTP aquí, esperamos a que el usuario lo solicite
        otpSessions.set(data.cedula, {
            otp: '',
            expiresAt: 0,
            email: citizen.email,
            nombres: citizen.nombres,
            attempts: 0 // Iniciar contador
        });

        return {
            success: true,
            message: 'Identidad Verificada',
            email: maskEmail(citizen.email),
            nombres: citizen.nombres,
            apellidos: citizen.apellidos
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
     * Generar código OTP de 8 dígitos
     */
    private generateOtp(): string {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    }
}
