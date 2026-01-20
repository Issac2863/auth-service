export declare class EmailService {
    private resend;
    constructor();
    sendOtpEmail(to: string, otp: string, nombres: string): Promise<boolean>;
}
export declare const emailService: EmailService;
