import { StudentProjectData } from '@/context/student-project-context';
import instance from '../common/axios';
import type {
    Project,
    CreateProjectRequest,
    ProjectsResponse,
    ProjectStudent,
    ProjectGroup,
    Topic,
    ICreateTopic,
} from './interface';
import { ProjectDetail } from '@/context/project-context';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export async function getClassProjects(classId: number): Promise<Project[]> {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
            `${API_BASE_URL}/v1/classes/${classId}/projects`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }
}

export async function createProject(
    classId: number,
    projectData: CreateProjectRequest
): Promise<Project> {
    const response = await instance.post(
        `/v1/classroom/${classId}/project`,
        projectData
    );
    return response.data;
}

export async function updateProject(
    projectId: number,
    projectData: Partial<ProjectDetail>
): Promise<Project> {
    const response = await instance.patch(
        `/v1/project/${projectId}`,
        projectData
    );
    return response.data;
}

export async function getProjectInClass(
    classId: number
): Promise<ProjectsResponse> {
    return await instance.get(`/v1/classroom/${classId}/projects`);
}

export async function getProjectDetail(projectId: number): Promise<Project> {
    const response = await instance.get(`/v1/project/${projectId}`);
    return response.data;
}

export async function getProjectStudents(
    projectId: number
): Promise<ProjectStudent[]> {
    const response = await instance.get(`/v1/project/${projectId}/students`);
    return response.data;
}

export async function getProjectGroups(
    projectId: number
): Promise<ProjectGroup[]> {
    const response = await instance.get(`/v1/project/${projectId}/groups`);
    return response.data;
}

export async function getProjectTopics(projectId: number): Promise<Topic[]> {
    const response = await instance.get(`/v1/project/${projectId}/topics`);
    return response.data;
}

export async function createProjectTopic(
    projectId: number,
    data: ICreateTopic
) {
    const form = new FormData();
    form.append('title', data.title);
    if (data.description) form.append('description', data?.description);
    if (data.attachments)
        for (const attachment of data.attachments)
            form.append('attachments', attachment);

    const response = await instance.post(
        `/v1/project/${projectId}/topics`,
        form
    );
    return response.data;
}

export async function autoDivideGroup(
    projectId: number,
    data: { groupSize: number; applyType: string }
): Promise<{ numOfGroups: number }> {
    const response = await instance.post(
        `/v1/project/${projectId}/auto-division-groups`,
        data
    );
    return response.data;
}

export async function getStudentProjectMeta(
    projectId: number
): Promise<StudentProjectData> {
    const response = await instance.get(
        `/v1/project/${projectId}/student-metadata`
    );
    return response.data;
}

export const getNotJoinedStudents = async (projectId: number) => {
    const response = await instance.get(
        `/v1/project/${projectId}/not-joined-students`
    );
    return response.data;
};

export const addStudentsToProject = async (
    projectId: number,
    studentClassroomIds: number[]
) => {
    const response = await instance.post(`/v1/project/${projectId}/students`, {
        studentClassroomIds,
    });
    return response.data;
};

export const removeStudentFromProject = async (
    projectId: number,
    studentProjectId: number
) => {
    const response = await instance.delete(
        `/v1/project/${projectId}/student/`,
        { data: { studentProjectId } }
    );
    return response.data;
};

export async function updateProjectTopic(
    topicId: number,
    data: {
        title?: string;
        description?: string;
        attachments?: File[];
        attachmentsToDelete?: number[];
    }
) {
    const form = new FormData();
    if (data.title) form.append('title', data.title);
    if (data.description) form.append('description', data.description);
    if (data.attachments) {
        for (const attachment of data.attachments) {
            form.append('attachments', attachment);
        }
    }
    if (data.attachmentsToDelete) {
        form.append(
            'attachmentsToDelete',
            JSON.stringify(data.attachmentsToDelete)
        );
    }

    const response = await instance.patch(`/v1/topic/${topicId}`, form);
    return response.data;
}

export async function getProjectTopicRequest(projectId: number) {
    const response = await instance.get(`/v1/project/${projectId}/create-topic-request`);
    return response.data;
}

export async function createOwnGroup(projectId: number) {
    const response = await instance.post(`/v1/project/${projectId}/own-group`);
    return response.data;
}

export const joinGroup = async (projectId: number, groupId: number) => {
    const response = await instance.post(`/v1/project/${projectId}/join-group-request/${groupId}`);
    return response.data;
};

export const getAllLecturerAssignedItems = async (projectId: number) => {
    const response = await instance.get(`/v1/project/${projectId}/lecturer-assigned-items`);
    return response.data;
};

export const exportProjectToTemplate = async (projectId: number, title: string) => {
    const response = await instance.post(`/v1/project/${projectId}/template-export`, { title });
    return response.data;
};

export const deleteProject = async (projectId: number) => {
    const response = await instance.delete(`/v1/project/${projectId}`);
    return response.data;
};