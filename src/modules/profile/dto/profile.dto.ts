import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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

export class UserProfileDto {
    @ApiProperty() id!: string;
    @ApiProperty() userId!: string;
    @ApiProperty() firstName!: string;
    @ApiProperty() lastName!: string;
    @ApiPropertyOptional() address?: string;
    @ApiPropertyOptional() phoneNumber?: string;
    @ApiProperty() createdAt!: string;
    @ApiProperty() updatedAt!: string;
}

export class CreateUserProfileDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    firstName!: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    lastName!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phoneNumber?: string;
}

export class UpdateUserProfileDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    lastName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phoneNumber?: string;
}
