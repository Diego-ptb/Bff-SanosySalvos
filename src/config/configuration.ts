import * as Joi from 'joi';

export const validationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'staging', 'production')
        .default('development'),
    PORT: Joi.number().default(3000),
    LOG_LEVEL: Joi.string()
        .valid('debug', 'info', 'warn', 'error')
        .default('info'),
    AUTH_SERVICE_URL: Joi.string().uri().required(),
    VET_SERVICE_URL: Joi.string().uri().required(),
    PET_SERVICE_URL: Joi.string().uri().required(),
    HTTP_TIMEOUT_MS: Joi.number().default(5000),
    HTTP_MAX_RETRIES: Joi.number().default(3),
    REDIS_URL: Joi.string().uri().default('redis://localhost:6379/0'),
    CORS_ORIGINS: Joi.string()
        .default('http://localhost:3001')
        .custom((value: string) => {
            // Simple validation: comma-separated list of URLs
            const urls = value.split(',').map((u) => u.trim());
            urls.forEach((url) => {
                try {
                    new URL(url);
                } catch {
                    throw new Error(`Invalid CORS origin URL: ${url}`);
                }
            });
            return urls;
        })
        .messages({
            'any.custom': '{#label} must be a comma-separated list of valid URLs',
        }),
    THROTTLE_TTL: Joi.number().default(60000),
    THROTTLE_LIMIT: Joi.number().default(100),
    HEALTH_CHECK_TIMEOUT_MS: Joi.number().default(5000),
});

export interface AppConfig {
    nodeEnv: string;
    port: number;
    logLevel: string;
    authServiceUrl: string;
    vetServiceUrl: string;
    petServiceUrl: string;
    httpTimeoutMs: number;
    httpMaxRetries: number;
    redisUrl: string;
    corsOrigins: string[];
    throttleTtl: number;
    throttleLimit: number;
    healthCheckTimeoutMs: number;
}

export function loadConfiguration(): AppConfig {
    return {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000', 10),
        logLevel: process.env.LOG_LEVEL || 'info',
        authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:8080',
        vetServiceUrl: process.env.VET_SERVICE_URL || 'http://vet-service:8081',
        petServiceUrl: process.env.PET_SERVICE_URL || 'http://pet-service:8082',
        httpTimeoutMs: parseInt(process.env.HTTP_TIMEOUT_MS || '5000', 10),
        httpMaxRetries: parseInt(process.env.HTTP_MAX_RETRIES || '3', 10),
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
        corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3001')
            .split(',')
            .map((url) => url.trim()),
        throttleTtl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
        throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
        healthCheckTimeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '5000', 10),
    };
}
