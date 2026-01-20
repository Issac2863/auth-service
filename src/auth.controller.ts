import { Controller, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { ValidateCredentialsDto } from './dto/auth.dto';
import { InternalSecurityGuard } from './guards/internal-security.guard';
import { InternalSecurityInterceptor } from './interceptors/internal-security.interceptor';

@Controller()
@UseGuards(InternalSecurityGuard)
@UseInterceptors(InternalSecurityInterceptor)
export class AuthController {
    // Instanciamos el logger con el nombre de la clase
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) { }

    /**
     * Validar cédula y código dactilar
     * Pattern: auth.validate-credentials
     */
    @MessagePattern('auth.validate-credentials')
    validateCredentials(@Payload('data') data: ValidateCredentialsDto) {
        this.logger.log('--- [PATTERN] auth.validate-credentials ---');
        this.logger.debug(`Datos recibidos: ${JSON.stringify(data)}`);
        return this.authService.validateCredentials(data);
    }

    /**
     * Enviar código OTP al email
     * Pattern: auth.send-otp
     */
    @MessagePattern('auth.send-otp')
    async sendOtp(@Payload('data') data: { cedula: string }) {
        this.logger.log(`--- [PATTERN] auth.send-otp para cédula: ${data.cedula} ---`);
        return this.authService.sendOtp(data.cedula);
    }

    /**
     * Verificar código OTP
     * Pattern: auth.verify-otp
     */
    @MessagePattern('auth.verify-otp')
    verifyOtp(@Payload('data') data: { cedula: string; otpCode: string }) {
        this.logger.log(`--- [PATTERN] auth.verify-otp para cédula: ${data.cedula} ---`);
        this.logger.debug(`Código OTP: ${data.otpCode}`);
        return this.authService.verifyOtp(data.cedula, { otpCode: data.otpCode });
    }

    /**
     * Validación Biométrica
     * Pattern: auth.biometric
     */
    @MessagePattern('auth.biometric')
    async verifyBiometric(@Payload('data') data: { cedula: string; image: string }) {
        this.logger.log(`--- [PATTERN] auth.biometric para cédula: ${data.cedula} ---`);
        return this.authService.verifyBiometric(data.cedula, data.image);
    }

    /**
     * Login Administrador
     * Pattern: auth.admin-login
     */
    @MessagePattern('auth.admin-login')
    adminLogin(@Payload('data') data: any) {
        this.logger.log('--- [PATTERN] auth.admin-login ---');
        return this.authService.adminLogin(data);
    }

    /**
     * Health check
     * Pattern: auth.health
     */
    @MessagePattern('auth.health')
    healthCheck() {
        this.logger.log('--- [HEALTH] Petición recibida ---');
        return {
            status: 'ok',
            service: 'auth-service',
            timestamp: new Date().toISOString()
        };
    }
}