'use client';

import type React from 'react';
import { useAuthProtection, UserRole } from '@/hooks/use-auth-protection';
import { createContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { OrganizationProvider } from '@/context/organization-context';
import { ProfileProvider } from '@/context/profile-context';
import { LecturerHeader } from '@/components/lecturer-header';
import { Loader2 } from 'lucide-react';

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

function LecturerLayoutContent({ children }: { children: React.ReactNode }) {
    const { loading, userInfo } = useAuthProtection({
        allowedRoles: [UserRole.LECTURER],
    });
    const pathname = usePathname();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const isInClassContext = pathname?.includes('/classes/');

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
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ userInfo, loading }}>
            <ProfileProvider>
                <div className="min-h-screen bg-gray-50">
                    {/* Header */}
                    <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
                        <LecturerHeader
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
                    <div className="flex min-h-[calc(100vh-4rem)]">
                        {isInClassContext ? (
                            // Class layout - children will render the sidebar and content
                            <div className="flex-1">{children}</div>
                        ) : (
                            // Regular layout for non-class pages
                            <main className="flex-1 mx-auto px-4 py-6 sm:px-6 lg:px-8">
                                {children}
                            </main>
                        )}
                    </div>
                </div>
            </ProfileProvider>
        </AuthContext.Provider>
    );
}

export default function LecturerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OrganizationProvider>
            <LecturerLayoutContent>{children}</LecturerLayoutContent>
        </OrganizationProvider>
    );
}
