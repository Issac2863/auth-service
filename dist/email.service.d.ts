export declare class EmailService {
    private transporter;
    constructor();
    sendOtpEmail(to: string, otp: string, nombres: string): Promise<boolean>;
}
export declare const emailService: EmailService;
