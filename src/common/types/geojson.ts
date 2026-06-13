/**
 * GeoJSON types for Leaflet/MapLibre integration
 * Reference: https://geojson.org/
 *
 * CRITICAL: GeoJSON uses [longitude, latitude] order (inverted from typical lat/lng)
 */

export type GeoJsonCoordinates = [longitude: number, latitude: number];

export interface GeoJsonPoint {
    type: 'Point';
    coordinates: GeoJsonCoordinates;
}

export interface GeoJsonFeature<P = Record<string, any>> {
    type: 'Feature';
    geometry: GeoJsonPoint;
    properties: P;
}

export interface GeoJsonFeatureCollection<P = Record<string, any>> {
    type: 'FeatureCollection';
    features: GeoJsonFeature<P>[];
}

/**
 * Property types for dashboard features
 */
export interface VetProperties {
    featureType: 'vet';
    id: string;
    name: string;
    address?: string;
    phone?: string;
    imageUrl?: string;
    specialty?: string;
}

export interface PetProperties {
    featureType: 'pet';
    id: string;
    name: string;
    type: 'DOG' | 'CAT' | 'OTHER';
    imageUrl?: string;
    ownerId: string;
    description?: string;
    contactInfo?: string;
    breed?: string;
    createdAt?: string;
}

// Type helpers
export type VetFeature = GeoJsonFeature<VetProperties>;
export type VetFeatureCollection = GeoJsonFeatureCollection<VetProperties>;

export type PetFeature = GeoJsonFeature<PetProperties>;
export type PetFeatureCollection = GeoJsonFeatureCollection<PetProperties>;
