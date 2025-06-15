export interface ImportLog {
    id: number;
    createdAt: string;
    updatedAt: string;
    type: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    description: string | null;
    performer: {
        id: number;
        name: string;
    };
}

export interface ImportLogResponse {
    total: number;
    data: ImportLog[];
    statusCode: number;
}

export interface ImportLogFilters {
    type?: string;
    status?: string;
    performerId?: number;
}
