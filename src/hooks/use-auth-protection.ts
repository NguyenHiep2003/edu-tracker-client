'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthData } from '@/services/local-storage/auth';
import { useCookies } from 'next-client-cookies';

export enum UserRole {
    STUDENT = 'STUDENT',
    LECTURER = 'LECTURER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER ADMIN',
}

export interface AuthData {
    roles: UserRole[] | null;
    accessToken: string | null;
    refreshToken?: string;
}

interface UseAuthProtectionOptions {
    allowedRoles: string[];
    redirectTo?: string;
}

interface UseAuthProtectionReturn {
    loading: boolean;
    userInfo: AuthData | null;
    isAuthenticated: boolean;
}

export function useAuthProtection({
    allowedRoles,
    redirectTo = '/login',
}: UseAuthProtectionOptions): UseAuthProtectionReturn {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<AuthData | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const cookies = useCookies();

    useEffect(() => {
        // Extract auth data from cookies and save to localStorage
        const authData = getAuthData();

        if (
            !authData ||
            !authData.accessToken ||
            !authData?.roles?.some((userRole) =>
                allowedRoles.includes(userRole)
            )
        ) {
            const rolesData = cookies.get('roles');
            console.log('🚀 ~ useEffect ~ rolesData:', rolesData);
            const accessToken = cookies.get('accessToken');
            console.log('🚀 ~ useEffect ~ accessToken:', accessToken);
            const roles: UserRole[] = rolesData ? JSON.parse(rolesData) : [];
            console.log('🚀 ~ useEffect ~ roles:', roles);
            if (
                !roles ||
                !accessToken ||
                !roles.some((userRole) => allowedRoles.includes(userRole))
            ) {
            }
            // Redirect to login if no auth data or wrong role
            // router.push(redirectTo);
            if (accessToken && roles) {
                console.log('🚀 ~ hehehehe');
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('roles', JSON.stringify(roles));
                cookies.remove('roles');
                cookies.remove('accessToken');
            }
        }

        // Set user info and mark as authenticated
        setUserInfo({
            roles: authData?.roles || null,
            accessToken: authData?.accessToken || null,
        });
        setIsAuthenticated(true);
        setLoading(false);
    }, [redirectTo]);

    return {
        loading,
        userInfo,
        isAuthenticated,
    };
}
