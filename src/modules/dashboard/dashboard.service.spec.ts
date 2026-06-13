import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { VetService } from '../vets/vet.service';
import { PetService } from '../pets/pet.service';

describe('DashboardService', () => {
    let service: DashboardService;
    let mockVetService: jest.Mocked<VetService>;
    let mockPetService: jest.Mocked<PetService>;
    let mockCacheManager: { get: jest.Mock; set: jest.Mock };

    const correlationId = 'test-correlation-id';
    const token = 'Bearer test-token';

    const mockVet = {
        id: '1',
        name: 'Clínica Central',
        address: 'Av. Providencia 123',
        phone: '+56912345678',
        latitude: -33.45,
        longitude: -70.67,
        userId: 'user-1',
    };

    const mockPubNearby = {
        id: 'pub-1',
        name: 'Firulais',
        type: 'DOG',
        ownerId: 'owner-1',
        latitude: -33.46,
        longitude: -70.68,
        active: true,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    };

    const mockPubFar = {
        id: 'pub-2',
        name: 'Luna',
        type: 'CAT',
        ownerId: 'owner-2',
        latitude: -34.0,
        longitude: -71.0,
        active: true,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    };

    beforeEach(async () => {
        mockVetService = {
            getAll: jest.fn(),
            getNearby: jest.fn(),
        } as any;

        mockPetService = {
            getActivePublications: jest.fn(),
        } as any;

        mockCacheManager = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                { provide: VetService, useValue: mockVetService },
                { provide: PetService, useValue: mockPetService },
                { provide: 'CACHE_MANAGER', useValue: mockCacheManager },
            ],
        }).compile();

        service = module.get<DashboardService>(DashboardService);
    });

    // --- cache ---

    it('cache hit: returns cached value without calling services', async () => {
        const cached = { vets: { features: [] }, lostPets: { features: [] } };
        mockCacheManager.get.mockResolvedValue(cached);

        const result = await service.getDashboard({} as any, correlationId, token);

        expect(result).toEqual(cached);
        expect(mockVetService.getAll).not.toHaveBeenCalled();
        expect(mockPetService.getActivePublications).not.toHaveBeenCalled();
    });

    // --- without location ---

    it('no location params: calls getAll instead of getNearby', async () => {
        mockVetService.getAll.mockResolvedValue([mockVet] as any);
        mockPetService.getActivePublications.mockResolvedValue([mockPubNearby] as any);

        await service.getDashboard({} as any, correlationId, token);

        expect(mockVetService.getAll).toHaveBeenCalledWith(token);
        expect(mockVetService.getNearby).not.toHaveBeenCalled();
    });

    it('no location params: all publications included (no haversine filter)', async () => {
        mockVetService.getAll.mockResolvedValue([]);
        mockPetService.getActivePublications.mockResolvedValue([mockPubNearby, mockPubFar] as any);

        const result = await service.getDashboard({} as any, correlationId, token);

        expect(result.lostPets.features).toHaveLength(2);
    });

    // --- with location ---

    it('with location params: calls getNearby instead of getAll', async () => {
        const query = { lat: -33.45, lng: -70.67, radius: 10 };
        mockVetService.getNearby.mockResolvedValue([mockVet] as any);
        mockPetService.getActivePublications.mockResolvedValue([]) as any;

        await service.getDashboard(query as any, correlationId, token);

        expect(mockVetService.getNearby).toHaveBeenCalledWith(-33.45, -70.67, 10, token);
        expect(mockVetService.getAll).not.toHaveBeenCalled();
    });

    it('with location params: haversine filters out pets beyond radius', async () => {
        const query = { lat: -33.45, lng: -70.67, radius: 5 };
        mockVetService.getNearby.mockResolvedValue([]);
        mockPetService.getActivePublications.mockResolvedValue([mockPubNearby, mockPubFar] as any);

        const result = await service.getDashboard(query as any, correlationId, token);

        // mockPubNearby is ~1.5km away, mockPubFar is ~70km away
        expect(result.lostPets.features).toHaveLength(1);
        expect(result.lostPets.features[0].properties.id).toBe('pub-1');
    });

    it('with location params: pet without coordinates is excluded', async () => {
        const query = { lat: -33.45, lng: -70.67, radius: 10 };
        const pubNoCoords = { ...mockPubNearby, id: 'pub-no-coords', latitude: null, longitude: null };
        mockVetService.getNearby.mockResolvedValue([]);
        mockPetService.getActivePublications.mockResolvedValue([pubNoCoords] as any);

        const result = await service.getDashboard(query as any, correlationId, token);

        expect(result.lostPets.features).toHaveLength(0);
    });

    // --- partial failures ---

    it('vets service fails: returns partial result with metrics and partial=true', async () => {
        const query = {};
        mockVetService.getAll.mockRejectedValue(new Error('Vet service down'));
        mockPetService.getActivePublications.mockResolvedValue([mockPubNearby] as any);

        const result = await service.getDashboard(query as any, correlationId, token);

        expect(result._meta.partial).toBe(true);
        expect(result.vets.features).toHaveLength(0);
        expect(result.lostPets.features).toHaveLength(1);
    });

    it('pets service fails: throws ServiceUnavailableException', async () => {
        mockVetService.getAll.mockResolvedValue([mockVet] as any);
        mockPetService.getActivePublications.mockRejectedValue(new Error('Pet service down'));

        await expect(service.getDashboard({} as any, correlationId, token))
            .rejects.toThrow(ServiceUnavailableException);
    });

    it('both services fail: throws ServiceUnavailableException', async () => {
        mockVetService.getAll.mockRejectedValue(new Error('Vet down'));
        mockPetService.getActivePublications.mockRejectedValue(new Error('Pet down'));

        await expect(service.getDashboard({} as any, correlationId, token))
            .rejects.toThrow(ServiceUnavailableException);
    });

    // --- cache key ---

    it('generateCacheKey: with lat/lng returns location-based key', async () => {
        mockVetService.getNearby.mockResolvedValue([]);
        mockPetService.getActivePublications.mockResolvedValue([]);

        await service.getDashboard({ lat: -33.45, lng: -70.67, radius: 10 } as any, correlationId, token);

        expect(mockCacheManager.get).toHaveBeenCalledWith('dashboard:-33.45:-70.67:10');
    });

    it('generateCacheKey: without lat/lng returns global key', async () => {
        mockVetService.getAll.mockResolvedValue([]);
        mockPetService.getActivePublications.mockResolvedValue([]);

        await service.getDashboard({} as any, correlationId, token);

        expect(mockCacheManager.get).toHaveBeenCalledWith('dashboard:all');
    });

    it('result is cached for 60 seconds', async () => {
        mockVetService.getAll.mockResolvedValue([]);
        mockPetService.getActivePublications.mockResolvedValue([]);

        await service.getDashboard({} as any, correlationId, token);

        expect(mockCacheManager.set).toHaveBeenCalledWith(
            'dashboard:all',
            expect.any(Object),
            60000
        );
    });

    // --- GeoJSON structure ---

    it('returns valid FeatureCollection structure for vets and lostPets', async () => {
        mockVetService.getAll.mockResolvedValue([mockVet] as any);
        mockPetService.getActivePublications.mockResolvedValue([mockPubNearby] as any);

        const result = await service.getDashboard({} as any, correlationId, token);

        expect(result.vets.type).toBe('FeatureCollection');
        expect(result.lostPets.type).toBe('FeatureCollection');
        expect(result.vets.features[0].properties.featureType).toBe('vet');
        expect(result.lostPets.features[0].properties.featureType).toBe('pet');
    });
});
