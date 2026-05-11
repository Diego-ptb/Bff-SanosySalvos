import { Injectable } from '@nestjs/common';
import { VetClient } from '@/http-clients/vet/vet.client';
import { CreateVetDto, UpdateVetDto, VetDto } from './dto/vet.dto';

@Injectable()
export class VetService {
    constructor(private readonly vetClient: VetClient) { }

    async getAll(token: string): Promise<VetDto[]> {
        return this.vetClient.getAll(token);
    }

    async create(dto: CreateVetDto, token: string): Promise<VetDto> {
        return this.vetClient.create(dto, token);
    }

    async getMy(token: string): Promise<VetDto> {
        return this.vetClient.getMy(token);
    }

    async updateMy(dto: UpdateVetDto, token: string): Promise<VetDto> {
        return this.vetClient.updateMy(dto, token);
    }

    async getById(id: string, token: string): Promise<VetDto> {
        return this.vetClient.getById(id, token);
    }

    async getNearby(lat: number, lng: number, radius?: number, token?: string): Promise<VetDto[]> {
        return this.vetClient.getNearby(lat, lng, radius, token);
    }
}
