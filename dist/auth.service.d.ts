import { ValidateCredentialsDto, VerifyOtpDto } from './dto/auth.dto';
export declare class AuthService {
    validateCredentials(data: ValidateCredentialsDto): {
        success: boolean;
        message: string;
        email: string;
        nombres: string;
        apellidos: string;
    };
    sendOtp(cedula: string): Promise<{
        success: boolean;
        message: string;
        _debugOtp: string;
    }>;
    verifyOtp(cedula: string, data: VerifyOtpDto): {
        success: boolean;
        message: string;
    };
    private generateOtp;
}
