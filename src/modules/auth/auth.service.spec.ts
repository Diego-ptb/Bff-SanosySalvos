import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthClient } from '@/http-clients/auth/auth.client';

describe('AuthService', () => {
    let service: AuthService;
    let mockAuthClient: jest.Mocked<AuthClient>;

    const token = 'Bearer test-token';

    beforeEach(async () => {
        mockAuthClient = {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            getMe: jest.fn(),
            createVetRequest: jest.fn(),
            getMyVetRequest: jest.fn(),
            getAllVetRequests: jest.fn(),
            approveVetRequest: jest.fn(),
            rejectVetRequest: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: AuthClient, useValue: mockAuthClient },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('register delegates to authClient', async () => {
        const dto = { username: 'juan', email: 'juan@test.com', password: '123456' };
        const result = { accessToken: 'abc', refreshToken: 'xyz' };
        mockAuthClient.register.mockResolvedValue(result as any);

        const response = await service.register(dto as any);

        expect(mockAuthClient.register).toHaveBeenCalledWith(dto);
        expect(response).toEqual(result);
    });

    it('login delegates to authClient', async () => {
        const dto = { username: 'juan', password: '123456' };
        const result = { accessToken: 'abc', refreshToken: 'xyz' };
        mockAuthClient.login.mockResolvedValue(result as any);

        const response = await service.login(dto as any);

        expect(mockAuthClient.login).toHaveBeenCalledWith(dto);
        expect(response).toEqual(result);
    });

    it('refresh delegates to authClient with token', async () => {
        const dto = { refreshToken: 'xyz' };
        const result = { accessToken: 'new-abc', refreshToken: 'new-xyz' };
        mockAuthClient.refresh.mockResolvedValue(result as any);

        const response = await service.refresh(dto as any, token);

        expect(mockAuthClient.refresh).toHaveBeenCalledWith(dto, token);
        expect(response).toEqual(result);
    });

    it('getMe delegates to authClient with token', async () => {
        const userInfo = { id: '1', username: 'juan', roles: [1] };
        mockAuthClient.getMe.mockResolvedValue(userInfo as any);

        const response = await service.getMe(token);

        expect(mockAuthClient.getMe).toHaveBeenCalledWith(token);
        expect(response).toEqual(userInfo);
    });

    it('createVetRequest delegates to authClient', async () => {
        const dto = { clinicName: 'Vet Clinic', address: 'Calle 1' };
        const result = { id: 'req-1', status: 'PENDING' };
        mockAuthClient.createVetRequest.mockResolvedValue(result as any);

        const response = await service.createVetRequest(dto as any, token);

        expect(mockAuthClient.createVetRequest).toHaveBeenCalledWith(dto, token);
        expect(response).toEqual(result);
    });

    it('getMyVetRequest delegates to authClient', async () => {
        const result = { id: 'req-1', status: 'PENDING' };
        mockAuthClient.getMyVetRequest.mockResolvedValue(result as any);

        const response = await service.getMyVetRequest(token);

        expect(mockAuthClient.getMyVetRequest).toHaveBeenCalledWith(token);
        expect(response).toEqual(result);
    });

    it('getAllVetRequests delegates to authClient', async () => {
        const result = [{ id: 'req-1' }, { id: 'req-2' }];
        mockAuthClient.getAllVetRequests.mockResolvedValue(result as any);

        const response = await service.getAllVetRequests(token);

        expect(mockAuthClient.getAllVetRequests).toHaveBeenCalledWith(token);
        expect(response).toEqual(result);
    });

    it('approveVetRequest delegates to authClient with id and token', async () => {
        const result = { id: 'req-1', status: 'APPROVED' };
        mockAuthClient.approveVetRequest.mockResolvedValue(result as any);

        const response = await service.approveVetRequest('req-1', token);

        expect(mockAuthClient.approveVetRequest).toHaveBeenCalledWith('req-1', token);
        expect(response).toEqual(result);
    });

    it('rejectVetRequest delegates to authClient with id, notes and token', async () => {
        const result = { id: 'req-1', status: 'REJECTED' };
        mockAuthClient.rejectVetRequest.mockResolvedValue(result as any);

        const response = await service.rejectVetRequest('req-1', 'incomplete info', token);

        expect(mockAuthClient.rejectVetRequest).toHaveBeenCalledWith('req-1', 'incomplete info', token);
        expect(response).toEqual(result);
    });
});
