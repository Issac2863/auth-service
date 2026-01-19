import * as nodemailer from 'nodemailer';

/**
 * Servicio de Email para envío de códigos OTP
 */
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Configurar transporter con Gmail
        // NOTA: En producción, usar variables de entorno
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'smtpepn2026@gmail.com',
                pass: process.env.EMAIL_PASSWORD || 'atqh eize uexy fxmn',
            },
        });
    }

    /**
     * Enviar código OTP por email
     */
    async sendOtpEmail(to: string, otp: string, nombres: string): Promise<boolean> {
        const mailOptions = {
            from: '"SEVOTEC - CNE" <smtpepn2026@gmail.com>',
            to: to,
            subject: '🔐 Código de Verificación - SEVOTEC',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1a5276 0%, #2980b9 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; text-align: center; }
            .otp-code { font-size: 36px; font-weight: bold; color: #1a5276; letter-spacing: 8px; background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .warning { font-size: 12px; color: #666; margin-top: 20px; }
            .footer { background: #f9f9f9; padding: 15px; text-align: center; font-size: 11px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🗳️ SEVOTEC</h1>
              <p style="margin:5px 0 0;">Sistema de Votación Electrónica</p>
            </div>
            <div class="content">
              <p>Hola <strong>${nombres}</strong>,</p>
              <p>Tu código de verificación es:</p>
              <div class="otp-code">${otp}</div>
              <p>Este código expira en <strong>5 minutos</strong>.</p>
              <p class="warning">⚠️ Si no solicitaste este código, ignora este mensaje.</p>
            </div>
            <div class="footer">
              <p>Consejo Nacional Electoral - Ecuador</p>
              <p>Este es un correo automático, no responder.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };

        try {
            console.log(`[EMAIL SERVICE] Enviando OTP a ${to}...`);
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[EMAIL SERVICE] Email enviado: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error('[EMAIL SERVICE] Error al enviar email:', error);
            return false;
        }
    }
}

// Singleton instance
export const emailService = new EmailService();
