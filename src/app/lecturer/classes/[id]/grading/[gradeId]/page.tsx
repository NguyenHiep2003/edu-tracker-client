'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import instance from '@/services/api/common/axios';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WarningModal } from '@/components/warning-modal';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
    Eye,
    EyeOff,
    FileSpreadsheet,
    GraduationCap,
    ListTodo,
    Lock,
    Settings2,
    Edit2,
    Save,
    X,
    Trash2,
    ChevronDown,
    Check,
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
import {
    deleteGrade,
    getGradeDetail,
    updateGrade,
} from '@/services/api/grades';

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
    const [editingStudent, setEditingStudent] = useState<number | null>(null);
    const [editedGrade, setEditedGrade] = useState<number | null>(null);
    const [error, setError] = useState<string>('');
    const [isEditingGrade, setIsEditingGrade] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editedGradeInfo, setEditedGradeInfo] = useState({
        title: '',
        description: '',
        maxScore: 0,
        scale: 0,
        visibility: GradeVisibility.PRIVATE,
    });
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
                setEditedGradeInfo({
                    title: response.data.title,
                    description: response.data.description,
                    maxScore: response.data.maxScore,
                    scale: response.data.scale,
                    visibility: response.data.visibility,
                });
            } catch (error) {
                console.error('Error fetching grade details:', error);
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

    const validateGrade = (value: number | null) => {
        if (value === null) {
            setError('');
            return true;
        }
        if (value < 0) {
            setError('Grade cannot be negative');
            return false;
        }
        if (gradeDetail?.maxScore && value > gradeDetail.maxScore) {
            setError(`Grade cannot exceed ${gradeDetail.maxScore}`);
            return false;
        }
        setError('');
        return true;
    };

    const handleGradeChange = (value: string) => {
        if (value === '') {
            setEditedGrade(null);
            setError('');
            return;
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            setError('Please enter a valid number');
            return;
        }
        validateGrade(numValue);
        setEditedGrade(numValue);
    };

    const handleSave = async (studentClassroomId: number) => {
        if (!gradeDetail?.id) return;
        if (!validateGrade(editedGrade)) return;

        try {
            await instance.patch(`/v1/grade/${gradeDetail.id}/student-grades`, {
                studentGrades: [
                    {
                        studentClassroomId,
                        value: editedGrade,
                    },
                ],
            });
            toast.success('Grade saved successfully');
            setEditingStudent(null);
            setEditedGrade(null);
            setError('');

            // Refresh grade details
            const response = await instance.get(`/v1/grade/${params.gradeId}`);
            setGradeDetail(response.data);
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
    };

    const handleEditGrade = () => {
        setIsEditingGrade(true);
    };

    const handleCancelEdit = () => {
        setIsEditingGrade(false);
        if (gradeDetail) {
            setEditedGradeInfo({
                title: gradeDetail.title,
                description: gradeDetail.description,
                maxScore: gradeDetail.maxScore,
                scale: gradeDetail.scale,
                visibility: gradeDetail.visibility,
            });
        }
    };

    const handleSaveGradeInfo = async () => {
        if (!gradeDetail?.id) return;

        try {
            await updateGrade(gradeDetail.id, editedGradeInfo);
            toast.success('Grade information updated successfully');
            setIsEditingGrade(false);

            // Refresh grade details
            const response = await getGradeDetail(
                params.gradeId as unknown as number
            );
            setGradeDetail(response.data);
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
    };

    const handleDeleteGrade = async () => {
        if (!gradeDetail?.id) return;

        try {
            await deleteGrade(gradeDetail.id);
            toast.success('Grade deleted successfully');
            router.push(`/lecturer/classes/${params.id}/grading`);
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
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

    const visibilityOptions = [
        { value: GradeVisibility.PRIVATE, label: 'Private' },
        { value: GradeVisibility.PUBLIC, label: 'Public' },
        { value: GradeVisibility.RESTRICTED, label: 'Restricted' },
    ];

    return (
        <div className="p-6 space-y-6">
            <Card className="p-6">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isEditingGrade ? (
                                <h1 className="text-2xl font-semibold text-gray-900">
                                    Edit Grade Information
                                </h1>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-semibold text-gray-900">
                                        {gradeDetail.title}
                                    </h1>
                                    <Badge
                                        variant="secondary"
                                        className={getTypeColor(
                                            gradeDetail.type
                                        )}
                                    >
                                        <span className="flex items-center gap-1">
                                            {getTypeIcon(gradeDetail.type)}
                                            {gradeDetail.type}
                                        </span>
                                    </Badge>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditingGrade ? (
                                <>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="rounded-md p-2 hover:bg-gray-100"
                                    >
                                        <X className="h-4 w-4 text-gray-500" />
                                    </button>
                                    <button
                                        onClick={handleSaveGradeInfo}
                                        className="rounded-md p-2 hover:bg-gray-100"
                                    >
                                        <Save className="h-4 w-4 text-green-600" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleEditGrade}
                                        className="rounded-md p-2 hover:bg-gray-100"
                                    >
                                        <Edit2 className="h-4 w-4 text-blue-600" />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="rounded-md p-2 hover:bg-gray-100"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {isEditingGrade ? (
                        <div className="space-y-4">
                            <div>
                                <Label
                                    htmlFor="title"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Title
                                </Label>
                                <Input
                                    id="title"
                                    value={editedGradeInfo.title}
                                    onChange={(e) =>
                                        setEditedGradeInfo((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="description"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={editedGradeInfo.description}
                                    onChange={(e) =>
                                        setEditedGradeInfo((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    className="mt-1"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label
                                        htmlFor="maxScore"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Max Score
                                    </Label>
                                    <Input
                                        id="maxScore"
                                        type="number"
                                        value={editedGradeInfo.maxScore}
                                        onChange={(e) =>
                                            setEditedGradeInfo((prev) => ({
                                                ...prev,
                                                maxScore: e.target.value
                                                    ? parseFloat(e.target.value)
                                                    : 0,
                                            }))
                                        }
                                        className="mt-1"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <Label
                                        htmlFor="scale"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Scale
                                    </Label>
                                    <Input
                                        id="scale"
                                        type="number"
                                        value={editedGradeInfo.scale}
                                        onChange={(e) =>
                                            setEditedGradeInfo((prev) => ({
                                                ...prev,
                                                scale: parseInt(e.target.value),
                                            }))
                                        }
                                        className="mt-1"
                                        min="0"
                                        max="4"
                                        step="1"
                                    />
                                </div>
                                <div>
                                    <Label
                                        htmlFor="visibility"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Visibility
                                    </Label>
                                    <Listbox
                                        value={editedGradeInfo.visibility}
                                        onChange={(value: GradeVisibility) =>
                                            setEditedGradeInfo((prev) => ({
                                                ...prev,
                                                visibility: value,
                                            }))
                                        }
                                    >
                                        <div className="relative mt-1">
                                            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border shadow-sm focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm text-gray-900">
                                                <span className="block truncate">
                                                    {
                                                        visibilityOptions.find(
                                                            (option) =>
                                                                option.value ===
                                                                editedGradeInfo.visibility
                                                        )?.label
                                                    }
                                                </span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronDown
                                                        className="h-5 w-5 text-gray-400"
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                            </Listbox.Button>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Listbox.Options className="absolute mt-1 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                                                    {visibilityOptions.map(
                                                        (option) => (
                                                            <Listbox.Option
                                                                key={
                                                                    option.value
                                                                }
                                                                className={({
                                                                    active,
                                                                }) =>
                                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                        active
                                                                            ? 'bg-blue-100 text-blue-900'
                                                                            : 'text-gray-900'
                                                                    }`
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {({
                                                                    selected,
                                                                }) => (
                                                                    <>
                                                                        <span
                                                                            className={`block truncate ${
                                                                                selected
                                                                                    ? 'font-medium'
                                                                                    : 'font-normal'
                                                                            }`}
                                                                        >
                                                                            {
                                                                                option.label
                                                                            }
                                                                        </span>
                                                                        {selected ? (
                                                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                                                <Check
                                                                                    className="h-5 w-5"
                                                                                    aria-hidden="true"
                                                                                />
                                                                            </span>
                                                                        ) : null}
                                                                    </>
                                                                )}
                                                            </Listbox.Option>
                                                        )
                                                    )}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </Listbox>
                                </div>
                                <div className="flex items-end">
                                    <div className="w-full">
                                        <Label className="text-sm font-medium text-gray-700">
                                            Created
                                        </Label>
                                        <div className="mt-1 text-sm text-gray-500 bg-gray-50 border rounded-lg px-3 py-2">
                                            {format(
                                                new Date(gradeDetail.createdAt),
                                                'MMM d, yyyy'
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
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
                                                    `/lecturer/classes/${params.id}/projects/${gradeDetail.project.id}`
                                                );
                                            if (gradeDetail.lecturerWorkItem)
                                                router.push(
                                                    `/lecturer/classes/${params.id}/work-items/${gradeDetail.lecturerWorkItem.id}`
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
                                                    {gradeDetail.project
                                                        ?.title ||
                                                        gradeDetail
                                                            .lecturerWorkItem
                                                            ?.summary}
                                                </h4>
                                                {gradeDetail.project && (
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-sm text-indigo-700 group-hover:text-indigo-600">
                                                            <span className="font-medium">
                                                                Key:
                                                            </span>{' '}
                                                            {
                                                                gradeDetail
                                                                    .project.key
                                                            }
                                                        </p>
                                                        <p className="text-sm text-indigo-700 group-hover:text-indigo-600">
                                                            <span className="font-medium">
                                                                Type:
                                                            </span>{' '}
                                                            {
                                                                gradeDetail
                                                                    .project
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
                                        {getVisibilityIcon(
                                            gradeDetail.visibility
                                        )}
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
                    )}
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
                                            {editingStudent ===
                                            studentClassroom.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <div>
                                                        <input
                                                            type="number"
                                                            value={
                                                                editedGrade ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                handleGradeChange(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="block w-24 rounded-md border-0 py-1.5 text-gray-900 text-center shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                            min="0"
                                                            max={
                                                                gradeDetail.maxScore
                                                            }
                                                            step={
                                                                10 **
                                                                -gradeDetail.scale
                                                            }
                                                        />
                                                        {error && (
                                                            <p className="mt-1 text-xs text-red-600">
                                                                {error}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                studentClassroom
                                                    .studentToGrades[0]
                                                    ?.value ?? '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                {editingStudent ===
                                                studentClassroom.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditingStudent(
                                                                    null
                                                                );
                                                                setEditedGrade(
                                                                    null
                                                                );
                                                                setError('');
                                                            }}
                                                            className="rounded-md p-1 hover:bg-gray-100"
                                                        >
                                                            <X className="h-4 w-4 text-gray-500" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleSave(
                                                                    studentClassroom.id
                                                                )
                                                            }
                                                            className="rounded-md p-1 hover:bg-gray-100"
                                                        >
                                                            <Save className="h-4 w-4 text-green-600" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingStudent(
                                                                studentClassroom.id
                                                            );
                                                            setEditedGrade(
                                                                studentClassroom
                                                                    .studentToGrades[0]
                                                                    ?.value ??
                                                                    null
                                                            );
                                                        }}
                                                        className="rounded-md p-1 hover:bg-gray-100"
                                                    >
                                                        <Edit2 className="h-4 w-4 text-blue-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <WarningModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteGrade}
                title="Delete Grade"
                description="Are you sure you want to delete this grade? This action cannot be undone and will remove all student grades associated with it."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
