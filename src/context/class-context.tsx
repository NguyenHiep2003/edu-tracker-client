'use client';

import type React from 'react';
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { toast } from 'react-toastify';
import type { Class } from '@/services/api/class/interface';
import { getClassDetails } from '@/services/api/class';

// Mock function to update class details - replace with actual API call
const updateClassDetails = async (
    id: number,
    updates: Partial<Class>
): Promise<Class> => {
    const currentClass = await getClassDetails(Number(id));
    return {
        ...currentClass,
        ...updates,
    };
};

// Context interface
interface ClassContextType {
    // Data
    classData: Class | null;
    loading: boolean;
    error: string | null;

    // UI State
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;

    // Actions
    refreshClass: () => Promise<void>;
    updateClass: (updates: Partial<Class>) => Promise<void>;

    // Utility
    isCurrentUserLecturer: boolean;
    classInitials: string;
    classGradient: string;
    isCurrentUserIsClassOwner: boolean;
}

// Create context
const ClassContext = createContext<ClassContextType | null>(null);

// Custom hook to use class context
export const useClassContext = () => {
    const context = useContext(ClassContext);
    if (!context) {
        throw new Error('useClassContext must be used within a ClassProvider');
    }
    return context;
};

// Utility functions
const generateClassColor = (className: string): string => {
    const colors = [
        'from-blue-400 to-blue-600',
        'from-green-400 to-green-600',
        'from-purple-400 to-purple-600',
        'from-pink-400 to-pink-600',
        'from-indigo-400 to-indigo-600',
        'from-red-400 to-red-600',
        'from-yellow-400 to-yellow-600',
        'from-teal-400 to-teal-600',
        'from-orange-400 to-orange-600',
        'from-cyan-400 to-cyan-600',
    ];

    let hash = 0;
    for (let i = 0; i < className.length; i++) {
        hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};

const generateInitials = (className: string): string => {
    return className
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 3);
};

// Provider component
interface ClassProviderProps {
    children: React.ReactNode;
    classId: number;
    currentUserId?: number; // Pass from auth context or props
}

export const ClassProvider: React.FC<ClassProviderProps> = ({
    children,
    classId,
    currentUserId, // Default for demo
}) => {
    // State
    const [classData, setClassData] = useState<Class | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Fetch class data
    const fetchClassData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClassDetails(classId);
            setClassData(data);
        } catch (err: any) {
            console.error('Error fetching class details:', err);
            setError(err.message || 'Failed to load class details');
            toast.error('Failed to load class details');
        } finally {
            setLoading(false);
        }
    }, [classId]);

    // Refresh class data
    const refreshClass = useCallback(async () => {
        await fetchClassData();
        // toast.success('Class data refreshed');
    }, [fetchClassData]);

    // Update class data
    const updateClass = useCallback(
        async (updates: Partial<Class>) => {
            if (!classData) return;

            try {
                setLoading(true);
                const updatedClass = await updateClassDetails(classId, updates);
                setClassData(updatedClass);
                // toast.success('Class updated successfully');
            } catch (err: any) {
                console.error('Error updating class:', err);
                // toast.error('Failed to update class');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [classId, classData]
    );

    // Check if current user is a lecturer
    const isCurrentUserLecturer =
        classData?.lecturers.some(
            (lecturer) => lecturer.id === currentUserId
        ) || false;

    const isCurrentUserIsClassOwner = classData?.ownerId == currentUserId;

    // Generate class visuals
    const classInitials = classData ? generateInitials(classData.name) : '';
    const classGradient = classData
        ? generateClassColor(classData.name)
        : 'from-gray-400 to-gray-600';

    // Load data on mount
    useEffect(() => {
        fetchClassData();
    }, [fetchClassData]);

    // Keyboard shortcut for sidebar toggle
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'b') {
                event.preventDefault();
                setSidebarCollapsed(!sidebarCollapsed);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sidebarCollapsed]);

    // Context value
    const contextValue: ClassContextType = {
        // Data
        classData,
        loading,
        error,

        // UI State
        sidebarCollapsed,
        setSidebarCollapsed,

        // Actions
        refreshClass,
        updateClass,

        // Utility
        isCurrentUserLecturer,
        classInitials,
        classGradient,
        isCurrentUserIsClassOwner,
    };

    return (
        <ClassContext.Provider value={contextValue}>
            {children}
        </ClassContext.Provider>
    );
};

// Export context for advanced usage
export { ClassContext };
