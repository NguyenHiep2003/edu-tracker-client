'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FolderOpen,
    Calendar,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    Eye,
    User,
    BarChart3,
    UserPlus,
} from 'lucide-react';
import { getProjectsOfClassForStudent } from '@/services/api/class';
import { toast } from 'react-toastify';
import { addStudentsToProject } from '@/services/api/project';
import { useClassContext } from '@/context/class-context';
import { formatDate } from '@/helper/date-formatter';

interface ProjectData {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    title: string;
    description: string | null;
    key: string;
    startDate: string;
    endDate: string;
    type: 'TEAM' | 'SOLO';
    status: 'OPEN' | 'CLOSED' | 'SCHEDULED';
    participationMode: 'mandatory' | 'optional';
    joinProjectDeadline: string | null;
    allowStudentFormTeam: boolean;
    formGroupDeadline: string | null;
    classroomId: number;
    numberOfStudents: number;
    canManageProgress: boolean;
    groupNumber: number | null;
    isJoined: boolean;
    groupId?: number;
}
export default function StudentProjectsPage() {
    const params = useParams();
    const classId = params.id as string;
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const { classData } = useClassContext();
    const router = useRouter();
    useEffect(() => {
        // Using your real project data
        getProjectsOfClassForStudent(Number(classId)).then((data) => {
            setProjects(data);
            setLoading(false);
        });
    }, [classId]);

    const getTypeIcon = (type: 'TEAM' | 'SOLO') => {
        return type === 'TEAM' ? (
            <Users className="h-5 w-5 text-blue-600" />
        ) : (
            <User className="h-5 w-5 text-green-600" />
        );
    };

    const getStatusBadge = (status: 'OPEN' | 'CLOSED' | 'SCHEDULED') => {
        switch (status) {
            case 'OPEN':
                return (
                    <Badge className="bg-green-100 text-green-800">Open</Badge>
                );
            case 'CLOSED':
                return (
                    <Badge className="bg-red-100 text-red-800">Closed</Badge>
                );
            case 'SCHEDULED':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        Scheduled
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getJoinStatusBadge = (isJoined: boolean) => {
        return isJoined ? (
            <Badge className="bg-blue-100 text-blue-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Joined
            </Badge>
        ) : (
            <Badge variant="outline" className="text-gray-600">
                <XCircle className="h-3 w-3 mr-1" />
                Not Joined
            </Badge>
        );
    };

    const getParticipationBadge = (mode: 'mandatory' | 'optional') => {
        return mode === 'mandatory' ? (
            <Badge className="text-xs font-semibold bg-red-500 text-white border-red-600 shadow-sm">
                MANDATORY
            </Badge>
        ) : (
            <Badge className="text-xs font-semibold bg-blue-500 text-white border-blue-600 shadow-sm">
                OPTIONAL
            </Badge>
        );
    };

    const getDaysUntilEnd = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid gap-6">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-48 bg-gray-200 rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Projects
                </h1>
                <p className="text-gray-600">
                    View and manage your project assignments
                </p>
            </div>

            {/* Projects Grid */}
            <div className="grid gap-4 lg:gap-6">
                {projects.map((project) => {
                    const daysUntilEnd = getDaysUntilEnd(project.endDate);
                    const isOverdue = daysUntilEnd < 0;
                    const isDueSoon = daysUntilEnd <= 3 && daysUntilEnd >= 0;

                    return (
                        <Card
                            key={project.id}
                            className={`transition-all hover:shadow-lg ${
                                project.isJoined
                                    ? 'border-blue-200 bg-blue-50'
                                    : isOverdue
                                    ? 'border-red-200 bg-red-50'
                                    : isDueSoon
                                    ? 'border-yellow-200 bg-yellow-50'
                                    : ''
                            }`}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        {getTypeIcon(project.type)}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CardTitle className="text-xl">
                                                    {project.title}
                                                </CardTitle>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs font-mono text-gray-600"
                                                >
                                                    {project.key}
                                                </Badge>
                                                {getParticipationBadge(
                                                    project.participationMode
                                                )}
                                            </div>
                                            <p className="text-gray-600 mt-1">
                                                {project.description ||
                                                    'No description provided'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {getStatusBadge(project.status)}
                                        {getJoinStatusBadge(project.isJoined)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                                    {/* Start Date */}
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <div className="text-sm font-medium">
                                                Start Date
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {formatDate(
                                                    project.startDate,
                                                    'dd/MM/yyyy HH:mm'
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* End Date */}
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <div className="text-sm font-medium">
                                                End Date
                                            </div>
                                            <div
                                                className={`text-sm ${
                                                    isOverdue
                                                        ? 'text-red-600'
                                                        : isDueSoon
                                                        ? 'text-yellow-600'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                {formatDate(
                                                    project.endDate,
                                                    'dd/MM/yyyy HH:mm'
                                                )}
                                                {isOverdue && (
                                                    <span className="ml-1 font-medium">
                                                        (
                                                        {Math.abs(daysUntilEnd)}{' '}
                                                        days overdue)
                                                    </span>
                                                )}
                                                {isDueSoon && !isOverdue && (
                                                    <span className="ml-1 font-medium">
                                                        ({daysUntilEnd} days
                                                        left)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Join Project Deadline */}
                                    <div className="flex items-center space-x-2">
                                        <UserPlus className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <div className="text-sm font-medium">
                                                Join Deadline
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {project.joinProjectDeadline
                                                    ? formatDate(
                                                          project.joinProjectDeadline,
                                                          'dd/MM/yyyy HH:mm'
                                                      )
                                                    : 'No deadline'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Students Count */}
                                    <div className="flex items-center space-x-2">
                                        <Users className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <div className="text-sm font-medium">
                                                Students
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {project.numberOfStudents}{' '}
                                                joined
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Information */}
                                {(project.groupNumber ||
                                    project.formGroupDeadline ||
                                    (project.joinProjectDeadline &&
                                        !project.isJoined)) && (
                                    <div className="mb-4 space-y-3">
                                        {/* Group Information */}
                                        {project.groupNumber && (
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="text-sm font-medium text-blue-900">
                                                    Your Group: Group{' '}
                                                    {project.groupNumber}
                                                </div>
                                            </div>
                                        )}

                                        {/* Form Group Deadline */}
                                        {project.formGroupDeadline && (
                                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                <div className="text-sm font-medium text-yellow-900 mb-1">
                                                    Group Formation Deadline
                                                </div>
                                                <div className="text-sm text-yellow-700">
                                                    {formatDate(
                                                        project.formGroupDeadline,
                                                        'dd/MM/yyyy HH:mm'
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Join Project Deadline */}
                                        {project.joinProjectDeadline &&
                                            !project.isJoined && (
                                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <div className="text-sm font-medium text-orange-900 mb-1">
                                                        Join Project Deadline
                                                    </div>
                                                    <div className="text-sm text-orange-700">
                                                        {formatDate(
                                                            project.joinProjectDeadline,
                                                            'dd/MM/yyyy HH:mm'
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-between">
                                    <div className="flex space-x-3">
                                        {/* Always show View Details */}
                                        <Link
                                            href={`/student/classes/${classId}/projects/${project.id}/details/`}
                                        >
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </Button>
                                        </Link>

                                        {/* Show Manage Progress only if canManageProgress is true */}
                                        {project.canManageProgress &&
                                            project.groupId && (
                                                <Link
                                                    href={`/student/classes/${classId}/projects/${project.id}/progress-management/${project.groupId}`}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <BarChart3 className="h-4 w-4 mr-2" />
                                                        Manage Group and
                                                        Progress
                                                    </Button>
                                                </Link>
                                            )}

                                        {/* Show Join button for non-joined projects */}
                                        {!project.isJoined &&
                                            (!project.joinProjectDeadline ||
                                                new Date(
                                                    project.joinProjectDeadline
                                                ) > new Date()) && (
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    onClick={async () => {
                                                        if (
                                                            classData?.studentClassroomId
                                                        ) {
                                                            await addStudentsToProject(
                                                                project.id,
                                                                [
                                                                    classData.studentClassroomId,
                                                                ]
                                                            );

                                                            router.push(
                                                                `/student/classes/${classId}/projects/${project.id}/details/`
                                                            );
                                                            toast.success(
                                                                'You have joined the project.'
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Join Project
                                                </Button>
                                            )}
                                    </div>

                                    {/* <div className="text-right">
                                        <div className="text-sm text-gray-500">
                                            Created:{' '}
                                            {formatDate(project.createdAt)}
                                        </div>
                                    </div> */}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {projects.length === 0 && (
                <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No projects yet
                    </h3>
                    <p className="text-gray-600">
                        Projects will appear here when they are assigned by your
                        instructor.
                    </p>
                </div>
            )}
        </div>
    );
}
