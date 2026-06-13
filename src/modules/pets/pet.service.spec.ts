import { Test, TestingModule } from '@nestjs/testing';
import { PetService } from './pet.service';
import { PetClient } from '@/http-clients/pet/pet.client';
import { VetClient } from '@/http-clients/vet/vet.client';
import { ProfileDataClient } from '@/http-clients/profile-data/profile-data.client';

describe('PetService', () => {
    let service: PetService;
    let mockPetClient: jest.Mocked<PetClient>;
    let mockVetClient: jest.Mocked<VetClient>;
    let mockProfileDataClient: jest.Mocked<ProfileDataClient>;

    const token = 'Bearer test-token';

    const mockPet = {
        id: 'pet-1',
        name: 'Firulais',
        type: 'DOG',
        age: 3,
        ownerId: 'owner-1',
        lost: true,
    };

    const mockVet = {
        id: 'vet-1',
        name: 'Clínica Central',
        address: 'Calle 1',
        phone: '+56912345678',
        imageUrl: 'https://example.com/vet.jpg',
        userId: 'owner-2',
    };

    beforeEach(async () => {
        mockPetClient = {
            create: jest.fn(),
            getMy: jest.fn(),
            getLost: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            markAsFound: jest.fn(),
            deleteById: jest.fn(),
            getAdoptable: jest.fn(),
            createPublication: jest.fn(),
            getActivePublications: jest.fn(),
            getMyPublications: jest.fn(),
            deletePublication: jest.fn(),
        } as any;

        mockVetClient = {
            getAll: jest.fn(),
            getNearby: jest.fn(),
        } as any;

        mockProfileDataClient = {
            getProfileByUserId: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PetService,
                { provide: PetClient, useValue: mockPetClient },
                { provide: VetClient, useValue: mockVetClient },
                { provide: ProfileDataClient, useValue: mockProfileDataClient },
            ],
        }).compile();

        service = module.get<PetService>(PetService);
    });

    // --- simple delegates ---

    it('create delegates to petClient', async () => {
        mockPetClient.create.mockResolvedValue(mockPet as any);
        const dto = { name: 'Firulais', type: 'DOG', age: 3 };

        const result = await service.create(dto as any, token);

        expect(mockPetClient.create).toHaveBeenCalledWith(dto, token);
        expect(result).toEqual(mockPet);
    });

    it('getMy delegates to petClient', async () => {
        mockPetClient.getMy.mockResolvedValue([mockPet] as any);

        const result = await service.getMy(token);

        expect(mockPetClient.getMy).toHaveBeenCalledWith(token);
        expect(result).toEqual([mockPet]);
    });

    it('getLost delegates to petClient', async () => {
        mockPetClient.getLost.mockResolvedValue([mockPet] as any);

        const result = await service.getLost(token);

        expect(mockPetClient.getLost).toHaveBeenCalledWith(token);
        expect(result).toEqual([mockPet]);
    });

    it('getById delegates to petClient', async () => {
        mockPetClient.getById.mockResolvedValue(mockPet as any);

        const result = await service.getById('pet-1', token);

        expect(mockPetClient.getById).toHaveBeenCalledWith('pet-1', token);
        expect(result).toEqual(mockPet);
    });

    it('update delegates to petClient', async () => {
        const dto = { name: 'Max' };
        mockPetClient.update.mockResolvedValue({ ...mockPet, name: 'Max' } as any);

        const result = await service.update('pet-1', dto as any, token);

        expect(mockPetClient.update).toHaveBeenCalledWith('pet-1', dto, token);
        expect(result.name).toBe('Max');
    });

    it('markAsFound delegates to petClient', async () => {
        mockPetClient.markAsFound.mockResolvedValue({ ...mockPet, lost: false } as any);

        const result = await service.markAsFound('pet-1', token);

        expect(mockPetClient.markAsFound).toHaveBeenCalledWith('pet-1', token);
        expect(result.lost).toBe(false);
    });

    it('delete delegates to petClient', async () => {
        mockPetClient.deleteById.mockResolvedValue(undefined);

        await service.delete('pet-1', token);

        expect(mockPetClient.deleteById).toHaveBeenCalledWith('pet-1', token);
    });

    it('createPublication delegates to petClient', async () => {
        const dto = { name: 'Firulais', type: 'DOG', latitude: -33.45, longitude: -70.67 };
        const pub = { id: 'pub-1', name: 'Firulais' };
        mockPetClient.createPublication.mockResolvedValue(pub as any);

        const result = await service.createPublication(dto as any, token);

        expect(mockPetClient.createPublication).toHaveBeenCalledWith(dto, token);
        expect(result).toEqual(pub);
    });

    it('getActivePublications delegates to petClient', async () => {
        const pubs = [{ id: 'pub-1' }];
        mockPetClient.getActivePublications.mockResolvedValue(pubs as any);

        const result = await service.getActivePublications(token);

        expect(mockPetClient.getActivePublications).toHaveBeenCalledWith(token);
        expect(result).toEqual(pubs);
    });

    it('deletePublication delegates to petClient', async () => {
        mockPetClient.deletePublication.mockResolvedValue(undefined);

        await service.deletePublication('pub-1', token);

        expect(mockPetClient.deletePublication).toHaveBeenCalledWith('pub-1', token);
    });

    // --- getAdoptableEnriched ---

    it('getAdoptableEnriched: pet owner is vet → caretaker comes from vetMap', async () => {
        const petOwnedByVet = { ...mockPet, ownerId: 'owner-2' };
        mockPetClient.getAdoptable.mockResolvedValue([petOwnedByVet] as any);
        mockVetClient.getAll.mockResolvedValue([mockVet] as any);

        const result = await service.getAdoptableEnriched(token);

        expect(result[0].caretaker).toEqual({
            type: 'VET',
            name: 'Clínica Central',
            address: 'Calle 1',
            phone: '+56912345678',
            imageUrl: 'https://example.com/vet.jpg',
        });
        expect(mockProfileDataClient.getProfileByUserId).not.toHaveBeenCalled();
    });

    it('getAdoptableEnriched: pet owner is regular user → caretaker from profileDataClient', async () => {
        const petOwnedByUser = { ...mockPet, ownerId: 'owner-1' };
        mockPetClient.getAdoptable.mockResolvedValue([petOwnedByUser] as any);
        mockVetClient.getAll.mockResolvedValue([]);
        mockProfileDataClient.getProfileByUserId.mockResolvedValue({
            firstName: 'Juan',
            lastName: 'Pérez',
            address: 'Av. Providencia 123',
            phoneNumber: '+56912345678',
        } as any);

        const result = await service.getAdoptableEnriched(token);

        expect(result[0].caretaker).toEqual({
            type: 'USER',
            name: 'Juan Pérez',
            address: 'Av. Providencia 123',
            phone: '+56912345678',
        });
    });

    it('getAdoptableEnriched: profile fetch fails → caretaker is null', async () => {
        const petOwnedByUser = { ...mockPet, ownerId: 'owner-1' };
        mockPetClient.getAdoptable.mockResolvedValue([petOwnedByUser] as any);
        mockVetClient.getAll.mockResolvedValue([]);
        mockProfileDataClient.getProfileByUserId.mockRejectedValue(new Error('Profile not found'));

        const result = await service.getAdoptableEnriched(token);

        expect(result[0].caretaker).toBeNull();
    });

    it('getAdoptableEnriched: vetClient.getAll fails → treats as empty, still resolves', async () => {
        mockPetClient.getAdoptable.mockResolvedValue([mockPet] as any);
        mockVetClient.getAll.mockRejectedValue(new Error('Vet service down'));
        mockProfileDataClient.getProfileByUserId.mockResolvedValue({
            firstName: 'Juan',
            lastName: 'Pérez',
            address: 'Calle 1',
            phoneNumber: '+56912345678',
        } as any);

        const result = await service.getAdoptableEnriched(token);

        expect(result).toHaveLength(1);
        expect(result[0].caretaker?.type).toBe('USER');
    });

    it('getAdoptableEnriched: multiple pets with same owner → profileDataClient called once', async () => {
        const pet1 = { ...mockPet, id: 'pet-1', ownerId: 'owner-1' };
        const pet2 = { ...mockPet, id: 'pet-2', ownerId: 'owner-1' };
        mockPetClient.getAdoptable.mockResolvedValue([pet1, pet2] as any);
        mockVetClient.getAll.mockResolvedValue([]);
        mockProfileDataClient.getProfileByUserId.mockResolvedValue({
            firstName: 'Juan',
            lastName: 'Pérez',
            address: 'Calle 1',
            phoneNumber: '+56912345678',
        } as any);

        const result = await service.getAdoptableEnriched(token);

        expect(result).toHaveLength(2);
        expect(mockProfileDataClient.getProfileByUserId).toHaveBeenCalledTimes(1);
    });
});
