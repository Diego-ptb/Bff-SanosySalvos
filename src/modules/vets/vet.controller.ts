import { Controller, Get, Post, Patch, Param, Body, UseGuards, UseInterceptors, Query, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { Response } from 'express';
import { VetService } from './vet.service';
import { CreateVetDto, UpdateVetDto, VetDto } from './dto/vet.dto';
import { AuthToken } from '@/common/decorators';
import { JwtPropagationGuard } from '@/common/guards/jwt-propagation.guard';
import { LoggingInterceptor } from '@/common/interceptors';

@ApiTags('Vets')
@Controller('/api/vets')
@UseInterceptors(LoggingInterceptor)
export class VetController {
    constructor(private readonly vetService: VetService) { }

    @Get()
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @CacheKey('vets:all')
    @CacheTTL(60000) // Cache por 60 segundos
    @ApiOperation({ summary: 'Get all veterinary clinics' })
    @ApiResponse({ status: 200, description: 'List of vets', type: [VetDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getAll(
        @AuthToken() token: string,
        @Res({ passthrough: true }) response: Response
    ): Promise<VetDto[]> {
        response.set('Cache-Control', 'private, max-age=60');
        return this.vetService.getAll(token);
    }

    @Post()
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new veterinary clinic (VET role required)' })
    @ApiResponse({ status: 201, description: 'Clinic created', type: VetDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 403, description: 'Forbidden - VET role required' })
    async create(
        @Body() dto: CreateVetDto,
        @AuthToken() token: string
    ): Promise<VetDto> {
        return this.vetService.create(dto, token);
    }

    @Get('/my')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user\'s veterinary clinic' })
    @ApiResponse({ status: 200, description: 'Clinic info', type: VetDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Not found' })
    async getMy(@AuthToken() token: string): Promise<VetDto> {
        return this.vetService.getMy(token);
    }

    @Patch('/my')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user\'s veterinary clinic' })
    @ApiResponse({ status: 200, description: 'Clinic updated', type: VetDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Not found' })
    async updateMy(
        @Body() dto: UpdateVetDto,
        @AuthToken() token: string
    ): Promise<VetDto> {
        return this.vetService.updateMy(dto, token);
    }

    @Get('/:id')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @CacheKey('vets:by-id')
    @CacheTTL(300000) // Cache por 5 minutos
    @ApiOperation({ summary: 'Get veterinary clinic by ID' })
    @ApiParam({ name: 'id', type: String, description: 'Vet clinic UUID' })
    @ApiResponse({ status: 200, description: 'Clinic info', type: VetDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Not found' })
    async getById(
        @Param('id') id: string,
        @AuthToken() token: string,
        @Res({ passthrough: true }) response: Response
    ): Promise<VetDto> {
        response.set('Cache-Control', 'private, max-age=300');
        return this.vetService.getById(id, token);
    }

    @Get('/nearby/search')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @CacheKey('vets:nearby')
    @CacheTTL(60000) // Cache por 60 segundos
    @ApiOperation({ summary: 'Get veterinary clinics nearby' })
    @ApiQuery({ name: 'lat', type: Number, description: 'Latitude', required: true })
    @ApiQuery({ name: 'lng', type: Number, description: 'Longitude', required: true })
    @ApiQuery({ name: 'radius', type: Number, description: 'Search radius in km', required: false })
    @ApiResponse({ status: 200, description: 'List of nearby vets', type: [VetDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getNearby(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radius') radius?: string,
        @AuthToken() token?: string,
        @Res({ passthrough: true }) response?: Response
    ): Promise<VetDto[]> {
        if (response) {
            response.set('Cache-Control', 'private, max-age=60');
        }
        return this.vetService.getNearby(
            parseFloat(lat),
            parseFloat(lng),
            radius ? parseFloat(radius) : undefined,
            token
        );
    }
}
