import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { RoleId } from '@/common/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<RoleId[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new ForbiddenException('Acceso denegado');
        }

        const token = authHeader.substring(7);
        const roles = this.extractRoles(token);

        const hasRole = requiredRoles.some((role) => roles.includes(role));
        if (!hasRole) {
            throw new ForbiddenException('No tienes permiso para realizar esta acción');
        }

        return true;
    }

    private extractRoles(token: string): number[] {
        try {
            const payloadBase64 = token.split('.')[1];
            const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
            return Array.isArray(payload.roles) ? (payload.roles as number[]) : [];
        } catch {
            return [];
        }
    }
}
