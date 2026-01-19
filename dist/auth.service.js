"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const citizen_mock_data_1 = require("./citizen-mock.data");
const email_service_1 = require("./email.service");
const otpSessions = new Map();
let AuthService = class AuthService {
    validateCredentials(data) {
        console.log('[AUTH SERVICE] Validando credenciales:', data.cedula);
        const citizen = (0, citizen_mock_data_1.findCitizen)(data.cedula, data.codigoDactilar);
        if (!citizen) {
            throw new microservices_1.RpcException({
                success: false,
                message: 'Credenciales inválidas. Verifique su cédula y código dactilar.',
                statusCode: 401
            });
        }
        otpSessions.set(data.cedula, {
            otp: '',
            expiresAt: 0,
            email: citizen.email,
            nombres: citizen.nombres
        });
        return {
            success: true,
            message: 'Identidad Verificada',
            email: (0, citizen_mock_data_1.maskEmail)(citizen.email),
            nombres: citizen.nombres,
            apellidos: citizen.apellidos
        };
    }
    async sendOtp(cedula) {
        console.log('[AUTH SERVICE] Solicitud de envío de OTP para:', cedula);
        const session = otpSessions.get(cedula);
        if (!session) {
            throw new microservices_1.RpcException({
                success: false,
                message: 'No se encontró sesión activa. Por favor inicie el proceso nuevamente.',
                statusCode: 400
            });
        }
        const otp = this.generateOtp();
        const expiresAt = Date.now() + 5 * 60 * 1000;
        session.otp = otp;
        session.expiresAt = expiresAt;
        otpSessions.set(cedula, session);
        console.log(`[AUTH SERVICE] OTP generado para ${cedula}: ${otp}`);
        const emailSent = await email_service_1.emailService.sendOtpEmail(session.email, otp, session.nombres);
        if (!emailSent) {
            console.error('[AUTH SERVICE] Error al enviar email, pero continuamos para pruebas');
        }
        return {
            success: true,
            message: 'Código enviado al correo electrónico',
            _debugOtp: otp
        };
    }
    verifyOtp(cedula, data) {
        console.log('[AUTH SERVICE] Verificando OTP para:', cedula);
        const session = otpSessions.get(cedula);
        if (!session || !session.otp) {
            throw new microservices_1.RpcException({
                success: false,
                message: 'No hay código OTP activo. Por favor solicite uno nuevo.',
                statusCode: 400
            });
        }
        if (Date.now() > session.expiresAt) {
            otpSessions.delete(cedula);
            throw new microservices_1.RpcException({
                success: false,
                message: 'El código OTP ha expirado. Por favor solicite uno nuevo.',
                statusCode: 400
            });
        }
        const isValid = data.otpCode === session.otp;
        if (!isValid) {
            throw new microservices_1.RpcException({
                success: false,
                message: 'Código OTP incorrecto.',
                statusCode: 400
            });
        }
        otpSessions.delete(cedula);
        return {
            success: true,
            message: 'OTP verificado correctamente'
        };
    }
    generateOtp() {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)()
], AuthService);
//# sourceMappingURL=auth.service.js.map