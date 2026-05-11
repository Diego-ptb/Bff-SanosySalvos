import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance, AxiosError } from 'axios';

@Injectable()
export class HttpClientBase {
    protected readonly logger = new Logger(this.constructor.name);
    protected readonly axiosInstance: AxiosInstance;

    constructor(
        protected readonly httpService: HttpService,
        protected readonly configService: ConfigService
    ) {
        this.axiosInstance = this.httpService.axiosRef;
        this.configureDefaults();
    }

    private configureDefaults(): void {
        const timeout = this.configService.get<number>('HTTP_TIMEOUT_MS') || 5000;
        this.axiosInstance.defaults.timeout = timeout;

        // Request interceptor para propagar headers y metadatos
        this.axiosInstance.interceptors.request.use((config: any) => {
            config.metadata = { startTime: Date.now() };
            const correlationId = config.headers['x-correlation-id'] as string;
            if (correlationId) {
                config.headers['x-correlation-id'] = correlationId;
            }
            const authToken = config.headers.authorization as string;
            if (authToken) {
                config.headers.authorization = authToken;
            }
            return config;
        });

        // Response interceptor para logging
        this.axiosInstance.interceptors.response.use(
            (response: any) => {
                const latency = (Date.now() - (response.config.metadata?.startTime || 0)) / 1000;
                this.logger.debug(
                    `${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${latency.toFixed(2)}s)`
                );
                return response;
            },
            (error: AxiosError) => {
                this.logger.error(
                    `HTTP Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || error.code}`
                );
                throw error;
            }
        );
    }

    /**
     * Realiza un GET request con retry automático en errores idempotentes
     */
    protected async get<T>(
        url: string,
        headers: Record<string, string> = {}
    ): Promise<T> {
        return this.requestWithRetry<T>(() =>
            this.axiosInstance.get<T>(url, { headers })
        );
    }

    /**
     * Realiza un POST request (sin retry)
     */
    protected async post<T>(
        url: string,
        data: unknown,
        headers: Record<string, string> = {}
    ): Promise<T> {
        const response = await this.axiosInstance.post<T>(url, data, { headers });
        return response.data;
    }

    /**
     * Realiza un PUT request con retry automático
     */
    protected async put<T>(
        url: string,
        data: unknown,
        headers: Record<string, string> = {}
    ): Promise<T> {
        return this.requestWithRetry<T>(() =>
            this.axiosInstance.put<T>(url, data, { headers })
        );
    }

    /**
     * Realiza un PATCH request (sin retry)
     */
    protected async patch<T>(
        url: string,
        data: unknown,
        headers: Record<string, string> = {}
    ): Promise<T> {
        const response = await this.axiosInstance.patch<T>(url, data, { headers });
        return response.data;
    }

    /**
     * Realiza un DELETE request con retry automático
     */
    protected async delete<T>(
        url: string,
        headers: Record<string, string> = {}
    ): Promise<T> {
        return this.requestWithRetry<T>(() =>
            this.axiosInstance.delete<T>(url, { headers })
        );
    }

    /**
     * Implementa retry con backoff exponencial solo para errores idempotentes (5xx)
     */
    private async requestWithRetry<T>(
        request: () => Promise<{ data: T }>,
        retryCount = 0
    ): Promise<T> {
        try {
            const response = await request();
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            const maxRetries = this.configService.get<number>('HTTP_MAX_RETRIES') || 3;

            // Solo reintentar en 5xx (server errors) y ECONNABORTED
            if (retryCount < maxRetries && (axiosError.code === 'ECONNABORTED' || (axiosError.response?.status ?? 0) >= 500)) {
                const delay = Math.pow(2, retryCount) * 100; // backoff exponencial: 100ms, 200ms, 400ms
                this.logger.warn(
                    `Retry ${retryCount + 1}/${maxRetries} after ${delay}ms for ${axiosError.config?.url}`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.requestWithRetry<T>(request, retryCount + 1);
            }

            throw error;
        }
    }

    /**
     * Extrae el token del header Authorization
     */
    protected extractToken(token: string): Record<string, string> {
        if (!token) {
            return {};
        }
        return {
            authorization: `Bearer ${token}`,
        };
    }
}
