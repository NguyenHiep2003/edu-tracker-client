'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
    Eye,
    EyeOff,
    FileSpreadsheet,
    GraduationCap,
    ListTodo,
    Lock,
    Plus,
    Settings2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
import { getGrades } from '@/services/api/grades';
import { CreateGradeModal } from '@/components/create-grade-modal';
import { GradeType, GradeVisibility } from '@/services/api/grades/type';
import { formatDate } from '@/helper/date-formatter';


interface Grade {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    title: string;
    description: string;
    type: GradeType;
    // isFinal: boolean;
    fileId: number | null;
    maxScore: number;
    visibility: GradeVisibility;
    classroomId: number;
}

export default function GradingPage() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const params = useParams();
    const router = useRouter();
    const fetchGrades = async () => {
        try {
            setLoading(true);
            const response = await getGrades(Number(params.id));
            setGrades(response.data);
        } catch (error) {
            console.log("🚀 ~ fetchGrades ~ error:", error)
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchGrades();
    }, [params.id]);

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
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="p-6 animate-pulse bg-gray-50 rounded-lg border"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Các đầu điểm đánh giá
                </h1>
                <Button
                    className="flex items-center gap-2"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    Thêm đầu điểm đánh giá
                </Button>
            </div>

            <CreateGradeModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    // Refresh grades list after creating a new grade
                    fetchGrades();
                }}
                existingGrades={grades.map((grade) => ({
                    id: grade.id,
                    title: grade.title,
                }))}
                classId={Number(params.id)}
            />

            <div className="space-y-4">
                {grades.map((grade) => (
                    <Card
                        key={grade.id}
                        className="p-6 cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300"
                        onClick={() =>
                            router.push(
                                `/lecturer/classes/${params.id}/grading/${grade.id}`
                            )
                        }
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-medium text-gray-900">
                                        {grade.title}
                                    </h2>
                                    {/* {grade.isFinal && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-blue-50 text-blue-700 hover:bg-blue-50"
                                        >
                                            Final Grade
                                        </Badge>
                                    )} */}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Badge
                                        variant="secondary"
                                        className={getTypeColor(grade.type)}
                                    >
                                        <span className="flex items-center gap-1">
                                            {getTypeIcon(grade.type)}
                                            {grade.type}
                                        </span>
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className={getVisibilityColor(
                                            grade.visibility
                                        )}
                                    >
                                        <span className="flex items-center gap-1">
                                            {getVisibilityIcon(
                                                grade.visibility
                                            )}
                                            {grade.visibility}
                                        </span>
                                    </Badge>
                                    <span>•</span>
                                    <span>Điểm tối đa: {grade.maxScore}</span>
                                    <span>•</span>
                                    <span>
                                        Ngày tạo:{' '}
                                        {formatDate(grade.createdAt, 'dd/MM/yyyy')}
                                    </span>
                                </div>
                                {grade.description && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        {grade.description}
                                    </p>
                                )}
                            </div>
                            {/* <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Settings2 className="h-4 w-4" />
                                        <span className="sr-only">
                                            Open menu
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            router.push(
                                                `/lecturer/classes/${params.id}/grading/${grade.id}`
                                            )
                                        }
                                    >
                                        View Grades
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu> */}
                        </div>
                    </Card>
                ))}

                {grades.length === 0 && (
                    <div className="text-center py-12">
                        <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">
                            Không có đầu điểm đánh giá
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Bắt đầu bằng cách tạo đầu điểm đánh giá mới.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
