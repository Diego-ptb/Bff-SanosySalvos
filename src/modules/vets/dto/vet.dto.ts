import {
    IsString,
    IsUUID,
    IsOptional,
    IsNumber,
    Min,
    Max,
    IsNotEmpty,
    MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateVetDto {
    @ApiProperty({ example: 'Veterinaria Central', description: 'Clinic name' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: 'Calle Principal 123', description: 'Address', required: false })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ example: '+56912345678', description: 'Phone number', required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ example: -33.8688, description: 'Latitude', minimum: -90, maximum: 90 })
    @IsNumber()
    @Min(-90)
    @Max(90)
    @Type(() => Number)
    @IsNotEmpty()
    latitude!: number;

    @ApiProperty({ example: -151.2093, description: 'Longitude', minimum: -180, maximum: 180 })
    @IsNumber()
    @Min(-180)
    @Max(180)
    @Type(() => Number)
    @IsNotEmpty()
    longitude!: number;

    @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Image URL', required: false })
    @IsString()
    @IsOptional()
    imageUrl?: string;
}

export class UpdateVetDto {
    @ApiProperty({ example: 'Veterinaria Central', description: 'Clinic name', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'Calle Principal 123', description: 'Address', required: false })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ example: '+56912345678', description: 'Phone number', required: false })
    @IsString()
    @IsOptional()
    phone?: string;

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

    @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Image URL', required: false })
    @IsString()
    @IsOptional()
    imageUrl?: string;
}

export class VetDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Vet clinic UUID' })
    id!: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Owner user UUID', required: false })
    userId?: string;

    @ApiProperty({ example: 'Veterinaria Central', description: 'Clinic name' })
    name!: string;

    @ApiProperty({ example: 'Calle Principal 123', description: 'Address' })
    address?: string;

    @ApiProperty({ example: '+56912345678', description: 'Phone number' })
    phone?: string;

    @ApiProperty({ example: -33.8688, description: 'Latitude' })
    latitude!: number;

    @ApiProperty({ example: -151.2093, description: 'Longitude' })
    longitude!: number;

    @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Image URL' })
    imageUrl?: string;
}
