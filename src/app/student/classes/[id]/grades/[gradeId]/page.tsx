'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
    Eye,
    EyeOff,
    FileSpreadsheet,
    GraduationCap,
    ListTodo,
    Lock,
    Settings2,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { GradeType, GradeVisibility } from '../page';
import { toast } from 'react-toastify';
import { getGradeDetail } from '@/services/api/grades';

interface Student {
    id: number;
    email: string;
    name: string | null;
    externalId: string | null;
}

interface StudentToGrade {
    id: number;
    value: number;
}

interface StudentClassroom {
    id: number;
    student: Student;
    studentToGrades: StudentToGrade[];
}

interface GradeDetail {
    id: number;
    createdAt: string;
    updatedAt: string;
    title: string;
    description: string;
    type: GradeType;
    // isFinal: boolean;
    maxScore: number;
    visibility: GradeVisibility;
    classroom: {
        classroomToStudents: StudentClassroom[];
    };
    scale: number;
    project?: {
        id: number;
        createdAt: string;
        updatedAt: string;
        title: string;
        description: string | null;
        key: string;
        startDate: string;
        endDate: string;
        type: string;
        participationMode: string;
        joinProjectDeadline: string | null;
        allowStudentFormTeam: boolean;
        formGroupDeadline: string | null;
        classroomId: number;
    };
    lecturerWorkItem?: {
        id: number;
        summary: string;
        description?: string;
        // Add other lecturer work item fields as needed
    };
}

export default function GradeDetailPage() {
    const [gradeDetail, setGradeDetail] = useState<GradeDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const params = useParams();
    const router = useRouter();

    useEffect(() => {
        const fetchGradeDetail = async () => {
            try {
                setLoading(true);
                const response = await getGradeDetail(
                    params.gradeId as unknown as number
                );
                setGradeDetail(response.data);
            } catch (error) {
                console.log('🚀 ~ fetchGradeDetail ~ error:', error);
                toast.error('Error fetching grade details');
            } finally {
                setLoading(false);
            }
        };

        fetchGradeDetail();
    }, [params.id, params.gradeId]);

    const getTypeIcon = (type: GradeType) => {
        switch (type) {
            case GradeType.PROJECT:
                return <ListTodo className="h-4 w-4" />;
            case GradeType.LECTURER_WORK_ITEM:
                return <GraduationCap className="h-4 w-4" />;
            case GradeType.IMPORT_FILE:
                return <FileSpreadsheet className="h-4 w-4" />;
            case GradeType.AGGREGATION:
                return <Settings2 className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const getTypeColor = (type: GradeType) => {
        switch (type) {
            case GradeType.PROJECT:
                return 'bg-blue-50 text-blue-700 ring-blue-600/20';
            case GradeType.LECTURER_WORK_ITEM:
                return 'bg-purple-50 text-purple-700 ring-purple-600/20';
            case GradeType.IMPORT_FILE:
                return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
            case GradeType.AGGREGATION:
                return 'bg-gray-50 text-gray-700 ring-gray-600/20';
            default:
                return '';
        }
    };

    const getVisibilityIcon = (visibility: GradeVisibility) => {
        switch (visibility) {
            case GradeVisibility.PUBLIC:
                return <Eye className="h-4 w-4" />;
            case GradeVisibility.PRIVATE:
                return <Lock className="h-4 w-4" />;
            case GradeVisibility.RESTRICTED:
                return <EyeOff className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const getVisibilityColor = (visibility: GradeVisibility) => {
        switch (visibility) {
            case GradeVisibility.PUBLIC:
                return 'bg-green-50 text-green-700 ring-green-600/20';
            case GradeVisibility.PRIVATE:
                return 'bg-red-50 text-red-700 ring-red-600/20';
            case GradeVisibility.RESTRICTED:
                return 'bg-orange-50 text-orange-700 ring-orange-600/20';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-1/3 bg-gray-200 rounded" />
                    <div className="h-24 bg-gray-200 rounded" />
                    <div className="h-64 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    if (!gradeDetail) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">
                        Grade not found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        The grade you&apos;re looking for doesn&apos;t exist or
                        you don&apos;t have permission to view it.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <Card className="p-6">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {gradeDetail.title}
                            </h1>
                            <Badge
                                variant="secondary"
                                className={getTypeColor(gradeDetail.type)}
                            >
                                <span className="flex items-center gap-1">
                                    {getTypeIcon(gradeDetail.type)}
                                    {gradeDetail.type}
                                </span>
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {gradeDetail.description && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </h3>
                                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                    {gradeDetail.description}
                                </p>
                            </div>
                        )}

                        {(gradeDetail.project ||
                            gradeDetail.lecturerWorkItem) && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">
                                    {gradeDetail.project
                                        ? 'Linked Project'
                                        : 'Linked Work Item'}
                                </h3>
                                <div
                                    onClick={() => {
                                        if (gradeDetail.project)
                                            router.push(
                                                `/student/classes/${params.id}/projects/${gradeDetail.project.id}`
                                            );
                                        if (gradeDetail.lecturerWorkItem)
                                            router.push(
                                                `/student/classes/${params.id}/work-items/${gradeDetail.lecturerWorkItem.id}`
                                            );
                                    }}
                                    className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200 hover:shadow-md group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            {gradeDetail.project ? (
                                                <ListTodo className="h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
                                            ) : (
                                                <GraduationCap className="h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-base font-semibold text-indigo-900 group-hover:text-indigo-800">
                                                {gradeDetail.project?.title ||
                                                    gradeDetail.lecturerWorkItem
                                                        ?.summary}
                                            </h4>
                                            {gradeDetail.project && (
                                                <div className="mt-2 space-y-1">
                                                    <p className="text-sm text-indigo-700 group-hover:text-indigo-600">
                                                        <span className="font-medium">
                                                            Key:
                                                        </span>{' '}
                                                        {
                                                            gradeDetail.project
                                                                .key
                                                        }
                                                    </p>
                                                    <p className="text-sm text-indigo-700 group-hover:text-indigo-600">
                                                        <span className="font-medium">
                                                            Type:
                                                        </span>{' '}
                                                        {
                                                            gradeDetail.project
                                                                .type
                                                        }
                                                    </p>
                                                    <p className="text-sm text-indigo-700 group-hover:text-indigo-600">
                                                        <span className="font-medium">
                                                            Duration:
                                                        </span>{' '}
                                                        {format(
                                                            new Date(
                                                                gradeDetail.project.startDate
                                                            ),
                                                            'MMM d, yyyy'
                                                        )}{' '}
                                                        -{' '}
                                                        {format(
                                                            new Date(
                                                                gradeDetail.project.endDate
                                                            ),
                                                            'MMM d, yyyy'
                                                        )}
                                                    </p>
                                                    {gradeDetail.project
                                                        .description && (
                                                        <p className="text-sm text-indigo-600 mt-2 group-hover:text-indigo-500">
                                                            {
                                                                gradeDetail
                                                                    .project
                                                                    .description
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {gradeDetail.lecturerWorkItem
                                                ?.description && (
                                                <p className="text-sm text-indigo-600 mt-2 group-hover:text-indigo-500">
                                                    {
                                                        gradeDetail
                                                            .lecturerWorkItem
                                                            .description
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-blue-900">
                                        Max Score
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-blue-900">
                                    {gradeDetail.maxScore}
                                </p>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-purple-900">
                                        Scale
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-purple-900">
                                    {gradeDetail.scale}
                                </p>
                            </div>

                            <div
                                className={`rounded-lg p-4 ${getVisibilityColor(
                                    gradeDetail.visibility
                                ).replace('ring-', 'border-')}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {getVisibilityIcon(gradeDetail.visibility)}
                                    <span className="text-sm font-medium">
                                        Visibility
                                    </span>
                                </div>
                                <p className="text-2xl font-bold">
                                    {gradeDetail.visibility}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700">
                                        Created
                                    </span>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">
                                    {format(
                                        new Date(gradeDetail.createdAt),
                                        'MMM d, yyyy'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Student Grades
                    </h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">
                                    Grade
                                </TableHead>
                                <TableHead className="w-24"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gradeDetail.classroom.classroomToStudents.map(
                                (studentClassroom) => (
                                    <TableRow key={studentClassroom.id}>
                                        <TableCell className="font-medium">
                                            {studentClassroom.student
                                                .externalId || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {studentClassroom.student.name ||
                                                '-'}
                                        </TableCell>
                                        <TableCell>
                                            {studentClassroom.student.email}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {studentClassroom.studentToGrades[0]
                                                ?.value ?? '-'}
                                        </TableCell>
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
