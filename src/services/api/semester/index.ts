import instance from '../common/axios';
import type {
    SemesterResponse,
    CreateSemesterRequest,
    UpdateSemesterRequest,
    Semester,
} from './interface';

export const getSemesters = async (): Promise<SemesterResponse> => {
    return await instance.get('/v1/organization/semester');
};

export const createSemester = async (
    data: CreateSemesterRequest
): Promise<Semester> => {
    const response = await instance.post('/v1/organization/semester', data);
    return response.data;
};

export const updateSemester = async (
    id: number,
    data: UpdateSemesterRequest
): Promise<Semester> => {
    const response = await instance.patch(
        `/v1/organization/semester/${id}`,
        data
    );
    return response.data;
};

export const deleteSemester = async (id: number): Promise<void> => {
    const response = await instance.delete(`/v1/organization/semester/${id}`);
    return response.data;
};

export const getCurrentSemester = async (): Promise<Semester> => {
    const response = await instance.get('/v1/organization/semester/current');
    return response.data;
};
