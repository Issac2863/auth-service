import { ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { ValidateCredentialsDto, VerifyOtpDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly biometricClient;
    private readonly jwtService;
    constructor(biometricClient: ClientProxy, jwtService: JwtService);
    validateCredentials(data: ValidateCredentialsDto): Promise<{
        success: boolean;
        message: string;
        email: string;
        nombres: string;
        apellidos: string;
        _debugOtp: string;
    }>;
    sendOtp(cedula: string): Promise<{
        success: boolean;
        message: string;
        _debugOtp: string;
    }>;
    verifyOtp(cedula: string, data: VerifyOtpDto): {
        success: boolean;
        message: string;
    };
    adminLogin(data: any): {
        success: boolean;
        message: string;
        token: string;
        user: {
            email: any;
            role: string;
        };
    };
    private generateOtp;
    verifyBiometric(cedula: string, image: string): Promise<{
        success: boolean;
        accessToken: string;
        expirationTime: number;
        message: string;
    }>;
}
