import { Injectable } from '@nestjs/common';
import { PetClient } from '@/http-clients/pet/pet.client';
import { VetClient } from '@/http-clients/vet/vet.client';
import { ProfileDataClient } from '@/http-clients/profile-data/profile-data.client';
import { CreatePetDto, UpdatePetDto, PetDto, CreatePetPublicationDto, PetPublicationDto, AdoptablePetEnrichedDto, CaretakerDto } from './dto/pet.dto';

@Injectable()
export class PetService {
    constructor(
        private readonly petClient: PetClient,
        private readonly vetClient: VetClient,
        private readonly profileDataClient: ProfileDataClient,
    ) { }

    async create(dto: CreatePetDto, token: string): Promise<PetDto> {
        return this.petClient.create(dto, token);
    }

    async getMy(token: string): Promise<PetDto[]> {
        return this.petClient.getMy(token);
    }

    async getLost(token: string): Promise<PetDto[]> {
        return this.petClient.getLost(token);
    }

    async getById(id: string, token: string): Promise<PetDto> {
        return this.petClient.getById(id, token);
    }

    async update(id: string, dto: UpdatePetDto, token: string): Promise<PetDto> {
        return this.petClient.update(id, dto, token);
    }

    async markAsFound(id: string, token: string): Promise<PetDto> {
        return this.petClient.markAsFound(id, token);
    }

    async delete(id: string, token: string): Promise<void> {
        return this.petClient.deleteById(id, token);
    }

    async getAdoptable(token: string): Promise<PetDto[]> {
        return this.petClient.getAdoptable(token);
    }

    async getAdoptableEnriched(token: string): Promise<AdoptablePetEnrichedDto[]> {
        const [pets, vets] = await Promise.all([
            this.petClient.getAdoptable(token),
            this.vetClient.getAll(token).catch(() => []),
        ]);

        const vetMap = new Map<string, CaretakerDto>();
        for (const vet of vets) {
            if (vet.userId) {
                vetMap.set(vet.userId, {
                    type: 'VET',
                    name: vet.name,
                    address: vet.address,
                    phone: vet.phone,
                    imageUrl: vet.imageUrl,
                });
            }
        }

        const userOwnerIds = [...new Set(
            pets.filter(p => !vetMap.has(p.ownerId)).map(p => p.ownerId)
        )];

        const profileMap = new Map<string, CaretakerDto | null>();
        await Promise.allSettled(
            userOwnerIds.map(async (ownerId) => {
                try {
                    const profile = await this.profileDataClient.getProfileByUserId(ownerId, token);
                    profileMap.set(ownerId, {
                        type: 'USER',
                        name: `${profile.firstName} ${profile.lastName}`.trim(),
                        address: profile.address,
                        phone: profile.phoneNumber,
                    });
                } catch {
                    profileMap.set(ownerId, null);
                }
            })
        );

        return pets.map(pet => ({
            ...pet,
            caretaker: vetMap.get(pet.ownerId) ?? profileMap.get(pet.ownerId) ?? null,
        }));
    }

    async createPublication(dto: CreatePetPublicationDto, token: string): Promise<PetPublicationDto> {
        return this.petClient.createPublication(dto, token);
    }

    async getActivePublications(token: string): Promise<PetPublicationDto[]> {
        return this.petClient.getActivePublications(token);
    }

    async getMyPublications(token: string): Promise<PetPublicationDto[]> {
        return this.petClient.getMyPublications(token);
    }

    async deletePublication(id: string, token: string): Promise<void> {
        return this.petClient.deletePublication(id, token);
    }
}
