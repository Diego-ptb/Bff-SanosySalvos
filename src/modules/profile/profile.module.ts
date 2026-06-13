import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileDataClient } from '@/http-clients/profile-data/profile-data.client';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { VetModule } from '../vets/vet.module';
import { PetModule } from '../pets/pet.module';

@Module({
    imports: [HttpModule, AuthModule, VetModule, PetModule],
    controllers: [ProfileController],
    providers: [ProfileService, ProfileDataClient, RolesGuard, Reflector],
    exports: [ProfileService],
})
export class ProfileModule { }
