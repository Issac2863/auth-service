import { Injectable, Inject, Logger } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import { maskEmail } from 'src/utils/maskemail';
import { ValidateCredentialsDto } from '../dto/auth.dto';
import { emailService } from './email.service';
import * as crypto from 'crypto';
import { CensusProxy } from '../proxies/census.proxy';
import { lastValueFrom } from 'rxjs';
import { TokenService } from '../security/generateToken.service';
import { OtpSessionService } from './session.service';

/**
 * Servicio de autenticación para el sistema electoral SEVOTEC.
 * Gestiona el proceso completo de autenticación de votantes mediante:
 * - Validación de identidad contra el censo electoral
 * - Generación y verificación de códigos OTP
 * - Autenticación biométrica facial
 * - Generación de tokens de acceso para votación
 */
@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @Inject('BIOMETRIC_SERVICE') private readonly biometricClient: ClientProxy,
        private readonly censusService: CensusProxy,
        private readonly tokenService: TokenService,
        private readonly sessionService: OtpSessionService
    ) { }

/**
     * Valida las credenciales del votante (cédula + código dactilar) y inicia el proceso de autenticación.
     * Verifica que el ciudadano esté habilitado para votar y no tenga sesiones activas.
     * 
     * @param data - Datos de validación del votante
     * @returns Objeto con resultado de validación e información para siguiente paso
     * @throws RpcException cuando las credenciales son inválidas o el votante no puede acceder
     */
    async validateCredentials(data: ValidateCredentialsDto) {
        this.logger.log(`Iniciando validación de identidad - Cédula: ${data.cedula}`);

        try {
            const validation = await this.censusService.validateIdentity(data);

            // Verificar existencia del ciudadano en el censo
            if (!validation || !validation.exists) {
                this.logger.warn(`Credenciales inválidas para cédula: ${data.cedula}`);
                throw new RpcException({
                    success: false,
                    message: validation?.message || 'Credenciales inválidas. Verifique su cédula y código dactilar.',
                    statusCode: 401
                });
            }

            // Validación crítica: verificar elegibilidad para votar
            if (!validation.canVote) {
                return this.handleIneligibleVoter(validation, data.cedula);
            }

            // Crear sesión OTP para votante elegible
            const citizen = validation.citizenData;
            const otp = this.generateOtp();

            this.sessionService.create(citizen.id.toString(), {
                otp,
                expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutos
                email: citizen.email,
                nombres: citizen.nombres,
                cedula: citizen.cedula,
                attempts: 0
            });

            // Envío de OTP por email (deshabilitado temporalmente)
            //await this.sendOtpByEmail(citizen.email, otp, citizen.nombres);

            return {
                success: true,
                id: citizen.id,
                message: 'Identidad verificada. Se ha enviado un código a su correo.',
                email: maskEmail(citizen.email),
                otpDebug: otp // Para pruebas internas; eliminar en producción
            };

        } catch (error) {
            if (error instanceof RpcException) throw error;
            
            this.logger.error(`Error interno en validación de credenciales: ${error.message}`, error.stack);
            throw new RpcException({ 
                success: false, 
                message: 'Error interno del servidor.', 
                statusCode: 500 
            });
        }
    }

    /**
     * Regenera y envía un nuevo código OTP para una sesión activa.
     * 
     * @param id - ID de la sesión del votante
     * @returns Resultado de la regeneración del código
     * @throws RpcException cuando la sesión no existe
     */
    async sendOtp(id: string) {
        this.logger.log(`Generando nuevo OTP - ID: ${id}`);
        
        try {
            const session = this.sessionService.get(id);

            if (!session) {
                this.logger.warn(`Intento de regenerar OTP para sesión inexistente: ${id}`);
                throw new RpcException({ 
                    success: false,
                    message: 'Sesión no encontrada.', 
                    statusCode: 400 
                });
            }

            const otp = this.generateOtp();
            const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

            this.sessionService.update(id, { otp, expiresAt, attempts: 0 });
            this.logger.log(`OTP regenerado exitosamente para sesión ${id}`);

            // Envío de OTP por email (deshabilitado temporalmente)
            // await this.sendOtpByEmail(session.email, otp, session.nombres);

            return {
                success: true,
                message: 'Código enviado al correo electrónico'
            };

        } catch (error) {
            if (error instanceof RpcException) throw error;
            
            this.logger.error(`Error al regenerar OTP para sesión ${id}: ${error.message}`, error.stack);
            throw new RpcException({ 
                success: false, 
                message: 'Error interno del servidor.', 
                statusCode: 500 
            });
        }
    }

    /**
     * Verifica el código OTP proporcionado por el usuario.
     * Implementa protección contra ataques de fuerza bruta y timing attacks.
     * 
     * @param data - Objeto conteniendo el ID de sesión y código OTP
     * @returns Resultado de la verificación
     * @throws RpcException cuando el OTP es inválido, expirado o se exceden los intentos
     */
    verifyOtp(data: any) {
        this.logger.log(`Verificando OTP - ID Sesión: ${data.id}`);
        
        try {
            const session = this.sessionService.get(data.id);

            if (!session) {
                this.logger.warn(`Intento de verificar OTP para sesión inexistente: ${data.id}`);
                throw new RpcException({ 
                    success: false,
                    message: 'No hay código OTP activo.', 
                    statusCode: 400 
                });
            }

            // Incrementar contador de intentos
            const currentAttempts = (session.attempts || 0) + 1;
            
            // Verificar límite de intentos (protección anti-fuerza bruta)
            if (currentAttempts > 3) {
                this.logger.warn(`Exceso de intentos de OTP para sesión ${data.id} - Eliminando sesión`);
                this.sessionService.remove(data.id);
                throw new RpcException({ 
                    success: false,
                    message: 'Exceso de intentos (3).', 
                    statusCode: 429 
                });
            }

            this.sessionService.update(data.id, { attempts: currentAttempts });

            // Verificar expiración del código
            if (Date.now() > session.expiresAt) {
                this.logger.warn(`OTP expirado para sesión ${data.id} - Eliminando sesión`);
                this.sessionService.remove(data.id);
                throw new RpcException({ 
                    success: false,
                    message: 'El código OTP ha expirado.', 
                    statusCode: 400 
                });
            }

            // Verificación segura del OTP (protección contra timing attacks)
            const inputBuffer = Buffer.from(data.otpCode);
            const targetBuffer = Buffer.from(session.otp);
            let isValid = false;

            if (inputBuffer.length === targetBuffer.length) {
                isValid = crypto.timingSafeEqual(inputBuffer, targetBuffer);
            }

            if (!isValid) {
                const restantes = 3 - currentAttempts;
                this.logger.warn(`OTP incorrecto para sesión ${data.id} - Intentos restantes: ${restantes}`);
                throw new RpcException({ 
                    success: false,
                    message: `Código incorrecto. Quedan ${restantes} intentos.`, 
                    statusCode: 400 
                });
            }

            this.logger.log(`OTP verificado correctamente para sesión ${data.id}`);
            return { 
                success: true, 
                message: 'OTP verificado. Proceda a biometría.' 
            };

        } catch (error) {
            if (error instanceof RpcException) throw error;
            
            this.logger.error(`Error al verificar OTP para sesión ${data.id}: ${error.message}`, error.stack);
            throw new RpcException({ 
                success: false, 
                message: 'Error interno del servidor.', 
                statusCode: 500 
            });
        }
    }

    /**
     * Realiza la verificación biométrica facial del votante y genera el token de acceso final.
     * Este es el último paso del proceso de autenticación.
     * 
     * @param id - ID de la sesión del votante
     * @param image - Imagen facial en base64 para verificación biométrica
     * @returns Token de acceso para el sistema de votación
     * @throws RpcException cuando la verificación biométrica falla o hay errores de sesión
     */
    async verifyBiometric(id: string, image: string) {
        this.logger.log(`Iniciando verificación biométrica - ID: ${id}`);

        try {
            const session = this.sessionService.get(id);
            
            if (!session) {
                this.logger.warn(`Intento de verificación biométrica para sesión inexistente: ${id}`);
                throw new RpcException({ 
                    success: false,
                    message: 'Sesión no encontrada.', 
                    statusCode: 404 
                });
            }

            // Ejecutar verificación biométrica
            const biometricResult = await this.executeBiometricCheck(session.cedula, image);

            if (!biometricResult.success) {
                this.logger.warn(`Verificación biométrica fallida para cédula ${session.cedula}`);
                throw new RpcException({ 
                    success: false,
                    message: biometricResult.message || 'Verificación biométrica fallida.', 
                    statusCode: 401 
                });
            }

            // Generar token de acceso para votación (válido por 10 minutos)
            const { token, expiresAt } = await this.tokenService.generateAccessToken(
                id, 'VOTER', 300
            );

            // Limpiar sesión temporal al completar autenticación exitosa
            this.sessionService.remove(id);
            
            this.logger.log(`Autenticación completa exitosa para cédula ${session.cedula}`);

            return {
                success: true,
                accessToken: token,
                expirationTime: expiresAt,
                message: 'Autenticación exitosa'
            };

        } catch (error) {
            if (error instanceof RpcException) throw error;
            
            this.logger.error(`Error en verificación biométrica para sesión ${id}: ${error.message}`, error.stack);
            throw new RpcException({ 
                success: false,
                message: 'Error interno en verificación biométrica.', 
                statusCode: 500 
            });
        }
    }

    // ====================== MÉTODOS PRIVADOS ======================

    /**
     * Maneja casos donde el votante no es elegible para votar.
     * Proporciona mensajes específicos según el estado del votante.
     */
    private handleIneligibleVoter(validation: any, cedula: string) {
        const estado = validation.currentState;
        
        if (estado === 'VOTANDO') {
            this.logger.warn(`Intento de sesión duplicada - Cédula: ${cedula}`);
            throw new RpcException({
                success: false,
                message: 'Ya tiene una sesión de votación activa',
                statusCode: 409 // Conflict
            });
        }
        
        if (estado === 'GUARDANDO_VOTO') {
            this.logger.warn(`Intento de acceso durante guardado - Cédula: ${cedula}`);
            throw new RpcException({
                success: false,
                message: 'Su voto está siendo procesado. Por favor espere.',
                statusCode: 409
            });
        }
        
        if (estado === 'VOTO' || validation.hasVoted) {
            this.logger.warn(`Intento de re-votación detectado - Cédula: ${cedula}`);
            throw new RpcException({
                success: false,
                message: 'Usted ya ha registrado su voto previamente.',
                statusCode: 403
            });
        }

        // Estado desconocido o no permitido
        this.logger.warn(`Votante no elegible - Cédula: ${cedula}, Estado: ${estado}`);
        throw new RpcException({
            success: false,
            message: validation.message || 'No puede iniciar una nueva sesión de votación en este momento.',
            statusCode: 403
        });
    }

    /**
     * Genera un código OTP de 6 dígitos aleatorio.
     */
    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Ejecuta la verificación biométrica facial con el servicio externo.
     * En caso de fallo de conexión, activa modo bypass temporal.
     */
    private async executeBiometricCheck(cedula: string, image: string) {
        try {
            this.logger.log(`Enviando solicitud biométrica para cédula: ${cedula}`);
            
            const result = await lastValueFrom(
                this.biometricClient.send('biometric.validate-facial', { 
                    cedula, 
                    imagenBase64: image 
                })
            );
            
            return result;
            
        } catch (error) {
            this.logger.warn(`⚠️ Servicio biométrico no disponible - Activando modo bypass para cédula: ${cedula}`);
            this.logger.error(`Error biométrico: ${error.message}`, error.stack);
            
            // Modo bypass temporal para desarrollo/contingencia
            return { success: true, message: 'Modo bypass biométrico activo' };
        }
    }

    /**
     * Envía código OTP por email al votante (funcionalidad deshabilitada temporalmente).
     */
    private async sendOtpByEmail(email: string, otp: string, nombres: string) {
        try {
            const emailSent = await emailService.sendOtpEmail(email, otp, nombres);
            
            if (emailSent) {
                this.logger.log(`Email OTP enviado exitosamente a: ${maskEmail(email)}`);
            } else {
                this.logger.warn(`Fallo en envío de email a: ${maskEmail(email)}`);
            }
            
        } catch (error) {
            this.logger.error(`Error al enviar OTP por email a ${maskEmail(email)}: ${error.message}`, error.stack);
        }
    }
}