import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
export declare class InternalSecurityGuard implements CanActivate {
    private readonly configService;
    private readonly jwtService;
    private readonly logger;
    constructor(configService: ConfigService, jwtService: JwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
