import { Grade } from '@/context/project-context';
import instance from '../common/axios';

export async function getGrades(classId: number) {
    const response = await instance.get(`/v1/classroom/${classId}/grades`);
    return response;
}

export async function getGradeDetail(gradeId: number) {
    const response = await instance.get(`/v1/grade/${gradeId}`);
    return response;
}

export async function updateGrade(gradeId: number, grade: Partial<Grade>) {
    const response = await instance.patch(`/v1/grade/${gradeId}`, grade);
    return response;
}

export async function deleteGrade(gradeId: number) {
    const response = await instance.delete(`/v1/grade/${gradeId}`);
    return response;
}

