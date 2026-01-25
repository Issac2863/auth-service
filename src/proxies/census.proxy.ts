import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseMessageProxy } from './tcp-base.proxy';
import { EnvelopePackerService } from 'src/security/envelopePacker.service';
import { ValidateCredentialsDto } from 'src/dto/auth.dto';

@Injectable()
export class CensusProxy extends BaseMessageProxy {
  protected readonly logger = new Logger(CensusProxy.name);
  protected readonly targetService = 'census-service';
  protected readonly originService = 'auth-service';
  protected readonly privateKeyVar = 'CENSUS_PRIVATE_KEY_BASE64'; // Clave para firmar mensajes
  protected readonly apiKeyVar = 'CENSUS_INTERNAL_API_KEY';        // Clave para validación rápida
  protected readonly publicKeyVar = 'CENSUS_PUBLIC_KEY_BASE64';   // Clave pública del microservicio
  protected readonly timeoutMs = 8000; // Tiempo de espera para respuestas

  constructor(
    @Inject('CENSUS_SERVICE') private readonly censusClient: ClientProxy,
    securityService: EnvelopePackerService,
  ) {
    super(censusClient, securityService);
  }

  /**
   * @method validateIdentity
   * @description Primer paso del flujo: verifica las credenciales básicas del ciudadano.
   * @param {ValidateIdentityDto} credentialUser - Datos de identidad del usuario.
   * @returns {Promise<any>} Resultado de la validación de identidad.
   */
  async validateIdentity(credentialUser: ValidateCredentialsDto): Promise<any> {
    this.logger.log(`Enviando solicitud de validación de identidad para cédula: ${credentialUser.cedula}`);
    return this.sendRequest('census.validate-credentials', credentialUser);
  }
}
