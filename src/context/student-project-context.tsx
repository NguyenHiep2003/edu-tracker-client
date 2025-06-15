'use client';

import { getStudentProjectMeta } from '@/services/api/project';
import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export interface StudentProjectData {
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
    participationMode: 'mandatory' | 'optional';
    joinProjectDeadline: string | null;
    allowStudentFormTeam: boolean;
    allowStudentCreateTopic: boolean;
    formGroupDeadline: string | null;
    classroomId: number;
    numberOfStudents: number;
    canManageProgress: boolean;
    groupNumber: number | null;
    isJoined: boolean;
    groupId?: number | null;
    studentProjectId?: number | null;
}

interface StudentProjectContextType {
    projectData: StudentProjectData | null;
    loading: boolean;
    error: string | null;
    refetchProject: () => Promise<void>;
}

const StudentProjectContext = createContext<
    StudentProjectContextType | undefined
>(undefined);

export function StudentProjectProvider({
    children,
    projectId,
}: {
    children: React.ReactNode;
    projectId: number;
}) {
    const [projectData, setProjectData] = useState<StudentProjectData | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProject = async () => {
        try {
            setLoading(true);
            setError(null);

            // TODO: Replace with actual API call
            // const response = await getStudentProjectDetail(projectId)

            // Mock data for now - replace with real API call
            const studentProjectMeta = await getStudentProjectMeta(projectId);

            setProjectData(studentProjectMeta);
        } catch (error: any) {
            console.error('Error fetching project:', error);
            setError(error.message || 'Failed to load project');
            toast.error('Failed to load project details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchProject();
        }
    }, [projectId]);

    const refetchProject = async () => {
        await fetchProject();
    };

    return (
        <StudentProjectContext.Provider
            value={{
                projectData,
                loading,
                error,
                refetchProject,
            }}
        >
            {children}
        </StudentProjectContext.Provider>
    );
}

export function useStudentProjectContext() {
    const context = useContext(StudentProjectContext);
    if (context === undefined) {
        throw new Error(
            'useStudentProjectContext must be used within a StudentProjectProvider'
        );
    }
    return context;
}
