'use client';

import type React from 'react';
import { use, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Users, User, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    StudentProjectProvider,
    useStudentProjectContext,
} from '@/context/student-project-context';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipTrigger,
    TooltipProvider,
    TooltipContent,
} from '@/components/ui/tooltip';
import {
    addStudentsToProject,
    removeStudentFromProject,
} from '@/services/api/project';
import { useClassContext } from '@/context/class-context';
import { toast } from 'react-toastify';
import { WarningModal } from '@/components/warning-modal';

interface StudentProjectLayoutProps {
    children: React.ReactNode;
    params: Promise<{ id: string; projectId: string }>;
}

function StudentProjectLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const classId = params.id as string;
    const projectId = params.projectId as string;
    const [isOpen, setIsOpen] = useState(false);
    const { projectData, loading, refetchProject } = useStudentProjectContext();
    const { classData } = useClassContext();

    const navigation = [
        {
            name: 'Overview',
            href: `/student/classes/${classId}/projects/${projectId}/details`,
            icon: FileText,
        },
        {
            name: 'Students',
            href: `/student/classes/${classId}/projects/${projectId}/details/students`,
            icon: User,
        },
        {
            name: 'Groups',
            href: `/student/classes/${classId}/projects/${projectId}/details/groups`,
            icon: Users,
        },
        {
            name: 'Topics',
            href: `/student/classes/${classId}/projects/${projectId}/details/topics`,
            icon: Target,
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading project...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* Breadcrumb Navigation */}
                        <nav className="flex items-center text-sm text-gray-600">
                            <Link
                                href={`/student/classes/${classId}/projects`}
                                className="flex items-center hover:text-blue-600 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Projects
                            </Link>
                            <span className="mx-2">/</span>
                            <span className="text-gray-900 font-medium">
                                Project Details
                            </span>
                        </nav>

                        {/* Project Info */}
                        {projectData && (
                            <div className="flex items-center space-x-3">
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {projectData.title}
                                </h1>
                                <Badge
                                    variant="outline"
                                    className="text-xs bg-gray-100 text-gray-800"
                                >
                                    {projectData.key}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                        {projectData && !projectData.isJoined && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                            disabled={
                                                projectData.joinProjectDeadline
                                                    ? new Date(
                                                          projectData.joinProjectDeadline
                                                      ) < new Date()
                                                    : false
                                            }
                                            onClick={async () => {
                                                if (
                                                    classData?.studentClassroomId
                                                ) {
                                                    await addStudentsToProject(
                                                        projectData.id,
                                                        [
                                                            classData.studentClassroomId,
                                                        ]
                                                    );
                                                    toast.success(
                                                        'You have joined the project.'
                                                    );
                                                    refetchProject();
                                                }
                                            }}
                                        >
                                            Join Project
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs text-gray-600">
                                            {projectData.joinProjectDeadline
                                                ? new Date(
                                                      projectData.joinProjectDeadline
                                                  ) < new Date()
                                                    ? 'You cannot join the project because the join project deadline has passed.'
                                                    : 'You can join the project until the join project deadline.'
                                                : 'You can join the project.'}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {projectData?.canManageProgress &&
                            projectData.groupId && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        router.push(
                                            `/student/classes/${classId}/projects/${projectId}/progress-management/${projectData.groupId}`
                                        );
                                    }}
                                >
                                    Manage Progress
                                </Button>
                            )}
                        {projectData &&
                            projectData.isJoined &&
                            projectData.participationMode === 'optional' && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                disabled={
                                                    projectData.joinProjectDeadline
                                                        ? new Date(
                                                              projectData.joinProjectDeadline
                                                          ) < new Date()
                                                        : false
                                                }
                                                onClick={async () => {
                                                    setIsOpen(true);
                                                }}
                                            >
                                                Leave Project
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs text-gray-600">
                                                You can leave the project.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex space-x-1 mt-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                                    isActive
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                )}
                            >
                                <item.icon className="h-4 w-4 mr-2" />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
                <WarningModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    onConfirm={async () => {
                        if (projectData?.studentProjectId) {
                            await removeStudentFromProject(
                                projectData.id,
                                projectData.studentProjectId
                            );
                            toast.success('You have left the project.');
                            refetchProject();
                        }
                        setIsOpen(false);
                    }}
                    title="Leave Project"
                    description="Are you sure you want to leave the project?"
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export default function StudentProjectLayout({
    children,
    params,
}: StudentProjectLayoutProps) {
    const resolvedParams = use(params);
    const projectId = Number.parseInt(resolvedParams.projectId);

    return (
        <StudentProjectProvider projectId={projectId}>
            <StudentProjectLayoutContent>
                {children}
            </StudentProjectLayoutContent>
        </StudentProjectProvider>
    );
}
