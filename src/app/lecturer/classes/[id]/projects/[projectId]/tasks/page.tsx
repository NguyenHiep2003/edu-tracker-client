'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import {
    Plus,
    Calendar,
    Clock,
    Users,
    FileText,
    Eye,
    Trash2,
    CheckCircle,
    AlertCircle,
    XCircle,
    Loader2,
    Edit2,
    BarChart3,
} from 'lucide-react';
import { useProjectContext } from '@/context/project-context';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import {
    createLecturerWorkItem,
    deleteLecturerAssignedItem,
} from '@/services/api/work_items';
import { getAllLecturerAssignedItems } from '@/services/api/project';
import { formatDate } from '@/helper/date-formatter';
import { getTypeIcon } from '@/helper/get-type-icon';
import { EditTaskModal } from '@/components/edit-task-modal';
import { WarningModal } from '@/components/warning-modal';
import { Progress } from '@/components/ui/progress';

interface Task {
    lecturer_item_id: number;
    lecturer_item_created_at: string;
    lecturer_item_updated_at: string;
    lecturer_item_deleted_at: string | null;
    lecturer_item_type: 'Task' | 'Story';
    lecturer_item_summary: string;
    lecturer_item_description: string;
    lecturer_item_start_date: string | null;
    lecturer_item_end_date: string | null;
    lecturer_item_reporter_id: number;
    lecturer_item_project_id: number;
    lecturer_item_assign_type: 'ALL' | 'SPECIFIC';
    lecturer_item_group_ids: string | null;
    lecturer_item_scheduled_job_id: string;
    job_id: string;
    job_scheduled_time: string;
    job_status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAIL';
    job_fail_reason: string | null;
    num_group_done: string;
    num_group: string;
}

enum AssignType {
    ALL = 'ALL',
    SPECIFIC = 'SPECIFIC',
}

enum WorkItemType {
    TASK = 'Task',
    STORY = 'Story',
}

export default function TasksPage() {
    const {} = useProjectContext();
    const params = useParams();
    const classId = params.id as string;
    const projectId = params.projectId as string;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isDeletingTask, setIsDeletingTask] = useState(false);
    const [newTask, setNewTask] = useState({
        assignType: AssignType.ALL,
        type: WorkItemType.TASK,
        summary: '',
        description: '',
        startDate: '',
        endDate: '',
        attachments: [] as File[],
        createGradeComponent: true,
        gradeComponent: {
            title: '',
            description: '',
            maxScore: 10,
            scale: 2,
        },
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch tasks on component mount
    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    // Auto-update grade component title when task summary changes
    useEffect(() => {
        if (
            newTask.createGradeComponent &&
            newTask.summary &&
            newTask.gradeComponent
        ) {
            const defaultGradeTitle = `${newTask.summary} Grade`;
            // Only update if it's still the default or empty
            if (
                !newTask.gradeComponent.title ||
                newTask.gradeComponent.title.endsWith(' Grade')
            ) {
                setNewTask((prev) => ({
                    ...prev,
                    gradeComponent: {
                        ...prev.gradeComponent!,
                        title: defaultGradeTitle,
                    },
                }));
            }
        }
    }, [newTask.summary, newTask.createGradeComponent]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await getAllLecturerAssignedItems(
                Number(projectId)
            );
            setTasks(response);
        } catch (error: any) {
            console.log('🚀 ~ fetchTasks ~ error:', error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const getJobStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        Pending
                    </Badge>
                );
            case 'PROCESSING':
                return (
                    <Badge className="bg-blue-100 text-blue-800">
                        Processing
                    </Badge>
                );
            case 'DONE':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        Published
                    </Badge>
                );
            case 'FAIL':
                return (
                    <Badge className="bg-red-100 text-red-800">Failed</Badge>
                );
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getJobStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case 'PROCESSING':
                return (
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                );
            case 'DONE':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'FAIL':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!newTask.summary.trim()) {
            newErrors.summary = 'Task summary is required';
        }

        if (newTask.description && !newTask.description.trim()) {
            newErrors.description = 'Description cannot be empty if provided';
        }

        // Grade component validation
        if (newTask.createGradeComponent && newTask.gradeComponent) {
            if (!newTask.gradeComponent.title.trim()) {
                newErrors.gradeTitle = 'Grade component title is required';
            }

            if (
                !newTask.gradeComponent.maxScore ||
                newTask.gradeComponent.maxScore <= 0
            ) {
                newErrors.gradeMaxScore = 'Max score must be greater than 0';
            }
            if (
                !newTask.gradeComponent.scale ||
                newTask.gradeComponent.scale <= 0
            ) {
                newErrors.gradeScale = 'Scale must be greater than 0';
            }
        }

        // Validate start date if provided
        if (newTask.startDate) {
            const startDate = new Date(newTask.startDate);
            const now = new Date();
            if (startDate <= now) {
                newErrors.startDate = 'Start date must be in the future';
            }
        }

        // Validate end date if provided
        if (newTask.endDate) {
            const endDate = new Date(newTask.endDate);
            const now = new Date();
            if (endDate <= now) {
                newErrors.endDate = 'End date must be in the future';
            }

            // Validate end date is after start date
            if (newTask.startDate) {
                const startDate = new Date(newTask.startDate);
                if (endDate <= startDate) {
                    newErrors.endDate = 'End date must be after start date';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateTask = async () => {
        if (!validateForm()) return;

        try {
            setIsCreatingTask(true);
            await createLecturerWorkItem(Number(projectId), newTask);
            await fetchTasks(); // Refresh the task list
            setNewTask({
                assignType: AssignType.ALL,
                type: WorkItemType.TASK,
                summary: '',
                description: '',
                startDate: '',
                endDate: '',
                attachments: [],
                createGradeComponent: true,
                gradeComponent: {
                    title: '',
                    description: '',
                    maxScore: 10,
                    scale: 2,
                },
            });
            setIsCreateDialogOpen(false);
            setErrors({});
            toast.success('Task created successfully!');
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to create task');
            }
        } finally {
            setIsCreatingTask(false);
        }
    };

    const handleDeleteClick = (task: Task) => {
        setTaskToDelete(task);
        setIsDeleteWarningOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!taskToDelete) return;

        try {
            setIsDeletingTask(true);
            await deleteLecturerAssignedItem(taskToDelete.lecturer_item_id);
            await fetchTasks(); // Refresh the task list
            toast.success('Task deleted successfully!');
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to delete task');
            }
        } finally {
            setIsDeletingTask(false);
            setTaskToDelete(null);
            setIsDeleteWarningOpen(false);
        }
    };

    const handleDeleteCancel = () => {
        setTaskToDelete(null);
        setIsDeleteWarningOpen(false);
    };

    const handleGradeComponentChange = (
        field: keyof NonNullable<typeof newTask.gradeComponent>,
        value: any
    ) => {
        setNewTask((prev) => ({
            ...prev,
            gradeComponent: {
                ...prev.gradeComponent!,
                [field]: value,
            },
        }));

        // Clear error when user starts typing
        const errorKey = `grade${
            field.charAt(0).toUpperCase() + field.slice(1)
        }`;
        if (errors[errorKey]) {
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading tasks...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-gray-600">
                        Manage tasks and assignments for project groups
                    </p>
                </div>

                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsCreateDialogOpen(true)}
                    disabled={isCreatingTask}
                >
                    {isCreatingTask ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Task...
                        </>
                    ) : (
                        <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Task
                        </>
                    )}
                </Button>

                {/* Create Task Dialog */}
                <Transition appear show={isCreateDialogOpen}>
                    <Dialog
                        as="div"
                        className="relative z-10"
                        onClose={setIsCreateDialogOpen}
                    >
                        <Transition.Child
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[82vh]">
                                        {/* Fixed Header */}
                                        <Dialog.Title
                                            as="h3"
                                            className="p-6 text-lg font-medium leading-6 text-gray-900 flex-shrink-0 border-b"
                                        >
                                            Create New Task
                                        </Dialog.Title>

                                        {/* Scrollable Content */}
                                        <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label
                                                        htmlFor="type"
                                                        className="text-gray-900"
                                                    >
                                                        Type
                                                    </Label>
                                                    <select
                                                        id="type"
                                                        value={newTask.type}
                                                        onChange={(e) =>
                                                            setNewTask({
                                                                ...newTask,
                                                                type: e.target
                                                                    .value as WorkItemType,
                                                            })
                                                        }
                                                        className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option
                                                            value={
                                                                WorkItemType.TASK
                                                            }
                                                        >
                                                            Task
                                                        </option>
                                                        <option
                                                            value={
                                                                WorkItemType.STORY
                                                            }
                                                        >
                                                            Story
                                                        </option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <Label
                                                        htmlFor="assignType"
                                                        className="text-gray-900"
                                                    >
                                                        Assign To
                                                    </Label>
                                                    <select
                                                        id="assignType"
                                                        value={
                                                            newTask.assignType
                                                        }
                                                        onChange={(e) =>
                                                            setNewTask({
                                                                ...newTask,
                                                                assignType: e
                                                                    .target
                                                                    .value as AssignType,
                                                            })
                                                        }
                                                        className="w-full px-3 text-gray-700 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        disabled
                                                    >
                                                        <option
                                                            value={
                                                                AssignType.ALL
                                                            }
                                                        >
                                                            All Groups
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <Label
                                                    htmlFor="summary"
                                                    className="text-gray-900"
                                                >
                                                    Summary
                                                </Label>
                                                <Input
                                                    id="summary"
                                                    value={newTask.summary}
                                                    onChange={(e) =>
                                                        setNewTask({
                                                            ...newTask,
                                                            summary:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Enter task summary (e.g. Vẽ biểu đồ ca sử dụng)"
                                                    className="text-gray-700"
                                                />
                                                {errors.summary && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {errors.summary}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label
                                                    htmlFor="description"
                                                    className="text-gray-900"
                                                >
                                                    Description (Optional)
                                                </Label>
                                                <Textarea
                                                    id="description"
                                                    value={newTask.description}
                                                    onChange={(e) =>
                                                        setNewTask({
                                                            ...newTask,
                                                            description:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Describe what groups need to do"
                                                    rows={4}
                                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                />
                                                {errors.description && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {errors.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Label
                                                            htmlFor="startDate"
                                                            className="text-gray-900"
                                                        >
                                                            Start Date
                                                            (Optional)
                                                        </Label>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        className="text-gray-400 hover:text-gray-600"
                                                                    >
                                                                        <svg
                                                                            className="h-4 w-4"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>
                                                                        Students
                                                                        will
                                                                        receive
                                                                        the task
                                                                        after
                                                                        this
                                                                        date
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <input
                                                        id="startDate"
                                                        type="datetime-local"
                                                        value={
                                                            newTask.startDate
                                                        }
                                                        onChange={(e) => {
                                                            setNewTask({
                                                                ...newTask,
                                                                startDate:
                                                                    e.target
                                                                        .value,
                                                            });
                                                        }}
                                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        lang="en-GB"
                                                    />
                                                    {errors.startDate && (
                                                        <p className="text-red-500 text-sm mt-1">
                                                            {errors.startDate}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label
                                                        htmlFor="endDate"
                                                        className="text-gray-900"
                                                    >
                                                        End Date (Optional)
                                                    </Label>
                                                    <input
                                                        id="endDate"
                                                        type="datetime-local"
                                                        value={newTask.endDate}
                                                        onChange={(e) =>
                                                            setNewTask({
                                                                ...newTask,
                                                                endDate:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        lang="en-GB"
                                                    />
                                                    {errors.endDate && (
                                                        <p className="text-red-500 text-sm mt-1">
                                                            {errors.endDate}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <Label
                                                    htmlFor="attachments"
                                                    className="text-gray-900"
                                                >
                                                    Attachments (Optional)
                                                </Label>
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <input
                                                            id="attachments"
                                                            type="file"
                                                            multiple
                                                            onChange={(e) => {
                                                                const files =
                                                                    Array.from(
                                                                        e.target
                                                                            .files ||
                                                                            []
                                                                    );
                                                                // Add new files to existing ones
                                                                setNewTask({
                                                                    ...newTask,
                                                                    attachments:
                                                                        [
                                                                            ...newTask.attachments,
                                                                            ...files,
                                                                        ],
                                                                });
                                                                // Clear the input value so same file can be selected again
                                                                e.target.value =
                                                                    '';
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <label
                                                            htmlFor="attachments"
                                                            className="flex items-center justify-center h-12 px-4 border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <div className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
                                                                    Choose Files
                                                                </div>
                                                                <span className="text-gray-500">
                                                                    or drag and
                                                                    drop
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>

                                                    {newTask.attachments
                                                        .length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium text-gray-700">
                                                                {
                                                                    newTask
                                                                        .attachments
                                                                        .length
                                                                }{' '}
                                                                file(s)
                                                                selected:
                                                            </p>
                                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                                {newTask.attachments.map(
                                                                    (
                                                                        file,
                                                                        index
                                                                    ) => (
                                                                        <div
                                                                            key={`${file.name}-${index}`}
                                                                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border"
                                                                        >
                                                                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                                                <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                                                <span className="text-sm text-gray-700 truncate">
                                                                                    {
                                                                                        file.name
                                                                                    }
                                                                                </span>
                                                                                <span className="text-xs text-gray-500 flex-shrink-0">
                                                                                    (
                                                                                    {(
                                                                                        file.size /
                                                                                        1024
                                                                                    ).toFixed(
                                                                                        1
                                                                                    )}{' '}
                                                                                    KB)
                                                                                </span>
                                                                            </div>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const updatedFiles =
                                                                                        newTask.attachments.filter(
                                                                                            (
                                                                                                _,
                                                                                                i
                                                                                            ) =>
                                                                                                i !==
                                                                                                index
                                                                                        );
                                                                                    setNewTask(
                                                                                        {
                                                                                            ...newTask,
                                                                                            attachments:
                                                                                                updatedFiles,
                                                                                        }
                                                                                    );
                                                                                }}
                                                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                            >
                                                                                ×
                                                                            </Button>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>

                                                            {newTask.attachments
                                                                .length > 0 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setNewTask(
                                                                            {
                                                                                ...newTask,
                                                                                attachments:
                                                                                    [],
                                                                            }
                                                                        );
                                                                    }}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Clear All
                                                                    Files
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Grade Component Settings */}
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                                    <BarChart3 className="h-5 w-5" />
                                                    Grade Component
                                                </h3>

                                                <div>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                newTask.createGradeComponent
                                                            }
                                                            onChange={(e) =>
                                                                setNewTask({
                                                                    ...newTask,
                                                                    createGradeComponent:
                                                                        e.target
                                                                            .checked,
                                                                })
                                                            }
                                                            className="text-blue-600"
                                                        />
                                                        <span className="text-gray-900">
                                                            Create grade
                                                            component for this
                                                            task
                                                        </span>
                                                    </label>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Automatically create a
                                                        grading component to
                                                        track student
                                                        performance
                                                    </p>
                                                </div>

                                                {newTask.createGradeComponent && (
                                                    <div className="space-y-4 pl-6 border-l-2 border-blue-200 bg-blue-50 p-4 rounded-r-lg">
                                                        <div>
                                                            <Label
                                                                htmlFor="gradeTitle"
                                                                className="text-gray-900 font-medium"
                                                            >
                                                                Grade Component
                                                                Title *
                                                            </Label>
                                                            <Input
                                                                id="gradeTitle"
                                                                value={
                                                                    newTask
                                                                        .gradeComponent
                                                                        ?.title ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleGradeComponentChange(
                                                                        'title',
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Enter grade component title"
                                                                className={`text-gray-900 placeholder-gray-500 ${
                                                                    errors.gradeTitle
                                                                        ? 'border-red-500'
                                                                        : ''
                                                                }`}
                                                            />
                                                            {errors.gradeTitle && (
                                                                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                                    <AlertCircle className="h-4 w-4" />
                                                                    {
                                                                        errors.gradeTitle
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <Label
                                                                htmlFor="gradeDescription"
                                                                className="text-gray-900 font-medium"
                                                            >
                                                                Grade Component
                                                                Description
                                                            </Label>
                                                            <textarea
                                                                id="gradeDescription"
                                                                value={
                                                                    newTask
                                                                        .gradeComponent
                                                                        ?.description ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleGradeComponentChange(
                                                                        'description',
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Enter grade component description (optional)"
                                                                className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label
                                                                htmlFor="gradeMaxScore"
                                                                className="text-gray-900 font-medium"
                                                            >
                                                                Max Score *
                                                            </Label>
                                                            <Input
                                                                id="gradeMaxScore"
                                                                type="number"
                                                                min="1"
                                                                step="0.1"
                                                                value={
                                                                    newTask
                                                                        .gradeComponent
                                                                        ?.maxScore ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleGradeComponentChange(
                                                                        'maxScore',
                                                                        Number.parseFloat(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ) || 0
                                                                    )
                                                                }
                                                                placeholder="Enter maximum score"
                                                                className={`text-gray-900 placeholder-gray-500 ${
                                                                    errors.gradeMaxScore
                                                                        ? 'border-red-500'
                                                                        : ''
                                                                }`}
                                                            />
                                                            {errors.gradeMaxScore && (
                                                                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                                    <AlertCircle className="h-4 w-4" />
                                                                    {
                                                                        errors.gradeMaxScore
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <Label
                                                                htmlFor="gradeScale"
                                                                className="text-gray-900 font-medium"
                                                            >
                                                                Scale *
                                                            </Label>
                                                            <Input
                                                                id="gradeScale"
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={
                                                                    newTask
                                                                        .gradeComponent
                                                                        ?.scale ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleGradeComponentChange(
                                                                        'scale',
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ) || 0
                                                                    )
                                                                }
                                                                placeholder="Enter scale"
                                                                className={`text-gray-900 placeholder-gray-500 ${
                                                                    errors.gradeScale
                                                                        ? 'border-red-500'
                                                                        : ''
                                                                }`}
                                                            />
                                                            {errors.gradeScale && (
                                                                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                                    <AlertCircle className="h-4 w-4" />
                                                                    {
                                                                        errors.gradeScale
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Fixed Footer */}
                                        <div className="flex justify-end space-x-2 p-6 flex-shrink-0 border-t">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsCreateDialogOpen(
                                                        false
                                                    );
                                                    setNewTask({
                                                        assignType:
                                                            AssignType.ALL,
                                                        type: WorkItemType.TASK,
                                                        summary: '',
                                                        description: '',
                                                        startDate: '',
                                                        endDate: '',
                                                        attachments: [],
                                                        createGradeComponent:
                                                            true,
                                                        gradeComponent: {
                                                            title: '',
                                                            description: '',
                                                            maxScore: 10,
                                                            scale: 2,
                                                        },
                                                    });
                                                    setErrors({});
                                                }}
                                                disabled={isCreatingTask}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleCreateTask}
                                                disabled={isCreatingTask}
                                            >
                                                {isCreatingTask ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Creating Task...
                                                    </>
                                                ) : (
                                                    'Create Task'
                                                )}
                                            </Button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </div>

            {/* Tasks Grid */}
            <div className="grid gap-6">
                {tasks.map((task) => (
                    <Card
                        key={task.lecturer_item_id}
                        className="hover:shadow-lg transition-shadow"
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {getTypeIcon(task.lecturer_item_type)}
                                        <CardTitle className="text-xl">
                                            {task.lecturer_item_summary}
                                        </CardTitle>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {task.lecturer_item_type}
                                        </Badge>
                                        {getJobStatusBadge(task.job_status)}
                                    </div>
                                    <p className="text-gray-600">
                                        {task.lecturer_item_description ||
                                            'No description provided'}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                {/* Start Date */}
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm font-medium">
                                            Start Date
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {task.lecturer_item_start_date
                                                ? formatDate(
                                                      task.lecturer_item_start_date,
                                                      'dd/MM/yyyy HH:mm'
                                                  )
                                                : 'Not set'}
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
                                        <div className="text-sm text-gray-600">
                                            {task.lecturer_item_end_date
                                                ? formatDate(
                                                      task.lecturer_item_end_date,
                                                      'dd/MM/yyyy HH:mm'
                                                  )
                                                : 'Not set'}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm font-medium">
                                            Progress
                                        </div>
                                        {task.job_status === 'DONE' ? (
                                            <div className="text-sm text-gray-600">
                                                {task.num_group_done} of{' '}
                                                {task.num_group} groups
                                                submitted
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-600">
                                                Not started
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Publish Status */}
                                <div className="flex items-center space-x-2">
                                    {getJobStatusIcon(task.job_status)}
                                    <div>
                                        <div className="text-sm font-medium">
                                            Publish Status
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(
                                                task.job_scheduled_time,
                                                'dd/MM/yyyy HH:mm'
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar - Always show, 0 progress when not published */}
                            <div className="mb-4">
                                <Progress
                                    value={
                                        task.job_status === 'DONE'
                                            ? (parseInt(task.num_group_done) /
                                                  parseInt(task.num_group)) *
                                              100
                                            : 0
                                    }
                                    className="h-2"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center">
                                <div className="flex space-x-2">
                                    <Link
                                        href={`/lecturer/classes/${classId}/projects/${projectId}/tasks/${task.lecturer_item_id}`}
                                    >
                                        <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Submissions
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setEditingTaskId(
                                                task.lecturer_item_id
                                            );
                                            setIsEditDialogOpen(true);
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                </div>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteClick(task)}
                                    disabled={isDeletingTask}
                                >
                                    {isDeletingTask ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {tasks.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No tasks yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Create your first task to assign work to project groups.
                    </p>
                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        disabled={isCreatingTask}
                    >
                        {isCreatingTask ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating Task...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Task
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Edit Task Modal */}
            <EditTaskModal
                isOpen={isEditDialogOpen}
                onClose={() => {
                    setIsEditDialogOpen(false);
                    setEditingTaskId(null);
                }}
                taskId={editingTaskId || 0}
                jobStatus={
                    tasks.find((t) => t.lecturer_item_id === editingTaskId)
                        ?.job_status || 'PENDING'
                }
                onUpdate={fetchTasks}
            />

            {/* Delete Warning Modal */}
            <WarningModal
                isOpen={isDeleteWarningOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Task"
                description={`Are you sure you want to delete the task "${taskToDelete?.lecturer_item_summary}"? This action cannot be undone and will remove all associated data.`}
                confirmText="Delete Task"
                cancelText="Cancel"
            />
        </div>
    );
}
