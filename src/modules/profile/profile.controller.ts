import { Body, Controller, Get, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { ProfileResponseDto, UserProfileDto, CreateUserProfileDto, UpdateUserProfileDto } from './dto/profile.dto';
import { AuthToken, CorrelationId, Roles } from '@/common/decorators';
import { JwtPropagationGuard } from '@/common/guards/jwt-propagation.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { LoggingInterceptor } from '@/common/interceptors';
import { RoleId } from '@/common/enums/role.enum';

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

    @Post('/me')
    @UseGuards(RolesGuard)
    @Roles(RoleId.USER)
    @ApiOperation({ summary: 'Crear datos personales del usuario (solo rol USER)' })
    @ApiResponse({ status: 201, description: 'Perfil creado', type: UserProfileDto })
    @ApiResponse({ status: 403, description: 'Solo usuarios con rol USER pueden crear perfil' })
    @ApiResponse({ status: 409, description: 'El usuario ya tiene un perfil' })
    async createUserProfile(
        @Body() dto: CreateUserProfileDto,
        @AuthToken() token: string
    ): Promise<UserProfileDto> {
        return this.profileService.createUserProfile(dto, token);
    }

    @Get('/me')
    @ApiOperation({ summary: 'Obtener datos personales del usuario' })
    @ApiResponse({ status: 200, description: 'Datos del perfil', type: UserProfileDto })
    @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
    async getUserProfile(@AuthToken() token: string): Promise<UserProfileDto> {
        return this.profileService.getUserProfile(token);
    }

    @Patch('/me')
    @ApiOperation({ summary: 'Actualizar datos personales del usuario' })
    @ApiResponse({ status: 200, description: 'Perfil actualizado', type: UserProfileDto })
    @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
    async updateUserProfile(
        @Body() dto: UpdateUserProfileDto,
        @AuthToken() token: string
    ): Promise<UserProfileDto> {
        return this.profileService.updateUserProfile(dto, token);
    }
}
