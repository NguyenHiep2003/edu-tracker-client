'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useGroupContext } from '@/context/group-context';
import { toast } from 'react-toastify';
import { X, Upload, File, Trash2 } from 'lucide-react';
import {
    getEpicInGroup,
    getSprintNameInGroup,
    getUserInGroup,
} from '@/services/api/group';
import { useProfile } from '@/context/profile-context';
import type { WorkItemStatus } from '@/services/api/work_items/interface';
import { generateInitials, getAvatarColor } from './avatar';

export type WorkItemType = 'Epic' | 'Story' | 'Task' | 'Subtask';

interface GroupMember {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    studentProjectId: string;
}

interface Epic {
    key: string;
    id: number;
    summary: string;
    description?: string;
}

interface Sprint {
    id: number;
    key: string;
    name: string;
    number: number;
    status: 'active' | 'future' | 'completed';
    startDate?: string;
    endDate?: string;
}

export interface CreateWorkItemData {
    type: WorkItemType;
    summary: string;
    description?: string;
    status: WorkItemStatus;
    assigneeId?: number;
    reporterId?: number;
    parentItemId?: number;
    sprintId?: number;
    startDate?: string;
    endDate?: string;
    attachments?: File[];
    storyPoints?: number;
}

interface CreateWorkItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateWorkItemData) => Promise<void>;
    defaultType?: WorkItemType;
}

export function CreateWorkItemModal({
    isOpen,
    onClose,
    onSubmit,
    defaultType = 'Task',
}: CreateWorkItemModalProps) {
    const { groupData } = useGroupContext();
    const [loading, setLoading] = useState(false);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [epics, setEpics] = useState<Epic[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const { profile } = useProfile();
    const [dataLoaded, setDataLoaded] = useState(false);

    // Close any open select when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[role="combobox"]')) {
                // Close all selects when clicking outside
                const openSelects = document.querySelectorAll(
                    '[data-state="open"]'
                );
                openSelects.forEach((select) => {
                    const button = select.querySelector('button');
                    if (button) button.click();
                });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Form state
    const [formData, setFormData] = useState<CreateWorkItemData>({
        type: defaultType,
        summary: '',
        description: '',
        status: 'TO DO',
        assigneeId: undefined,
        reporterId: undefined,
        parentItemId: undefined,
        sprintId: undefined,
        startDate: undefined,
        endDate: undefined,
        attachments: [],
        storyPoints: undefined,
    });

    // Load data when modal opens
    useEffect(() => {
        if (isOpen && groupData && !dataLoaded) {
            loadModalData();
        }
    }, [isOpen, groupData]);

    // Reset form when modal opens, but preserve the type selection
    useEffect(() => {
        if (isOpen && !dataLoaded) {
            resetForm();
        }
    }, [isOpen, dataLoaded]);

    const loadModalData = async () => {
        try {
            setLoading(true);
            let data;
            if (groupData) {
                data = await getUserInGroup(groupData?.id);
            }

            const members =
                data?.map((user: any) => ({
                    id: user?.id,
                    name: user?.name || user?.email,
                    email: user?.email,
                    avatar: user?.name?.charAt(0).toUpperCase(),
                    studentProjectId:
                        user?.studentProjectId || user?.id?.toString(),
                })) || [];

            setGroupMembers(members);

            // Load epics
            const epicsData = await getEpicInGroup(groupData?.id);
            setEpics(epicsData || []);

            // Load sprints
            const sprintsData = await getSprintNameInGroup(groupData?.id, {
                status: 'INACTIVE,IN PROGRESS',
            });
            setSprints(sprintsData || []);

            // Set current user as reporter after data is loaded
            setFormData((prev) => ({
                ...prev,
                reporterId: profile?.id,
            }));

            setDataLoaded(true);
        } catch (error) {
            console.error('Error loading modal data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            type: defaultType,
            summary: '',
            description: '',
            status: 'TO DO',
            assigneeId: undefined,
            reporterId: profile?.id,
            parentItemId: undefined,
            sprintId: undefined,
            startDate: undefined,
            endDate: undefined,
            attachments: [],
            storyPoints: undefined,
        });
    };

    // Reset data loaded state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setDataLoaded(false);
            setGroupMembers([]);
            setEpics([]);
            setSprints([]);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.summary.trim()) {
            toast.error('Summary is required');
            return;
        }

        if (!formData.reporterId) {
            toast.error('Reporter is required');
            return;
        }

        try {
            console.log(formData);
            setLoading(true);
            await onSubmit(formData);
            onClose();
        } catch (error: any) {
            console.error('Error creating work item:', error);
            toast.error(error.message || 'Failed to create work item');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setFormData((prev) => ({
            ...prev,
            attachments: [...(prev.attachments || []), ...files],
        }));
    };

    const removeFile = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            attachments: prev.attachments?.filter((_, i) => i !== index) || [],
        }));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
            ' ' +
            sizes[i]
        );
    };

    const canHaveParent = formData.type === 'Story' || formData.type === 'Task';
    const canHaveSprint = formData.type === 'Story' || formData.type === 'Task';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                            Create Work Item
                        </h3>
                        {formData.type && (
                            <Badge
                                className={
                                    formData.type === 'Epic'
                                        ? 'bg-purple-100 text-purple-800'
                                        : formData.type === 'Story'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                }
                            >
                                {formData.type}
                            </Badge>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Main Info Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Left Column - Essential Info */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Work Item Type */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="type"
                                        className="text-sm font-semibold text-gray-900"
                                    >
                                        Work Item Type *
                                    </Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: string) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                type: value as WorkItemType,
                                                parentItemId:
                                                    value === 'Epic'
                                                        ? undefined
                                                        : prev.parentItemId,
                                                sprintId:
                                                    value === 'Epic'
                                                        ? undefined
                                                        : prev.sprintId,
                                            }));
                                        }}
                                        name="type-select"
                                    >
                                        <SelectTrigger className="w-full text-gray-900">
                                            <SelectValue
                                                placeholder={defaultType}
                                                colorMap={{
                                                    Epic: 'bg-purple-100 text-purple-800',
                                                    Story: 'bg-green-100 text-green-800',
                                                    Task: 'bg-blue-100 text-blue-800',
                                                }}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem
                                                value="Epic"
                                                showAfterPick="Epic"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Badge className="bg-purple-100 text-purple-800 font-medium">
                                                        Epic
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                            <SelectItem
                                                value="Story"
                                                showAfterPick="Story"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Badge className="bg-green-100 text-green-800 font-medium">
                                                        Story
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                            <SelectItem
                                                value="Task"
                                                showAfterPick="Task"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Badge className="bg-blue-100 text-blue-800 font-medium">
                                                        Task
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Summary */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="summary"
                                        className="text-sm font-semibold text-gray-900"
                                    >
                                        Summary *
                                    </Label>
                                    <Input
                                        id="summary"
                                        value={formData.summary}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                summary: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter a brief summary of the work item"
                                        className="w-full text-gray-900 placeholder:text-gray-500"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="description"
                                        className="text-sm font-semibold text-gray-900"
                                    >
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        placeholder="Provide a detailed description of the work item"
                                        className="min-h-[150px] text-gray-900 placeholder:text-gray-500 bg-white"
                                        rows={6}
                                    />
                                </div>

                                {/* Story Points */}
                                {formData.type !== 'Epic' && (
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="storyPoints"
                                            className="text-sm font-semibold text-gray-900"
                                        >
                                            Story Points
                                        </Label>
                                        <Input
                                            id="storyPoints"
                                            type="number"
                                            min={0}
                                            max={100}
                                            className="w-full text-gray-900"
                                            value={formData.storyPoints || ''}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                    ? parseInt(e.target.value)
                                                    : undefined;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    storyPoints: value,
                                                }));
                                            }}
                                            placeholder="Enter story points"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Optional: Estimate the complexity
                                            (0-100)
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Details */}
                            <div className="space-y-6">
                                {/* Status */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="status"
                                        className="text-sm font-semibold text-gray-900"
                                    >
                                        Status
                                    </Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: string) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                status: value as WorkItemStatus,
                                            }));
                                        }}
                                        name="status-select"
                                    >
                                        <SelectTrigger className="w-full text-gray-900">
                                            <SelectValue
                                                placeholder={'TO DO'}
                                                colorMap={{
                                                    'TO DO':
                                                        'bg-gray-200 text-gray-900',
                                                    'IN PROGRESS':
                                                        'bg-blue-100 text-blue-800',
                                                }}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem
                                                value="TO DO"
                                                showAfterPick="TO DO"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Badge className="bg-gray-200 text-gray-900 font-medium">
                                                        TO DO
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                            <SelectItem
                                                value="IN PROGRESS"
                                                showAfterPick="IN PROGRESS"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Badge className="bg-blue-100 text-blue-800 font-medium">
                                                        IN PROGRESS
                                                    </Badge>
                                                    <span className="text-sm text-gray-900"></span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Assignee */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="assignee"
                                        className="text-sm font-semibold text-gray-900"
                                    >
                                        Assignee
                                    </Label>
                                    <Select
                                        value={
                                            formData.assigneeId?.toString() ||
                                            ''
                                        }
                                        onValueChange={(value) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                assigneeId:
                                                    value && value !== '0'
                                                        ? Number.parseInt(value)
                                                        : undefined,
                                            }));
                                        }}
                                        name="assignee-select"
                                    >
                                        <SelectTrigger className="w-full text-gray-900">
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-700">
                                                        Unassigned
                                                    </span>
                                                </div>
                                            </SelectItem>
                                            {groupMembers.map((member) => (
                                                <SelectItem
                                                    key={
                                                        member.studentProjectId
                                                    }
                                                    value={
                                                        member.studentProjectId
                                                    }
                                                    showAfterPick={member.name}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <div
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-gray-900 ${getAvatarColor(
                                                                member.name
                                                            )}`}
                                                        >
                                                            {generateInitials(
                                                                member.name
                                                            )}
                                                        </div>
                                                        <span className="text-gray-900">
                                                            {member.name}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Parent Epic */}
                                {canHaveParent && (
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="parentItem"
                                            className="text-sm font-semibold text-gray-900"
                                        >
                                            Parent Epic
                                        </Label>
                                        <Select
                                            value={
                                                formData.parentItemId?.toString() ||
                                                ''
                                            }
                                            onValueChange={(value) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    parentItemId:
                                                        value && value !== '0'
                                                            ? Number.parseInt(
                                                                  value
                                                              )
                                                            : undefined,
                                                }));
                                            }}
                                            name="parent-select"
                                        >
                                            <SelectTrigger className="w-full text-gray-900">
                                                <SelectValue placeholder="Select parent epic" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {epics?.length === 0 ? (
                                                    <div className="relative px-2 py-1.5 text-sm text-gray-500 cursor-not-allowed bg-gray-50">
                                                        No epics available
                                                    </div>
                                                ) : (
                                                    <>
                                                        <SelectItem
                                                            value="0"
                                                            showAfterPick="Select parent epic"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-gray-700">
                                                                    No epic
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                        {epics.map((epic) => (
                                                            <SelectItem
                                                                key={epic.id}
                                                                value={epic.id.toString()}
                                                                showAfterPick={`${epic.key} - ${epic.summary}`}
                                                            >
                                                                <div className="flex items-center space-x-2">
                                                                    <Badge className="bg-purple-100 text-purple-800 font-medium">
                                                                        Epic
                                                                    </Badge>
                                                                    <span className="text-gray-900 truncate">
                                                                        {
                                                                            epic.summary
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Sprint */}
                                {canHaveSprint && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="sprint"
                                                className="text-sm font-semibold text-gray-900"
                                            >
                                                Sprint
                                            </Label>
                                            {/* <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCreateSprint}
                                                disabled={creatingNewSprint}
                                                className="h-7 px-2"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                {creatingNewSprint
                                                    ? 'Creating...'
                                                    : 'New Sprint'}
                                            </Button> */}
                                        </div>
                                        <Select
                                            value={
                                                formData.sprintId?.toString() ||
                                                ''
                                            }
                                            onValueChange={(value) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    sprintId:
                                                        value && value !== '0'
                                                            ? Number.parseInt(
                                                                  value
                                                              )
                                                            : undefined,
                                                }));
                                            }}
                                            name="sprint-select"
                                        >
                                            <SelectTrigger className="w-full text-gray-900">
                                                <SelectValue placeholder="Select sprint" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sprints.length === 0 ? (
                                                    <div className="relative px-2 py-1.5 text-sm text-gray-500 cursor-not-allowed bg-gray-50">
                                                        No sprints available
                                                    </div>
                                                ) : (
                                                    <>
                                                        <SelectItem
                                                            value="0"
                                                            showAfterPick="Select sprint"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-gray-700">
                                                                    No sprint
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                        {sprints.map(
                                                            (sprint) => (
                                                                <SelectItem
                                                                    key={
                                                                        sprint.id
                                                                    }
                                                                    value={sprint.id.toString()}
                                                                    showAfterPick={`${
                                                                        sprint.name ||
                                                                        `SPRINT ${sprint.number}`
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <span className="text-gray-900">
                                                                            {sprint.name ||
                                                                                `SPRINT ${sprint.number}`}
                                                                        </span>
                                                                        <Badge
                                                                            className={
                                                                                sprint.status ===
                                                                                'active'
                                                                                    ? 'bg-green-100 text-green-800 font-medium'
                                                                                    : sprint.status ===
                                                                                      'future'
                                                                                    ? 'bg-blue-100 text-blue-800 font-medium'
                                                                                    : 'bg-gray-100 text-gray-800 font-medium'
                                                                            }
                                                                        >
                                                                            {
                                                                                sprint.status
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Dates */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="startDate"
                                            className="text-sm font-semibold text-gray-900"
                                        >
                                            Start Date
                                        </Label>
                                        <input
                                            type="datetime-local"
                                            value={
                                                formData?.startDate
                                                    ? (() => {
                                                          const date = new Date(
                                                              formData.startDate
                                                          );
                                                          // Convert to local timezone for datetime-local input
                                                          const offset =
                                                              date.getTimezoneOffset();
                                                          const localISOTime =
                                                              new Date(
                                                                  date.getTime() -
                                                                      offset *
                                                                          60 *
                                                                          1000
                                                              ).toISOString();
                                                          return localISOTime.slice(
                                                              0,
                                                              16
                                                          );
                                                      })()
                                                    : ''
                                            }
                                            onChange={(e) => {
                                                if (!e.target.value) {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        startDate: undefined,
                                                    }));
                                                    return;
                                                }

                                                // Convert from local datetime-local to UTC
                                                const localDate = new Date(
                                                    e.target.value
                                                );
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    startDate:
                                                        localDate.toISOString(),
                                                }));
                                            }}
                                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="endDate"
                                            className="text-sm font-semibold text-gray-900"
                                        >
                                            End Date
                                        </Label>
                                        <input
                                            type="datetime-local"
                                            value={
                                                formData?.endDate
                                                    ? (() => {
                                                          const date = new Date(
                                                              formData.endDate
                                                          );
                                                          // Convert to local timezone for datetime-local input
                                                          const offset =
                                                              date.getTimezoneOffset();
                                                          const localISOTime =
                                                              new Date(
                                                                  date.getTime() -
                                                                      offset *
                                                                          60 *
                                                                          1000
                                                              ).toISOString();
                                                          return localISOTime.slice(
                                                              0,
                                                              16
                                                          );
                                                      })()
                                                    : ''
                                            }
                                            onChange={(e) => {
                                                if (!e.target.value) {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        endDate: undefined,
                                                    }));
                                                    return;
                                                }

                                                // Convert from local datetime-local to UTC
                                                const localDate = new Date(
                                                    e.target.value
                                                );

                                                // Validate that end date is not before start date
                                                if (
                                                    formData?.startDate &&
                                                    localDate <
                                                        new Date(
                                                            formData.startDate
                                                        )
                                                ) {
                                                    return; // Don't update if end date is before start date
                                                }

                                                setFormData((prev) => ({
                                                    ...prev,
                                                    endDate:
                                                        localDate.toISOString(),
                                                }));
                                            }}
                                            min={
                                                formData?.startDate
                                                    ? (() => {
                                                          const date = new Date(
                                                              formData.startDate
                                                          );
                                                          const offset =
                                                              date.getTimezoneOffset();
                                                          const localISOTime =
                                                              new Date(
                                                                  date.getTime() -
                                                                      offset *
                                                                          60 *
                                                                          1000
                                                              ).toISOString();
                                                          return localISOTime.slice(
                                                              0,
                                                              16
                                                          );
                                                      })()
                                                    : undefined
                                            }
                                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div className="space-y-4 border-t pt-6 mt-6">
                            <Label
                                htmlFor="attachments"
                                className="text-sm font-medium text-gray-900"
                            >
                                Attachments
                            </Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                                <div className="text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-4">
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer"
                                        >
                                            <span className="text-blue-600 hover:text-blue-500 font-medium">
                                                Choose files
                                            </span>
                                            <span className="text-gray-500">
                                                {' '}
                                                or drag and drop
                                            </span>
                                        </label>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileChange}
                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        PDF, DOC, TXT, Images, ZIP up to 10MB
                                        each
                                    </p>
                                </div>
                            </div>

                            {/* Selected Files List */}
                            {formData.attachments &&
                                formData.attachments.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-gray-700">
                                            Selected Files (
                                            {formData.attachments.length})
                                        </p>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {formData.attachments.map(
                                                (file, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                                    >
                                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                            <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {file.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {formatFileSize(
                                                                        file.size
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeFile(
                                                                    index
                                                                )
                                                            }
                                                            className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                                className="min-w-[100px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="min-w-[100px]"
                            >
                                {loading ? 'Creating...' : 'Create Item'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
