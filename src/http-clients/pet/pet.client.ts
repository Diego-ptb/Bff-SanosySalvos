import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpClientBase } from '../http-client.base';
import { CreatePetDto, UpdatePetDto, PetDto, CreatePetPublicationDto, PetPublicationDto } from '@/modules/pets/dto/pet.dto';

@Injectable()
export class PetClient extends HttpClientBase {
    private readonly baseUrl: string;

    constructor(
        httpService: HttpService,
        configService: ConfigService
    ) {
        super(httpService, configService);
        this.baseUrl = configService.get<string>('PET_SERVICE_URL') || 'http://pet-service:8082';
    }

    async create(dto: CreatePetDto, token: string): Promise<PetDto> {
        return this.post<PetDto>(
            `${this.baseUrl}/pets`,
            dto,
            this.extractToken(token)
        );
    }

    async getMy(token: string): Promise<PetDto[]> {
        return this.get<PetDto[]>(
            `${this.baseUrl}/pets/me`,
            this.extractToken(token)
        );
    }

    async getLost(token: string): Promise<PetDto[]> {
        return this.get<PetDto[]>(
            `${this.baseUrl}/pets/lost`,
            this.extractToken(token)
        );
    }

    async getById(id: string, token: string): Promise<PetDto> {
        return this.get<PetDto>(
            `${this.baseUrl}/pets/${id}`,
            this.extractToken(token)
        );
    }

    async update(id: string, dto: UpdatePetDto, token: string): Promise<PetDto> {
        return this.put<PetDto>(
            `${this.baseUrl}/pets/${id}`,
            dto,
            this.extractToken(token)
        );
    }

    async markAsFound(id: string, token: string): Promise<PetDto> {
        return this.put<PetDto>(
            `${this.baseUrl}/pets/${id}/found`,
            {},
            this.extractToken(token)
        );
    }

    async deleteById(id: string, token: string): Promise<void> {
        return super.delete<void>(
            `${this.baseUrl}/pets/${id}`,
            this.extractToken(token)
        );
    }

    async getAdoptable(token: string): Promise<PetDto[]> {
        return this.get<PetDto[]>(
            `${this.baseUrl}/pets/adoptable`,
            this.extractToken(token)
        );
    }

    async createPublication(dto: CreatePetPublicationDto, token: string): Promise<PetPublicationDto> {
        return this.post<PetPublicationDto>(
            `${this.baseUrl}/publications`,
            dto,
            this.extractToken(token)
        );
    }

    async getActivePublications(token: string): Promise<PetPublicationDto[]> {
        return this.get<PetPublicationDto[]>(
            `${this.baseUrl}/publications/active`,
            this.extractToken(token)
        );
    }

    async getMyPublications(token: string): Promise<PetPublicationDto[]> {
        return this.get<PetPublicationDto[]>(
            `${this.baseUrl}/publications/me`,
            this.extractToken(token)
        );
    }

    async deletePublication(id: string, token: string): Promise<void> {
        return super.delete<void>(
            `${this.baseUrl}/publications/${id}`,
            this.extractToken(token)
        );
    }
}
