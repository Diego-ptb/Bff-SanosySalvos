import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { UpstreamServicesHealthIndicator } from './upstream-services.health';

@Module({
    imports: [TerminusModule, HttpModule],
    controllers: [HealthController],
    providers: [UpstreamServicesHealthIndicator],
})
export class HealthModule { }
