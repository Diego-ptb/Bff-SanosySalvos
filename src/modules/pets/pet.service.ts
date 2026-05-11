import { Injectable } from '@nestjs/common';
import { PetClient } from '@/http-clients/pet/pet.client';
import { CreatePetDto, UpdatePetDto, PetDto } from './dto/pet.dto';

@Injectable()
export class PetService {
    constructor(private readonly petClient: PetClient) { }

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
}
