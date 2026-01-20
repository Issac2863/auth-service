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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const jwt_1 = require("@nestjs/jwt");
const rxjs_1 = require("rxjs");
const citizen_mock_data_1 = require("./citizen-mock.data");
const email_service_1 = require("./email.service");
const crypto = __importStar(require("crypto"));
const otpSessions = new Map();
let AuthService = class AuthService {
    biometricClient;
    jwtService;
    constructor(biometricClient, jwtService) {
        this.biometricClient = biometricClient;
        this.jwtService = jwtService;
    }
    async validateCredentials(data) {
        console.log('[AUTH SERVICE] Validando credenciales:', data.cedula);
        const citizen = (0, citizen_mock_data_1.findCitizen)(data.cedula, data.codigoDactilar);
        if (!citizen) {
            throw new microservices_1.RpcException({
                success: false,
                message: 'Credenciales inválidas. Verifique su cédula y código dactilar.',
                statusCode: 401
            });
        }
        const otp = this.generateOtp();
        const expiresAt = Date.now() + 5 * 60 * 1000;
        otpSessions.set(data.cedula, {
            otp: otp,
            expiresAt: expiresAt,
            email: citizen.email,
            nombres: citizen.nombres,
            attempts: 0
        });
        console.log(`[AUTH SERVICE] OTP generado para ${data.cedula}: ${otp}`);
        const emailSent = await email_service_1.emailService.sendOtpEmail(citizen.email, otp, citizen.nombres);
        if (!emailSent) {
            console.error('[AUTH SERVICE] Error al enviar email, pero continuamos');
        }
        return {
            success: true,
            message: 'Identidad verificada. Código OTP enviado a tu correo.',
            email: (0, citizen_mock_data_1.maskEmail)(citizen.email),
            nombres: citizen.nombres,
            apellidos: citizen.apellidos,
            _debugOtp: otp
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
        session.attempts = 0;
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
        session.attempts = (session.attempts || 0) + 1;
        if (session.attempts > 3) {
            otpSessions.delete(cedula);
            console.warn(`[AUTH SECURITY] Usuario ${cedula} bloqueado por múltiples intentos fallidos de OTP.`);
            throw new microservices_1.RpcException({
                success: false,
                message: 'Has excedido el número máximo de intentos (3). Por seguridad, inicia el proceso nuevamente.',
                statusCode: 429
            });
        }
        otpSessions.set(cedula, session);
        if (Date.now() > session.expiresAt) {
            otpSessions.delete(cedula);
            throw new microservices_1.RpcException({
                success: false,
                message: 'El código OTP ha expirado. Por favor solicite uno nuevo.',
                statusCode: 400
            });
        }
        const inputBuffer = Buffer.from(data.otpCode);
        const targetBuffer = Buffer.from(session.otp);
        let isValid = false;
        try {
            if (inputBuffer.length === targetBuffer.length) {
                isValid = crypto.timingSafeEqual(inputBuffer, targetBuffer);
            }
        }
        catch (e) {
            isValid = false;
        }
        if (!isValid) {
            const intentosRestantes = 3 - session.attempts;
            throw new microservices_1.RpcException({
                success: false,
                message: `Código OTP incorrecto. Intentos restantes: ${intentosRestantes}`,
                statusCode: 400
            });
        }
        otpSessions.delete(cedula);
        return {
            success: true,
            message: 'OTP verificado correctamente'
        };
    }
    adminLogin(data) {
        console.log('[AUTH SERVICE] Admin login attempt:', data.email);
        const VALID_ADMIN_EMAIL = 'admin@sevotec.com';
        const VALID_ADMIN_PASS_HASH = '371eef82556f28f6cc80ce4c61d48aa0af47af38fcb5caa00c9bfa872dcb8135';
        if (data.email === VALID_ADMIN_EMAIL && data.password === VALID_ADMIN_PASS_HASH) {
            return {
                success: true,
                message: 'Bienvenido Administrador',
                token: 'admin-mock-token-secure-2026',
                user: {
                    email: data.email,
                    role: 'ADMIN'
                }
            };
        }
        throw new microservices_1.RpcException({
            success: false,
            message: 'Credenciales de administrador inválidas',
            statusCode: 401
        });
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async verifyBiometric(cedula, image) {
        console.log('[AUTH SERVICE] Iniciando verificación biométrica remota para:', cedula);
        try {
            const citizen = citizen_mock_data_1.CIUDADANOS_MOCK.find(c => c.cedula === cedula);
            if (!citizen) {
                throw new microservices_1.RpcException({ message: 'Ciudadano no encontrado', statusCode: 404 });
            }
            console.log('[AUTH SERVICE] Contactando biometric-service...');
            const result = await (0, rxjs_1.lastValueFrom)(this.biometricClient.send('biometric.validate-facial', {
                cedula,
                imagenBase64: image
            })).catch(err => {
                console.error('[AUTH SERVICE] Error comunicación biometric-service:', err);
                throw new microservices_1.RpcException({ message: 'Error de comunicación con servicio biométrico', statusCode: 503 });
            });
            console.log('[AUTH SERVICE] Respuesta biometric-service:', result);
            if (!result || !result.success) {
                throw new microservices_1.RpcException({
                    success: false,
                    message: result?.message || 'Verificación facial fallida',
                    statusCode: 401
                });
            }
            const privateKeyBase64 = process.env.JWT_PRIVATE_KEY_BASE64;
            if (!privateKeyBase64) {
                throw new Error('JWT_PRIVATE_KEY_BASE64 no configurada en el entorno');
            }
            const privateKeyPEM = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
            const payload = {
                sub: citizen.cedula,
                role: citizen.role,
            };
            const token = this.jwtService.sign(payload, {
                privateKey: privateKeyPEM,
                algorithm: 'RS256',
                expiresIn: `${citizen.expirationTime}m`
            });
            return {
                success: true,
                accessToken: token,
                message: 'Autenticación exitosa'
            };
        }
        catch (error) {
            console.error('[AUTH SERVICE] Error en proceso biométrico:', error);
            if (error instanceof microservices_1.RpcException)
                throw error;
            throw new microservices_1.RpcException({
                success: false,
                message: error.message || 'Error interno en biometría',
                statusCode: 500
            });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('BIOMETRIC_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map