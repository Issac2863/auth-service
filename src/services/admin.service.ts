import { Injectable, Logger } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { SupabaseService } from "./supabase.service";
import { TokenService } from "src/security/generateToken.service";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly tokenService: TokenService // Inyectamos el servicio de tokens
  ) {}

  async adminLogin(data: any) {
    this.logger.log(`Intento de inicio de sesión administrativo: ${data.email}`);

    try {
      const client = this.supabase.getClient();

      // 1. Consultar el administrador en la base de datos
      const { data: admin, error } = await client
        .from('administrators')
        .select('*')
        .eq('email', data.email)
        .maybeSingle();

      if (error) {
        throw new Error(`Fallo en la comunicación con la base de datos: ${error.message}`);
      }

      // 2. Validar credenciales
      if (!admin || admin.password !== data.password) {
        this.logger.warn(`Credenciales administrativas inválidas para: ${data.email}`);
        throw new RpcException({
          success: false,
          message: 'Credenciales de administrador inválidas',
          statusCode: 401,
        });
      }

      // 3. Éxito: Generar Token Real
      // Usamos el email como 'sub' y asignamos el rol 'ADMIN'
      const { token, expiresAt } = await this.tokenService.generateAccessToken(
        admin.id, 
        'ADMIN', 
        3600 // Duración: 1 hora
      );

      this.logger.log(`✅ Login administrativo exitoso: ${admin.email}`);

      return {
        success: true,
        message: 'Bienvenido Administrador',
        accessToken: token, // Cambiado de 'token' a 'accessToken' para consistencia
        expirationTime: expiresAt,
        user: {
          email: admin.email,
          role: admin.role || 'ADMIN',
        },
      };

    } catch (error) {
      if (error instanceof RpcException) throw error;

      this.logger.error(`Error en autenticación administrativa: ${error.message}`);
      throw new RpcException({
        success: false,
        message: error.message || 'Error interno del servidor',
        statusCode: 500,
      });
    }
  }
}