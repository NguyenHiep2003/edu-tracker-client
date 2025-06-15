'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenuV2 as DropdownMenu,
    DropdownMenuV2Content as DropdownMenuContent,
    DropdownMenuV2Item as DropdownMenuItem,
    DropdownMenuV2Trigger as DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu-v2';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Plus,
    // Search,
    ChevronDown,
    ChevronRight,
    MoreHorizontal,
    User,
    Settings,
    Play,
    CheckCircle,
    GripVertical,
    Flag,
} from 'lucide-react';
import { useState, useEffect, Fragment } from 'react';
import {
    CreateWorkItemModal,
    type CreateWorkItemData,
    type WorkItemType,
} from '@/components/create-work-item-modal';
import { useGroupContext } from '@/context/group-context';
import { toast } from 'react-toastify';
import { createWorkItems, getBacklogData } from '@/services/api/group';
import { createSprint, Sprint } from '@/services/api/group/sprint';
import { WorkItemDetailModal } from '@/components/work-item-detail-modal';
import type {
    WorkItem,
    WorkItemStatus,
} from '@/services/api/work_items/interface';
import {
    approveWorkItem,
    deleteWorkItem,
    updateWorkItem,
} from '@/services/api/work_items';

import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import { ApprovalDialog } from '@/components/approval-dialog';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { Label } from '@/components/ui/label';
import {
    completeSprint,
    deleteSprint,
    updateSprint,
} from '@/services/api/sprint';
import { getTypeIcon } from '@/helper/get-type-icon';
import { CompleteSprintModal } from '@/components/complete-sprint-modal';
import { WarningModal } from '@/components/warning-modal';
import { formatDistanceToNow } from 'date-fns';

// Sortable Item Component
interface SortableItemProps {
    id: string;
    item: WorkItem;
    selectedItems: Set<number>;
    toggleItemSelection: (id: number) => void;
    setSelectedWorkItem: (item: WorkItem) => void;
    getTypeIcon: (type: WorkItemType) => React.ReactNode;
    getStatusColor: (status: WorkItemStatus) => string;
    getAvailableStatuses: () => WorkItemStatus[];
    StatusMenuItem: React.ComponentType<{
        status: WorkItemStatus;
        itemId: number;
        workItem: WorkItem;
    }>;
    generateInitials: (name: string) => string;
    getAvatarColor: (name: string) => string;
    formatDate: (date: string) => string;
    setSelectedWorkItemToDelete: (item: WorkItem) => void;
    setShowWarningDeleteWorkItemModal: (value: boolean) => void;
}

function DraggableItem({
    id,
    item,
    selectedItems,
    toggleItemSelection,
    setSelectedWorkItem,
    getTypeIcon,
    getStatusColor,
    getAvailableStatuses,
    StatusMenuItem,
    generateInitials,
    getAvatarColor,
    formatDate,
    setSelectedWorkItemToDelete,
    setShowWarningDeleteWorkItemModal,
}: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              opacity: isDragging ? 0.5 : 1,
          }
        : {};

    const handleEpicClick = (e: React.MouseEvent, epic: any) => {
        e.stopPropagation();
        setSelectedWorkItem({ id: epic.id } as WorkItem);
    };

    // Check if this is a lecturer-assigned work item
    const isLecturerAssigned = item.parentLecturerWorkItemId != null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center space-x-3 p-3 rounded-md border ${
                isDragging
                    ? 'border-blue-300 bg-blue-50 shadow-lg'
                    : isLecturerAssigned
                    ? 'border-orange-200 bg-orange-50 hover:border-orange-300 hover:bg-orange-100'
                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
            } transition-colors ${
                isLecturerAssigned ? 'border-l-4 border-l-orange-400' : ''
            }`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
            >
                <GripVertical className="h-4 w-4" />
            </div>

            <div
                className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => setSelectedWorkItem(item)}
            >
                <Checkbox
                    checked={selectedItems.has(item.id as number)}
                    onCheckedChange={() =>
                        toggleItemSelection(item.id as number)
                    }
                    className="translate-y-[1px]"
                    onClick={(e) => e.stopPropagation()}
                />

                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 min-w-[120px]">
                        {getTypeIcon(item.type as WorkItemType)}
                        <span className="text-sm font-mono text-blue-600">
                            {item.key}
                        </span>
                        {isLecturerAssigned && (
                            <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                title="This task was assigned by your lecturer and is required for completion"
                            >
                                <User className="w-3 h-3 mr-1" />
                                Lecturer
                            </span>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Epic Information */}
                        {item.parentItem && (
                            <div
                                className="flex items-center space-x-2 mb-1 cursor-pointer hover:bg-purple-50 rounded-sm p-1 -ml-1 transition-colors"
                                onClick={(e) =>
                                    handleEpicClick(e, item.parentItem)
                                }
                                title={`Click to view epic: ${item.parentItem.summary}`}
                            >
                                <div className="w-4 h-4 bg-purple-500 rounded-sm flex items-center justify-center">
                                    {getTypeIcon(
                                        item.parentItem.type as WorkItemType
                                    )}
                                </div>
                                <span className="text-xs font-mono text-purple-600 font-medium">
                                    {item.parentItem.key}
                                </span>
                                <span className="text-xs text-purple-700 truncate max-w-[200px]">
                                    {item.parentItem.summary}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <span
                                className={`text-sm truncate ${
                                    isLecturerAssigned
                                        ? 'text-orange-900 font-medium'
                                        : 'text-gray-900'
                                }`}
                            >
                                {item.summary}
                            </span>
                            {item.storyPoints && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    {item.storyPoints}
                                </span>
                            )}
                            {isLecturerAssigned && (
                                <span className="text-xs text-orange-600 font-medium">
                                    (Required)
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <span>Created {formatDate(item.createdAt)}</span>
                            {item.updatedAt !== item.createdAt && (
                                <span>
                                    • Updated {formatDate(item.updatedAt)}
                                </span>
                            )}
                            {item.numOfSubItems > 0 && (
                                <span>
                                    • {item.numOfSubItems}{' '}
                                    {item.numOfSubItems === 1
                                        ? 'sub-task'
                                        : 'sub-tasks'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    className="flex items-center space-x-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                variant="outline"
                                className={getStatusColor(
                                    item.status as WorkItemStatus
                                )}
                            >
                                {item.status}{' '}
                                <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {getAvailableStatuses().map((status) => (
                                <StatusMenuItem
                                    key={status}
                                    status={status}
                                    itemId={item.id as number}
                                    workItem={item as WorkItem}
                                />
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center">
                        {item.assignee?.studentClassroom?.student ? (
                            <div
                                className={`w-8 h-8 ${getAvatarColor(
                                    item.assignee.studentClassroom.student.name
                                )} rounded-full flex items-center justify-center`}
                                title={
                                    item.assignee.studentClassroom.student.name
                                }
                            >
                                <span className="text-white text-xs font-medium">
                                    {generateInitials(
                                        item.assignee.studentClassroom.student
                                            .name
                                    )}
                                </span>
                            </div>
                        ) : (
                            <div
                                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                                title="Unassigned"
                            >
                                <User className="h-4 w-4 text-gray-400" />
                            </div>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Move to sprint</DropdownMenuItem> */}
                            {!isLecturerAssigned ? (
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        setSelectedWorkItemToDelete(item);
                                        setShowWarningDeleteWorkItemModal(true);
                                    }}
                                >
                                    Delete
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    className="text-gray-400 cursor-not-allowed"
                                    disabled
                                >
                                    <div className="flex items-center space-x-2">
                                        <span>Delete</span>
                                        <span className="text-xs">
                                            (Lecturer-assigned)
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

// Add a DroppableContainer component
interface DroppableContainerProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

function DroppableContainer({
    id,
    children,
    className,
}: DroppableContainerProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${
                isOver ? 'bg-blue-50 border-blue-300' : ''
            } transition-colors duration-200`}
        >
            {children}
        </div>
    );
}

interface StartSprintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        name?: string;
        startDate: string;
        endDate: string;
    }) => void;
    sprint: Sprint;
}

const StartSprintModal = ({
    isOpen,
    onClose,
    onSubmit,
    sprint,
}: StartSprintModalProps) => {
    const [sprintName, setSprintName] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');

    // Get current date and one week later
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const startDate = now.toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
    const defaultEndDate = oneWeekLater.toISOString().split('T')[0]; // One week later

    useEffect(() => {
        if (isOpen) {
            setSprintName(sprint.name || '');
            setEndDate(defaultEndDate);
            setError('');
        }
    }, [isOpen, sprint.name, defaultEndDate]);

    const handleSubmit = () => {
        if (!endDate) {
            setError('End date is required');
            return;
        }

        const selectedEndDate = new Date(endDate);
        const selectedStartDate = new Date(startDate);

        if (selectedEndDate <= selectedStartDate) {
            setError('End date must be after start date');
            return;
        }

        onSubmit({
            name: sprintName.trim() || undefined,
            startDate,
            endDate,
        });
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <HeadlessDialog
                as="div"
                className="relative z-50"
                onClose={onClose}
            >
                <Transition.Child
                    as={Fragment}
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
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <HeadlessDialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Start Sprint: {sprint.name}
                                </HeadlessDialog.Title>

                                <div className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">
                                            Sprint Name (optional)
                                        </Label>
                                        <Input
                                            value={sprintName}
                                            onChange={(e) =>
                                                setSprintName(e.target.value)
                                            }
                                            placeholder="Enter sprint name..."
                                            className="w-full bg-white text-black"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700">
                                            Start Date
                                        </Label>
                                        <Input
                                            value={startDate}
                                            type="date"
                                            disabled
                                            className="w-full bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Start date is set to today and
                                            cannot be changed
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700">
                                            End Date
                                        </Label>
                                        <Input
                                            value={endDate}
                                            onChange={(e) =>
                                                setEndDate(e.target.value)
                                            }
                                            type="date"
                                            min={startDate}
                                            className="w-full bg-white text-black"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Default is one week from start date
                                        </p>
                                    </div>

                                    {error && (
                                        <p className="text-sm text-red-500">
                                            {error}
                                        </p>
                                    )}

                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                        <p className="text-sm text-blue-800">
                                            <strong>Sprint Summary:</strong>
                                        </p>
                                        <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                                            <li>
                                                {sprint.workItems?.length || 0}{' '}
                                                work items will be included
                                            </li>
                                            <li>
                                                Duration:{' '}
                                                {Math.ceil(
                                                    (new Date(
                                                        endDate
                                                    ).getTime() -
                                                        new Date(
                                                            startDate
                                                        ).getTime()) /
                                                        (1000 * 60 * 60 * 24)
                                                )}{' '}
                                                days
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSubmit}>
                                        Start Sprint
                                    </Button>
                                </div>
                            </HeadlessDialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </HeadlessDialog>
        </Transition>
    );
};

interface EditSprintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        name?: string;
        startDate?: string;
        endDate?: string;
    }) => void;
    sprint: Sprint;
}

const EditSprintModal = ({
    isOpen,
    onClose,
    onSubmit,
    sprint,
}: EditSprintModalProps) => {
    const [sprintName, setSprintName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSprintName(sprint.name || '');

            // Format dates to YYYY-MM-DD for HTML date inputs
            const formatDateForInput = (dateString?: string) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            setStartDate(formatDateForInput(sprint.startDate));
            setEndDate(formatDateForInput(sprint.endDate));
            setError('');
        }
    }, [isOpen, sprint.name, sprint.startDate, sprint.endDate]);

    const handleSubmit = () => {
        // Validate that end date is after start date if both are provided
        if (startDate && endDate) {
            const selectedEndDate = new Date(endDate);
            const selectedStartDate = new Date(startDate);

            if (selectedEndDate <= selectedStartDate) {
                setError('End date must be after start date');
                return;
            }
        }

        onSubmit({
            name: sprintName.trim() || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        });
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <HeadlessDialog
                as="div"
                className="relative z-50"
                onClose={onClose}
            >
                <Transition.Child
                    as={Fragment}
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
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <HeadlessDialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Edit Sprint: {sprint.name}
                                </HeadlessDialog.Title>

                                <div className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">
                                            Sprint Name
                                        </Label>
                                        <Input
                                            value={sprintName}
                                            onChange={(e) =>
                                                setSprintName(e.target.value)
                                            }
                                            placeholder="Enter sprint name..."
                                            className="w-full bg-white text-black"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700">
                                            Start Date (optional)
                                        </Label>
                                        <Input
                                            value={startDate}
                                            onChange={(e) =>
                                                setStartDate(e.target.value)
                                            }
                                            type="date"
                                            className="w-full bg-white text-black"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Leave empty if no specific start
                                            date
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700">
                                            End Date (optional)
                                        </Label>
                                        <Input
                                            value={endDate}
                                            onChange={(e) =>
                                                setEndDate(e.target.value)
                                            }
                                            type="date"
                                            min={startDate || undefined}
                                            className="w-full bg-white text-black"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Leave empty if no specific end date
                                        </p>
                                    </div>

                                    {error && (
                                        <p className="text-sm text-red-500">
                                            {error}
                                        </p>
                                    )}

                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                        <p className="text-sm text-blue-800">
                                            <strong>Sprint Summary:</strong>
                                        </p>
                                        <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                                            <li>
                                                {sprint.workItems?.length || 0}{' '}
                                                work items in this sprint
                                            </li>
                                            <li>Status: {sprint.status}</li>
                                            {startDate && endDate && (
                                                <li>
                                                    Duration:{' '}
                                                    {Math.ceil(
                                                        (new Date(
                                                            endDate
                                                        ).getTime() -
                                                            new Date(
                                                                startDate
                                                            ).getTime()) /
                                                            (1000 *
                                                                60 *
                                                                60 *
                                                                24)
                                                    )}{' '}
                                                    days
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSubmit}>
                                        Save Changes
                                    </Button>
                                </div>
                            </HeadlessDialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </HeadlessDialog>
        </Transition>
    );
};

export default function ProgressManagement() {
    const { groupData, isGroupLeader } = useGroupContext();
    // const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sprints, setSprints] = useState<Partial<Sprint>[]>([]);
    const [backlogItems, setBacklogItems] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingSprintLoading, setCreatingSprintLoading] = useState(false);
    const [expandedSprints, setExpandedSprints] = useState<Set<number>>(
        new Set([1])
    ); // Sprint 1 expanded by default
    const [expandedBacklog, setExpandedBacklog] = useState(true);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(
        null
    );
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [selectedItemForApproval, setSelectedItemForApproval] =
        useState<WorkItem | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<WorkItem | null>(null);
    const [showStartSprintModal, setShowStartSprintModal] = useState(false);
    const [selectedSprintToStart, setSelectedSprintToStart] =
        useState<Sprint | null>(null);
    const [showEditSprintModal, setShowEditSprintModal] = useState(false);
    const [selectedSprintToEdit, setSelectedSprintToEdit] =
        useState<Sprint | null>(null);
    const [showCompleteSprintModal, setShowCompleteSprintModal] =
        useState(false);
    const [selectedSprintToComplete, setSelectedSprintToComplete] =
        useState<Sprint | null>(null);
    const [showWarningDeleteSprintModal, setShowWarningDeleteSprintModal] =
        useState(false);
    const [selectedSprintToDelete, setSelectedSprintToDelete] =
        useState<Sprint | null>(null);
    const [showWarningDeleteWorkItemModal, setShowWarningDeleteWorkItemModal] =
        useState(false);
    const [selectedWorkItemToDelete, setSelectedWorkItemToDelete] =
        useState<WorkItem | null>(null);
    // Load data
    useEffect(() => {
        if (groupData) loadData();
    }, [groupData]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Call your actual API - replace with your actual API function
            const response: { sprints: Sprint[]; backlogs: WorkItem[] } =
                await getBacklogData(groupData.id);

            // Process sprints data
            const processedSprints: Partial<Sprint>[] = response.sprints.map(
                (sprint) =>
                    ({
                        id: sprint.id,
                        name: sprint.name || 'SPRINT ' + sprint.number, // Handle both "name" and "number" fields
                        status: sprint.status,
                        startDate: sprint.startDate,
                        endDate: sprint.endDate,
                        workItems: sprint.workItems.map((item) => ({
                            id: item.id,
                            key: item.key || `WI-${item.id}`,
                            type: item.type,
                            summary: item.summary,
                            description: item.description,
                            status: item.status,
                            assignee: item.assignee,
                            reporter: {
                                id: item.reporter?.id,
                                name:
                                    item.reporter?.name || item.reporter?.email,
                                email: item.reporter?.email,
                            },
                            sprintId: item.sprintId,
                            startDate: item.startDate,
                            endDate: item.endDate,
                            createdAt: item.createdAt,
                            updatedAt: item.updatedAt,
                            storyPoints: item.storyPoints,
                            numOfSubItems: item.numOfSubItems,
                            parentItem: item.parentItem,
                            parentLecturerWorkItemId:
                                item.parentLecturerWorkItemId,
                        })),
                    } as Partial<Sprint>)
            );

            // Process backlog data
            const processedBacklog: Partial<WorkItem>[] = response.backlogs.map(
                (item: any) => ({
                    id: item.id,
                    key: item.key || `WI-${item.id}`,
                    type: item.type,
                    summary: item.summary,
                    description: item.description,
                    status: item.status,
                    assignee: item.assignee,
                    sprintId: item.sprintId,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    storyPoints: item.storyPoints,
                    numOfSubItems: item.numOfSubItems,
                    parentItem: item.parentItem,
                    parentLecturerWorkItemId: item.parentLecturerWorkItemId,
                })
            );

            setSprints(processedSprints);
            setBacklogItems(processedBacklog as WorkItem[]);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load backlog data');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to generate initials

    const handleCreateWorkItem = async (data: CreateWorkItemData) => {
        try {
            await createWorkItems(Number(groupData.id), data);
            await loadData();
            toast.success(`${data.type} created successfully`);
        } catch (error: any) {
            console.error('Error creating work item:', error);
            throw new Error(error.message || 'Failed to create work item');
        }
    };

    const toggleSprint = (sprintId: number) => {
        const newExpanded = new Set(expandedSprints);
        if (newExpanded.has(sprintId)) {
            newExpanded.delete(sprintId);
        } else {
            newExpanded.add(sprintId);
        }
        setExpandedSprints(newExpanded);
    };

    const toggleItemSelection = (itemId: number) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const handleStatusChange = async (
        itemId: number,
        newStatus: WorkItemStatus,
        workItem: WorkItem
    ) => {
        if (workItem?.status === newStatus) {
            return;
        }

        try {
            if (newStatus === 'DONE' && isGroupLeader) {
                setSelectedItemForApproval(workItem);
                setShowApprovalDialog(true);
                return;
            }

            await updateWorkItem(itemId, { status: newStatus });
            await loadData();
            toast.success('Status updated successfully');
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
    };

    const handleApproval = async (rating: number, comment: string) => {
        if (!selectedItemForApproval) return;

        try {
            await approveWorkItem(selectedItemForApproval.id, rating, comment);
            await loadData();
            toast.success('Work item approved successfully');
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        } finally {
            setSelectedItemForApproval(null);
        }
    };

    const handleStartSprint = async (data: {
        name?: string;
        startDate: string;
        endDate: string;
    }) => {
        if (!selectedSprintToStart) return;

        try {
            await updateSprint(selectedSprintToStart.id, {
                ...data,
                status: 'IN PROGRESS',
            });

            toast.success('Sprint started successfully');

            // Reset modal state first
            setShowStartSprintModal(false);
            setSelectedSprintToStart(null);

            // Then reload data
            await loadData();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to start sprint');
            }
        }
    };

    const handleEditSprint = async (data: {
        name?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        if (!selectedSprintToEdit) return;

        try {
            await updateSprint(selectedSprintToEdit.id, data);

            toast.success('Sprint updated successfully');

            // Reset modal state first
            setShowEditSprintModal(false);
            setSelectedSprintToEdit(null);

            // Then reload data
            await loadData();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to update sprint');
            }
        }
    };

    const handleCompleteSprint = async (data: {
        moveToBacklog?: boolean;
        moveToSprintId?: number;
    }) => {
        if (!selectedSprintToComplete) return;
        console.log('🚀 ~ ProgressManagement ~ data:', data);

        try {
            // Move incomplete tasks if specified
            if (data.moveToBacklog) {
                await completeSprint(selectedSprintToComplete.id, 0);
            } else if (data.moveToSprintId) {
                await completeSprint(
                    selectedSprintToComplete.id,
                    data.moveToSprintId
                );
            }

            toast.success('Sprint completed successfully');

            // Reset modal state first
            setShowCompleteSprintModal(false);
            setSelectedSprintToComplete(null);

            // Then reload data
            await loadData();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to complete sprint');
            }
        }
    };
    const handleDeleteSprint = async (sprintId: number) => {
        try {
            await deleteSprint(sprintId);
            await loadData();
            toast.success('Sprint deleted successfully');
            setShowWarningDeleteSprintModal(false);
            setSelectedSprintToDelete(null);
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
    };

    const handleDeleteWorkItem = async (workItemId: number) => {
        try {
            await deleteWorkItem(workItemId);
            await loadData();
            toast.success('Work item deleted successfully');
            setShowWarningDeleteWorkItemModal(false);
            setSelectedWorkItemToDelete(null);
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
    };

    const getAvailableStatuses = (): WorkItemStatus[] => {
        if (isGroupLeader) {
            return ['TO DO', 'IN PROGRESS', 'WAIT FOR REVIEW', 'DONE'];
        }
        return ['TO DO', 'IN PROGRESS', 'WAIT FOR REVIEW'];
    };

    const getStatusColor = (status: WorkItemStatus) => {
        switch (status) {
            case 'TO DO':
                return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300';
            case 'IN PROGRESS':
                return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300';
            case 'WAIT FOR REVIEW':
                return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300';
            case 'DONE':
                return 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300';
            default:
                return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300';
        }
    };

    const formatDate = (date: string) => {
        if (!date) return '';
        return formatDistanceToNow(new Date(date), { addSuffix: true });
    };

    const getSprintStatusCounts = (sprint: Sprint) => {
        const todo = sprint.workItems.filter(
            (item) => item.status === 'TO DO'
        ).length;
        const inProgress = sprint.workItems.filter(
            (item) => item.status === 'IN PROGRESS'
        ).length;
        const done = 0; // Add when you have "DONE" status
        const lecturerAssigned = sprint.workItems.filter(
            (item) => item.parentLecturerWorkItemId != null
        ).length;
        return { todo, inProgress, done, lecturerAssigned };
    };

    const generateInitials = (name: string): string => {
        if (!name) return '?';
        return name
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    };

    const getAvatarColor = (name: string): string => {
        const colors = [
            'bg-gradient-to-br from-blue-400 to-blue-600',
            'bg-gradient-to-br from-green-400 to-green-600',
            'bg-gradient-to-br from-purple-400 to-purple-600',
            'bg-gradient-to-br from-yellow-400 to-yellow-600',
            'bg-gradient-to-br from-pink-400 to-pink-600',
            'bg-gradient-to-br from-indigo-400 to-indigo-600',
            'bg-gradient-to-br from-red-400 to-red-600',
            'bg-gradient-to-br from-teal-400 to-teal-600',
        ];
        if (!name) return colors[0];
        const index = name
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    const StatusMenuItem = ({
        status,
        itemId,
        workItem,
    }: {
        status: WorkItemStatus;
        itemId: number;
        workItem: WorkItem;
    }) => (
        <DropdownMenuItem
            className={`${getStatusColor(status)} w-full justify-between`}
            onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(itemId, status, workItem);
            }}
        >
            {status}
        </DropdownMenuItem>
    );

    // Drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px of movement before drag starts
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);

        // Find the dragged item
        const sprintItem = sprints
            .flatMap((sprint) => sprint.workItems || [])
            .find((item) => item.id?.toString() === active.id);
        const backlogItem = backlogItems.find(
            (item) => item.id?.toString() === active.id
        );

        setDraggedItem((sprintItem || backlogItem) as WorkItem);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setDraggedItem(null);

        if (!over) return;

        const draggedId = active.id as string;
        const containerId = over.id as string;

        // If dropped on the same container, do nothing for now
        if (draggedId === containerId) return;

        try {
            setLoading(true);
            const workItemId = parseInt(draggedId);
            let newSprintId: number | null = null;

            // Determine the new sprint ID based on container
            if (containerId !== 'backlog') {
                newSprintId = parseInt(containerId);
            }

            await updateWorkItem(workItemId, {
                sprintId: newSprintId?.toString() ?? null,
            });

            await loadData();
            // toast.success('Work item moved successfully');
        } catch (error: any) {
            console.error('Error moving work item:', error);
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to move work item');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading backlog...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-4 ml-4 px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Backlog
                    </h1>
                    <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
                            <span>Self-created tasks</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-orange-200 border border-orange-300 rounded border-l-4 border-l-orange-400"></div>
                            <span>Lecturer-assigned tasks (Required)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-xs border border-orange-200">
                                👨‍🏫 2
                            </span>
                            <span>Lecturer-assigned count</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters
            <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search backlog"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            Epic <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>All Epics</DropdownMenuItem>
                        <DropdownMenuItem>
                            User Management Epic
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            Project Management Epic
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            Type <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>All Types</DropdownMenuItem>
                        <DropdownMenuItem>Epic</DropdownMenuItem>
                        <DropdownMenuItem>Story</DropdownMenuItem>
                        <DropdownMenuItem>Task</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div> */}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Sprints */}
                <div className="space-y-4">
                    {sprints.map((sprint) => {
                        const isExpanded = expandedSprints.has(
                            sprint.id as number
                        );
                        const statusCounts = getSprintStatusCounts(
                            sprint as Sprint
                        );

                        return (
                            <Card
                                key={sprint.id}
                                className="border border-gray-200"
                            >
                                {/* Sprint Header */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                    onClick={() =>
                                        toggleSprint(sprint.id as number)
                                    }
                                >
                                    <div className="flex items-center space-x-3">
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-500" />
                                        )}

                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-900">
                                                {sprint.name}
                                            </span>

                                            {/* Sprint Status Badge */}
                                            {sprint.status === 'INACTIVE' && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                                                    Not Started
                                                </span>
                                            )}
                                            {sprint.status ===
                                                'IN PROGRESS' && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                                                    In Progress
                                                </span>
                                            )}
                                            {sprint.status === 'COMPLETED' && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Completed
                                                </span>
                                            )}

                                            {sprint.startDate &&
                                                sprint.endDate && (
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(
                                                            sprint.startDate
                                                        )}{' '}
                                                        –{' '}
                                                        {formatDate(
                                                            sprint.endDate
                                                        )}
                                                    </span>
                                                )}
                                            <span className="text-sm text-gray-500">
                                                (
                                                {sprint?.workItems?.length || 0}{' '}
                                                work items)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        {/* Status Counts */}
                                        <div className="flex items-center space-x-2 text-sm">
                                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                                {statusCounts.todo}
                                            </span>
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                {statusCounts.inProgress}
                                            </span>
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                                {statusCounts.done}
                                            </span>
                                            {/* {statusCounts.lecturerAssigned >
                                                0 && (
                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs border border-orange-200">
                                                    👨‍🏫{' '}
                                                    {
                                                        statusCounts.lecturerAssigned
                                                    }
                                                </span>
                                            )} */}
                                        </div>

                                        {/* Sprint Actions */}
                                        {sprint.status === 'IN PROGRESS' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setSelectedSprintToComplete(
                                                        sprint as Sprint
                                                    );
                                                    setShowCompleteSprintModal(
                                                        true
                                                    );
                                                }}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Complete sprint
                                            </Button>
                                        )}
                                        {sprint.status === 'INACTIVE' &&
                                            sprint.workItems &&
                                            sprint.workItems.length > 0 && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedSprintToStart(
                                                            sprint as Sprint
                                                        );
                                                        setShowStartSprintModal(
                                                            true
                                                        );
                                                    }}
                                                >
                                                    <Play className="h-4 w-4 mr-1" />
                                                    Start sprint
                                                </Button>
                                            )}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSprintToEdit(
                                                            sprint as Sprint
                                                        );
                                                        setShowEditSprintModal(
                                                            true
                                                        );
                                                    }}
                                                >
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Edit sprint
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSprintToDelete(
                                                            sprint as Sprint
                                                        );
                                                        setShowWarningDeleteSprintModal(
                                                            true
                                                        );
                                                    }}
                                                >
                                                    Delete sprint
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Sprint Content */}
                                {isExpanded && (
                                    <CardContent className="pt-0 pb-4">
                                        <DroppableContainer
                                            id={sprint.id?.toString() || ''}
                                        >
                                            <div
                                                className="space-y-2 min-h-[60px] p-2 rounded border-2 border-dashed border-gray-200"
                                                style={{ minHeight: '60px' }}
                                            >
                                                {sprint?.workItems?.map(
                                                    (item) => (
                                                        <DraggableItem
                                                            key={item.id}
                                                            id={
                                                                item.id?.toString() ||
                                                                ''
                                                            }
                                                            item={
                                                                item as WorkItem
                                                            }
                                                            selectedItems={
                                                                selectedItems
                                                            }
                                                            toggleItemSelection={
                                                                toggleItemSelection
                                                            }
                                                            setSelectedWorkItem={
                                                                setSelectedWorkItem
                                                            }
                                                            getTypeIcon={
                                                                getTypeIcon
                                                            }
                                                            getStatusColor={
                                                                getStatusColor
                                                            }
                                                            getAvailableStatuses={
                                                                getAvailableStatuses
                                                            }
                                                            StatusMenuItem={
                                                                StatusMenuItem
                                                            }
                                                            generateInitials={
                                                                generateInitials
                                                            }
                                                            getAvatarColor={
                                                                getAvatarColor
                                                            }
                                                            formatDate={
                                                                formatDate
                                                            }
                                                            setSelectedWorkItemToDelete={
                                                                setSelectedWorkItemToDelete
                                                            }
                                                            setShowWarningDeleteWorkItemModal={
                                                                setShowWarningDeleteWorkItemModal
                                                            }
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </DroppableContainer>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}

                    {/* Backlog Section */}
                    <Card className="border border-gray-200">
                        <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedBacklog(!expandedBacklog)}
                        >
                            <div className="flex items-center space-x-3">
                                {expandedBacklog ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}

                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">
                                        Backlog
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        ({backlogItems.length} work items)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                        {
                                            backlogItems.filter(
                                                (item) =>
                                                    item.status === 'TO DO'
                                            ).length
                                        }
                                    </span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                        {
                                            backlogItems.filter(
                                                (item) =>
                                                    item.status ===
                                                    'IN PROGRESS'
                                            ).length
                                        }
                                    </span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                        0
                                    </span>
                                    {/* {backlogItems.filter(
                                        (item) =>
                                            item.parentLecturerWorkItemId !=
                                            null
                                    ).length > 0 && (
                                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs border border-orange-200">
                                            👨‍🏫{' '}
                                            {
                                                backlogItems.filter(
                                                    (item) =>
                                                        item.parentLecturerWorkItemId !=
                                                        null
                                                ).length
                                            }
                                        </span>
                                    )} */}
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={creatingSprintLoading}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            setCreatingSprintLoading(true);
                                            await createSprint(groupData.id);
                                            await loadData();
                                        } catch (error) {
                                            console.error(
                                                'Error creating sprint:',
                                                error
                                            );
                                            toast.error(
                                                'Failed to create sprint'
                                            );
                                        } finally {
                                            setCreatingSprintLoading(false);
                                        }
                                    }}
                                >
                                    {creatingSprintLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create sprint'
                                    )}
                                </Button>
                            </div>
                        </div>

                        {expandedBacklog && (
                            <CardContent className="pt-0 pb-4">
                                <DroppableContainer id="backlog">
                                    <div className="space-y-2 min-h-[60px] p-2 rounded border-2 border-dashed border-gray-200">
                                        {backlogItems.map((item) => (
                                            <DraggableItem
                                                key={item.id}
                                                id={item.id?.toString() || ''}
                                                item={item}
                                                selectedItems={selectedItems}
                                                toggleItemSelection={
                                                    toggleItemSelection
                                                }
                                                setSelectedWorkItem={
                                                    setSelectedWorkItem
                                                }
                                                getTypeIcon={getTypeIcon}
                                                getStatusColor={getStatusColor}
                                                getAvailableStatuses={
                                                    getAvailableStatuses
                                                }
                                                StatusMenuItem={StatusMenuItem}
                                                generateInitials={
                                                    generateInitials
                                                }
                                                getAvatarColor={getAvatarColor}
                                                formatDate={formatDate}
                                                setSelectedWorkItemToDelete={
                                                    setSelectedWorkItemToDelete
                                                }
                                                setShowWarningDeleteWorkItemModal={
                                                    setShowWarningDeleteWorkItemModal
                                                }
                                            />
                                        ))}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start text-gray-600 hover:text-gray-900"
                                            onClick={() =>
                                                setShowCreateModal(true)
                                            }
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create
                                        </Button>
                                    </div>
                                </DroppableContainer>
                            </CardContent>
                        )}
                    </Card>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeId && draggedItem ? (
                        <div
                            className={`flex items-center space-x-3 p-3 rounded-md border shadow-lg opacity-90 ${
                                draggedItem.parentLecturerWorkItemId != null
                                    ? 'border-orange-300 bg-orange-50 border-l-4 border-l-orange-400'
                                    : 'border-blue-300 bg-blue-50'
                            }`}
                        >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <div className="flex flex-col space-y-1">
                                {/* Epic Information in Drag Overlay */}
                                {draggedItem.parentItem && (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-purple-500 rounded-sm flex items-center justify-center">
                                            <Flag className="w-2.5 h-2.5 text-white" />
                                        </div>
                                        <span className="text-xs font-mono text-purple-600 font-medium">
                                            {draggedItem.parentItem.key}
                                        </span>
                                        <span className="text-xs text-purple-700 truncate">
                                            {draggedItem.parentItem.summary}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    {getTypeIcon(
                                        draggedItem.type as WorkItemType
                                    )}
                                    <span className="text-sm font-mono text-blue-600">
                                        {draggedItem.key}
                                    </span>
                                    {draggedItem.parentLecturerWorkItemId !=
                                        null && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                            <User className="w-3 h-3 mr-1" />
                                            Lecturer
                                        </span>
                                    )}
                                    <span className="text-sm text-gray-900">
                                        {draggedItem.summary}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Work Item Detail Modal */}
            {selectedWorkItem && (
                <WorkItemDetailModal
                    isOpen={!!selectedWorkItem}
                    onClose={() => setSelectedWorkItem(null)}
                    workItemId={selectedWorkItem.id}
                    onUpdate={() => {
                        // Refresh the data
                        loadData();
                    }}
                    isGroupLeader={isGroupLeader}
                    onOpenSubtask={(subtaskId) => {
                        // Here you would:
                        // 1. Update your state to show the new work item
                        setSelectedWorkItem({ id: subtaskId } as WorkItem);
                        // 2. Open the modal again
                    }}
                />
            )}

            {/* Create Work Item Modal */}
            <CreateWorkItemModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateWorkItem}
            />

            {/* Add the ApprovalDialog */}
            <ApprovalDialog
                isOpen={showApprovalDialog}
                onClose={() => {
                    setShowApprovalDialog(false);
                    setSelectedItemForApproval(null);
                }}
                onSubmit={handleApproval}
                workItem={selectedItemForApproval as WorkItem}
            />

            {/* Start Sprint Modal */}
            {selectedSprintToStart && (
                <StartSprintModal
                    isOpen={showStartSprintModal}
                    onClose={() => {
                        setShowStartSprintModal(false);
                        setSelectedSprintToStart(null);
                    }}
                    onSubmit={handleStartSprint}
                    sprint={selectedSprintToStart}
                />
            )}

            {/* Edit Sprint Modal */}
            {selectedSprintToEdit && (
                <EditSprintModal
                    isOpen={showEditSprintModal}
                    onClose={() => {
                        setShowEditSprintModal(false);
                        setSelectedSprintToEdit(null);
                    }}
                    onSubmit={handleEditSprint}
                    sprint={selectedSprintToEdit}
                />
            )}

            {/* Complete Sprint Modal */}
            {selectedSprintToComplete && (
                <CompleteSprintModal
                    isOpen={showCompleteSprintModal}
                    onClose={() => {
                        setShowCompleteSprintModal(false);
                        setSelectedSprintToComplete(null);
                    }}
                    onSubmit={handleCompleteSprint}
                    sprint={selectedSprintToComplete}
                    availableSprints={
                        sprints.filter((s) => s.id !== undefined) as Sprint[]
                    }
                />
            )}
            <WarningModal
                isOpen={showWarningDeleteSprintModal}
                onClose={() => setShowWarningDeleteSprintModal(false)}
                onConfirm={() => {
                    console.log('delete sprint', selectedSprintToDelete);
                    if (selectedSprintToDelete) {
                        handleDeleteSprint(selectedSprintToDelete.id);
                    }
                }}
                title={`Delete ${
                    selectedSprintToDelete?.name ??
                    `SPRINT ${selectedSprintToDelete?.number}`
                }`}
                description="Are you sure you want to delete this sprint? All task will be moved to backlog."
            />
            <WarningModal
                isOpen={showWarningDeleteWorkItemModal}
                onClose={() => setShowWarningDeleteWorkItemModal(false)}
                onConfirm={() => {
                    if (selectedWorkItemToDelete) {
                        handleDeleteWorkItem(selectedWorkItemToDelete.id);
                    }
                }}
                title={`Delete work item ${selectedWorkItemToDelete?.key} ${selectedWorkItemToDelete?.summary}`}
                description="Are you sure you want to delete this work item and all its subtasks? This action cannot be undone."
            />
        </div>
    );
}
