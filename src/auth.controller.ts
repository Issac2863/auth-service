import { Controller, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './services/auth.service';
import { ValidateCredentialsDto } from './dto/auth.dto';
import { InternalApiKeyGuard } from './guards/internalApiKey.guard';
import { EnvelopeOpenerInterceptor } from './interceptors/envelopeOpener.interceptor';
import { AdminService } from './services/admin.service';

/**
 * @class AuthController
 * @description Controlador que expone los endpoints de autenticación vía TCP.
 * Protegido con guard e interceptor de seguridad interna para validar comunicaciones del API Gateway.
 */
@Controller()
@UseGuards(InternalApiKeyGuard) // Valida la autenticidad de las peticiones del Gateway
@UseInterceptors(EnvelopeOpenerInterceptor) // Desencripta y valida sobres de seguridad
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        private readonly authService: AuthService,
        private readonly adminService: AdminService

    ) { }

    /**
     * @method validateCredentials
     * @description Primer paso del flujo: valida las credenciales básicas del ciudadano (cédula y código dactilar).
     * @param {ValidateCredentialsDto} data - DTO con cédula y código dactilar del ciudadano.
     * @returns {object} Resultado de la validación de credenciales.
     */
    @MessagePattern('auth.validate-credentials')
    validateCredentials(@Payload('data') data: ValidateCredentialsDto) {
        this.logger.log(`[Step 1] Validando credenciales para cédula: ${data.cedula}`);
        return this.authService.validateCredentials(data);
    }

    /**
     * @method sendOtp
     * @description Envía un código OTP al email del ciudadano previamente validado.
     * @param {object} data - Objeto con la cédula del ciudadano.
     * @returns {Promise<object>} Confirmación del envío del OTP.
     */
    @MessagePattern('auth.send-otp')
    async sendOtp(@Payload('data') data: { cedula: string }) {
        this.logger.log(`[OTP Request] Enviando código OTP para cédula: ${data.cedula}`);
        return this.authService.sendOtp(data.cedula);
    }

    /**
     * @method verifyOtp
     * @description Segundo paso del flujo: verifica el código OTP proporcionado por el usuario.
     * @param {object} data - Objeto con cédula y código OTP.
     * @returns {object} Resultado de la verificación del OTP.
     */
    @MessagePattern('auth.verify-otp')
    verifyOtp(@Payload('data') data: { id: string; otpCode: string }) {
        this.logger.log(`[Step 2] Verificando OTP para cédula: ${data.id}`);
        return this.authService.verifyOtp(data);
    }

    /**
     * @method verifyBiometric
     * @description Paso final del flujo: validación biométrica del rostro del usuario.
     * @param {object} data - Objeto con cédula e imagen biométrica en base64.
     * @returns {Promise<object>} Resultado de la verificación biométrica y token de acceso.
     */
    @MessagePattern('auth.biometric')
    async verifyBiometric(@Payload('data') data: { id: string; image: string }) {
        this.logger.log(`[Step 3] Procesando verificación biométrica para cédula: ${data.id}`);
        return this.authService.verifyBiometric(data.id, data.image);
    }

    /**
     * @method adminLogin
     * @description Autentica las credenciales de un administrador del sistema.
     * @param {any} data - Credenciales del administrador.
     * @returns {object} Resultado de la autenticación administrativa.
     */
    @MessagePattern('auth.admin-login')
    adminLogin(@Payload('data') data: {email: string; password: string}) {
        this.logger.log(`Procesando autenticación de administrador: ${data.email}`);
        return this.adminService.adminLogin(data);
    }

    /**
     * @method healthCheck
     * @description Endpoint de verificación de estado del microservicio.
     * @returns {object} Estado actual del servicio con timestamp.
     */
    @MessagePattern('auth.health')
    healthCheck() {
        return {
            status: 'ok',
            service: 'auth-service',
            timestamp: new Date().toISOString()
        };
    }
    
}