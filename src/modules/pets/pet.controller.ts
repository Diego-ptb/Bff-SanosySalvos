import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PetService } from './pet.service';
import { CreatePetDto, UpdatePetDto, PetDto, CreatePetPublicationDto, PetPublicationDto, AdoptablePetEnrichedDto } from './dto/pet.dto';
import { AuthToken } from '@/common/decorators';
import { JwtPropagationGuard } from '@/common/guards/jwt-propagation.guard';
import { LoggingInterceptor } from '@/common/interceptors';

@ApiTags('Pets')
@Controller('/api/pets')
@UseInterceptors(LoggingInterceptor)
export class PetController {
    constructor(private readonly petService: PetService) { }

    @Post()
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new pet' })
    @ApiResponse({ status: 201, description: 'Pet created', type: PetDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async create(
        @Body() dto: CreatePetDto,
        @AuthToken() token: string
    ): Promise<PetDto> {
        return this.petService.create(dto, token);
    }

    @Get('/me')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user\'s pets' })
    @ApiResponse({ status: 200, description: 'List of user pets', type: [PetDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getMy(@AuthToken() token: string): Promise<PetDto[]> {
        return this.petService.getMy(token);
    }

    @Get('/lost')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all lost pets' })
    @ApiResponse({ status: 200, description: 'List of lost pets', type: [PetDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getLost(@AuthToken() token: string): Promise<PetDto[]> {
        return this.petService.getLost(token);
    }

    @Get('/adoptable')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all pets available for adoption' })
    @ApiResponse({ status: 200, description: 'List of adoptable pets', type: [PetDto] })
    async getAdoptable(@AuthToken() token: string): Promise<PetDto[]> {
        return this.petService.getAdoptable(token);
    }

    @Get('/adoptable/enriched')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get adoptable pets with caretaker information' })
    @ApiResponse({ status: 200, description: 'Enriched adoptable pets list', type: [AdoptablePetEnrichedDto] })
    async getAdoptableEnriched(@AuthToken() token: string): Promise<AdoptablePetEnrichedDto[]> {
        return this.petService.getAdoptableEnriched(token);
    }

    @Get('/:id')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get a pet by ID' })
    @ApiResponse({ status: 200, description: 'Pet details', type: PetDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Pet not found' })
    async getById(
        @Param('id') id: string,
        @AuthToken() token: string
    ): Promise<PetDto> {
        return this.petService.getById(id, token);
    }

    @Put('/:id')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a pet' })
    @ApiResponse({ status: 200, description: 'Pet updated', type: PetDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Pet not found' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdatePetDto,
        @AuthToken() token: string
    ): Promise<PetDto> {
        return this.petService.update(id, dto, token);
    }

    @Put('/:id/found')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark a pet as found (idempotent)' })
    @ApiResponse({ status: 200, description: 'Pet marked as found', type: PetDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Pet not found' })
    async markAsFound(
        @Param('id') id: string,
        @AuthToken() token: string
    ): Promise<PetDto> {
        return this.petService.markAsFound(id, token);
    }

    @Delete('/:id')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a pet' })
    @ApiResponse({ status: 204, description: 'Pet deleted' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Pet not found' })
    async delete(
        @Param('id') id: string,
        @AuthToken() token: string
    ): Promise<void> {
        return this.petService.delete(id, token);
    }

    @Post('/publications')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a pet adoption publication (expires in 14 days)' })
    @ApiResponse({ status: 201, description: 'Publication created', type: PetPublicationDto })
    async createPublication(
        @Body() dto: CreatePetPublicationDto,
        @AuthToken() token: string
    ): Promise<PetPublicationDto> {
        return this.petService.createPublication(dto, token);
    }

    @Get('/publications/active')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all active (non-expired) publications' })
    @ApiResponse({ status: 200, description: 'List of active publications', type: [PetPublicationDto] })
    async getActivePublications(@AuthToken() token: string): Promise<PetPublicationDto[]> {
        return this.petService.getActivePublications(token);
    }

    @Get('/publications/me')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my publications' })
    @ApiResponse({ status: 200, description: 'My publications', type: [PetPublicationDto] })
    async getMyPublications(@AuthToken() token: string): Promise<PetPublicationDto[]> {
        return this.petService.getMyPublications(token);
    }

    @Delete('/publications/:id')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a publication' })
    @ApiResponse({ status: 204, description: 'Publication deleted' })
    async deletePublication(
        @Param('id') id: string,
        @AuthToken() token: string
    ): Promise<void> {
        return this.petService.deletePublication(id, token);
    }
}
