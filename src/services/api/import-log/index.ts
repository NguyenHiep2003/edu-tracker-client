import instance from '../common/axios';
import type { ImportLogResponse } from './interface';

export const getImportLogs = async (
    id: number,
    page = 1,
    limit = 10
): Promise<ImportLogResponse> => {
    const response: ImportLogResponse = await instance.get(
        `/v1/organization/${id}/import-logs`,
        { params: { page, size: limit } }
    );
    return response;
};
