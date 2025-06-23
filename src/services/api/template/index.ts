import instance from '../common/axios';
import { Template } from './interface';

export const getTemplate = async (keyword: string): Promise<Template[]> => {
    const response = await instance.get('/v1/template', {
        params: {
            keyword: keyword,
        },
    });
    return response.data || [];
};

export const previewTemplate = async (
    templateId: number,
    projectStartAt?: string
) => {
    if (projectStartAt) {
        const response = await instance.get(
            `/v1/template/${templateId}/preview`,
            {
                params: {
                    projectStartAt: projectStartAt,
                },
            }
        );
        return response.data;
    }

    const response = await instance.get(`/v1/template/${templateId}/preview`);
    return response.data;
};

export const importTemplate = async (classId: number, templateId: number, projectStartAt?: string) => {
    const response = await instance.post(`/v1/classroom/${classId}/import-project`, {
        templateId: templateId,
        projectStartAt: projectStartAt ?? undefined,
    });
    return response.data;
};

export const deleteTemplate = async (templateId: number) => {
    const response = await instance.delete(`/v1/template/${templateId}`);
    return response.data;
};