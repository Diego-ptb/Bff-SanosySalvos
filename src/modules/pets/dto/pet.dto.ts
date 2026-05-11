import {
    IsString,
    IsUUID,
    IsOptional,
    IsNumber,
    Min,
    Max,
    IsNotEmpty,
    MaxLength,
    IsBoolean,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { PetType } from '@/common/enums/pet-type.enum';

export class CreatePetDto {
    @ApiProperty({ example: 'Firulais', description: 'Pet name', maxLength: 100 })
    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: 'DOG', description: 'Pet type', enum: PetType })
    @IsEnum(PetType)
    @IsNotEmpty()
    type!: PetType;

    @ApiProperty({ example: 3, description: 'Pet age in years' })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    age!: number;

    @ApiProperty({ example: 'Golden retriever, friendly', description: 'Description', maxLength: 500, required: false })
    @IsString()
    @MaxLength(500)
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'https://example.com/pet.jpg', description: 'Image URL', required: false })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({ example: false, description: 'Is pet lost?', required: false })
    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    lost?: boolean;

    @ApiProperty({ example: -33.8688, description: 'Latitude (for lost pets)', required: false, minimum: -90, maximum: 90 })
    @IsNumber()
    @IsOptional()
    @Min(-90)
    @Max(90)
    @Type(() => Number)
    latitude?: number;

    @ApiProperty({ example: -151.2093, description: 'Longitude (for lost pets)', required: false, minimum: -180, maximum: 180 })
    @IsNumber()
    @IsOptional()
    @Min(-180)
    @Max(180)
    @Type(() => Number)
    longitude?: number;
}

export class UpdatePetDto {
    @ApiProperty({ example: 'Firulais', description: 'Pet name', maxLength: 100, required: false })
    @IsString()
    @MaxLength(100)
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'DOG', description: 'Pet type', enum: PetType, required: false })
    @IsEnum(PetType)
    @IsOptional()
    type?: PetType;

    @ApiProperty({ example: 3, description: 'Pet age in years', required: false })
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    age?: number;

    @ApiProperty({ example: 'Golden retriever, friendly', description: 'Description', maxLength: 500, required: false })
    @IsString()
    @MaxLength(500)
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'https://example.com/pet.jpg', description: 'Image URL', required: false })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({ example: false, description: 'Is pet lost?', required: false })
    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    lost?: boolean;

    @ApiProperty({ example: -33.8688, description: 'Latitude', required: false, minimum: -90, maximum: 90 })
    @IsNumber()
    @IsOptional()
    @Min(-90)
    @Max(90)
    @Type(() => Number)
    latitude?: number;

    @ApiProperty({ example: -151.2093, description: 'Longitude', required: false, minimum: -180, maximum: 180 })
    @IsNumber()
    @IsOptional()
    @Min(-180)
    @Max(180)
    @Type(() => Number)
    longitude?: number;
}

export class PetDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Pet UUID' })
    id!: string;

    @ApiProperty({ example: 'Firulais', description: 'Pet name' })
    name!: string;

    @ApiProperty({ example: 'DOG', description: 'Pet type', enum: PetType })
    type!: PetType;

    @ApiProperty({ example: 3, description: 'Pet age in years' })
    age!: number;

    @ApiProperty({ example: 'Golden retriever, friendly', description: 'Description' })
    description?: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Owner UUID' })
    ownerId!: string;

    @ApiProperty({ example: 'https://example.com/pet.jpg', description: 'Image URL' })
    imageUrl?: string;

    @ApiProperty({ example: -33.8688, description: 'Latitude' })
    latitude?: number;

    @ApiProperty({ example: -151.2093, description: 'Longitude' })
    longitude?: number;

    @ApiProperty({ example: false, description: 'Is pet lost?' })
    lost!: boolean;

    @ApiProperty({ example: '2026-05-09T12:34:56.000Z', description: 'Created timestamp', required: false })
    createdAt?: string;

    @ApiProperty({ example: '2026-05-09T12:34:56.000Z', description: 'Updated timestamp', required: false })
    updatedAt?: string;
}
