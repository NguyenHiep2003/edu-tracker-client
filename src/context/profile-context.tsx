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
import type { IUser } from '@/services/api/user/interface';
import { getProfile } from '@/services/api/user';
import { UserRole } from '@/hooks/use-auth-protection';

// Profile context interface
interface ProfileContextType {
    // Data
    profile: IUser | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;

    // Actions
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<IUser>) => Promise<void>;
    logout: () => void;

    // Utility
    getUserInitials: () => string;
    hasRole: (role: UserRole) => boolean;
    isAdmin: boolean;
    isLecturer: boolean;
    isStudent: boolean;
}

// Create context
const ProfileContext = createContext<ProfileContextType | null>(null);

// Custom hook to use profile context
export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};

// Utility functions
const generateUserInitials = (name: string): string => {
    if (!name) return 'U';

    return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Mock function to update profile - replace with actual API call
const updateUserProfile = async (updates: Partial<IUser>): Promise<IUser> => {
    const currentProfile = await getProfile();
    return {
        ...currentProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
};

// Provider component
interface ProfileProviderProps {
    children: React.ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({
    children,
}) => {
    // State
    const [profile, setProfile] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch profile data
    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const userData = await getProfile();
            setProfile(userData);
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            setError(err.message || 'Failed to load profile');

            // Don't show toast on initial load failure (user might not be logged in)
            if (profile !== null) {
                toast.error('Failed to load profile');
            }
        } finally {
            setLoading(false);
        }
    }, [profile]);

    // Refresh profile data
    const refreshProfile = useCallback(async () => {
        await fetchProfile();
        if (profile) {
            toast.success('Profile refreshed');
        }
    }, [fetchProfile, profile]);

    // Update profile data
    const updateProfile = useCallback(
        async (updates: Partial<IUser>) => {
            if (!profile) return;

            try {
                setLoading(true);
                const updatedProfile = await updateUserProfile(updates);
                setProfile(updatedProfile);
                toast.success('Profile updated successfully');
            } catch (err: any) {
                console.error('Error updating profile:', err);
                toast.error('Failed to update profile');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [profile]
    );

    // Logout function
    const logout = useCallback(() => {
        setProfile(null);
        setError(null);
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
    }, []);

    // Utility functions
    const getUserInitials = useCallback(() => {
        return generateUserInitials(profile?.name || '');
    }, [profile]);

    const hasRole = useCallback(
        (role: UserRole) => {
            if (!profile?.roles) return false;
            return profile.roles.includes(role);
        },
        [profile]
    );

    // Computed properties
    const isAuthenticated = profile !== null;
    const isAdmin = hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN);
    const isLecturer = hasRole(UserRole.LECTURER);
    const isStudent = hasRole(UserRole.STUDENT);

    // Load profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    // Context value
    const contextValue: ProfileContextType = {
        // Data
        profile,
        loading,
        error,
        isAuthenticated,

        // Actions
        refreshProfile,
        updateProfile,
        logout,

        // Utility
        getUserInitials,
        hasRole,
        isAdmin,
        isLecturer,
        isStudent,
    };

    return (
        <ProfileContext.Provider value={contextValue}>
            {children}
        </ProfileContext.Provider>
    );
};

// Export context for advanced usage
export { ProfileContext };
