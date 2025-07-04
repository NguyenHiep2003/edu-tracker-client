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

    const getJoinStatusBadge = (isJoined: boolean) => {
        return isJoined ? (
            <Badge className="bg-blue-100 text-blue-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Đã tham gia
            </Badge>
        ) : (
            <Badge variant="outline" className="text-gray-600">
                <XCircle className="h-3 w-3 mr-1" />
                Chưa tham gia
            </Badge>
        );
    };

    const getParticipationBadge = (mode: 'mandatory' | 'optional') => {
        return mode === 'mandatory' ? (
            <Badge className="text-xs font-semibold bg-red-500 text-white border-red-600 shadow-sm">
                Bắt buộc
            </Badge>
        ) : (
            <Badge className="text-xs font-semibold bg-blue-500 text-white border-blue-600 shadow-sm">
                Tùy chọn
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
                    Dự án
                </h1>
                <p className="text-gray-600">
                    Xem và quản lý các dự án trong lớp học của bạn
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
                                                    'Không có mô tả'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
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
                                                Ngày bắt đầu
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
                                                Ngày kết thúc
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
                                                        (Đã quá hạn {Math.abs(daysUntilEnd)} ngày)
                                                    </span>
                                                )}
                                                {isDueSoon && !isOverdue && (
                                                    <span className="ml-1 font-medium">
                                                        (Còn {daysUntilEnd} ngày)
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
                                                Hạn tham gia
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {project.joinProjectDeadline
                                                    ? formatDate(
                                                          project.joinProjectDeadline,
                                                          'dd/MM/yyyy HH:mm'
                                                      )
                                                    : 'Không có hạn'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Students Count */}
                                    <div className="flex items-center space-x-2">
                                        <Users className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <div className="text-sm font-medium">
                                                Số sinh viên
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {project.numberOfStudents}{' '}
                                                đã tham gia
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
                                                    Nhóm của bạn: Nhóm{' '}
                                                    {project.groupNumber}
                                                </div>
                                            </div>
                                        )}

                                        {/* Form Group Deadline */}
                                        {project.formGroupDeadline && project.type === 'TEAM' && (
                                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                <div className="text-sm font-medium text-yellow-900 mb-1">
                                                    Hạn lập nhóm
                                                </div>
                                                <div className="text-sm text-yellow-700">
                                                    {formatDate(
                                                        project.formGroupDeadline,
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
                                                Xem chi tiết
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
                                                        Quản lý nhóm và tiến độ
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
                                                                'Bạn đã tham gia dự án.'
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Tham gia dự án
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
                        Không có dự án nào
                    </h3>
                    <p className="text-gray-600">
                        Dự án sẽ hiển thị ở đây khi được giao bởi giáo viên của lớp học.
                    </p>
                </div>
            )}
        </div>
    );
}
