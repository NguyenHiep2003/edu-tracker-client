export interface Project {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    title: string;
    description: string | null;
    key: string;
    startDate: string;
    endDate: string;
    type: 'SOLO' | 'TEAM';
    status: 'OPEN' | 'SCHEDULED' | 'CLOSE';
    participationMode: 'optional' | 'mandatory';
    joinProjectDeadline: string | null;
    allowStudentFormTeam: boolean;
    allowStudentCreateTopic: boolean;
    formGroupDeadline: string | null;
    classroomId: number;
    numberOfStudents: number;
    grade?: {
        id: number;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        title: string;
        description: string;
        type: string;
        // isFinal: boolean;
        fileId: string | null;
        maxScore: number;
        visibility: 'PRIVATE' | 'PUBLIC' | 'RESTRICTED';
    };
}

export interface CreateProjectRequest {
    title: string;
    description?: string;
    key: string;
    startDate: string;
    endDate: string;
    // status: 'OPEN' | 'SCHEDULED' | 'CLOSE';
    type: 'SOLO' | 'TEAM';
    participationMode: 'optional' | 'mandatory';
    allowStudentFormTeam: boolean;
    formGroupDeadline?: string;
    joinProjectDeadline?: string;
    createGradeComponent: boolean;
    gradeComponent?: {
        title: string;
        description: string;
        maxScore: number;
        scale: number;
    };
}

export interface ProjectsResponse {
    data: Project[];
    statusCode: number;
}

export interface ProjectStudent {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    email: string;
    name: string | null;
    externalId: string | null;
    roles: string[];
    organizationId: number;
    addedById: number;
    groupNumber: number | null;
    role: 'LEADER' | 'MEMBER' | null;
    studentProjectId: number;
}

export interface ProjectStudentsResponse {
    data: ProjectStudent[];
    statusCode: number;
}

export interface Leader {
    id: number;
    createdAt: string;
    updatedAt: string;
    email: string;
    name: string | null;
    externalId: string | null;
    roles: string[];
    organizationId: number;
    addedById: number;
}

export interface Topic {
    id: number;
    createdAt: string;
    updatedAt: string;
    title: string;
    description: string;
    projectId: number;
    attachments: {
        id: number;
        createdAt: string;
        updatedAt: string;
        cloudId: string;
        url: string;
        name: string;
        type: string;
    }[];
}

export interface ProjectGroup {
    number: number;
    leader: Leader;
    numberOfMember: number;
    topic: Topic | null;
    id: number;
    createdAt: string;
    updatedAt: string;
    joinRequestCreated?: boolean;
}

export interface ICreateTopic {
    title: string;
    description?: string;
    attachments?: File[];
}
