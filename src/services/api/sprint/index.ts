import instance from "../common/axios";

export async function updateSprint(sprintId: number, data: any) {
    const response = await instance.patch(`v1/sprint/${sprintId}`, data);
    return response.data;
}

export async function completeSprint(sprintId: number, newSprintId?: number) {
    const response = await instance.patch(`v1/sprint/${sprintId}/completed`, {
        newSprintId: newSprintId
    });
    return response.data;
}

export async function deleteSprint(sprintId: number) {
    const response = await instance.delete(`v1/sprint/${sprintId}`);
    return response.data;
}


