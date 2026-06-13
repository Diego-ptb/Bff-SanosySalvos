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
    CreateVetRequestDto,
    VetRequestResponseDto,
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

    async createVetRequest(dto: CreateVetRequestDto, token: string): Promise<VetRequestResponseDto> {
        return this.post<VetRequestResponseDto>(
            `${this.baseUrl}/auth/vet-requests`,
            dto,
            this.extractToken(token)
        );
    }

    async getMyVetRequest(token: string): Promise<VetRequestResponseDto> {
        return this.get<VetRequestResponseDto>(
            `${this.baseUrl}/auth/vet-requests/my`,
            this.extractToken(token)
        );
    }

    async getAllVetRequests(token: string): Promise<VetRequestResponseDto[]> {
        return this.get<VetRequestResponseDto[]>(
            `${this.baseUrl}/auth/vet-requests`,
            this.extractToken(token)
        );
    }

    async approveVetRequest(id: string, token: string): Promise<VetRequestResponseDto> {
        return this.patch<VetRequestResponseDto>(
            `${this.baseUrl}/auth/vet-requests/${id}/approve`,
            {},
            this.extractToken(token)
        );
    }

    async rejectVetRequest(id: string, notes: string | undefined, token: string): Promise<VetRequestResponseDto> {
        return this.patch<VetRequestResponseDto>(
            `${this.baseUrl}/auth/vet-requests/${id}/reject`,
            { notes },
            this.extractToken(token)
        );
    }
}
