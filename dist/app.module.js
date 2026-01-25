"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./services/auth.service");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const microservices_1 = require("@nestjs/microservices");
const keyVault_service_1 = require("./security/keyVault.service");
const internalApiKey_guard_1 = require("./guards/internalApiKey.guard");
const envelopeOpener_interceptor_1 = require("./interceptors/envelopeOpener.interceptor");
const census_proxy_1 = require("./proxies/census.proxy");
const envelopePacker_service_1 = require("./security/envelopePacker.service");
const generateToken_service_1 = require("./security/generateToken.service");
const session_service_1 = require("./services/session.service");
const supabase_service_1 = require("./services/supabase.service");
const admin_service_1 = require("./services/admin.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            jwt_1.JwtModule.register({}),
            microservices_1.ClientsModule.register([
                {
                    name: 'BIOMETRIC_SERVICE',
                    transport: microservices_1.Transport.TCP,
                    options: {
                        host: process.env.BIOMETRIC_SERVICE_HOST || 'biometric-service.railway.internal',
                        port: parseInt(process.env.BIOMETRIC_SERVICE_PORT || '3003'),
                    },
                },
                {
                    name: 'CENSUS_SERVICE',
                    transport: microservices_1.Transport.TCP,
                    options: {
                        host: process.env.CENSUS_SERVICE_HOST || 'census-service.railway.internal',
                        port: parseInt(process.env.CENSUS_SERVICE_PORT || '3006'),
                    },
                },
            ]),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            census_proxy_1.CensusProxy,
            envelopePacker_service_1.EnvelopePackerService,
            keyVault_service_1.KeyVaultService,
            internalApiKey_guard_1.InternalApiKeyGuard,
            envelopeOpener_interceptor_1.EnvelopeOpenerInterceptor,
            generateToken_service_1.TokenService,
            session_service_1.OtpSessionService,
            supabase_service_1.SupabaseService,
            admin_service_1.AdminService
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map