import axiosInstance from '../common/axios';
import { WorkItem } from '../work_items/interface';

export interface CreateSprintRequest {}

export interface Sprint {
    id: number;
    name: string;
    number: number;
    status: 'INACTIVE' | 'IN PROGRESS' | 'COMPLETED';
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
    workItems: WorkItem[] | Partial<WorkItem>[];
}

export const createSprint = async (groupId: number): Promise<Sprint> => {
    const response = await axiosInstance.post(`/v1/group/${groupId}/sprints`);
    return response.data;
};
