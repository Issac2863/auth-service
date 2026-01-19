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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalSecurityGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
let InternalSecurityGuard = class InternalSecurityGuard {
    configService;
    jwtService;
    logger = new common_1.Logger('InternalSecurityGuard');
    constructor(configService, jwtService) {
        this.configService = configService;
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const rpcData = context.switchToRpc().getData();
        const headers = rpcData?.headers;
        this.logger.log('--- [GUARD] Iniciando validación de seguridad ---');
        if (!headers) {
            this.logger.error('Fallo: No se encontraron headers en la petición rpc');
            throw new common_1.UnauthorizedException('No se encontraron headers de seguridad');
        }
        const expectedApiKey = this.configService.get('AUTH_INTERNAL_API_KEY');
        if (headers['x-api-key'] !== expectedApiKey) {
            this.logger.error(`Fallo: x-api-key no coincide. Recibida: ${headers['x-api-key']?.substring(0, 5)}...`);
            throw new common_1.UnauthorizedException('API Key interna inválida');
        }
        this.logger.log('Paso 1: x-api-key validada correctamente');
        try {
            const gatewayPublicKey = this.configService.get('GATEWAY_PUBLIC_KEY_BASE64');
            if (!gatewayPublicKey) {
                this.logger.fatal('Error Crítico: GATEWAY_PUBLIC_KEY_BASE64 no está en el .env');
                throw new common_1.InternalServerErrorException('Configuración PUBLIC_KEY no encontrada');
            }
            const publicKey = Buffer.from(gatewayPublicKey, 'base64').toString('utf-8');
            await this.jwtService.verifyAsync(headers['x-internal-token'], {
                publicKey: publicKey,
                algorithms: ['RS256'],
                issuer: 'sevotec-gateway',
                audience: 'auth-service',
            });
            this.logger.log('Paso 2: JWT de identidad (RS256) verificado');
        }
        catch (error) {
            this.logger.error(`Fallo en JWT: ${error.message}`);
            throw new common_1.UnauthorizedException('Token de identidad inválido o expirado');
        }
        return true;
    }
};
exports.InternalSecurityGuard = InternalSecurityGuard;
exports.InternalSecurityGuard = InternalSecurityGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService])
], InternalSecurityGuard);
//# sourceMappingURL=internal-security.guard.js.map