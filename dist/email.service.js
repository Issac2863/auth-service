"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer = __importStar(require("nodemailer"));
class EmailService {
    transporter;
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'smtpepn2026@gmail.com',
                pass: process.env.EMAIL_PASSWORD || 'atqh eize uexy fxmn',
            },
        });
    }
    async sendOtpEmail(to, otp, nombres) {
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