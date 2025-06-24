import instance from '../common/axios';
import { handleApiError } from '../common/error';

export async function getWorkItemDetail(workItemId: number) {
    const response = await instance.get(`/v1/work-item/${workItemId}`);
    return response.data;
}

export async function updateWorkItem(
    workItemId: number,
    data: Partial<{
        summary: string;
        description: string;
        status: string;
        assigneeId: number | null | string;
        sprintId: number | null | string;
        storyPoints: number | null;
        startDate: string | null;
        endDate: string | null;
        parentItemId: number | null | string;
        deletedAttachmentIds: number[] | null;
    }>
) {
    const response = await instance.patch(`/v1/work-item/${workItemId}`, data);
    return response.data;
}

export async function approveWorkItem(
    workItemId: number,
    rating: number,
    comment: string
) {
    const response = await instance.patch(
        `/v1/work-item/${workItemId}/approve`,
        { rating, comment }
    );
    return response.data;
}

export const rejectWorkItem = async (workItemId: number, comment: string) => {
    try {
        const response = await instance.patch(
            `/v1/work-item/${workItemId}/reject`,
            {
                comment,
            }
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteWorkItem = async (workItemId: number) => {
    const response = await instance.delete(`/v1/work-item/${workItemId}`);
    return response.data;
};

export const createLecturerWorkItem = async (
    projectId: number,
    data: {
        assignType: string;
        summary: string;
        description: string;
        type: string;
        startDate?: string | null;
        endDate?: string | null;
        attachments?: File[];
        createGradeComponent?: boolean;
        gradeComponent?: {
            title: string;
            description: string;
            maxScore: number;
            scale: number;
        };
    }
) => {
    const formData = new FormData();
    formData.append('assignType', data.assignType);
    formData.append('summary', data.summary);
    formData.append('description', data.description);
    formData.append('type', data.type);
    if (data.startDate) {
        formData.append('startDate', data.startDate);
    }
    if (data.endDate) {
        formData.append('endDate', data.endDate);
    }
    if (data.attachments) {
        data.attachments.forEach((file) => {
            formData.append('attachments', file);
        });
    }
    if (data.createGradeComponent) {
        formData.append(
            'createGradeComponent',
            data.createGradeComponent.toString()
        );
    }
    if (data.gradeComponent) {
        formData.append('gradeComponent', JSON.stringify(data.gradeComponent));
    }
    const response = await instance.post(
        `/v1/project/${projectId}/work-item`,
        formData
    );
    return response.data;
};

export const getLecturerAssignedItemInfo = async (itemId: number) => {
    const response = await instance.get(
        `/v1/work-item/lecturer-assigned/${itemId}`
    );
    return response.data;
};

export const updateLecturerAssignedItem = async (
    itemId: number,
    data: Partial<{
        type: string;
        summary: string;
        description: string;
        startDate: string | null;
        endDate: string | null;
        deletedAttachmentIds: number[];
        attachments?: File[];
    }>
) => {
    const formData = new FormData();
    if (data.type) formData.append('type', data.type);
    if (data.summary) formData.append('summary', data.summary);
    if (data.description) formData.append('description', data.description);
    if (data.startDate) formData.append('startDate', data.startDate);
    if (data.startDate === null) formData.append('startDate', 'null');
    if (data.endDate) formData.append('endDate', data.endDate);
    if (data.deletedAttachmentIds && data.deletedAttachmentIds.length > 0) {
        formData.append(
            'deletedAttachmentIds',
            data.deletedAttachmentIds.join(',')
        );
    }
    if (data.attachments) {
        data.attachments.forEach((file) => {
            formData.append('attachments', file);
        });
    }

    const response = await instance.patch(
        `/v1/work-item/lecturer-assigned/${itemId}`,
        formData
    );
    return response.data;
};

export const deleteLecturerAssignedItem = async (itemId: number) => {
    const response = await instance.delete(
        `/v1/work-item/lecturer-assigned/${itemId}`
    );
    return response.data;
};

export const getLecturerAssignedItemSubmission = async (itemId: number) => {
    const response = await instance.get(
        `/v1/work-item/lecturer-assigned/${itemId}/submission`
    );
    return response.data;
};

export const getLecturerAssignedItemSubmissionDetailOfGroup = async (
    itemId: number,
    groupId: number
) => {
    const response = await instance.get(
        `/v1/work-item/lecturer-assigned/${itemId}/submission/${groupId}`
    );
    return response.data;
};
