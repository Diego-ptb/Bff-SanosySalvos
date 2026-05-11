import { Injectable } from '@nestjs/common';
import { AuthClient } from '@/http-clients/auth/auth.client';
import { RegisterDto, LoginDto, RefreshDto, AuthResponseDto, UserInfoDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(private readonly authClient: AuthClient) { }

    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        return this.authClient.register(dto);
    }

    async login(dto: LoginDto): Promise<AuthResponseDto> {
        return this.authClient.login(dto);
    }

    async refresh(dto: RefreshDto, token: string): Promise<AuthResponseDto> {
        return this.authClient.refresh(dto, token);
    }

    async getMe(token: string): Promise<UserInfoDto> {
        return this.authClient.getMe(token);
    }
}
