import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const AuthToken = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return '';
        }
        return authHeader.substring(7);
    }
);
