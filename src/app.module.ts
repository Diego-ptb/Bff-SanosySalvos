import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { validationSchema } from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { VetModule } from './modules/vets/vet.module';
import { PetModule } from './modules/pets/pet.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProfileModule } from './modules/profile/profile.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema,
            envFilePath: '.env',
        }),
        HttpModule,
        CacheModule.register({
            isGlobal: true,
            ttl: 60 * 1000, // 60 segundos default
            max: 100, // max 100 items
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60 * 1000, // 60 segundos
                limit: 100, // 100 requests per minute por IP
            },
        ]),
        AuthModule,
        VetModule,
        PetModule,
        DashboardModule,
        ProfileModule,
        HealthModule,
    ],
})
export class AppModule { }
