import { UserRole } from '@/hooks/use-auth-protection';
import instance from '../common/axios';
import { IUser, UserListResponse } from './interface';

export async function getProfile(): Promise<IUser> {
    const response = await instance.get('/v1/user/me');
    return response.data;
}

export async function downloadImportTemplate(type: string) {
    const response: any = await instance.get('v1/user/excel-user/template', {
        params: { type },
        responseType: 'blob',
    });
    const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `import-template.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
}

export async function downloadLecturersExport(type: string) {
    const response: any = await instance.get('v1/user/excel-lecturer', {
        params: { type },
        responseType: 'blob',
    });
    const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `lecturers-export.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
}

export async function downloadStudentsExport(type: string) {
    const response: any = await instance.get('v1/user/excel-student', {
        params: { type },
        responseType: 'blob',
    });
    const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `students-export.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
}

export async function getUsersInOrganization(
    organizationId: number,
    query: {
        role?: UserRole;
        externalId?: number;
        email?: string;
        name?: string;
    },
    page: number,
    size: number
): Promise<UserListResponse> {
    const response: UserListResponse = await instance.get(
        `/v1/organization/${organizationId}/users`,
        { params: { ...query, page, size } }
    );
    return response;
}

export async function addUserToOrganization(
    data: Pick<IUser, 'name' | 'email' | 'roles' | 'externalId'>
) {
    const response = await instance.post('/v1/user', data);
    return response.data;
}

export async function updateUser(
    id: number,
    data: Pick<IUser, 'name' | 'roles' | 'externalId'>
) {
    const response = await instance.patch(`/v1/user/${id}`, data);
    return response.data;
}

export async function deleteUser(id: number) {
    const response = await instance.delete(`/v1/user/${id}`);
    return response.data;
}

export async function importLecturer(file: File) {
    const form = new FormData();
    form.append('file', file);
    const response = await instance.post(`/v1/user/upload-lecturer`, form);
    return response.data;
}

export async function importStudent(file: File) {
    const form = new FormData();
    form.append('file', file);
    const response = await instance.post(`/v1/user/upload-student`, form);
    return response.data;
}
