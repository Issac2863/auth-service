"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const auth_service_1 = require("./services/auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const internalApiKey_guard_1 = require("./guards/internalApiKey.guard");
const envelopeOpener_interceptor_1 = require("./interceptors/envelopeOpener.interceptor");
const admin_service_1 = require("./services/admin.service");
let AuthController = AuthController_1 = class AuthController {
    authService;
    adminService;
    logger = new common_1.Logger(AuthController_1.name);
    constructor(authService, adminService) {
        this.authService = authService;
        this.adminService = adminService;
    }
    validateCredentials(data) {
        this.logger.log(`[Step 1] Validando credenciales para cédula: ${data.cedula}`);
        return this.authService.validateCredentials(data);
    }
    async sendOtp(data) {
        this.logger.log(`[OTP Request] Enviando código OTP para cédula: ${data.cedula}`);
        return this.authService.sendOtp(data.cedula);
    }
    verifyOtp(data) {
        this.logger.log(`[Step 2] Verificando OTP para cédula: ${data.id}`);
        return this.authService.verifyOtp(data);
    }
    async verifyBiometric(data) {
        this.logger.log(`[Step 3] Procesando verificación biométrica para cédula: ${data.id}`);
        return this.authService.verifyBiometric(data.id, data.image);
    }
    adminLogin(data) {
        this.logger.log(`Procesando autenticación de administrador: ${data.email}`);
        return this.adminService.adminLogin(data);
    }
    healthCheck() {
        return {
            status: 'ok',
            service: 'auth-service',
            timestamp: new Date().toISOString()
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, microservices_1.MessagePattern)('auth.validate-credentials'),
    __param(0, (0, microservices_1.Payload)('data')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ValidateCredentialsDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "validateCredentials", null);
__decorate([
    (0, microservices_1.MessagePattern)('auth.send-otp'),
    __param(0, (0, microservices_1.Payload)('data')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendOtp", null);
__decorate([
    (0, microservices_1.MessagePattern)('auth.verify-otp'),
    __param(0, (0, microservices_1.Payload)('data')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, microservices_1.MessagePattern)('auth.biometric'),
    __param(0, (0, microservices_1.Payload)('data')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyBiometric", null);
__decorate([
    (0, microservices_1.MessagePattern)('auth.admin-login'),
    __param(0, (0, microservices_1.Payload)('data')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "adminLogin", null);
__decorate([
    (0, microservices_1.MessagePattern)('auth.health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "healthCheck", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(internalApiKey_guard_1.InternalApiKeyGuard),
    (0, common_1.UseInterceptors)(envelopeOpener_interceptor_1.EnvelopeOpenerInterceptor),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        admin_service_1.AdminService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map