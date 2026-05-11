import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VetFeatureCollection, PetFeatureCollection } from '@/common/types/geojson';
import { AggregationMeta } from '@/common/types';

export class DashboardQueryDto {
    @ApiProperty({ example: -33.8688, description: 'Latitude for nearby vets', required: false })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    lat?: number;

    @ApiProperty({ example: -151.2093, description: 'Longitude for nearby vets', required: false })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    lng?: number;

    @ApiProperty({ example: 10.0, description: 'Search radius in km', required: false })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    radius?: number;
}

export class DashboardResponseDto {
    @ApiProperty({
        type: 'object',
        description: 'Veterinary clinics as GeoJSON FeatureCollection',
        example: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [-70.6483, -33.4569] },
                    properties: { id: 'uuid', name: 'Veterinaria X' },
                },
            ],
        },
    })
    vets!: VetFeatureCollection;

    @ApiProperty({
        type: 'object',
        description: 'Lost pets as GeoJSON FeatureCollection',
        example: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [-70.65, -33.45] },
                    properties: { id: 'uuid', name: 'Firulais', type: 'DOG' },
                },
            ],
        },
    })
    lostPets!: PetFeatureCollection;

    @ApiProperty({ description: 'Summary metrics' })
    metrics!: {
        totalVets: number;
        totalLostPets: number;
    };

    @ApiProperty({ description: 'Aggregation metadata' })
    _meta!: AggregationMeta & {
        partial: boolean;
        timestamp: string;
    };
}
