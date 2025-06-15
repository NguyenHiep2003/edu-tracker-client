'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Settings,
    BarChart3,
    FileText,
    ListTodo,
    MoreHorizontal,
    Maximize2,
    Share2,
    Zap,
    List,
    Users,
    ArrowLeft,
} from 'lucide-react';
import { GroupProvider } from '@/context/group-context';
import { useStudentProjectContext } from '@/context/student-project-context';
import { use } from 'react';
import { StudentProjectProvider } from '@/context/student-project-context';

const tabs = [
    { id: 'backlog', label: 'Backlog', icon: ListTodo },
    { id: 'board', label: 'Board', icon: BarChart3 },
    { id: 'list', label: 'List', icon: List },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
];

export function ProgressManagementLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const params = useParams();
    const { projectData } = useStudentProjectContext();
    const projectId = params.projectId as string;
    const groupId = params.groupId as string;
    const classId = params.id as string;

    const getCurrentTab = () => {
        if (pathname.includes('/board')) return 'board';
        if (pathname.includes('/settings')) return 'settings';
        if (pathname.includes('/summary')) return 'summary';
        if (pathname.includes('/list')) return 'list';
        if (pathname.includes('/members')) return 'members';
        return 'backlog';
    };

    const currentTab = getCurrentTab();

    return (
        <div className="min-h-screen bg-white">
            {/* Project Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <nav className="flex items-center text-sm text-gray-600">
                                    <Link
                                        href={`/student/classes/${classId}/projects`}
                                        className="flex items-center hover:text-blue-600 transition-colors"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Projects
                                    </Link>
                                    <span className="mx-2">/</span>
                                </nav>
                                <div className="w-8 h-7 bg-blue-600 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                        {projectData?.key}
                                    </span>
                                </div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {projectData?.title}
                                </h1>
                                <Button variant="secondary" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="secondary" size="sm">
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" size="sm">
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" size="sm">
                                <Zap className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="px-6">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = currentTab === tab.id;
                            const href =
                                tab.id === 'backlog'
                                    ? `/student/classes/${classId}/projects/${projectId}/progress-management/${groupId}`
                                    : `/student/classes/${classId}/projects/${projectId}/progress-management/${groupId}/${tab.id}`;

                            return (
                                <Link
                                    key={tab.id}
                                    href={href}
                                    className={cn(
                                        'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                        isActive
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Page Content */}
            <GroupProvider groupId={Number(groupId)}>
                <div className="flex-1">{children}</div>
            </GroupProvider>
        </div>
    );
}

export default function ProgressManagementLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string; projectId: string; groupId: string }>;
}) {
    const resolvedParams = use(params);
    const projectId = Number.parseInt(resolvedParams.projectId);
    return (
        <StudentProjectProvider projectId={projectId}>
            <ProgressManagementLayoutContent>
                {children}
            </ProgressManagementLayoutContent>
        </StudentProjectProvider>
    );
}
