'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenuV2 as DropdownMenu,
    DropdownMenuV2Content as DropdownMenuContent,
    // DropdownMenuV2Item as DropdownMenuItem,
    DropdownMenuV2Trigger as DropdownMenuTrigger,
    DropdownMenuV2Separator as DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu-v2';
import {
    User,
    GripVertical,
    Clock,
    AlertCircle,
    CheckCircle2,
    PlayCircle,
    Search,
    X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGroupContext } from '@/context/group-context';
import { toast } from 'react-toastify';
import {
    getGroupBoardData,
    getUserInGroup,
    getSprintNameInGroup,
} from '@/services/api/group';
import { approveWorkItem, updateWorkItem } from '@/services/api/work_items';
import { WorkItemDetailModal } from '@/components/work-item-detail-modal';
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
import type {
    WorkItem,
    WorkItemStatus,
} from '@/services/api/work_items/interface';
import { ApprovalDialog } from '@/components/approval-dialog';
import { GroupMember } from '@/services/api/group/interface';
import { generateInitials, getAvatarColor } from '@/components/avatar';

interface BoardColumn {
    status: WorkItemStatus;
    workItems: WorkItem[];
}

interface SprintData {
    id: number;
    name: string;
    number: number;
    status: string;
}

interface DraggableWorkItemProps {
    workItem: WorkItem;
    onWorkItemClick: (workItem: WorkItem) => void;
}

const DraggableWorkItem = ({
    workItem,
    onWorkItemClick,
}: DraggableWorkItemProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id: workItem.id.toString() });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              opacity: isDragging ? 0.8 : 1,
          }
        : {};

    // Check if this is a lecturer-assigned work item
    const isLecturerAssigned = workItem.parentLecturerWorkItemId != null;

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Epic':
                return {
                    bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
                    text: 'text-white',
                    border: 'border-purple-200',
                    badge: 'bg-purple-100 text-purple-800 border-purple-300',
                };
            case 'Story':
                return {
                    bg: 'bg-gradient-to-r from-green-500 to-green-600',
                    text: 'text-white',
                    border: 'border-green-200',
                    badge: 'bg-green-100 text-green-800 border-green-300',
                };
            case 'Task':
                return {
                    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
                    text: 'text-white',
                    border: 'border-blue-200',
                    badge: 'bg-blue-100 text-blue-800 border-blue-300',
                };
            case 'Subtask':
                return {
                    bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
                    text: 'text-white',
                    border: 'border-orange-200',
                    badge: 'bg-orange-100 text-orange-800 border-orange-300',
                };
            default:
                return {
                    bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
                    text: 'text-white',
                    border: 'border-gray-200',
                    badge: 'bg-gray-100 text-gray-800 border-gray-300',
                };
        }
    };

    const typeColors = getTypeColor(workItem.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group cursor-pointer transform transition-all duration-200 hover:scale-[1.02] ${
                isDragging ? 'z-50 rotate-3 scale-105' : ''
            }`}
            onClick={() => onWorkItemClick(workItem)}
        >
            <Card
                className={`hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:shadow-2xl overflow-hidden ${
                    isLecturerAssigned
                        ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-l-orange-400'
                        : 'bg-white'
                }`}
            >
                {/* Type Header Strip */}
                <div
                    className={`h-1.5 ${
                        isLecturerAssigned
                            ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                            : typeColors.bg
                    }`}
                ></div>

                <CardContent className="p-4 relative">
                    {/* Drag Handle - Positioned absolutely */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 rounded-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-3 pr-8">
                        <div className="flex items-center space-x-2.5 flex-wrap">
                            <Badge
                                variant="outline"
                                className={`text-xs font-medium px-2 py-1 ${typeColors.badge} border-0 shadow-sm`}
                            >
                                {workItem.type}
                            </Badge>
                            <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-semibold">
                                {workItem.key}
                            </span>
                            {isLecturerAssigned && (
                                <Badge
                                    variant="outline"
                                    className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-800 border-orange-200 shadow-sm"
                                    title="This task was assigned by your lecturer and is required for completion"
                                >
                                    <User className="w-3 h-3 mr-1" />
                                    Lecturer
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Epic Label Section - Only show if work item has a parent epic */}
                    {workItem.parentItem &&
                        workItem.parentItem.type === 'Epic' && (
                            <div className="mb-3">
                                <div
                                    className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onWorkItemClick(workItem.parentItem!);
                                    }}
                                    title={`Epic: ${workItem.parentItem.summary}`}
                                >
                                    {/* <span className="mr-1">🎯</span> */}
                                    <span className="font-mono text-xs mr-1">
                                        {workItem.parentItem.key}
                                    </span>
                                    <span className="truncate max-w-[150px]">
                                        {workItem.parentItem.summary}
                                    </span>
                                </div>
                            </div>
                        )}

                    {/* Title Section */}
                    <h3
                        className={`text-sm font-semibold mb-2 leading-relaxed transition-colors line-clamp-2 overflow-hidden ${
                            isLecturerAssigned
                                ? 'text-orange-900 hover:text-orange-700'
                                : 'text-gray-900 hover:text-gray-700'
                        }`}
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {workItem.summary}
                        {isLecturerAssigned && (
                            <span className="text-xs text-orange-600 font-medium ml-2">
                                (Required)
                            </span>
                        )}
                    </h3>

                    {/* Description Section */}
                    {workItem.description && (
                        <p
                            className="text-xs text-gray-600 mb-4 leading-relaxed bg-gray-50 p-2 rounded-md line-clamp-2 overflow-hidden"
                            style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {workItem.description}
                        </p>
                    )}

                    {/* Footer Section */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        {/* Left side - Story Points */}
                        <div className="flex items-center space-x-2">
                            {workItem.storyPoints && (
                                <div className="flex items-center space-x-1">
                                    <Badge
                                        variant="secondary"
                                        className="text-xs bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-0 px-2 py-1 font-medium shadow-sm"
                                    >
                                        <span className="mr-1">⚡</span>
                                        {workItem.storyPoints} SP
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* Right side - Assignee */}
                        <div className="flex items-center">
                            {workItem.assignee?.studentClassroom?.student ? (
                                <div className="flex items-center space-x-2 group/assignee">
                                    <div
                                        className={`w-8 h-8 ${getAvatarColor(
                                            workItem.assignee.studentClassroom
                                                .student.name
                                        )} rounded-full flex items-center justify-center shadow-md ring-2 ring-white transform transition-transform group-hover/assignee:scale-110`}
                                        title={
                                            workItem.assignee.studentClassroom
                                                .student.name
                                        }
                                    >
                                        <span className="text-xs text-white font-bold drop-shadow-sm">
                                            {generateInitials(
                                                workItem.assignee
                                                    .studentClassroom.student
                                                    .name
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-md ring-2 ring-white group/unassigned hover:from-gray-300 hover:to-gray-400 transition-all"
                                    title="Unassigned"
                                >
                                    <User className="h-4 w-4 text-gray-500 group-hover/unassigned:text-gray-600 transition-colors" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Priority/Lecturer Indicator */}
                    <div className="absolute top-3 left-3 space-y-1">
                        {isLecturerAssigned && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        )}
                        {workItem.storyPoints && workItem.storyPoints >= 8 && (
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

interface DroppableColumnProps {
    status: WorkItemStatus;
    children: React.ReactNode;
}

const DroppableColumn = ({ status, children }: DroppableColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({ id: status });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[200px] transition-all duration-300 ease-in-out ${
                isOver
                    ? 'bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 scale-[1.02] shadow-lg rounded-lg'
                    : ''
            }`}
        >
            {children}
        </div>
    );
};

export default function BoardPage() {
    const { groupData, isGroupLeader } = useGroupContext();
    const [boardData, setBoardData] = useState<BoardColumn[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<WorkItem | null>(null);
    const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(
        null
    );
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [selectedItemForApproval, setSelectedItemForApproval] =
        useState<WorkItem | null>(null);

    // Filter states
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [filteredAssignees, setFilteredAssignees] = useState<Set<number>>(
        new Set()
    );
    const [sprints, setSprints] = useState<SprintData[]>([]);
    const [filteredSprints, setFilteredSprints] = useState<Set<number>>(
        new Set()
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Load board data
    useEffect(() => {
        if (groupData) {
            loadBoardData();
        }
    }, [groupData]);

    useEffect(() => {
        if (groupData) {
            loadGroupMembers();
            loadSprints();
        }
    }, [groupData]);

    // Debounce search query
    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
        }

        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setIsSearching(false);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reload board data when debounced search query changes
    useEffect(() => {
        if (groupData && debouncedSearchQuery !== undefined) {
            loadBoardData();
        }
    }, [debouncedSearchQuery]);

    const loadBoardData = async (overrideFilters?: {
        assigneeIds?: Set<number>;
        sprintIds?: Set<number>;
        searchQuery?: string;
    }) => {
        try {
            setLoading(true);
            const filtersToUse =
                overrideFilters?.assigneeIds ?? filteredAssignees;
            const sprintsToUse = overrideFilters?.sprintIds ?? filteredSprints;
            const searchToUse =
                overrideFilters?.searchQuery ?? debouncedSearchQuery;

            const response = await getGroupBoardData(groupData.id, {
                assigneeIds:
                    filtersToUse.size > 0
                        ? Array.from(filtersToUse).join(',')
                        : undefined,
                sprintIds:
                    sprintsToUse.size > 0
                        ? Array.from(sprintsToUse).join(',')
                        : undefined,
                keyword: searchToUse,
            });
            setBoardData(response);
        } catch (error) {
            console.error('Error loading board data:', error);
            toast.error('Failed to load board data');
        } finally {
            setLoading(false);
        }
    };

    const loadGroupMembers = async () => {
        try {
            const response = await getUserInGroup(groupData.id);
            setGroupMembers(response);
        } catch (error) {
            console.error('Error loading group members:', error);
            toast.error('Failed to load group members');
        }
    };

    const loadSprints = async () => {
        try {
            const response = await getSprintNameInGroup(groupData.id, {
                status: 'IN PROGRESS',
            });
            setSprints(response);
        } catch (error) {
            console.error('Error loading sprints:', error);
            toast.error('Failed to load sprints');
        }
    };

    const handleApproval = async (rating: number, comment: string) => {
        if (!selectedItemForApproval) return;

        try {
            await approveWorkItem(selectedItemForApproval.id, rating, comment);
            await loadBoardData();
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
        const draggedWorkItem = boardData
            .flatMap((column) => column.workItems)
            .find((item) => item.id.toString() === active.id);

        setDraggedItem(draggedWorkItem || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const draggedId = active.id as string;
        const newStatus = over.id as WorkItemStatus;

        // Find the current item and its current status
        const currentColumn = boardData.find((column) =>
            column.workItems.some((item) => item.id.toString() === draggedId)
        );

        if (!currentColumn || currentColumn.status === newStatus) return;

        try {
            if (newStatus === 'DONE' && !isGroupLeader) {
                toast.error('Only group leader can approve work items');
                return;
            }
            if (newStatus === 'DONE' && isGroupLeader) {
                setSelectedItemForApproval(draggedItem);
                setShowApprovalDialog(true);
                return;
            }
            await updateWorkItem(parseInt(draggedId), { status: newStatus });

            // Reload the board data
            await loadBoardData();
            toast.success('Work item status updated successfully');
        } catch (error: any) {
            // console.error('Error updating work item:', error);
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to update work item');
            }
        } finally {
            setTimeout(() => {
                setDraggedItem(null);
            }, 1000);
        }
    };

    const getStatusIcon = (status: WorkItemStatus) => {
        switch (status) {
            case 'TO DO':
                return <AlertCircle className="h-5 w-5 text-gray-500" />;
            case 'IN PROGRESS':
                return <PlayCircle className="h-5 w-5 text-blue-500" />;
            case 'WAIT FOR REVIEW':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'DONE':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: WorkItemStatus) => {
        switch (status) {
            case 'TO DO':
                return {
                    border: 'border-t-gray-400',
                    bg: 'bg-gradient-to-r from-gray-50 to-gray-100',
                    text: 'text-gray-700',
                };
            case 'IN PROGRESS':
                return {
                    border: 'border-t-blue-500',
                    bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
                    text: 'text-blue-700',
                };
            case 'WAIT FOR REVIEW':
                return {
                    border: 'border-t-yellow-500',
                    bg: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
                    text: 'text-yellow-700',
                };
            case 'DONE':
                return {
                    border: 'border-t-green-500',
                    bg: 'bg-gradient-to-r from-green-50 to-green-100',
                    text: 'text-green-700',
                };
            default:
                return {
                    border: 'border-t-gray-400',
                    bg: 'bg-gradient-to-r from-gray-50 to-gray-100',
                    text: 'text-gray-700',
                };
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-6 ml-4 px-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading board...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 ml-4 px-6 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">📋</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Project Board
                    </h1>
                </div>
                <div className="ml-11 space-y-2">
                    <p className="text-gray-600 font-medium">
                        Drag and drop work items to update their status
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-white border border-gray-300 rounded shadow-sm"></div>
                            <span>Self-created tasks</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-300 rounded border-l-4 border-l-orange-400"></div>
                            <span>Lecturer-assigned tasks (Required)</span>
                        </div>
                        {/* Task count summary */}
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="mt-6 ml-11 flex items-center space-x-4">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            </div>
                        )}
                        <Input
                            placeholder="Search work items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-700"
                        />
                    </div>

                    {/* Assignee Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center space-x-2 bg-white border-gray-200 hover:bg-gray-50"
                            >
                                <User className="h-4 w-4" />
                                <span>Assignee</span>
                                {filteredAssignees.size > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 bg-blue-100 text-blue-800"
                                    >
                                        {filteredAssignees.size}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 p-2">
                            <div className="space-y-2">
                                <div className="font-medium text-sm text-gray-700 px-2 py-1">
                                    Filter by Assignee
                                </div>
                                <DropdownMenuSeparator />

                                {/* Unassigned Option */}
                                <div className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded">
                                    <Checkbox
                                        id="unassigned"
                                        checked={filteredAssignees.has(0)}
                                        onCheckedChange={(checked) => {
                                            const newFilters = new Set(
                                                filteredAssignees
                                            );
                                            if (checked === true) {
                                                newFilters.add(0);
                                            } else {
                                                newFilters.delete(0);
                                            }
                                            setFilteredAssignees(newFilters);
                                        }}
                                    />
                                    <div className="flex items-center space-x-2 flex-1">
                                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="h-3 w-3 text-gray-400" />
                                        </div>
                                        <span className="text-sm text-gray-700">
                                            Unassigned
                                        </span>
                                    </div>
                                </div>

                                {/* Group Members */}
                                {groupMembers.map((member) => (
                                    <div
                                        key={member.studentProjectId}
                                        className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded"
                                    >
                                        <Checkbox
                                            id={`member-${member.studentProjectId}`}
                                            checked={filteredAssignees.has(
                                                member.studentProjectId
                                            )}
                                            onCheckedChange={(checked) => {
                                                const newFilters = new Set(
                                                    filteredAssignees
                                                );
                                                if (checked === true) {
                                                    newFilters.add(
                                                        member.studentProjectId
                                                    );
                                                } else {
                                                    newFilters.delete(
                                                        member.studentProjectId
                                                    );
                                                }
                                                setFilteredAssignees(
                                                    newFilters
                                                );
                                            }}
                                        />
                                        <div className="flex items-center space-x-2 flex-1">
                                            {member.name ? (
                                                <div className="flex items-center space-x-2 group/assignee">
                                                    <div
                                                        className={`w-8 h-8 ${getAvatarColor(
                                                            member.name
                                                        )} rounded-full flex items-center justify-center shadow-md ring-2 ring-white transform transition-transform group-hover/assignee:scale-110`}
                                                        title={member.name}
                                                    >
                                                        <span className="text-xs text-white font-bold drop-shadow-sm">
                                                            {generateInitials(
                                                                member.name
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-md ring-2 ring-white group/unassigned hover:from-gray-300 hover:to-gray-400 transition-all"
                                                    title="No name"
                                                >
                                                    <User className="h-4 w-4 text-gray-500 group-hover/unassigned:text-gray-600 transition-colors" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {member.name}
                                                </div>
                                                <div
                                                    className="text-xs text-gray-500 truncate block w-full"
                                                    title={member.email}
                                                    style={{
                                                        maxWidth: '150px',
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {member.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Clear Filters */}
                                {filteredAssignees.size > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <div className="flex items-center space-x-2 px-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 justify-center text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                                                onClick={() => {
                                                    // Apply the filters (reload board data)
                                                    loadBoardData();
                                                }}
                                            >
                                                Apply Filter
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 justify-center text-gray-600 hover:text-gray-900"
                                                onClick={() => {
                                                    // Clear filters and reload with empty filters
                                                    loadBoardData({
                                                        assigneeIds: new Set(),
                                                        searchQuery:
                                                            debouncedSearchQuery,
                                                    });
                                                    setFilteredAssignees(
                                                        new Set()
                                                    );
                                                }}
                                            >
                                                <X className="h-3 w-3 mr-1" />
                                                Clear
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Additional Filter Button */}

                    {/* Sprint Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center space-x-2 bg-white border-gray-200 hover:bg-gray-50"
                            >
                                <span>🏃</span>
                                <span>Sprint</span>
                                {filteredSprints.size > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 bg-green-100 text-green-800"
                                    >
                                        {filteredSprints.size}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 p-2">
                            <div className="space-y-2">
                                <div className="font-medium text-sm text-gray-700 px-2 py-1">
                                    Filter by Sprint
                                </div>
                                <DropdownMenuSeparator />

                                {/* Sprint Options */}
                                {sprints.map((sprint) => (
                                    <div
                                        key={sprint.id}
                                        className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded"
                                    >
                                        <Checkbox
                                            id={`sprint-${sprint.id}`}
                                            checked={filteredSprints.has(
                                                sprint.id
                                            )}
                                            onCheckedChange={(checked) => {
                                                const newFilters = new Set(
                                                    filteredSprints
                                                );
                                                if (checked === true) {
                                                    newFilters.add(sprint.id);
                                                } else {
                                                    newFilters.delete(
                                                        sprint.id
                                                    );
                                                }
                                                setFilteredSprints(newFilters);
                                            }}
                                        />
                                        <div className="flex items-center space-x-2 flex-1">
                                            {/* <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                                <span className="text-xs text-white font-bold">
                                                    S{sprint.number}
                                                </span>
                                            </div> */}
                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {sprint.name ??
                                                        `SPRINT ${sprint.number}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {sprints.length === 0 && (
                                    <div className="text-center py-4 text-gray-400">
                                        <p className="text-sm">
                                            No active sprints
                                        </p>
                                    </div>
                                )}

                                {/* Apply and Clear Filters */}
                                {filteredSprints.size > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <div className="flex items-center space-x-2 px-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 justify-center text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                                                onClick={() => {
                                                    loadBoardData();
                                                }}
                                            >
                                                Apply Filter
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 justify-center text-gray-600 hover:text-gray-900"
                                                onClick={() => {
                                                    loadBoardData({
                                                        assigneeIds:
                                                            filteredAssignees,
                                                        sprintIds: new Set(),
                                                        searchQuery:
                                                            debouncedSearchQuery,
                                                    });
                                                    setFilteredSprints(
                                                        new Set()
                                                    );
                                                }}
                                            >
                                                <X className="h-3 w-3 mr-1" />
                                                Clear
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Board Columns */}
                <div className="grid grid-cols-4 gap-6">
                    {boardData.map((column) => {
                        const statusColors = getStatusColor(column.status);

                        return (
                            <div key={column.status} className="flex flex-col">
                                {/* Column Header */}
                                <Card
                                    className={`border-t-4 ${statusColors.border} mb-4 shadow-lg hover:shadow-xl transition-shadow duration-200`}
                                >
                                    <CardHeader
                                        className={`pb-3 ${statusColors.bg} rounded-t-lg`}
                                    >
                                        <CardTitle
                                            className={`flex items-center justify-between text-sm font-bold ${statusColors.text}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                {getStatusIcon(column.status)}
                                                <span className="text-base">
                                                    {column.status}
                                                </span>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className={`text-xs px-3 py-1 ${statusColors.text} bg-white/20 backdrop-blur-sm border-0 font-semibold shadow-sm`}
                                            >
                                                {column.workItems.length}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                </Card>

                                {/* Droppable Column */}
                                <DroppableColumn status={column.status}>
                                    <div className="space-y-4 min-h-[500px] p-2 rounded-lg border-2 border-dashed border-gray-200 transition-all duration-200">
                                        {column.workItems.map((workItem) => (
                                            <DraggableWorkItem
                                                key={workItem.id}
                                                workItem={workItem}
                                                onWorkItemClick={
                                                    setSelectedWorkItem
                                                }
                                            />
                                        ))}
                                        {column.workItems.length === 0 && (
                                            <div className="text-center py-12 text-gray-400">
                                                <div className="flex flex-col items-center space-y-2">
                                                    {getStatusIcon(
                                                        column.status
                                                    )}
                                                    <p className="text-sm font-medium">
                                                        No items
                                                    </p>
                                                    <p className="text-xs">
                                                        Drag items here
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </DroppableColumn>
                            </div>
                        );
                    })}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeId && draggedItem ? (
                        <div className="rotate-3 scale-105">
                            <DraggableWorkItem
                                workItem={draggedItem}
                                onWorkItemClick={setSelectedWorkItem}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {selectedWorkItem && (
                <WorkItemDetailModal
                    isOpen={!!selectedWorkItem}
                    onClose={() => setSelectedWorkItem(null)}
                    workItemId={selectedWorkItem.id}
                    onUpdate={loadBoardData}
                    isGroupLeader={isGroupLeader}
                    onOpenSubtask={(subtaskId) => {
                        setSelectedWorkItem({ id: subtaskId } as WorkItem);
                    }}
                />
            )}
            <ApprovalDialog
                isOpen={showApprovalDialog}
                onClose={() => {
                    setShowApprovalDialog(false);
                    setSelectedItemForApproval(null);
                }}
                onSubmit={handleApproval}
                workItem={selectedItemForApproval as WorkItem}
            />
        </div>
    );
}
