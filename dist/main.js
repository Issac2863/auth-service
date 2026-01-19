"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.createMicroservice(app_module_1.AppModule, {
        transport: microservices_1.Transport.TCP,
        options: {
            host: process.env.AUTH_SERVICE_HOST || 'localhost',
            port: parseInt(process.env.AUTH_SERVICE_PORT || '3001'),
        },
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    await app.listen();
    console.log(`Auth Service is running on TCP port ${process.env.AUTH_SERVICE_PORT || 3001}`);
}
bootstrap();
//# sourceMappingURL=main.js.map