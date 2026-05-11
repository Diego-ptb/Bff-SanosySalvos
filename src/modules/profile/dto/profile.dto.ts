import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from '@/modules/auth/dto/auth.dto';
import { VetDto } from '@/modules/vets/dto/vet.dto';
import { PetDto } from '@/modules/pets/dto/pet.dto';
import { AggregatedSection, AggregationMeta } from '@/common/types';

export class ProfileResponseDto {
    @ApiProperty({ type: UserInfoDto, description: 'User information' })
    user!: UserInfoDto;

    @ApiProperty({ description: 'Veterinary clinic (null if user is not a VET)' })
    vet!: AggregatedSection<VetDto> | null;

    @ApiProperty({ type: [PetDto], description: 'User\'s pets' })
    pets!: AggregatedSection<PetDto[]>;

    @ApiProperty({ description: 'Aggregation metadata' })
    _meta!: AggregationMeta;
}
