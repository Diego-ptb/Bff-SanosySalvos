import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtPropagationGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Missing Authorization header');
        }

        if (!authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Invalid Authorization header format. Expected: Bearer <token>');
        }

        const token = authHeader.substring(7);
        if (!token) {
            throw new UnauthorizedException('Empty Bearer token');
        }

        return true;
    }
}
