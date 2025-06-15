'use client';

import { getUserGroupData } from '@/services/api/group';
import { GroupData, StudentProject } from '@/services/api/group/interface';
import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface GroupContextType {
    loading: boolean;
    groupData: GroupData;
    error: string | null;
    isGroupLeader: boolean;
    refetchGroup: () => Promise<void>;
    // Helper functions to get specific data
    getCurrentUserRole: () => 'LEADER' | 'MEMBER' | null;
    getCurrentUserClassRole: () => 'STUDENT' | 'TA' | null;
    getGroupMembers: () => StudentProject[];
    getGroupLeader: () => StudentProject | null;
    setIsGroupLeader: (isGroupLeader: boolean) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({
    children,
    groupId,
    currentUserId,
}: {
    children: React.ReactNode;
    groupId: number;
    currentUserId?: number;
}) {
    const [groupData, setGroupData] = useState<GroupData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGroupLeader, setIsGroupLeader] = useState(false);

    const fetchGroup = async () => {
        try {
            setLoading(true);
            const data = await getUserGroupData(groupId);

            setGroupData(data);
            if (data.studentProjects[0]?.role == 'LEADER')
                setIsGroupLeader(true);
        } catch (error: any) {
            console.error('Error fetching group:', error);
            setError(error.message || 'Failed to load group');
            toast.error('Failed to load group details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchGroup();
        }
    }, [groupId]);

    const refetchGroup = async () => {
        await fetchGroup();
    };

    // Helper function to get current user's role in the group
    const getCurrentUserRole = (): 'LEADER' | 'MEMBER' | null => {
        if (!groupData || !currentUserId) return null;

        const userProject = groupData.studentProjects.find(
            (sp) => sp.studentClassroom.studentId === currentUserId
        );

        return userProject?.role || null;
    };

    // Helper function to get current user's role in the class
    const getCurrentUserClassRole = (): 'STUDENT' | 'TA' | null => {
        if (!groupData || !currentUserId) return null;

        const userProject = groupData.studentProjects.find(
            (sp) => sp.studentClassroom.studentId === currentUserId
        );

        return userProject?.studentClassroom.role || null;
    };

    // Helper function to get all group members
    const getGroupMembers = (): StudentProject[] => {
        return groupData?.studentProjects || [];
    };

    // Helper function to get group leader
    const getGroupLeader = (): StudentProject | null => {
        if (!groupData) return null;

        return (
            groupData.studentProjects.find((sp) => sp.role === 'LEADER') || null
        );
    };

    return (
        <GroupContext.Provider
            value={{
                isGroupLeader,
                setIsGroupLeader,
                groupData: groupData as GroupData,
                loading,
                error,
                refetchGroup,
                getCurrentUserRole,
                getCurrentUserClassRole,
                getGroupMembers,
                getGroupLeader,
            }}
        >
            {children}
        </GroupContext.Provider>
    );
}

export function useGroupContext() {
    const context = useContext(GroupContext);
    if (context === undefined) {
        throw new Error('useGroupContext must be used within a GroupProvider');
    }
    return context;
}

// Additional helper hooks for convenience
export function useCurrentUserGroupRole() {
    const { getCurrentUserRole } = useGroupContext();
    return getCurrentUserRole();
}

export function useCurrentUserClassRole() {
    const { getCurrentUserClassRole } = useGroupContext();
    return getCurrentUserClassRole();
}

export function useGroupMembers() {
    const { getGroupMembers } = useGroupContext();
    return getGroupMembers();
}

export function useGroupLeader() {
    const { getGroupLeader } = useGroupContext();
    return getGroupLeader();
}
