import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto, AuthResponseDto, UserInfoDto } from './dto/auth.dto';
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
}
