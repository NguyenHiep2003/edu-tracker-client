'use client';

import type React from 'react';
import { useAuthProtection, UserRole } from '@/hooks/use-auth-protection';
import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { OrganizationProvider } from '@/context/organization-context';
import { ProfileProvider } from '@/context/profile-context';
import { StudentHeader } from '@/components/student-header';

interface AuthContextType {
    userInfo: {
        roles: UserRole[] | null;
        accessToken: string | null;
    } | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    userInfo: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
    const { loading, userInfo } = useAuthProtection({
        allowedRoles: [UserRole.STUDENT],
    });
    const pathname = usePathname();
    const params = useParams();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Check if we're in a class context
    const isInClassContext =
        pathname.includes('/student/classes/') && params.id;

    // Handle keyboard shortcut for sidebar toggle
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'b' && isInClassContext) {
                event.preventDefault();
                setSidebarCollapsed(!sidebarCollapsed);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sidebarCollapsed, isInClassContext]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Loading Student Dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ userInfo, loading }}>
            <ProfileProvider>
                <div className="min-h-screen bg-gray-50 flex">
                    {/* Header */}
                    <div className="fixed top-0 left-0 right-0 z-30">
                        <StudentHeader
                            sidebarCollapsed={
                                isInClassContext ? sidebarCollapsed : undefined
                            }
                            onSidebarToggle={
                                isInClassContext
                                    ? () =>
                                          setSidebarCollapsed(!sidebarCollapsed)
                                    : undefined
                            }
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex w-full pt-20">
                        {isInClassContext ? (
                            // Class layout - children will render the sidebar and content
                            <div className="flex w-full">{children}</div>
                        ) : (
                            // Regular layout for non-class pages
                            <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                                <div className="px-4 py-6 sm:px-0">
                                    {children}
                                </div>
                            </main>
                        )}
                    </div>
                </div>
            </ProfileProvider>
        </AuthContext.Provider>
    );
}

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OrganizationProvider>
            <StudentLayoutContent>{children}</StudentLayoutContent>
        </OrganizationProvider>
    );
}
