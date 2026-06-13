import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { VetService } from '../vets/vet.service';
import { PetService } from '../pets/pet.service';
import { ProfileDataClient } from '@/http-clients/profile-data/profile-data.client';
import { ProfileResponseDto, UserProfileDto, CreateUserProfileDto, UpdateUserProfileDto } from './dto/profile.dto';
import { AggregatedSection } from '@/common/types';
import { RoleId } from '@/common/enums/role.enum';

@Injectable()
export class ProfileService {
    private readonly logger = new Logger(ProfileService.name);

    constructor(
        private readonly authService: AuthService,
        private readonly vetService: VetService,
        private readonly petService: PetService,
        private readonly profileDataClient: ProfileDataClient
    ) { }

    async getProfile(token: string, correlationId: string): Promise<ProfileResponseDto> {
        const timestamp = new Date().toISOString();

        const userInfo = await this.authService.getMe(token);

        const [vetsResult, petsResult] = await Promise.allSettled([
            this.shouldFetchVet(userInfo.roles) ? this.vetService.getMy(token) : Promise.reject(new Error('User is not a VET')),
            this.petService.getMy(token),
        ]);

        let vet: AggregatedSection<any> | null = null;
        if (this.shouldFetchVet(userInfo.roles)) {
            if (vetsResult.status === 'fulfilled') {
                vet = { data: vetsResult.value, ok: true };
            } else {
                vet = { data: null, ok: false, error: (vetsResult.reason as Error).message };
            }
        }

        const pets = petsResult.status === 'fulfilled'
            ? { data: petsResult.value, ok: true }
            : { data: null, ok: false, error: (petsResult.reason as Error).message };

        if (petsResult.status === 'rejected') {
            this.logger.error(`[${correlationId}] Failed to fetch pets for profile`);
            throw new ServiceUnavailableException('Unable to fetch pets data');
        }

        const partial = (vet && !vet.ok) || !pets.ok;

        return { user: userInfo, vet, pets, _meta: { partial, correlationId, timestamp } };
    }

    async createUserProfile(dto: CreateUserProfileDto, token: string): Promise<UserProfileDto> {
        return this.profileDataClient.createProfile(dto, token);
    }

    async getUserProfile(token: string): Promise<UserProfileDto> {
        return this.profileDataClient.getMyProfile(token);
    }

    async updateUserProfile(dto: UpdateUserProfileDto, token: string): Promise<UserProfileDto> {
        return this.profileDataClient.updateMyProfile(dto, token);
    }

    private shouldFetchVet(roles: number[]): boolean {
        return roles.includes(RoleId.REFUGIO) || roles.includes(RoleId.ADMIN);
    }
}
