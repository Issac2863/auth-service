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
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const internal_security_guard_1 = require("./guards/internal-security.guard");
const internal_security_interceptor_1 = require("./interceptors/internal-security.interceptor");
let AuthController = AuthController_1 = class AuthController {
    authService;
    logger = new common_1.Logger(AuthController_1.name);
    constructor(authService) {
        this.authService = authService;
    }
    validateCredentials(data) {
        this.logger.log('--- [PATTERN] auth.validate-credentials ---');
        this.logger.debug(`Datos recibidos: ${JSON.stringify(data)}`);
        return this.authService.validateCredentials(data);
    }
    async sendOtp(data) {
        this.logger.log(`--- [PATTERN] auth.send-otp para cédula: ${data.cedula} ---`);
        return this.authService.sendOtp(data.cedula);
    }
    verifyOtp(data) {
        this.logger.log(`--- [PATTERN] auth.verify-otp para cédula: ${data.cedula} ---`);
        this.logger.debug(`Código OTP: ${data.otpCode}`);
        return this.authService.verifyOtp(data.cedula, { otpCode: data.otpCode });
    }
    adminLogin(data) {
        this.logger.log('--- [PATTERN] auth.admin-login ---');
        return this.authService.adminLogin(data);
    }
    healthCheck() {
        this.logger.log('--- [HEALTH] Petición recibida ---');
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
    (0, common_1.UseGuards)(internal_security_guard_1.InternalSecurityGuard),
    (0, common_1.UseInterceptors)(internal_security_interceptor_1.InternalSecurityInterceptor),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map