export interface Student {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    email: string;
    name: string;
    externalId: string | null;
    roles: string[];
    organizationId: number;
    addedById: number;
}

export interface StudentClassroom {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    studentId: number;
    classroomId: number;
    role: 'STUDENT' | 'TA';
    student: Student;
}

export interface StudentProject {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    studentClassroomId: number;
    projectId: number;
    groupId: number;
    statusOnRepo: string;
    role: 'LEADER' | 'MEMBER' | null;
    githubAccountId: number | null;
    studentClassroom: StudentClassroom;
}

export interface Topic {
    id: number;
    title: string;
    description: string;
    // Add other topic fields as needed
}

export interface GroupData {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    number: number;
    projectId: number;
    topicId: number | null;
    topic: Topic | null;
    studentProjects: StudentProject[];
}

export interface GroupMember {
    id: number;
    name: string | null;
    email: string;
    externalId: string | null;
    roleInGroup: 'LEADER' | 'MEMBER';
    studentProjectId: number;
}
