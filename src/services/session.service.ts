import { Injectable, Logger } from '@nestjs/common';

export interface OtpSession {
  otp: string;
  expiresAt: number;
  email: string;
  nombres: string;
  cedula: string;
  attempts: number;
}

@Injectable()
export class OtpSessionService {
  private readonly logger = new Logger(OtpSessionService.name);
  // Centralizamos el almacenamiento aquí
  private sessions = new Map<string, OtpSession>();

  create(id: string, data: OtpSession) {
    this.sessions.set(id, data);
  }

  get(id: string): OtpSession | undefined {
    return this.sessions.get(id);
  }

  update(id: string, data: Partial<OtpSession>) {
    const current = this.sessions.get(id);
    if (current) {
      this.sessions.set(id, { ...current, ...data });
    }
  }

  remove(id: string) {
    const deleted = this.sessions.delete(id);
    if (deleted) {
    }
  }

  // Útil para tus logs de debug
  getAllDebug() {
    return this.sessions;
  }
}