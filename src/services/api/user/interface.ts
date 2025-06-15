import { UserRole } from '@/hooks/use-auth-protection';

export interface IUser {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    email: string;
    name?: string;
    externalId: string | null;
    roles: UserRole[];
    organizationId: number;
    addedBy?: {
        name?: string;
    };
}

export interface UserListResponse {
    total: number;
    data: IUser[];
    statusCode: number;
}
