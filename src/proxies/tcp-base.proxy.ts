import { ClientProxy } from '@nestjs/microservices';
import { EnvelopePackerService } from 'src/security/envelopePacker.service';
import { lastValueFrom } from 'rxjs';
import { InternalServerErrorException, Logger } from '@nestjs/common';

/**
 * @abstract BaseMessageProxy
 * @description Clase base para todos los proxies TCP del API Gateway.
 * Maneja la comunicación segura con microservicios mediante message patterns y sobres de seguridad cifrados.
 */
export abstract class BaseMessageProxy {
  protected abstract readonly logger: Logger;
  protected abstract readonly targetService: string;   // Nombre del microservicio
  protected abstract readonly originService: string;     // Tiempo de espera para respuestas
  protected abstract readonly privateKeyVar: string; // Variable para clave privada de firma (Gateway)
  protected abstract readonly publicKeyVar: string;  // Variable para clave pública del microservicio
  protected abstract readonly apiKeyVar: string;     // Variable para clave de API interna

  constructor(
    protected readonly client: ClientProxy,
    protected readonly securityService: EnvelopePackerService,
  ) { }

  /**
   * @method sendRequest
   * @description Envía una petición segura al microservicio vía TCP con sobre de seguridad cifrado.
   * @template T - Tipo de respuesta esperada del microservicio.
   * @param {string} pattern - Patrón de mensaje para el microservicio.
   * @param {any} data - Datos a enviar al microservicio.
   * @returns {Promise<T>} Respuesta del microservicio.
   */
  protected async sendRequest<T>(pattern: string, data: any): Promise<T> {
    // Generar sobre de seguridad completo con todos los parámetros requeridos
    const { headers, payload: securePayload } = await this.securityService.getSecurityHeaders(
      this.targetService,
      this.originService,
      this.privateKeyVar,
      this.publicKeyVar,
      this.apiKeyVar,
      data
    );

    try {
      // El payload cifrado se envía como placeholder, el contenido real está en el header de seguridad
      return await lastValueFrom(
        this.client.send(pattern, { data: securePayload, headers })
      );
    } catch (error) {
      this.logger.error(`[TCP] Error en ${this.targetService} [${pattern}]: ${error.message}`);
      throw new InternalServerErrorException(error.message || `Fallo en comunicación TCP con ${this.targetService}`);
    }
  }
}