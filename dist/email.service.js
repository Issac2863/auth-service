"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const resend_1 = require("resend");
class EmailService {
    resend;
    constructor() {
        this.resend = new resend_1.Resend(process.env.RESEND_API_KEY || 're_MQv5eWkh_FaHYnrmfgaZJtfax4d7yGSim');
    }
    async sendOtpEmail(to, otp, nombres) {
        try {
            console.log(`[EMAIL SERVICE] Enviando OTP a ${to} via Resend...`);
            const { data, error } = await this.resend.emails.send({
                from: 'SEVOTEC <onboarding@resend.dev>',
                to: [to],
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
            });
            if (error) {
                console.error('[EMAIL SERVICE] Error Resend:', error);
                return false;
            }
            console.log(`[EMAIL SERVICE] Email enviado exitosamente: ${data?.id}`);
            return true;
        }
        catch (error) {
            console.error('[EMAIL SERVICE] Error al enviar email:', error);
            return false;
        }
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=email.service.js.map