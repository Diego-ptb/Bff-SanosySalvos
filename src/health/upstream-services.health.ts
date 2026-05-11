import { Injectable } from '@nestjs/common';
import {
    HealthCheckService,
    HealthIndicator,
    HealthIndicatorResult,
    HttpHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UpstreamServicesHealthIndicator extends HealthIndicator {
    constructor(
        private readonly http: HttpHealthIndicator,
        private readonly configService: ConfigService
    ) {
        super();
    }

    async isHealthy(): Promise<HealthIndicatorResult> {
        const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://auth-service:8080';
        const vetServiceUrl = this.configService.get<string>('VET_SERVICE_URL') || 'http://vet-service:8081';
        const petServiceUrl = this.configService.get<string>('PET_SERVICE_URL') || 'http://pet-service:8082';
        const timeout = this.configService.get<number>('HEALTH_CHECK_TIMEOUT_MS') || 5000;

        const checks = await Promise.allSettled([
            this.http.pingCheck('auth-service', `${authServiceUrl}/health/live`, { timeout }),
            this.http.pingCheck('vet-service', `${vetServiceUrl}/health/live`, { timeout }),
            this.http.pingCheck('pet-service', `${petServiceUrl}/health/live`, { timeout }),
        ]);

        const results: Record<string, unknown> = {};
        let isHealthy = true;

        checks.forEach((check, index) => {
            const services = ['auth-service', 'vet-service', 'pet-service'];
            const serviceName = services[index];

            if (check.status === 'fulfilled') {
                results[serviceName] = check.value;
            } else {
                results[serviceName] = { status: 'down' };
                isHealthy = false;
            }
        });

        return this.getStatus('upstream-services', isHealthy, results);
    }
}
