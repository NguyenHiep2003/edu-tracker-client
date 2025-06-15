export interface User {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    email: string;
    name: string;
    externalId: string;
    roles: string[];
    organizationId: number;
    addedById: number;
}

export interface Semester {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    organizationId: number;
}

export interface Class {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    externalId: string;
    name: string;
    description?: string;
    organizationId: number;
    semesterId: number;
    lecturers: User[];
    semester: Semester;
    numberOfStudents: number;
    teacherAssistance: { student: User }[];
    ownerId: number;
    studentClassroomId?: number;
}

export interface CreateClassRequest {
    name: string;
    externalId: string;
    semesterId: number;
}

export interface GetClassesResponse {
    data: Class[];
    statusCode: number;
}
