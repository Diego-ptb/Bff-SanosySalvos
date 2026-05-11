import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { VetModule } from '../src/modules/vets/vet.module';
import { PetModule } from '../src/modules/pets/pet.module';
import { validationSchema } from '../src/config/configuration';

describe('Vets & Pets - Updated Auth Requirements (e2e)', () => {
    let app: INestApplication;
    const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    validationSchema,
                    envFilePath: '.env.test',
                }),
                HttpModule,
                CacheModule.register({ isGlobal: true }),
                VetModule,
                PetModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
        );
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('Vets Endpoints — Now Require Bearer Token', () => {
        describe('GET /api/vets', () => {
            it('should reject 401 without Authorization header', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/vets')
                    .expect(HttpStatus.UNAUTHORIZED);

                expect(response.body.status).toBe(401);
                expect(response.body.title).toContain('Unauthorized');
            });

            it('should return vets with valid token', async () => {
                nock('http://vet-service:8081')
                    .get('/vets')
                    .reply(200, [
                        {
                            id: 'vet-1',
                            name: 'Veterinaria Central',
                            latitude: -33.8688,
                            longitude: -70.6483,
                        },
                    ]);

                const response = await request(app.getHttpServer())
                    .get('/api/vets')
                    .set('Authorization', validToken)
                    .expect(HttpStatus.OK);

                expect(response.body).toHaveLength(1);
                expect(response.body[0].name).toBe('Veterinaria Central');
            });

            it('should set Cache-Control: private header', async () => {
                nock('http://vet-service:8081')
                    .get('/vets')
                    .reply(200, []);

                const response = await request(app.getHttpServer())
                    .get('/api/vets')
                    .set('Authorization', validToken)
                    .expect(HttpStatus.OK);

                expect(response.headers['cache-control']).toContain('private');
                expect(response.headers['cache-control']).toContain('max-age=60');
            });
        });

        describe('GET /api/vets/:id', () => {
            it('should reject 401 without Authorization header', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/vets/550e8400-e29b-41d4-a716-446655440000')
                    .expect(HttpStatus.UNAUTHORIZED);

                expect(response.body.status).toBe(401);
            });

            it('should return vet by ID with valid token', async () => {
                const vetId = '550e8400-e29b-41d4-a716-446655440000';

                nock('http://vet-service:8081')
                    .get(`/vets/${vetId}`)
                    .reply(200, {
                        id: vetId,
                        name: 'Veterinaria Central',
                        latitude: -33.8688,
                        longitude: -70.6483,
                    });

                const response = await request(app.getHttpServer())
                    .get(`/api/vets/${vetId}`)
                    .set('Authorization', validToken)
                    .expect(HttpStatus.OK);

                expect(response.body.id).toBe(vetId);
                expect(response.body.name).toBe('Veterinaria Central');
            });

            it('should return 404 if vet not found', async () => {
                const vetId = '550e8400-e29b-41d4-a716-446655440000';

                nock('http://vet-service:8081')
                    .get(`/vets/${vetId}`)
                    .reply(404, { error: 'Not found' });

                await request(app.getHttpServer())
                    .get(`/api/vets/${vetId}`)
                    .set('Authorization', validToken)
                    .expect(HttpStatus.NOT_FOUND);
            });

            it('should set Cache-Control: private header', async () => {
                const vetId = '550e8400-e29b-41d4-a716-446655440000';

                nock('http://vet-service:8081')
                    .get(`/vets/${vetId}`)
                    .reply(200, { id: vetId, name: 'Vet' });

                const response = await request(app.getHttpServer())
                    .get(`/api/vets/${vetId}`)
                    .set('Authorization', validToken)
                    .expect(HttpStatus.OK);

                expect(response.headers['cache-control']).toContain('private');
                expect(response.headers['cache-control']).toContain('max-age=300');
            });
        });

        describe('GET /api/vets/nearby/search', () => {
            it('should reject 401 without Authorization header', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/vets/nearby/search?lat=-33.87&lng=-70.65')
                    .expect(HttpStatus.UNAUTHORIZED);

                expect(response.body.status).toBe(401);
            });

            it('should return nearby vets with valid token', async () => {
                const lat = -33.8688;
                const lng = -70.6483;

                nock('http://vet-service:8081')
                    .get(`/vets/nearby?lat=${lat}&lng=${lng}`)
                    .reply(200, [
                        {
                            id: 'vet-1',
                            name: 'Veterinaria Nearby',
                            latitude: lat,
                            longitude: lng,
                            distance: 0.5,
                        },
                    ]);

                const response = await request(app.getHttpServer())
                    .get(`/api/vets/nearby/search?lat=${lat}&lng=${lng}`)
                    .set('Authorization', validToken)
                    .expect(HttpStatus.OK);

                expect(response.body).toHaveLength(1);
                expect(response.body[0].name).toBe('Veterinaria Nearby');
            });

            it('should set Cache-Control: private header', async () => {
                nock('http://vet-service:8081')
                    .get(/vets\/nearby/)
                    .reply(200, []);

                const response = await request(app.getHttpServer())
                    .get('/api/vets/nearby/search?lat=-33.87&lng=-70.65')
                    .set('Authorization', validToken)
                    .expect(HttpStatus.OK);

                expect(response.headers['cache-control']).toContain('private');
                expect(response.headers['cache-control']).toContain('max-age=60');
            });
        });
    });

    describe('Pets Endpoints — New & Updated', () => {
        describe('GET /api/pets/lost', () => {
            it('should reject 401 without Authorization header', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/pets/lost')
                    .expect(HttpStatus.UNAUTHORIZED);

                expect(response.body.status).toBe(401);
            });

            it('should return lost pets with valid token', async () => {
                nock('http://pet-service:8082')
                    .get('/pets/lost')
                    .reply(200, [
                        {
                            id: 'pet-1',
                            name: 'Firulais',
                            type: 'DOG',
                            ownerId: 'owner-1',
                        },
                    ]);

                const response = await request(app.getHttpServer())
                    .get('/api/pets/lost')
                    .set('Authorization', validToken)
                    .expect(HttpStatus.OK);

                expect(response.body).toHaveLength(1);
                expect(response.body[0].name).toBe('Firulais');
            });
        });

        describe('GET /api/pets/:id (NEW)', () => {
            it('should reject 401 without Authorization header', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/pets/550e8400-e29b-41d4-a716-446655440001')
                    .expect(HttpStatus.UNAUTHORIZED);

                expect(response.body.status).toBe(401);
            });

            it('should return pet by ID with valid token', async () => {
                const petId = '550e8400-e29b-41d4-a716-446655440001';

                nock('http://pet-service:8082')
                    .get(`/pets/${petId}`)
                    .reply(200, {
                        id: petId,
                        name: 'Firulais',
                        type: 'DOG',
                        age: 3,
                        ownerId: 'owner-1',
                    });

                const response = await request(app.getHttpServer())
                    .get(`/api/pets/${petId}`)
                    .set('Authorization', validToken)
                    .expect(HttpStatus.OK);

                expect(response.body.id).toBe(petId);
                expect(response.body.name).toBe('Firulais');
                expect(response.body.type).toBe('DOG');
            });

            it('should return 404 if pet not found', async () => {
                const petId = '550e8400-e29b-41d4-a716-446655440001';

                nock('http://pet-service:8082')
                    .get(`/pets/${petId}`)
                    .reply(404, { error: 'Not found' });

                await request(app.getHttpServer())
                    .get(`/api/pets/${petId}`)
                    .set('Authorization', validToken)
                    .expect(HttpStatus.NOT_FOUND);
            });

            it('should handle invalid UUID format', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/pets/not-a-uuid')
                    .set('Authorization', validToken)
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.status).toBe(400);
            });
        });
    });
});
