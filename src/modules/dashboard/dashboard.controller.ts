import { Controller, Get, Query, UseInterceptors, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto, DashboardQueryDto } from './dto/dashboard.dto';
import { LoggingInterceptor } from '@/common/interceptors';
import { CorrelationId, AuthToken } from '@/common/decorators';
import { JwtPropagationGuard } from '@/common/guards/jwt-propagation.guard';

@ApiTags('Dashboard')
@Controller('/api/dashboard')
@UseInterceptors(LoggingInterceptor)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get aggregated dashboard data as GeoJSON (vets + lost pets)' })
    @ApiQuery({ name: 'lat', type: Number, required: false, description: 'Latitude for nearby vets' })
    @ApiQuery({ name: 'lng', type: Number, required: false, description: 'Longitude for nearby vets' })
    @ApiQuery({ name: 'radius', type: Number, required: false, description: 'Search radius in km' })
    @ApiResponse({ status: 200, description: 'Dashboard data as GeoJSON', type: DashboardResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 503, description: 'All upstream services failed' })
    async getDashboard(
        @Query() query: DashboardQueryDto,
        @CorrelationId() correlationId: string,
        @AuthToken() token: string,
        @Res({ passthrough: true }) response: Response
    ): Promise<DashboardResponseDto> {
        response.set('Cache-Control', 'private, max-age=60');
        return this.dashboardService.getDashboard(query, correlationId, token);
    }
}
