'use client';

import type React from 'react';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ProjectProvider, useProjectContext } from '@/context/project-context';
import {
    ArrowLeft,
    Info,
    Users,
    UsersIcon,
    BookOpen,
    CheckSquare,
} from 'lucide-react';
import { formatDate } from '@/helper/date-formatter';
import { cn } from '@/lib/utils';

const tabs = [
    {
        name: 'Thông tin dự án',
        href: '',
        icon: Info,
    },
    {
        name: 'Sinh viên',
        href: '/students',
        icon: Users,
    },
    {
        name: 'Nhóm',
        href: '/groups',
        icon: UsersIcon,
    },
    {
        name: 'Chủ đề',
        href: '/topics',
        icon: BookOpen,
    },
    {
        name: 'Công việc',
        href: '/tasks',
        icon: CheckSquare,
    },
];

function ProjectHeader() {
    const { projectData } = useProjectContext();
    const params = useParams();
    const classId = params.id as string;
    return (
        <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-3">
                            <Link
                                href={`/lecturer/classes/${classId}/projects`}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-6 w-6 text-gray-600" />
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {projectData?.title}
                            </h1>
                        </div>
                        <p className="text-gray-600 mt-1">
                           
                            {projectData?.startDate
                                ? formatDate(
                                      projectData?.startDate,
                                      "dd/MM/yyyy HH:mm"
                                  )
                                : '-'}{' '}
                            -{' '}
                            {projectData?.endDate
                                ? formatDate(
                                      projectData?.endDate,
                                      "dd/MM/yyyy HH:mm"
                                  )
                                : '-'}
                        </p>
                    </div>
                    {/* <div className="flex space-x-3">
                    <Button variant="outline">Edit Project</Button>
                    <Button variant="outline">More Actions</Button>
                </div> */}
                </div>
            </div>
        </div>
    );
}

export default function ProjectLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const classId = params.id as string;
    const projectId = Number.parseInt(params.projectId as string);

    const getCurrentTab = () => {
        const basePath = `/lecturer/classes/${classId}/projects/${projectId}`;

        if (pathname === basePath) return 'Thông tin dự án';
        if (pathname.includes('/students')) return 'Sinh viên';
        if (pathname.includes('/groups')) return 'Nhóm';
        if (pathname.includes('/topics')) return 'Chủ đề';
        if (pathname.includes('/tasks')) return 'Công việc';

        return 'Thông tin dự án'; // Default fallback
    };

    const currentTab = getCurrentTab();

    return (
        <ProjectProvider projectId={projectId}>
            <div className="flex-1 min-h-screen bg-gray-50">
                {/* Project Header */}
                <ProjectHeader />
                {/* Tabs Navigation */}
                <div className="bg-white border-b border-gray-200">
                    <div className="px-4">
                        <nav className="flex space-x-8">
                            {tabs.map((tab) => {
                                const href = `/lecturer/classes/${classId}/projects/${projectId}${tab.href}`;
                                const isActive = currentTab === tab.name;

                                return (
                                    <Link
                                        key={tab.name}
                                        href={href}
                                        className={cn(
                                            'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                            isActive
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        )}
                                    >
                                        <tab.icon className="h-4 w-4" />
                                        <span>{tab.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 max-w-8xl mx-auto">{children}</div>
            </div>
        </ProjectProvider>
    );
}
