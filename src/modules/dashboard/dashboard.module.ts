import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { VetModule } from '../vets/vet.module';
import { PetModule } from '../pets/pet.module';

@Module({
    imports: [VetModule, PetModule],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
