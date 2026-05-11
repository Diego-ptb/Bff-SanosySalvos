import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
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
}));
