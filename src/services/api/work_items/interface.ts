export interface Commit {
    id: string;
    url: string;
    numberOfLineAdded: number;
    numberOfLineDeleted: number;
    commitAt: string;
    recordedAt: string;
    workItemId: number;
    groupRepositoryId: number;
}

export interface Attachment {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    cloudId: string;
    url: string;
    name: string;
    type: string;
}

export interface ItemToAttachment {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    type: 'ATTACHMENT' | 'WORK EVIDENCE';
    attachment: Attachment;
}

export interface Student {
    id: number;
    email: string;
    name: string;
    externalId: string | null;
    roles: string[];
}

export interface StudentClassroom {
    id: number;
    studentId: number;
    classroomId: number;
    role: string;
    student: Student;
}

export interface Assignee {
    id: number;
    studentClassroomId: number;
    projectId: number;
    groupId: number;
    statusOnRepo: string;
    role: string;
    githubAccountId: number | null;
    studentClassroom: StudentClassroom;
}

export type WorkItemStatus =
    | 'TO DO'
    | 'IN PROGRESS'
    | 'WAIT FOR REVIEW'
    | 'DONE';

export interface WorkItem {
    id: number;
    key?: string;
    type: string;
    summary: string;
    description?: string;
    status: WorkItemStatus;
    assignee?: any;
    assigneeId?: number;
    sprintId?: number;
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
    storyPoints?: number;
    numOfSubItems: number;
    reporter?: {
        id: number;
        name: string;
        email: string;
    };
    groupId?: number;
    parentItemId?: number;
    parentLecturerWorkItemId?: number;
    sprint?: any;
    parentItem?: WorkItem;
    subItems?: WorkItem[];
    commits?: any[];
    itemToAttachments?: any[];
    rating?: number;
}
