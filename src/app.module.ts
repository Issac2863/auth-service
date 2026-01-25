import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KeyVaultService } from './security/keyVault.service';
import { InternalApiKeyGuard } from './guards/internalApiKey.guard';
import { EnvelopeOpenerInterceptor } from './interceptors/envelopeOpener.interceptor';
import { CensusProxy } from './proxies/census.proxy';
import { EnvelopePackerService } from './security/envelopePacker.service';
import { TokenService } from './security/generateToken.service';
import { OtpSessionService } from './services/session.service';
import { SupabaseService } from './services/supabase.service';
import { AdminService } from './services/admin.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
      {
        name: 'CENSUS_SERVICE',
        transport: Transport.TCP,
        options: {
          // Ojo: Corregí el typo de 'CENSUS_SERVICE_HOST' a 'CENSUS_SERVICE_HOST'
          host: process.env.CENSUS_SERVICE_HOST || 'census-service.railway.internal',
          port: parseInt(process.env.CENSUS_SERVICE_PORT || '3006'),
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CensusProxy,
    EnvelopePackerService,
    KeyVaultService,          
    InternalApiKeyGuard,      
    EnvelopeOpenerInterceptor, 
    TokenService,
    OtpSessionService,
    SupabaseService,
    AdminService
  ],
})
export class AppModule { }