import { Test, TestingModule } from '@nestjs/testing';
import { VetService } from './vet.service';
import { VetClient } from '@/http-clients/vet/vet.client';

describe('VetService', () => {
    let service: VetService;
    let mockVetClient: jest.Mocked<VetClient>;

    const token = 'Bearer test-token';

    const mockVet = {
        id: '1',
        name: 'Clínica Veterinaria Central',
        address: 'Av. Providencia 123',
        phone: '+56912345678',
        latitude: -33.45,
        longitude: -70.67,
        userId: 'user-uuid-1',
    };

    beforeEach(async () => {
        mockVetClient = {
            getAll: jest.fn(),
            create: jest.fn(),
            getMy: jest.fn(),
            updateMy: jest.fn(),
            getById: jest.fn(),
            getNearby: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VetService,
                { provide: VetClient, useValue: mockVetClient },
            ],
        }).compile();

        service = module.get<VetService>(VetService);
    });

    it('getAll delegates to vetClient', async () => {
        mockVetClient.getAll.mockResolvedValue([mockVet] as any);

        const result = await service.getAll(token);

        expect(mockVetClient.getAll).toHaveBeenCalledWith(token);
        expect(result).toEqual([mockVet]);
    });

    it('create delegates to vetClient with dto and token', async () => {
        const dto = { name: 'Nueva Clínica', address: 'Calle 2' };
        mockVetClient.create.mockResolvedValue(mockVet as any);

        const result = await service.create(dto as any, token);

        expect(mockVetClient.create).toHaveBeenCalledWith(dto, token);
        expect(result).toEqual(mockVet);
    });

    it('getMy delegates to vetClient', async () => {
        mockVetClient.getMy.mockResolvedValue(mockVet as any);

        const result = await service.getMy(token);

        expect(mockVetClient.getMy).toHaveBeenCalledWith(token);
        expect(result).toEqual(mockVet);
    });

    it('updateMy delegates to vetClient with dto and token', async () => {
        const dto = { phone: '+56999999999' };
        const updated = { ...mockVet, phone: '+56999999999' };
        mockVetClient.updateMy.mockResolvedValue(updated as any);

        const result = await service.updateMy(dto as any, token);

        expect(mockVetClient.updateMy).toHaveBeenCalledWith(dto, token);
        expect(result).toEqual(updated);
    });

    it('getById delegates to vetClient with id and token', async () => {
        mockVetClient.getById.mockResolvedValue(mockVet as any);

        const result = await service.getById('1', token);

        expect(mockVetClient.getById).toHaveBeenCalledWith('1', token);
        expect(result).toEqual(mockVet);
    });

    it('getNearby delegates to vetClient with lat, lng, radius and token', async () => {
        mockVetClient.getNearby.mockResolvedValue([mockVet] as any);

        const result = await service.getNearby(-33.45, -70.67, 10, token);

        expect(mockVetClient.getNearby).toHaveBeenCalledWith(-33.45, -70.67, 10, token);
        expect(result).toEqual([mockVet]);
    });

    it('getNearby without optional params passes undefined', async () => {
        mockVetClient.getNearby.mockResolvedValue([mockVet] as any);

        await service.getNearby(-33.45, -70.67);

        expect(mockVetClient.getNearby).toHaveBeenCalledWith(-33.45, -70.67, undefined, undefined);
    });
});
