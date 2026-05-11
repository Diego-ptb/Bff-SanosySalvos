import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpClientBase } from '../http-client.base';
import { CreateVetDto, UpdateVetDto, VetDto } from '@/modules/vets/dto/vet.dto';

@Injectable()
export class VetClient extends HttpClientBase {
    private readonly baseUrl: string;

    constructor(
        httpService: HttpService,
        configService: ConfigService
    ) {
        super(httpService, configService);
        this.baseUrl = configService.get<string>('VET_SERVICE_URL') || 'http://vet-service:8081';
    }

    async getAll(token: string): Promise<VetDto[]> {
        return this.get<VetDto[]>(
            `${this.baseUrl}/vets`,
            this.extractToken(token)
        );
    }

    async create(dto: CreateVetDto, token: string): Promise<VetDto> {
        return this.post<VetDto>(
            `${this.baseUrl}/vets`,
            dto,
            this.extractToken(token)
        );
    }

    async getMy(token: string): Promise<VetDto> {
        return this.get<VetDto>(
            `${this.baseUrl}/vets/my`,
            this.extractToken(token)
        );
    }

    async updateMy(dto: UpdateVetDto, token: string): Promise<VetDto> {
        return this.patch<VetDto>(
            `${this.baseUrl}/vets/my`,
            dto,
            this.extractToken(token)
        );
    }

    async getById(id: string, token: string): Promise<VetDto> {
        return this.get<VetDto>(
            `${this.baseUrl}/vets/${id}`,
            this.extractToken(token)
        );
    }

    async getNearby(lat: number, lng: number, radius?: number, token?: string): Promise<VetDto[]> {
        const params = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
        });
        if (radius !== undefined) {
            params.append('radius', radius.toString());
        }
        const authToken = token ? this.extractToken(token) : undefined;
        return this.get<VetDto[]>(`${this.baseUrl}/vets/nearby?${params.toString()}`, authToken);
    }
}
