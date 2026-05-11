import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpClientBase } from '../http-client.base';
import {
    RegisterDto,
    LoginDto,
    RefreshDto,
    AuthResponseDto,
    UserInfoDto,
} from '@/modules/auth/dto/auth.dto';

@Injectable()
export class AuthClient extends HttpClientBase {
    private readonly baseUrl: string;

    constructor(
        httpService: HttpService,
        configService: ConfigService
    ) {
        super(httpService, configService);
        this.baseUrl = configService.get<string>('AUTH_SERVICE_URL') || 'http://auth-service:8080';
    }

    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        return this.post<AuthResponseDto>(`${this.baseUrl}/auth/register`, dto);
    }

    async login(dto: LoginDto): Promise<AuthResponseDto> {
        return this.post<AuthResponseDto>(`${this.baseUrl}/auth/login`, dto);
    }

    async refresh(dto: RefreshDto, token: string): Promise<AuthResponseDto> {
        return this.post<AuthResponseDto>(
            `${this.baseUrl}/auth/refresh`,
            dto,
            this.extractToken(token)
        );
    }

    async validate(token: string): Promise<boolean> {
        const response = await this.get<boolean>(
            `${this.baseUrl}/auth/validate`,
            this.extractToken(token)
        );
        return response;
    }

    async getMe(token: string): Promise<UserInfoDto> {
        return this.get<UserInfoDto>(
            `${this.baseUrl}/auth/me`,
            this.extractToken(token)
        );
    }
}
