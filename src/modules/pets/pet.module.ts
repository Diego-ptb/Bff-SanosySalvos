import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PetController } from './pet.controller';
import { PetService } from './pet.service';
import { PetClient } from '@/http-clients/pet/pet.client';

@Module({
    imports: [HttpModule],
    controllers: [PetController],
    providers: [PetService, PetClient],
    exports: [PetService, PetClient],
})
export class PetModule { }
