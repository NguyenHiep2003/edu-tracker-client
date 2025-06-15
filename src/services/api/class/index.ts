import instance from '../common/axios';
import type { Class, GetClassesResponse, User } from './interface';

export const getTeachingClassesBySemester = async (
    semesterId?: number,
    keyword?: string | null
): Promise<GetClassesResponse> => {
    return await instance.get('/v1/classroom/teaching-class', {
        params: { semesterId, keyword },
    });
};

export const getAttemptedClassesBySemester = async (
    semesterId?: number,
    keyword?: string | null
): Promise<GetClassesResponse> => {
    return await instance.get('/v1/classroom/attempted-class', {
        params: { semesterId, keyword },
    });
};

export const createClass = async (
    id: string,
    name: string,
    description?: string
): Promise<GetClassesResponse> => {
    return await instance.post('/v1/classroom/', {
        externalId: id,
        name,
        description,
    });
};

export const getClassDetails = async (id: number): Promise<Class> => {
    const response = await instance.get(`/v1/classroom/${id}`);
    return response.data;
};

export const getClassStudents = async (
    id: number
): Promise<(User & { studentClassroomId: number })[]> => {
    const response = await instance.get(`/v1/classroom/${id}/students`);
    return response.data;
};
export async function updateClassInfo(
    id: number,
    {
        externalId,
        name,
        description,
    }: {
        externalId?: string;
        name?: string;
        description?: string;
    }
) {
    const response = await instance.patch(`/v1/classroom/${id}`, {
        externalId,
        name,
        description,
    });
    return response.data;
}

export const importStudentToClass = async (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await instance.post(
        `/v1/classroom/${id}/upload-student`,
        form
    );
    return response.data;
};

export const getSuggestLecturer = async (
    classId: number,
    keyword: string
): Promise<User[]> => {
    const response = await instance.get(
        `/v1/classroom/${classId}/suggest-lecturer`,
        {
            params: { keyword },
        }
    );
    return response.data;
};

export const getSuggestStudent = async (classId: number, keyword: string) => {
    const response = await instance.get(
        `/v1/classroom/${classId}/suggest-student`,
        {
            params: { keyword },
        }
    );
    return response.data;
};

export const addLecturerToClass = async (
    classId: number,
    lecturerId: number
) => {
    const response = await instance.post(`/v1/classroom/${classId}/lecturer`, {
        lecturerId,
    });
    return response.data;
};

export const addStudentToClass = async (classId: number, studentId: number) => {
    const response = await instance.post(`/v1/classroom/${classId}/student`, {
        studentId,
    });
    return response.data;
};

export const removeStudentInClass = async (
    classId: number,
    studentClassroomId: number
) => {
    const response = await instance.delete(
        `/v1/classroom/${classId}/student`,
        {
            data: { studentClassroomId },
        }
    );
    return response.data;
};



export const getProjectsOfClassForStudent = async (classId: number) => {
    const response = await instance.get(
        `/v1/classroom/${classId}/student-project`,
        {}
    );
    return response.data;
};

export const removeLecturerFromClass = async (
    classId: number,
    lecturerId: number
) => {
    const response = await instance.delete(
        `/v1/classroom/${classId}/lecturer`,
        {
            data: { lecturerId },
        }
    );
    return response.data;
};
