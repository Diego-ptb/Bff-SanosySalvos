import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VetController } from './vet.controller';
import { VetService } from './vet.service';
import { VetClient } from '@/http-clients/vet/vet.client';

@Module({
    imports: [HttpModule],
    controllers: [VetController],
    providers: [VetService, VetClient],
    exports: [VetService, VetClient],
})
export class VetModule { }
