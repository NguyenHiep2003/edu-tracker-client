export interface AuthProvider {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface AuthProvidersResponse {
    data: AuthProvider[];
    statusCode: number;
}
