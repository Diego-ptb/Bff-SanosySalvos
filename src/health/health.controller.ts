import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { UpstreamServicesHealthIndicator } from './upstream-services.health';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private upstreamServicesHealth: UpstreamServicesHealthIndicator
    ) { }

    @Get('/live')
    @HealthCheck()
    @ApiOperation({ summary: 'Liveness probe' })
    @ApiResponse({ status: 200, description: 'Service is alive' })
    check(): unknown {
        // Simple liveness: BFF is running
        return { status: 'ok' };
    }

    @Get('/ready')
    @HealthCheck()
    @ApiOperation({ summary: 'Readiness probe' })
    @ApiResponse({ status: 200, description: 'Service is ready' })
    @ApiResponse({ status: 503, description: 'Upstream services not available' })
    async ready(): Promise<unknown> {
        return this.health.check([() => this.upstreamServicesHealth.isHealthy()]);
    }
}
