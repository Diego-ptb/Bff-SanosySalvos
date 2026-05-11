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
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const { method, path } = request;
        const now = Date.now();

        return next.handle().pipe(
            tap((data) => {
                const latency = Date.now() - now;
                const correlationId = request.headers['x-correlation-id'] || 'unknown';
                this.logger.log(
                    JSON.stringify({
                        method,
                        path,
                        statusCode: context.switchToHttp().getResponse().statusCode,
                        latencyMs: latency,
                        correlationId,
                        timestamp: new Date().toISOString(),
                    })
                );
            })
        );
    }
}
