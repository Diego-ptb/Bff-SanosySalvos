import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthService } from '../auth/auth.service';
import { VetService } from '../vets/vet.service';
import { PetService } from '../pets/pet.service';
import { ProfileDataClient } from '@/http-clients/profile-data/profile-data.client';

describe('ProfileService', () => {
    let service: ProfileService;
    let mockAuthService: jest.Mocked<AuthService>;
    let mockVetService: jest.Mocked<VetService>;
    let mockPetService: jest.Mocked<PetService>;
    let mockProfileDataClient: jest.Mocked<ProfileDataClient>;

    const token = 'Bearer test-token';
    const correlationId = 'test-correlation-id';

    const mockPets = [{ id: 'pet-1', name: 'Firulais', type: 'DOG' }];
    const mockVet = { id: 'vet-1', name: 'Clínica Central' };
    const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        firstName: 'Juan',
        lastName: 'Pérez',
    };

    const userInfoBase = {
        id: 'user-1',
        username: 'juan',
        email: 'juan@test.com',
        roles: [1], // USER
    };

    beforeEach(async () => {
        mockAuthService = { getMe: jest.fn() } as any;
        mockVetService = { getMy: jest.fn() } as any;
        mockPetService = { getMy: jest.fn() } as any;
        mockProfileDataClient = {
            createProfile: jest.fn(),
            getMyProfile: jest.fn(),
            updateMyProfile: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProfileService,
                { provide: AuthService, useValue: mockAuthService },
                { provide: VetService, useValue: mockVetService },
                { provide: PetService, useValue: mockPetService },
                { provide: ProfileDataClient, useValue: mockProfileDataClient },
            ],
        }).compile();

        service = module.get<ProfileService>(ProfileService);
    });

    // --- getProfile ---

    it('getProfile for regular USER: vet is null, pets included', async () => {
        mockAuthService.getMe.mockResolvedValue({ ...userInfoBase, roles: [1] } as any);
        mockPetService.getMy.mockResolvedValue(mockPets as any);

        const result = await service.getProfile(token, correlationId);

        expect(result.user.username).toBe('juan');
        expect(result.vet).toBeNull();
        expect(result.pets.ok).toBe(true);
        expect(result.pets.data).toEqual(mockPets);
        expect(mockVetService.getMy).not.toHaveBeenCalled();
    });

    it('getProfile for REFUGIO user: vet data included', async () => {
        mockAuthService.getMe.mockResolvedValue({ ...userInfoBase, roles: [2] } as any); // REFUGIO
        mockVetService.getMy.mockResolvedValue(mockVet as any);
        mockPetService.getMy.mockResolvedValue(mockPets as any);

        const result = await service.getProfile(token, correlationId);

        expect(result.vet?.ok).toBe(true);
        expect(result.vet?.data).toEqual(mockVet);
    });

    it('getProfile for ADMIN user: vet data included', async () => {
        mockAuthService.getMe.mockResolvedValue({ ...userInfoBase, roles: [3] } as any); // ADMIN
        mockVetService.getMy.mockResolvedValue(mockVet as any);
        mockPetService.getMy.mockResolvedValue(mockPets as any);

        const result = await service.getProfile(token, correlationId);

        expect(result.vet?.ok).toBe(true);
    });

    it('getProfile: vet fetch fails → vet.ok=false, partial=true', async () => {
        mockAuthService.getMe.mockResolvedValue({ ...userInfoBase, roles: [2] } as any);
        mockVetService.getMy.mockRejectedValue(new Error('Vet not found'));
        mockPetService.getMy.mockResolvedValue(mockPets as any);

        const result = await service.getProfile(token, correlationId);

        expect(result.vet?.ok).toBe(false);
        expect(result._meta.partial).toBe(true);
        expect(result.pets.ok).toBe(true);
    });

    it('getProfile: pets fetch fails → throws ServiceUnavailableException', async () => {
        mockAuthService.getMe.mockResolvedValue({ ...userInfoBase, roles: [1] } as any);
        mockPetService.getMy.mockRejectedValue(new Error('Pet service down'));

        await expect(service.getProfile(token, correlationId))
            .rejects.toThrow(ServiceUnavailableException);
    });

    it('getProfile: _meta includes correlationId and timestamp', async () => {
        mockAuthService.getMe.mockResolvedValue({ ...userInfoBase, roles: [1] } as any);
        mockPetService.getMy.mockResolvedValue([]);

        const result = await service.getProfile(token, correlationId);

        expect(result._meta.correlationId).toBe(correlationId);
        expect(result._meta.timestamp).toBeDefined();
    });

    it('getProfile: partial=false when everything succeeds', async () => {
        mockAuthService.getMe.mockResolvedValue({ ...userInfoBase, roles: [1] } as any);
        mockPetService.getMy.mockResolvedValue(mockPets as any);

        const result = await service.getProfile(token, correlationId);

        expect(result._meta.partial).toBe(false);
    });

    // --- createUserProfile ---

    it('createUserProfile delegates to profileDataClient', async () => {
        mockProfileDataClient.createProfile.mockResolvedValue(mockProfile as any);
        const dto = { firstName: 'Juan', lastName: 'Pérez' };

        const result = await service.createUserProfile(dto as any, token);

        expect(mockProfileDataClient.createProfile).toHaveBeenCalledWith(dto, token);
        expect(result).toEqual(mockProfile);
    });

    // --- getUserProfile ---

    it('getUserProfile delegates to profileDataClient', async () => {
        mockProfileDataClient.getMyProfile.mockResolvedValue(mockProfile as any);

        const result = await service.getUserProfile(token);

        expect(mockProfileDataClient.getMyProfile).toHaveBeenCalledWith(token);
        expect(result).toEqual(mockProfile);
    });

    // --- updateUserProfile ---

    it('updateUserProfile delegates to profileDataClient', async () => {
        const dto = { firstName: 'Carlos' };
        const updated = { ...mockProfile, firstName: 'Carlos' };
        mockProfileDataClient.updateMyProfile.mockResolvedValue(updated as any);

        const result = await service.updateUserProfile(dto as any, token);

        expect(mockProfileDataClient.updateMyProfile).toHaveBeenCalledWith(dto, token);
        expect(result.firstName).toBe('Carlos');
    });
});
