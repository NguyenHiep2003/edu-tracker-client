'use client';

import type React from 'react';
import { use } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Info,
    FolderOpen,
    BarChart3,
    Settings,
    ChevronRight,
    ArrowLeft,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClassProvider, useClassContext } from '@/context/class-context';
import { useProfile } from '@/context/profile-context';

interface NavigationItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    description: string;
}

// Sidebar component that uses the context
function ClassSidebar({ classId }: { classId: string }) {
    const {
        classData,
        loading,
        sidebarCollapsed,
        setSidebarCollapsed,
        classInitials,
        classGradient,
    } = useClassContext();

    const pathname = usePathname();

    // Navigation items
    const navigationItems: NavigationItem[] = [
        {
            id: 'info',
            label: 'Class Info',
            icon: Info,
            href: `/lecturer/classes/${classId}`,
            description:
                'View and edit class details, manage lecturers and students',
        },
        {
            id: 'projects',
            label: 'Projects',
            icon: FolderOpen,
            href: `/lecturer/classes/${classId}/projects`,
            description: 'Manage class projects and assignments',
        },
        {
            id: 'grading',
            label: 'Grading Components',
            icon: BarChart3,
            href: `/lecturer/classes/${classId}/grading`,
            description: 'Configure grading criteria and components',
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            href: `/lecturer/classes/${classId}/settings`,
            description: 'Class settings and preferences',
        },
    ];

    if (loading || !classData) {
        return null;
    }

    return (
        <aside
            className={`fixed left-0 top-20 h-[calc(100vh-5rem)] bg-white shadow-lg border-r border-gray-200 flex flex-col transition-transform duration-300 z-20 ${
                sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
            }`}
            style={{ width: '280px' }}
        >
            {/* Class Header - like Teams */}
            <div className="p-4 border-b border-gray-200">
                {/* Back to Classes */}
                <Button
                    variant="secondary"
                    size="sm"
                    asChild
                    className="mb-4 -ml-2"
                >
                    <Link
                        href="/lecturer/home"
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        All Classes
                    </Link>
                </Button>

                {/* Class Info */}
                <div className="flex items-center space-x-3">
                    <div
                        className={`w-12 h-12 bg-gradient-to-br ${classGradient} rounded-xl flex items-center justify-center shadow-lg`}
                    >
                        <div className="text-white text-sm font-bold">
                            {classInitials}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2
                            className="text-lg font-semibold text-gray-900 truncate"
                            title={classData.name}
                        >
                            {classData.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {classData.semester.name} •{' '}
                            {/* {classData.numberOfStudents} students •  */}
                            ID:{' '}
                            {classData.externalId}
                        </p>
                    </div>
                </div>
            </div>

            {/* Hide Sidebar Button */}
            <div className="px-4 py-2 border-b border-gray-200">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSidebarCollapsed(true)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 w-full justify-between"
                >
                    <span className="flex items-center space-x-2">
                        <X className="h-4 w-4" />
                        <span>Hide Sidebar</span>
                    </span>
                    <div className="flex items-center space-x-1 text-xs">
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                            Ctrl
                        </kbd>
                        <span>+</span>
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                            B
                        </kbd>
                    </div>
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
                                    isActive
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Icon
                                        className={`h-5 w-5 ${
                                            isActive
                                                ? 'text-green-600'
                                                : 'text-gray-400 group-hover:text-gray-600'
                                        }`}
                                    />
                                    <div>
                                        <div className="font-medium">
                                            {item.label}
                                        </div>
                                        <div className="text-xs text-gray-500 group-hover:text-gray-600">
                                            {item.description}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight
                                    className={`h-4 w-4 ${
                                        isActive
                                            ? 'text-green-600'
                                            : 'text-gray-400'
                                    }`}
                                />
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                    <p>
                        Created:{' '}
                        {new Date(classData.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                        Updated:{' '}
                        {new Date(classData.updatedAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
        </aside>
    );
}

// Main content component that uses the context
function ClassMainContent({
    children,
}: {
    children: React.ReactNode;
    classId: string;
}) {
    const { sidebarCollapsed, setSidebarCollapsed, loading } =
        useClassContext();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 w-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Loading class details...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex-1 min-h-screen bg-gray-50 ${
                sidebarCollapsed ? 'ml-0' : 'ml-70'
            }`}
            style={{ marginLeft: sidebarCollapsed ? '0' : '280px' }}
        >
            {/* Content Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    {sidebarCollapsed && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSidebarCollapsed(false)}
                            className="flex items-center space-x-2"
                        >
                            <span>Show Sidebar</span>
                            <div className="flex items-center space-x-1 text-xs">
                                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                                    Ctrl
                                </kbd>
                                <span>+</span>
                                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                                    B
                                </kbd>
                            </div>
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">{children}</div>
        </div>
    );
}

// Main layout component
export default function ClassDetailLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    // Fix the params issue by using React.use()
    const resolvedParams = use(params);
    const classId = resolvedParams.id;
    const { profile } = useProfile();
    return (
        <ClassProvider classId={Number(classId)} currentUserId={profile?.id}>
            <div className="flex">
                <ClassSidebar classId={classId} />
                <ClassMainContent classId={classId}>
                    {children}
                </ClassMainContent>

                {/* Overlay for mobile when sidebar is open */}
                <MobileOverlay />
            </div>
        </ClassProvider>
    );
}

// Mobile overlay component
function MobileOverlay() {
    const { sidebarCollapsed, setSidebarCollapsed } = useClassContext();

    if (sidebarCollapsed) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
        />
    );
}
