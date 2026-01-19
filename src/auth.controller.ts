import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { ValidateCredentialsDto, VerifyOtpDto } from './dto/auth.dto';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Validar cédula y código dactilar
     * Pattern: auth.validate-credentials
     */
    @MessagePattern('auth.validate-credentials')
    validateCredentials(@Payload() data: ValidateCredentialsDto) {
        console.log('[AUTH CONTROLLER] Mensaje recibido: auth.validate-credentials');
        return this.authService.validateCredentials(data);
    }

    /**
     * Enviar código OTP al email
     * Pattern: auth.send-otp
     */
    @MessagePattern('auth.send-otp')
    async sendOtp(@Payload() data: { cedula: string }) {
        console.log('[AUTH CONTROLLER] Mensaje recibido: auth.send-otp');
        return this.authService.sendOtp(data.cedula);
    }

    /**
     * Verificar código OTP
     * Pattern: auth.verify-otp
     */
    @MessagePattern('auth.verify-otp')
    verifyOtp(@Payload() data: { cedula: string; otpCode: string }) {
        console.log('[AUTH CONTROLLER] Mensaje recibido: auth.verify-otp');
        return this.authService.verifyOtp(data.cedula, { otpCode: data.otpCode });
    }

    /**
     * Login Administrador
     * Pattern: auth.admin-login
     */
    @MessagePattern('auth.admin-login')
    adminLogin(@Payload() data: any) {
        console.log('[AUTH CONTROLLER] Mensaje recibido: auth.admin-login');
        return this.authService.adminLogin(data);
    }

    /**
     * Health check
     * Pattern: auth.health
     */
    @MessagePattern('auth.health')
    healthCheck() {
        return { status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() };
    }
}
