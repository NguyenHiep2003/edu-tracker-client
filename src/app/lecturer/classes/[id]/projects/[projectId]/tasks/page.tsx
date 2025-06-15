'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import {
    Plus,
    Calendar,
    Clock,
    Users,
    FileText,
    Eye,
    Edit3,
    Trash2,
} from 'lucide-react';
import { useProjectContext } from '@/context/project-context';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { createLecturerWorkItem } from '@/services/api/work_items';

interface Task {
    id: number;
    summary: string;
    description?: string;
    type: 'Task' | 'Story';
    startDate?: string;
    endDate?: string;
    createdAt: string;
    status: 'active' | 'completed' | 'overdue';
    totalGroups: number;
    submittedGroups: number;
    attachments?: string[];
}

enum AssignType {
    ALL = 'ALL',
    SPECIFIC = 'SPECIFIC',
}

enum WorkItemType {
    TASK = 'Task',
    STORY = 'Story',
}

// Mock data - replace with your API calls
const mockTasks: Task[] = [
    {
        id: 1,
        summary: 'Vẽ biểu đồ ca sử dụng',
        description:
            'Submit your project proposal with detailed timeline and objectives',
        type: 'Task',
        startDate: '2024-12-10T10:00:00',
        endDate: '2024-12-15T23:59:00',
        createdAt: '2024-11-20T10:00:00',
        status: 'active',
        totalGroups: 8,
        submittedGroups: 3,
        attachments: ['requirements.pdf'],
    },
    {
        id: 2,
        summary: 'Literature Review',
        description:
            'Conduct and submit a comprehensive literature review for your project topic',
        type: 'Story',
        startDate: '2024-12-15T09:00:00',
        endDate: '2024-12-22T23:59:00',
        createdAt: '2024-11-21T14:30:00',
        status: 'active',
        totalGroups: 8,
        submittedGroups: 1,
    },
];

export default function TasksPage() {
    const {} = useProjectContext();
    const params = useParams();
    const classId = params.id as string;
    const projectId = params.projectId as string;

    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        assignType: AssignType.ALL,
        type: WorkItemType.TASK,
        summary: '',
        description: '',
        startDate: '',
        endDate: '',
        attachments: [] as File[],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDaysUntilDue = (endDate: string) => {
        const due = new Date(endDate);
        const now = new Date();
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusBadge = (task: Task) => {
        if (!task.endDate) {
            return (
                <Badge className="bg-blue-100 text-blue-800">No Due Date</Badge>
            );
        }

        const daysLeft = getDaysUntilDue(task.endDate);

        if (daysLeft < 0) {
            return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
        } else if (daysLeft <= 3) {
            return (
                <Badge className="bg-yellow-100 text-yellow-800">
                    Due Soon
                </Badge>
            );
        } else {
            return (
                <Badge className="bg-green-100 text-green-800">Active</Badge>
            );
        }
    };

    const getProgressBadge = (submitted: number, total: number) => {
        const percentage = (submitted / total) * 100;

        if (percentage === 100) {
            return (
                <Badge className="bg-green-100 text-green-800">Complete</Badge>
            );
        } else if (percentage >= 50) {
            return (
                <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
            );
        } else {
            return <Badge className="bg-gray-100 text-gray-800">Started</Badge>;
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
           
            await createLecturerWorkItem(Number(projectId), newTask);
            const mockNewTask: Task = {
                id: Date.now(),
                summary: newTask.summary,
                description: newTask.description,
                type: newTask.type,
                startDate: newTask.startDate || undefined,
                endDate: newTask.endDate || undefined,
                createdAt: new Date().toISOString(),
                status: 'active',
                totalGroups: 8, // You'll get this from your API
                submittedGroups: 0,
                attachments: newTask.attachments.map((file) => file.name),
            };

            setTasks([...tasks, mockNewTask]);
            setNewTask({
                assignType: AssignType.ALL,
                type: WorkItemType.TASK,
                summary: '',
                description: '',
                startDate: '',
                endDate: '',
                attachments: [],
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
        }
    };

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
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                </Button>

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
                                    <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium leading-6 text-gray-900 mb-4"
                                        >
                                            Create New Task
                                        </Dialog.Title>
                                        <div className="space-y-4">
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
                                                    <Label
                                                        htmlFor="startDate"
                                                        className="text-gray-900"
                                                    >
                                                        Start Date (Optional)
                                                    </Label>
                                                    <input
                                                        id="startDate"
                                                        type="datetime-local"
                                                        value={
                                                            newTask.startDate
                                                        }
                                                        onChange={(e) =>
                                                            setNewTask({
                                                                ...newTask,
                                                                startDate:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
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
                                                    <Input
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
                                                                attachments: [
                                                                    ...newTask.attachments,
                                                                    ...files,
                                                                ],
                                                            });
                                                            // Clear the input value so same file can be selected again
                                                            e.target.value = '';
                                                        }}
                                                        className="h-12 flex items-center text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer file:transition-colors"
                                                    />

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

                                            <div className="flex justify-end space-x-2 pt-4">
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
                                                        });
                                                        setErrors({});
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleCreateTask}
                                                >
                                                    Create Task
                                                </Button>
                                            </div>
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
                        key={task.id}
                        className="hover:shadow-lg transition-shadow"
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CardTitle className="text-xl">
                                            {task.summary}
                                        </CardTitle>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {task.type}
                                        </Badge>
                                        {getStatusBadge(task)}
                                        {getProgressBadge(
                                            task.submittedGroups,
                                            task.totalGroups
                                        )}
                                    </div>
                                    <p className="text-gray-600">
                                        {task.description ||
                                            'No description provided'}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {/* End Date */}
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm font-medium">
                                            End Date
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {task.endDate
                                                ? formatDate(task.endDate)
                                                : 'No end date'}
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
                                        <div className="text-sm text-gray-600">
                                            {task.submittedGroups} of{' '}
                                            {task.totalGroups} groups
                                        </div>
                                    </div>
                                </div>

                                {/* Created */}
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm font-medium">
                                            Created
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(task.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Submission Progress</span>
                                    <span>
                                        {Math.round(
                                            (task.submittedGroups /
                                                task.totalGroups) *
                                                100
                                        )}
                                        %
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{
                                            width: `${
                                                (task.submittedGroups /
                                                    task.totalGroups) *
                                                100
                                            }%`,
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center">
                                <div className="flex space-x-2">
                                    <Link
                                        href={`/lecturer/classes/${classId}/projects/${projectId}/tasks/${task.id}`}
                                    >
                                        <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Submissions
                                        </Button>
                                    </Link>
                                    <Button variant="outline" size="sm">
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                </div>

                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
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
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Task
                    </Button>
                </div>
            )}
        </div>
    );
}
