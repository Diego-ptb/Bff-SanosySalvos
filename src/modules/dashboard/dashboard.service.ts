import { Injectable, ServiceUnavailableException, Logger, Inject } from '@nestjs/common';
import { VetService } from '../vets/vet.service';
import { PetService } from '../pets/pet.service';
import { DashboardResponseDto, DashboardQueryDto } from './dto/dashboard.dto';
import { AggregationMeta } from '@/common/types';
import { VetDto } from '../vets/dto/vet.dto';
import { PetDto } from '../pets/dto/pet.dto';
import { VetFeatureCollection, PetFeatureCollection, VetProperties, PetProperties } from '@/common/types/geojson';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(
        private readonly vetService: VetService,
        private readonly petService: PetService,
        @Inject('CACHE_MANAGER')
        private readonly cacheManager: any
    ) { }

    async getDashboard(
        query: DashboardQueryDto,
        correlationId: string,
        token: string
    ): Promise<DashboardResponseDto> {
        const timestamp = new Date().toISOString();

        // Generar cache key basada en parámetros de ubicación
        const cacheKey = this.generateCacheKey(query);
        const cached = (await this.cacheManager.get(cacheKey)) as DashboardResponseDto | undefined;
        if (cached) {
            this.logger.debug(`[${correlationId}] Dashboard cache hit for key: ${cacheKey}`);
            return cached;
        }

        // Ejecutar ambas llamadas en paralelo con tolerancia a fallos
        const [vetsResult, petsResult] = await Promise.allSettled([
            query.lat && query.lng
                ? this.vetService.getNearby(query.lat, query.lng, query.radius, token)
                : this.vetService.getAll(token),
            this.petService.getLost(token),
        ]);

        // Mapear resultados y convertir a GeoJSON
        const vetsData = this.extractData<VetDto[]>(vetsResult);
        const petsData = this.extractData<PetDto[]>(petsResult);

        // Convertir a FeatureCollections
        const vets = this.toVetFeatureCollection(vetsData);
        const lostPets = this.toPetFeatureCollection(petsData);

        // Calcular métricas
        const metrics = {
            totalVets: vets.features.length,
            totalLostPets: lostPets.features.length,
        };

        // Determinar si es parcial
        const partial = vetsResult.status === 'rejected' || petsResult.status === 'rejected';

        // Si ambas fallaron, devolver 503
        if (vetsResult.status === 'rejected' && petsResult.status === 'rejected') {
            this.logger.error(`[${correlationId}] All upstream services failed for dashboard`);
            throw new ServiceUnavailableException(
                'Unable to fetch dashboard data: all upstream services failed'
            );
        }

        const response: DashboardResponseDto = {
            vets,
            lostPets,
            _meta: {
                partial,
                correlationId,
                timestamp,
            },
            metrics,
        };

        // Cachear por 60 segundos
        await this.cacheManager.set(cacheKey, response, 60000);

        return response;
    }

    private generateCacheKey(query: DashboardQueryDto): string {
        if (query.lat && query.lng) {
            return `dashboard:${query.lat}:${query.lng}:${query.radius || 'default'}`;
        }
        return 'dashboard:all';
    }

    private extractData<T>(result: PromiseSettledResult<T>): T | null {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        const error = result.reason as Error;
        this.logger.warn(`Upstream service error: ${error.message}`);
        return null;
    }

    /**
     * Convierte VetDto[] a GeoJSON FeatureCollection
     * Filtra elementos sin coordenadas válidas
     */
    private toVetFeatureCollection(vets: VetDto[] | null): VetFeatureCollection {
        if (!vets || vets.length === 0) {
            return { type: 'FeatureCollection', features: [] };
        }

        const features = vets
            .filter((vet) => this.hasValidCoordinates(vet.latitude, vet.longitude))
            .map((vet) => ({
                type: 'Feature' as const,
                geometry: {
                    type: 'Point' as const,
                    // CRITICAL: GeoJSON uses [longitude, latitude], NOT [latitude, longitude]
                    coordinates: [vet.longitude, vet.latitude] as [number, number],
                },
                properties: {
                    id: vet.id,
                    name: vet.name,
                    address: vet.address,
                    phone: vet.phone,
                    imageUrl: vet.imageUrl,
                } as VetProperties,
            }));

        return { type: 'FeatureCollection', features };
    }

    /**
     * Convierte PetDto[] a GeoJSON FeatureCollection
     * Filtra elementos sin coordenadas válidas
     */
    private toPetFeatureCollection(pets: PetDto[] | null): PetFeatureCollection {
        if (!pets || pets.length === 0) {
            return { type: 'FeatureCollection', features: [] };
        }

        const features = pets
            .filter((pet) => this.hasValidCoordinates(pet.latitude, pet.longitude))
            .map((pet) => ({
                type: 'Feature' as const,
                geometry: {
                    type: 'Point' as const,
                    // CRITICAL: GeoJSON uses [longitude, latitude], NOT [latitude, longitude]
                    coordinates: [pet.longitude, pet.latitude] as [number, number],
                },
                properties: {
                    id: pet.id,
                    name: pet.name,
                    type: pet.type,
                    imageUrl: pet.imageUrl,
                    ownerId: pet.ownerId,
                    description: pet.description,
                } as PetProperties,
            }));

        return { type: 'FeatureCollection', features };
    }

    /**
     * Valida que las coordenadas sean válidas (no null, no undefined, no 0)
     */
    private hasValidCoordinates(lat?: number, lng?: number): boolean {
        return lat !== null && lat !== undefined && lat !== 0 && lng !== null && lng !== undefined && lng !== 0;
    }
}
