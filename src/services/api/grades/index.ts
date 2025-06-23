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

export async function exportGradeToExcel(gradeId: number, title: string) {
    const response: any = await instance.get(
        `v1/grade/${gradeId}/excel-export`,
        {
            params: {
                gradeId,
            },
            responseType: 'blob',
        }
    );
    const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute(
        'download',
        `${title}-export-${new Date().toLocaleDateString()}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
}
