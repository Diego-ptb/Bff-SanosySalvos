import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from '../src/modules/auth/auth.module';
import { validationSchema } from '../src/config/configuration';

describe('Auth Module (e2e)', () => {
    let app: INestApplication;

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
                AuthModule,
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

    describe('POST /api/auth/register', () => {
        it('should register a user successfully', async () => {
            const registerDto = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            nock('http://auth-service:8080')
                .post('/auth/register', registerDto)
                .reply(200, {
                    token: 'access-token-xyz',
                    refreshToken: 'refresh-token-xyz',
                    username: 'testuser',
                    roles: [3],
                });

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerDto)
                .expect(HttpStatus.OK);

            expect(response.body.token).toBe('access-token-xyz');
            expect(response.body.username).toBe('testuser');
            expect(response.body.roles).toContain(3);
        });

        it('should reject invalid email', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'not-an-email',
                    password: 'password123',
                })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it('should reject short password', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: '123', // < 6 characters
                })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.errors).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully', async () => {
            const loginDto = {
                username: 'testuser',
                password: 'password123',
            };

            nock('http://auth-service:8080')
                .post('/auth/login', loginDto)
                .reply(200, {
                    token: 'access-token-xyz',
                    refreshToken: 'refresh-token-xyz',
                    username: 'testuser',
                    roles: [3],
                });

            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(HttpStatus.OK);

            expect(response.body.token).toBeDefined();
            expect(response.body.refreshToken).toBeDefined();
        });

        it('should return 401 on invalid credentials', async () => {
            const loginDto = {
                username: 'testuser',
                password: 'wrong-password',
            };

            nock('http://auth-service:8080')
                .post('/auth/login', loginDto)
                .reply(401, {
                    error: 'Unauthorized',
                    message: 'Invalid credentials',
                });

            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return user info when authenticated', async () => {
            const token = 'valid-jwt-token';

            nock('http://auth-service:8080')
                .get('/auth/me')
                .matchHeader('authorization', `Bearer ${token}`)
                .reply(200, {
                    username: 'testuser',
                    email: 'test@example.com',
                    roles: [3],
                });

            const response = await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK);

            expect(response.body.username).toBe('testuser');
            expect(response.body.email).toBe('test@example.com');
        });

        it('should return 401 when no token provided', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .expect(HttpStatus.UNAUTHORIZED);
        });

        it('should return 401 with invalid Bearer format', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', 'InvalidFormat token')
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });
});
