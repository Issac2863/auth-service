import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { KeyVaultService } from '../security/keyVault.service';

@Injectable()
export class EnvelopeOpenerInterceptor implements NestInterceptor {
  constructor(private readonly securityService: KeyVaultService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const rpcData = context.switchToRpc().getData();
    const envelope = rpcData?.headers?.['x-security-envelope'];

    if (!envelope) throw new BadRequestException('Falta x-security-envelope');

    return from(this.securityService.unpack(envelope)).pipe(
      switchMap((decryptedData) => {
        // Sustituimos el payload "protected: true" por los datos reales
        rpcData.data = decryptedData;
        return next.handle();
      })
    );
  }
}