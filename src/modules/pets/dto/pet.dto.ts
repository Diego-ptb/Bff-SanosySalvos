import {
    IsString,
    IsOptional,
    IsNumber,
    Min,
    Max,
    IsNotEmpty,
    MaxLength,
    IsBoolean,
    IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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

    @ApiProperty({ example: 'Golden Retriever', description: 'Pet breed', maxLength: 100, required: false })
    @IsString()
    @MaxLength(100)
    @IsOptional()
    breed?: string;

    @ApiProperty({ example: false, description: 'Is pet available for adoption?', required: false })
    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    lost?: boolean;

    @ApiProperty({ example: -33.45, description: 'Latitude', minimum: -90, maximum: 90, required: false })
    @IsNumber()
    @Min(-90)
    @Max(90)
    @Type(() => Number)
    @IsOptional()
    latitude?: number;

    @ApiProperty({ example: -70.67, description: 'Longitude', minimum: -180, maximum: 180, required: false })
    @IsNumber()
    @Min(-180)
    @Max(180)
    @Type(() => Number)
    @IsOptional()
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

    @ApiProperty({ example: 'Golden Retriever', description: 'Pet breed', maxLength: 100, required: false })
    @IsString()
    @MaxLength(100)
    @IsOptional()
    breed?: string;

    @ApiProperty({ example: false, description: 'Is pet available for adoption?', required: false })
    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    lost?: boolean;

    @ApiProperty({ example: -33.45, description: 'Latitude', minimum: -90, maximum: 90, required: false })
    @IsNumber()
    @Min(-90)
    @Max(90)
    @Type(() => Number)
    @IsOptional()
    latitude?: number;

    @ApiProperty({ example: -70.67, description: 'Longitude', minimum: -180, maximum: 180, required: false })
    @IsNumber()
    @Min(-180)
    @Max(180)
    @Type(() => Number)
    @IsOptional()
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

    @ApiProperty({ example: 'Golden Retriever', description: 'Pet breed', required: false })
    breed?: string;

    @ApiProperty({ example: false, description: 'Is pet available for adoption?' })
    lost!: boolean;

    @ApiProperty({ example: '2026-05-09T12:34:56.000Z', description: 'Created timestamp', required: false })
    createdAt?: string;

    @ApiProperty({ example: '2026-05-09T12:34:56.000Z', description: 'Updated timestamp', required: false })
    updatedAt?: string;

    @ApiProperty({ example: -33.45, description: 'Latitude', required: false })
    latitude?: number;

    @ApiProperty({ example: -70.67, description: 'Longitude', required: false })
    longitude?: number;
}

export class CaretakerDto {
    @ApiProperty({ example: 'VET', enum: ['VET', 'USER'] })
    type!: 'VET' | 'USER';

    @ApiProperty({ example: 'Veterinaria Central', required: false })
    name?: string;

    @ApiProperty({ example: 'Calle Principal 123', required: false })
    address?: string;

    @ApiProperty({ example: '+56912345678', required: false })
    phone?: string;

    @ApiProperty({ example: 'https://example.com/vet.jpg', required: false })
    imageUrl?: string;
}

export class AdoptablePetEnrichedDto extends PetDto {
    @ApiProperty({ type: CaretakerDto, required: false, nullable: true })
    caretaker?: CaretakerDto | null;
}

export class CreatePetPublicationDto {
    @ApiProperty({ example: 'Firulais', maxLength: 100 })
    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: 'DOG', enum: PetType })
    @IsEnum(PetType)
    @IsNotEmpty()
    type!: PetType;

    @ApiProperty({ example: 3, required: false })
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    age?: number;

    @ApiProperty({ example: 'Friendly dog, brown fur', maxLength: 500, required: false })
    @IsString()
    @MaxLength(500)
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({ example: '+56 9 1234 5678', maxLength: 200, required: false })
    @IsString()
    @MaxLength(200)
    @IsOptional()
    contactInfo?: string;

    @ApiProperty({ example: 'Golden Retriever', maxLength: 100, required: false })
    @IsString()
    @MaxLength(100)
    @IsOptional()
    breed?: string;

    @ApiProperty({ example: -33.45, minimum: -90, maximum: 90 })
    @IsNumber()
    @Min(-90)
    @Max(90)
    @Type(() => Number)
    latitude!: number;

    @ApiProperty({ example: -70.67, minimum: -180, maximum: 180 })
    @IsNumber()
    @Min(-180)
    @Max(180)
    @Type(() => Number)
    longitude!: number;
}

export class PetPublicationDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty({ enum: PetType })
    type!: PetType;

    @ApiProperty({ required: false })
    age?: number;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ required: false })
    imageUrl?: string;

    @ApiProperty({ required: false })
    contactInfo?: string;

    @ApiProperty({ required: false })
    breed?: string;

    @ApiProperty()
    ownerId!: string;

    @ApiProperty()
    latitude!: number;

    @ApiProperty()
    longitude!: number;

    @ApiProperty()
    active!: boolean;

    @ApiProperty()
    createdAt!: string;

    @ApiProperty()
    expiresAt!: string;
}
