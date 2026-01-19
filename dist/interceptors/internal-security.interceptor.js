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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalSecurityInterceptor = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
let InternalSecurityInterceptor = class InternalSecurityInterceptor {
    configService;
    logger = new common_1.Logger('InternalSecurityInterceptor');
    constructor(configService) {
        this.configService = configService;
    }
    intercept(context, next) {
        const rpcCall = context.switchToRpc();
        const dataContainer = rpcCall.getData();
        this.logger.log('--- [INTERCEPTOR] Iniciando desempaquetado de datos ---');
        if (!dataContainer || !dataContainer.headers) {
            this.logger.error('Petición malformada: Estructura de mensaje inválida');
            throw new common_1.BadRequestException('Petición malformada: Faltan datos o headers');
        }
        const headers = dataContainer.headers;
        let payload = dataContainer.data;
        const gatewayPublicKeyBase64 = this.configService.get('GATEWAY_PUBLIC_KEY_BASE64');
        const authPrivateKeyBase64 = this.configService.get('AUTH_PRIVATE_KEY_BASE64');
        if (!gatewayPublicKeyBase64 || !authPrivateKeyBase64) {
            this.logger.fatal('Faltan llaves RSA en el entorno para procesar la data');
            throw new common_1.InternalServerErrorException('Configuración de llaves incompleta');
        }
        try {
            let payloadString;
            if (headers['x-encrypted'] === 'true') {
                this.logger.log('Detectado contenido cifrado. Iniciando descifrado RSA...');
                const privateKey = Buffer.from(authPrivateKeyBase64, 'base64').toString('utf-8');
                const encryptedBuffer = Buffer.from(payload.data, 'base64');
                const decrypted = crypto.publicDecrypt({
                    key: privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: "sha256",
                }, encryptedBuffer);
                payloadString = decrypted.toString('utf-8');
                dataContainer.data = JSON.parse(payloadString);
                this.logger.log('Contenido descifrado y parseado exitosamente');
            }
            else {
                payloadString = JSON.stringify(payload);
            }
            this.logger.log('Verificando firma digital de integridad (PSS)...');
            const publicKey = Buffer.from(gatewayPublicKeyBase64, 'base64').toString('utf-8');
            const signature = Buffer.from(headers['x-signature'], 'base64');
            const isVerified = crypto.verify("sha256", Buffer.from(payloadString), {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
            }, signature);
            if (!isVerified) {
                this.logger.error('Fallo: La firma digital NO coincide con el contenido');
                throw new Error('La firma digital no coincide');
            }
            this.logger.log('✅ Integridad verificada. Pasando al controlador.');
            return next.handle();
        }
        catch (error) {
            this.logger.error(`Error de seguridad en Interceptor: ${error.message}`);
            throw new common_1.BadRequestException(`Error de seguridad: ${error.message}`);
        }
    }
};
exports.InternalSecurityInterceptor = InternalSecurityInterceptor;
exports.InternalSecurityInterceptor = InternalSecurityInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], InternalSecurityInterceptor);
//# sourceMappingURL=internal-security.interceptor.js.map