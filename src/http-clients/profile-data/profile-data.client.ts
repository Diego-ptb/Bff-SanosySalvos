import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpClientBase } from '../http-client.base';
import { UserProfileDto, CreateUserProfileDto, UpdateUserProfileDto } from '@/modules/profile/dto/profile.dto';

@Injectable()
export class ProfileDataClient extends HttpClientBase {
    private readonly baseUrl: string;

    constructor(
        httpService: HttpService,
        configService: ConfigService
    ) {
        super(httpService, configService);
        this.baseUrl = configService.get<string>('PROFILE_SERVICE_URL') || 'http://profile-service:8083';
    }

    async createProfile(dto: CreateUserProfileDto, token: string): Promise<UserProfileDto> {
        return this.post<UserProfileDto>(
            `${this.baseUrl}/profiles`,
            dto,
            this.extractToken(token)
        );
    }

    async getMyProfile(token: string): Promise<UserProfileDto> {
        return this.get<UserProfileDto>(
            `${this.baseUrl}/profiles/me`,
            this.extractToken(token)
        );
    }

    async updateMyProfile(dto: UpdateUserProfileDto, token: string): Promise<UserProfileDto> {
        return this.patch<UserProfileDto>(
            `${this.baseUrl}/profiles/me`,
            dto,
            this.extractToken(token)
        );
    }

    async getProfileByUserId(userId: string, token: string): Promise<UserProfileDto> {
        return this.get<UserProfileDto>(
            `${this.baseUrl}/profiles/owner/${userId}`,
            this.extractToken(token)
        );
    }
}
