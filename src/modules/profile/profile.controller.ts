import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { ProfileResponseDto } from './dto/profile.dto';
import { AuthToken, CorrelationId } from '@/common/decorators';
import { JwtPropagationGuard } from '@/common/guards/jwt-propagation.guard';
import { LoggingInterceptor } from '@/common/interceptors';

@ApiTags('Profile')
@Controller('/api/profile')
@UseGuards(JwtPropagationGuard)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    @ApiOperation({ summary: 'Get aggregated user profile data' })
    @ApiResponse({ status: 200, description: 'User profile', type: ProfileResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 503, description: 'Unable to fetch complete profile' })
    async getProfile(
        @AuthToken() token: string,
        @CorrelationId() correlationId: string
    ): Promise<ProfileResponseDto> {
        return this.profileService.getProfile(token, correlationId);
    }
}
