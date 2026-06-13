import { Controller, Post, Get, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto, AuthResponseDto, UserInfoDto, CreateVetRequestDto, VetRequestResponseDto } from './dto/auth.dto';
import { AuthToken } from '@/common/decorators';
import { JwtPropagationGuard } from '@/common/guards/jwt-propagation.guard';

@ApiTags('Auth')
@Controller('/api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('/register')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 200, description: 'Registration successful', type: AuthResponseDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
        return this.authService.register(dto);
    }

    @Post('/login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(dto);
    }

    @Post('/refresh')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh JWT token' })
    @ApiResponse({ status: 200, description: 'Token refreshed', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async refresh(
        @Body() dto: RefreshDto,
        @AuthToken() token: string
    ): Promise<AuthResponseDto> {
        return this.authService.refresh(dto, token);
    }

    @Get('/me')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user info' })
    @ApiResponse({ status: 200, description: 'User info retrieved', type: UserInfoDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getMe(@AuthToken() token: string): Promise<UserInfoDto> {
        return this.authService.getMe(token);
    }

    @Post('/vet-requests')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Enviar solicitud de rol veterinaria' })
    @ApiResponse({ status: 200, description: 'Solicitud creada', type: VetRequestResponseDto })
    async createVetRequest(
        @Body() dto: CreateVetRequestDto,
        @AuthToken() token: string
    ): Promise<VetRequestResponseDto> {
        return this.authService.createVetRequest(dto, token);
    }

    @Get('/vet-requests/my')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Ver estado de mi solicitud de veterinaria' })
    @ApiResponse({ status: 200, description: 'Estado de la solicitud', type: VetRequestResponseDto })
    @ApiResponse({ status: 404, description: 'Sin solicitud activa' })
    async getMyVetRequest(@AuthToken() token: string): Promise<VetRequestResponseDto> {
        return this.authService.getMyVetRequest(token);
    }

    @Get('/vet-requests')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar todas las solicitudes (solo ADMIN)' })
    @ApiResponse({ status: 200, description: 'Lista de solicitudes', type: [VetRequestResponseDto] })
    async getAllVetRequests(@AuthToken() token: string): Promise<VetRequestResponseDto[]> {
        return this.authService.getAllVetRequests(token);
    }

    @Patch('/vet-requests/:id/approve')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Aprobar solicitud (solo ADMIN)' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Solicitud aprobada', type: VetRequestResponseDto })
    async approveVetRequest(
        @Param('id') id: string,
        @AuthToken() token: string
    ): Promise<VetRequestResponseDto> {
        return this.authService.approveVetRequest(id, token);
    }

    @Patch('/vet-requests/:id/reject')
    @UseGuards(JwtPropagationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Rechazar solicitud (solo ADMIN)' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Solicitud rechazada', type: VetRequestResponseDto })
    async rejectVetRequest(
        @Param('id') id: string,
        @Body() body: { notes?: string },
        @AuthToken() token: string
    ): Promise<VetRequestResponseDto> {
        return this.authService.rejectVetRequest(id, body?.notes, token);
    }
}
