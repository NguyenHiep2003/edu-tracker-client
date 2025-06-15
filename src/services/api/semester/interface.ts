export interface Semester {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    organizationId: number;
}

export interface SemesterResponse {
    data: Semester[];
    statusCode: number;
}

export interface CreateSemesterRequest {
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateSemesterRequest {
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
}
