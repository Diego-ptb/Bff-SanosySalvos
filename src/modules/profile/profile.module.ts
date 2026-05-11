import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { AuthModule } from '../auth/auth.module';
import { VetModule } from '../vets/vet.module';
import { PetModule } from '../pets/pet.module';

@Module({
    imports: [AuthModule, VetModule, PetModule],
    controllers: [ProfileController],
    providers: [ProfileService],
})
export class ProfileModule { }
