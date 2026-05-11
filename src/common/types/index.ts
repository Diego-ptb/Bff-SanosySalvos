export interface ProblemDetails {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance: string;
    correlationId: string;
    timestamp: string;
    errors?: Record<string, string[]>;
}

export interface AggregationMeta {
    partial: boolean;
    correlationId: string;
    timestamp: string;
}

export interface AggregatedSection<T> {
    data: T | null;
    ok: boolean;
    error?: string;
}

// GeoJSON types (re-exported from geojson.ts)
export * from './geojson';
