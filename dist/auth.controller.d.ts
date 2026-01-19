import { AuthService } from './auth.service';
import { ValidateCredentialsDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    validateCredentials(data: ValidateCredentialsDto): {
        success: boolean;
        message: string;
        email: string;
        nombres: string;
        apellidos: string;
    };
    sendOtp(data: {
        cedula: string;
    }): Promise<{
        success: boolean;
        message: string;
        _debugOtp: string;
    }>;
    verifyOtp(data: {
        cedula: string;
        otpCode: string;
    }): {
        success: boolean;
        message: string;
    };
    healthCheck(): {
        status: string;
        service: string;
        timestamp: string;
    };
}
