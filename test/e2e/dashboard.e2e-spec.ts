import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { DashboardModule } from '../src/modules/dashboard/dashboard.module';
import { validationSchema } from '../src/config/configuration';

describe('Dashboard Module (e2e)', () => {
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
                DashboardModule,
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

    describe('GET /api/dashboard', () => {
        it('should require Authorization header (Bearer token)', async () => {
            // Test que endpoint ahora requiere auth
            const response = await request(app.getHttpServer())
                .get(`/api/dashboard?lat=-33.87&lng=-70.65`)
                .expect(HttpStatus.UNAUTHORIZED); // ✅ 401 sin token

            expect(response.body.status).toBe(401);
        });

        it('should return aggregated dashboard data as GeoJSON FeatureCollection (success)', async () => {
            const lat = -33.8688;
            const lng = -151.2093;

            nock('http://vet-service:8081')
                .get(`/vets/nearby?lat=${lat}&lng=${lng}`)
                .reply(200, [
                    {
                        id: 'vet-1',
                        name: 'Veterinaria Central',
                        latitude: lat,
                        longitude: lng,
                        address: 'Calle Principal 123',
                        phone: '+56912345678',
                        imageUrl: 'https://example.com/vet.jpg',
                    },
                ]);

            nock('http://pet-service:8082')
                .get('/pets/lost')
                .reply(200, [
                    {
                        id: 'pet-1',
                        name: 'Firulais',
                        type: 'DOG',
                        latitude: lat + 0.001,
                        longitude: lng + 0.001,
                        ownerId: 'owner-1',
                        imageUrl: 'https://example.com/pet.jpg',
                    },
                ]);

            const response = await request(app.getHttpServer())
                .get(`/api/dashboard?lat=${lat}&lng=${lng}`)
                .set('Authorization', validToken)
                .expect(HttpStatus.OK);

            // ✅ Estructura GeoJSON FeatureCollection
            expect(response.body.vets.type).toBe('FeatureCollection');
            expect(response.body.vets.features).toBeDefined();
            expect(response.body.vets.features).toHaveLength(1);

            // ✅ Feature con geometry Point y coordinates [lng, lat] (CRÍTICO: orden invertido)
            const vetFeature = response.body.vets.features[0];
            expect(vetFeature.type).toBe('Feature');
            expect(vetFeature.geometry.type).toBe('Point');
            expect(vetFeature.geometry.coordinates).toEqual([lng, lat]); // [longitude, latitude]

            // ✅ Properties
            expect(vetFeature.properties.id).toBe('vet-1');
            expect(vetFeature.properties.name).toBe('Veterinaria Central');

            // ✅ Lost pets también como GeoJSON
            expect(response.body.lostPets.type).toBe('FeatureCollection');
            expect(response.body.lostPets.features).toHaveLength(1);

            // ✅ Métricas
            expect(response.body.metrics.totalVets).toBe(1);
            expect(response.body.metrics.totalLostPets).toBe(1);

            // ✅ Metadata
            expect(response.body._meta.partial).toBe(false);
            expect(response.body._meta.correlationId).toBeDefined();
        });

        it('should filter out items without valid coordinates', async () => {
            const lat = -33.8688;
            const lng = -151.2093;

            // Vet sin latitud
            nock('http://vet-service:8081')
                .get(`/vets/nearby?lat=${lat}&lng=${lng}`)
                .reply(200, [
                    {
                        id: 'vet-with-coords',
                        name: 'Vet 1',
                        latitude: lat,
                        longitude: lng,
                    },
                    {
                        id: 'vet-without-lat',
                        name: 'Vet 2',
                        latitude: null, // ❌ Sin latitud
                        longitude: lng,
                    },
                    {
                        id: 'vet-with-zero-lng',
                        name: 'Vet 3',
                        latitude: lat,
                        longitude: 0, // ❌ Longitude es 0 (inválida)
                    },
                ]);

            nock('http://pet-service:8082')
                .get('/pets/lost')
                .reply(200, []);

            const response = await request(app.getHttpServer())
                .get(`/api/dashboard?lat=${lat}&lng=${lng}`)
                .set('Authorization', validToken)
                .expect(HttpStatus.OK);

            // ✅ Solo 1 vet tiene coordenadas válidas
            expect(response.body.vets.features).toHaveLength(1);
            expect(response.body.vets.features[0].properties.id).toBe('vet-with-coords');
        });

        it('should handle partial failure gracefully', async () => {
            const lat = -33.8688;
            const lng = -151.2093;

            // vet-service falla
            nock('http://vet-service:8081')
                .get(`/vets/nearby?lat=${lat}&lng=${lng}`)
                .reply(500, { error: 'Internal Server Error' });

            // pet-service OK
            nock('http://pet-service:8082')
                .get('/pets/lost')
                .reply(200, []);

            const response = await request(app.getHttpServer())
                .get(`/api/dashboard?lat=${lat}&lng=${lng}`)
                .set('Authorization', validToken)
                .expect(HttpStatus.OK); // ✅ Retorna 200 aunque vet-service falle

            expect(response.body.vets.features).toEqual([]); // FeatureCollection vacío
            expect(response.body.lostPets.features).toEqual([]);
            expect(response.body._meta.partial).toBe(true); // ✅ Indica fallo parcial
        });

        it('should return 503 when all services fail', async () => {
            const lat = -33.8688;
            const lng = -151.2093;

            nock('http://vet-service:8081')
                .get(`/vets/nearby?lat=${lat}&lng=${lng}`)
                .reply(500);

            nock('http://pet-service:8082')
                .get('/pets/lost')
                .reply(500);

            await request(app.getHttpServer())
                .get(`/api/dashboard?lat=${lat}&lng=${lng}`)
                .set('Authorization', validToken)
                .expect(HttpStatus.SERVICE_UNAVAILABLE); // ✅ 503
        });

        it('should use all vets if lat/lng not provided', async () => {
            nock('http://vet-service:8081')
                .get('/vets')
                .reply(200, [
                    { id: '1', name: 'Vet 1', latitude: -33, longitude: -70 },
                    { id: '2', name: 'Vet 2', latitude: -33.5, longitude: -70.5 },
                ]);

            nock('http://pet-service:8082')
                .get('/pets/lost')
                .reply(200, []);

            const response = await request(app.getHttpServer())
                .get('/api/dashboard')
                .set('Authorization', validToken)
                .expect(HttpStatus.OK);

            expect(response.body.vets.features).toHaveLength(2);
            expect(response.body.vets.type).toBe('FeatureCollection');
        });

        it('should set Cache-Control: private header', async () => {
            nock('http://vet-service:8081')
                .get('/vets')
                .reply(200, []);

            nock('http://pet-service:8082')
                .get('/pets/lost')
                .reply(200, []);

            const response = await request(app.getHttpServer())
                .get('/api/dashboard')
                .set('Authorization', validToken)
                .expect(HttpStatus.OK);

            expect(response.headers['cache-control']).toContain('private');
            expect(response.headers['cache-control']).toContain('max-age=60');
        });
    });
});

