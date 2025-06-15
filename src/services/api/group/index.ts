import instance from '../common/axios';

export const getUserGroupData = async (groupId: number) => {
    const response = await instance.get(
        `/v1/group/${groupId}/user_group_metadata`,
        {}
    );
    return response.data;
};

export const getUserInGroup = async (groupId: number) => {
    const response = await instance.get(`/v1/group/${groupId}/members`, {});
    return response.data;
};

export const getEpicInGroup = async (groupId?: number) => {
    const response = await instance.get(`/v1/group/${groupId}/epics`, {});
    return response.data;
};

export const getSprintNameInGroup = async (groupId?: number, query?: any) => {
    const response = await instance.get(`/v1/group/${groupId}/sprints/name`, {
        params: query,
    });
    return response.data;
};
// type WorkItemFormData = {
//     type: string;
//     summary: string;
//     description: string;
//     status: 'TO DO' | 'IN PROGRESS' | 'DONE';
//     assigneeId?: number;
//     reporterId: number;
//     parentItemId?: number;
//     sprintId?: number;
//     startDate?: Date;
//     endDate?: Date;
//     attachments: File[]; // assuming it's a file upload
// };

export async function createWorkItems(groupId?: number, formData?: any) {
    const form = new FormData();

    form.append('type', formData.type);
    form.append('summary', formData.summary);
    if (formData.description) {
        form.append('description', formData.description);
    }
    form.append('status', formData.status);
    form.append('reporterId', formData.reporterId);

    if (formData.assigneeId !== undefined) {
        form.append('assigneeId', formData.assigneeId);
    }

    if (formData.parentItemId !== undefined) {
        form.append('parentItemId', formData.parentItemId);
    }

    if (formData.sprintId !== undefined) {
        form.append('sprintId', formData.sprintId);
    }

    if (formData.startDate) {
        form.append('startDate', formData.startDate);
    }

    if (formData.endDate) {
        form.append('endDate', formData.endDate);
    }
    if (formData.storyPoints) {
        form.append('storyPoints', formData.storyPoints);
    }
    if (formData.attachments) {
        for (const file of formData.attachments) {
            form.append('attachments', file);
        }
    }
    return await instance.post(`/v1/group/${groupId}/work_item`, form);
}

export async function getBacklogData(groupId: number) {
    const response = await instance.get(`/v1/group/${groupId}/backlogs`);
    return response.data;
}

export const assignStudentToGroup = async (
    studentProjectId: number,
    groupId: number
) => {
    const response = await instance.post(`/v1/group/${groupId}/member`, {
        studentProjectId,
    });
    return response.data;
};

export const removeStudentFromGroup = async (
    studentProjectId: number,
    groupId: number
) => {
    const response = await instance.delete(`/v1/group/${groupId}/member/`, {
        data: { studentProjectId },
    });
    return response.data;
};

export const getGroupBoardData = async (groupId: number, query?: any) => {
    const response = await instance.get(`/v1/group/${groupId}/board`, {
        params: query,
    });
    return response.data;
};

export const getGroupWorkItemsList = async (
    groupId: number,
    query?: {
        assigneeIds?: string;
        sprintIds?: string;
        keyword?: string;
        page?: number;
        size?: number;
        statuses?: string;
        types?: string;
        fromDate?: string;
        toDate?: string;
        isLecturerTask?: boolean;
    }
) => {
    const response = await instance.get(
        `/v1/group/${groupId}/list-work-items`,
        {
            params: query,
        }
    );
    return response;
};

export const transferLeadership = async (
    groupId: number,
    newLeaderId: number
) => {
    const response = await instance.patch(`/v1/group/${groupId}/leadership`, {
        newLeaderId,
    });
    return response.data;
};

export const updateGroupTopic = async (groupId: number, topicId: number) => {
    const response = await instance.patch(`/v1/group/${groupId}/topic`, {
        topicId,
    });
    return response.data;
};

export const requestNewTopic = async (
    groupId: number,
    data: {
        title: string;
        description?: string;
    }
) => {
    const response = await instance.post(
        `/v1/group/${groupId}/new-topic-request`,
        {
            title: data.title,
            description: data.description,
        }
    );
    return response.data;
};

export const getTopicRequest = async (groupId: number) => {
    const response = await instance.get(`/v1/group/${groupId}/topic-request`);
    return response.data;
};

export const getJoinGroupRequest = async (groupId: number) => {
    const response = await instance.get(`/v1/group/${groupId}/join-request`);
    return response.data;
};

export const acceptJoinGroupRequest = async (groupId: number, requestId: number) => {
    const response = await instance.patch(`/v1/group/${groupId}/join-request/${requestId}/accept`);
    return response.data;
};

export const leaveGroup = async (groupId: number) => {
    const response = await instance.delete(`/v1/group/${groupId}/leaving`);
    return response.data;
};