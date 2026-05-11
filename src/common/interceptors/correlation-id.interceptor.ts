import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
    private readonly logger = new Logger(CorrelationIdInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const correlationId = (request.headers['x-correlation-id'] as string) || this.generateId();

        request.headers['x-correlation-id'] = correlationId;

        const response = context.switchToHttp().getResponse();
        response.setHeader('x-correlation-id', correlationId);

        return next.handle().pipe(
            tap(() => {
                this.logger.debug(`[${correlationId}] ${request.method} ${request.path}`);
            })
        );
    }

    private generateId(): string {
        // Usar crypto built-in de Node.js para generar un simple UUID-like
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
