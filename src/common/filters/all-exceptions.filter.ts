import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AxiosError } from 'axios';
import { ProblemDetails } from '../types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const correlationId = (request.headers['x-correlation-id'] as string) || 'unknown';
        const timestamp = new Date().toISOString();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let title = 'Internal Server Error';
        let detail = 'An unexpected error occurred';
        let type = 'https://sanosysalvos.dev/errors/internal-server-error';
        let errors: Record<string, string[]> | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const responseBody = exception.getResponse();

            if (typeof responseBody === 'object' && responseBody !== null) {
                const body = responseBody as Record<string, unknown>;
                if (body.message) {
                    detail = Array.isArray(body.message)
                        ? body.message.join(', ')
                        : String(body.message);
                }
                if (body.error) {
                    title = String(body.error);
                }
            }

            // Mapeo de status conocidos
            if (status === HttpStatus.BAD_REQUEST) {
                title = 'Bad Request';
                type = 'https://sanosysalvos.dev/errors/bad-request';
                if (typeof responseBody === 'object' && responseBody !== null) {
                    const body = responseBody as Record<string, unknown>;
                    if (Array.isArray(body.message)) {
                        errors = { validation: body.message as string[] };
                    }
                }
            } else if (status === HttpStatus.UNAUTHORIZED) {
                title = 'Unauthorized';
                type = 'https://sanosysalvos.dev/errors/unauthorized';
            } else if (status === HttpStatus.FORBIDDEN) {
                title = 'Forbidden';
                type = 'https://sanosysalvos.dev/errors/forbidden';
            } else if (status === HttpStatus.NOT_FOUND) {
                title = 'Not Found';
                type = 'https://sanosysalvos.dev/errors/not-found';
            }
        } else if (exception instanceof AxiosError) {
            if (exception.code === 'ECONNABORTED') {
                status = HttpStatus.GATEWAY_TIMEOUT;
                title = 'Upstream Service Timeout';
                type = 'https://sanosysalvos.dev/errors/upstream-timeout';
                detail = `Upstream service did not respond within ${exception.config?.timeout || 'unknown'}ms`;
            } else if (exception.code === 'ECONNREFUSED') {
                status = HttpStatus.BAD_GATEWAY;
                title = 'Bad Gateway';
                type = 'https://sanosysalvos.dev/errors/bad-gateway';
                detail = `Failed to connect to upstream service: ${exception.config?.url || 'unknown'}`;
            } else if (exception.response) {
                const responseStatus = exception.response.status;
                if (responseStatus >= 400 && responseStatus < 500) {
                    status = responseStatus;
                    title = `Upstream Error: ${responseStatus}`;
                    detail = JSON.stringify(exception.response.data);
                } else {
                    status = HttpStatus.BAD_GATEWAY;
                    title = 'Bad Gateway';
                    detail = 'Upstream service returned an error';
                }
                type = `https://sanosysalvos.dev/errors/upstream-${status}`;
            } else {
                status = HttpStatus.BAD_GATEWAY;
                title = 'Bad Gateway';
                type = 'https://sanosysalvos.dev/errors/bad-gateway';
                detail = exception.message || 'Unknown axios error';
            }
        } else if (exception instanceof Error) {
            detail = exception.message || 'An unexpected error occurred';
        }

        const problemDetails: ProblemDetails = {
            type,
            title,
            status,
            detail,
            instance: request.path,
            correlationId,
            timestamp,
            ...(errors && { errors }),
        };

        this.logger.error(
            `[${correlationId}] ${request.method} ${request.path} - ${status} - ${detail}`,
            exception instanceof Error ? exception.stack : String(exception)
        );

        response.status(status).json(problemDetails);
    }
}
