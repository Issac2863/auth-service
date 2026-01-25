import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly privateKey: string;

  constructor(private readonly jwtService: JwtService) {
    const base64Key = process.env.JWT_PRIVATE_KEY_BASE64;
    if (!base64Key) {
      this.logger.error('JWT_PRIVATE_KEY_BASE64 no configurada');
      throw new InternalServerErrorException('Error de configuración de seguridad');
    }
    this.privateKey = Buffer.from(base64Key, 'base64').toString('utf8');
  }

  /**
   * Genera un token firmado con RS256.
   * @param sub Identificador (Cédula, ID o Email)
   * @param role Rol del usuario (VOTER, ADMIN)
   * @param seconds Duración en segundos
   */
  async generateAccessToken(sub: string | number, role: string, seconds: number) {
    const payload = { sub: String(sub), role };
    const token = this.jwtService.sign(payload, {
      privateKey: this.privateKey,
      algorithm: 'RS256',
      expiresIn: seconds,
    });

    return {
      token,
      expiresAt: Math.floor(Date.now() / 1000) + seconds,
    };
  }
}