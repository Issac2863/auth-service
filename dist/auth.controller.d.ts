import { AuthService } from './services/auth.service';
import { ValidateCredentialsDto } from './dto/auth.dto';
import { AdminService } from './services/admin.service';
export declare class AuthController {
    private readonly authService;
    private readonly adminService;
    private readonly logger;
    constructor(authService: AuthService, adminService: AdminService);
    validateCredentials(data: ValidateCredentialsDto): Promise<void | {
        success: boolean;
        id: any;
        message: string;
        email: string;
    }>;
    sendOtp(data: {
        cedula: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(data: {
        id: string;
        otpCode: string;
    }): {
        success: boolean;
        message: string;
    };
    verifyBiometric(data: {
        id: string;
        image: string;
    }): Promise<{
        success: boolean;
        accessToken: string;
        expirationTime: number;
        message: string;
    }>;
    adminLogin(data: {
        email: string;
        password: string;
    }): Promise<{
        success: boolean;
        message: string;
        accessToken: string;
        expirationTime: number;
        user: {
            email: any;
            role: any;
        };
    }>;
    healthCheck(): {
        status: string;
        service: string;
        timestamp: string;
    };
}
