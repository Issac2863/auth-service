import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({}),
    ClientsModule.register([
      {
        name: 'BIOMETRIC_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.BIOMETRIC_SERVICE_HOST || 'biometric-service.railway.internal',
          port: parseInt(process.env.BIOMETRIC_SERVICE_PORT || '3003'),
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule { }
