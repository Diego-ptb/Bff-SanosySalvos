import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PetController } from './pet.controller';
import { PetService } from './pet.service';
import { PetClient } from '@/http-clients/pet/pet.client';
import { VetModule } from '../vets/vet.module';
import { ProfileDataClient } from '@/http-clients/profile-data/profile-data.client';

@Module({
    imports: [HttpModule, VetModule],
    controllers: [PetController],
    providers: [PetService, PetClient, ProfileDataClient],
    exports: [PetService, PetClient],
})
export class PetModule { }
