'use client';

import { getProjectDetail } from '@/services/api/project';
import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export interface Grade {
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
    visibility: string;
    scale?: number;
}

export interface ProjectDetail {
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
    grade?: Grade;
}

interface ProjectContextType {
    projectData: ProjectDetail | null;
    loading: boolean;
    error: string | null;
    refetchProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({
    children,
    projectId,
}: {
    children: React.ReactNode;
    projectId: number;
}) {
    const [projectData, setProjectData] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProject = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getProjectDetail(projectId);

            setProjectData(data);
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
        <ProjectContext.Provider
            value={{
                projectData,
                loading,
                error,
                refetchProject,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export function useProjectContext() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error(
            'useProjectContext must be used within a ProjectProvider'
        );
    }
    return context;
}
