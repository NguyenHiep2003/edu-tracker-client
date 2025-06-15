'use client';

import { useState, useEffect, useCallback } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    User,
    Search,
    X,
    Clock,
    AlertCircle,
    CheckCircle2,
    PlayCircle,
    Filter,
    List,
    Target,
    // Calendar,
} from 'lucide-react';
import { useGroupContext } from '@/context/group-context';
import { toast } from 'react-toastify';
import {
    getGroupWorkItemsList,
    getUserInGroup,
    getSprintNameInGroup,
} from '@/services/api/group';
import { WorkItemDetailModal } from '@/components/work-item-detail-modal';
import type {
    WorkItem,
    WorkItemStatus,
} from '@/services/api/work_items/interface';
import { GroupMember } from '@/services/api/group/interface';
import { generateInitials, getAvatarColor } from '@/components/avatar';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getTypeIcon } from '@/helper/get-type-icon';
import { formatDate } from '@/helper/date-formatter';

const getStatusIcon = (status: WorkItemStatus) => {
    switch (status) {
        case 'TO DO':
            return <AlertCircle className="h-4 w-4 text-gray-500" />;
        case 'IN PROGRESS':
            return <PlayCircle className="h-4 w-4 text-blue-500" />;
        case 'WAIT FOR REVIEW':
            return <Clock className="h-4 w-4 text-yellow-500" />;
        case 'DONE':
            return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        default:
            return null;
    }
};

const getStatusBadgeColor = (status: WorkItemStatus) => {
    switch (status) {
        case 'TO DO':
            return 'bg-gray-100 text-gray-800 border-gray-300';
        case 'IN PROGRESS':
            return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'WAIT FOR REVIEW':
            return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'DONE':
            return 'bg-green-100 text-green-800 border-green-300';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

// const getTypeIcon = (type: string) => {
//     switch (type) {
//         case 'Epic':
//             return '🎯';
//         case 'Story':
//             return '📖';
//         case 'Task':
//             return '✅';
//         case 'Subtask':
//             return '🔧';
//         default:
//             return '📋';
//     }
// };

const getTypeBadgeColor = (type: string) => {
    switch (type) {
        case 'Epic':
            return 'bg-purple-100 text-purple-800 border-purple-300';
        case 'Story':
            return 'bg-green-100 text-green-800 border-green-300';
        case 'Task':
            return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'Subtask':
            return 'bg-orange-100 text-orange-800 border-orange-300';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

interface SprintData {
    id: number;
    name: string;
    number: number;
    status: string;
}

export default function WorkItemsListPage() {
    const { groupData, isGroupLeader } = useGroupContext();
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(
        null
    );

    // Filter states
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [filteredAssignees, setFilteredAssignees] = useState<Set<number>>(
        new Set()
    );
    const [sprints, setSprints] = useState<SprintData[]>([]);
    const [filteredSprints, setFilteredSprints] = useState<Set<number>>(
        new Set()
    );
    const [filteredStatuses, setFilteredStatuses] = useState<
        Set<WorkItemStatus>
    >(new Set());
    const [filteredTypes, setFilteredTypes] = useState<Set<string>>(new Set());
    const [filteredFromDate, setFilteredFromDate] = useState<string | null>(
        null
    );
    const [filteredToDate, setFilteredToDate] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLecturerTaskFilter, setIsLecturerTaskFilter] = useState(false);

    const ITEMS_PER_PAGE = 20;

    // Load initial data
    useEffect(() => {
        if (groupData) {
            loadGroupMembers();
            loadSprints();
            loadWorkItems(true); // true = reset
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
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reload when search query changes
    useEffect(() => {
        if (groupData && debouncedSearchQuery !== undefined) {
            loadWorkItems(true); // Reset to first page
        }
    }, [debouncedSearchQuery]);

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
            const response = await getSprintNameInGroup(groupData.id);
            setSprints(response);
        } catch (error) {
            console.error('Error loading sprints:', error);
            toast.error('Failed to load sprints');
        }
    };

    const loadWorkItems = useCallback(
        async (
            reset = false,
            overrideFilters?: {
                assigneeIds?: Set<number>;
                sprintIds?: Set<number>;
                statuses?: Set<WorkItemStatus>;
                types?: Set<string>;
                searchQuery?: string;
                fromDate?: string;
                toDate?: string;
                isLecturerTask?: boolean;
            }
        ) => {
            if (!groupData) return;

            try {
                if (reset) {
                    setLoading(true);
                }

                const currentPage = reset ? 1 : page;
                const filtersToUse = {
                    assigneeIds:
                        overrideFilters?.assigneeIds ?? filteredAssignees,
                    sprintIds: overrideFilters?.sprintIds ?? filteredSprints,
                    statuses: overrideFilters?.statuses ?? filteredStatuses,
                    types: overrideFilters?.types ?? filteredTypes,
                    searchQuery:
                        overrideFilters?.searchQuery ?? debouncedSearchQuery,
                    fromDate: overrideFilters?.fromDate ?? filteredFromDate,
                    toDate: overrideFilters?.toDate ?? filteredToDate,
                    isLecturerTask:
                        overrideFilters?.isLecturerTask == undefined
                            ? undefined
                            : isLecturerTaskFilter,
                };

                // Use the work items endpoint with server-side pagination and filtering
                const response: { total: number; data: WorkItem[] } =
                    (await getGroupWorkItemsList(groupData.id, {
                        assigneeIds:
                            filtersToUse.assigneeIds.size > 0
                                ? Array.from(filtersToUse.assigneeIds).join(',')
                                : undefined,
                        sprintIds:
                            filtersToUse.sprintIds.size > 0
                                ? Array.from(filtersToUse.sprintIds).join(',')
                                : undefined,
                        keyword: filtersToUse.searchQuery,
                        page: currentPage,
                        size: ITEMS_PER_PAGE,
                        statuses:
                            filtersToUse.statuses.size > 0
                                ? Array.from(filtersToUse.statuses).join(',')
                                : undefined,
                        types:
                            filtersToUse.types.size > 0
                                ? Array.from(filtersToUse.types).join(',')
                                : undefined,
                        fromDate: filtersToUse.fromDate || undefined,
                        toDate: filtersToUse.toDate || undefined,
                        isLecturerTask: filtersToUse.isLecturerTask,
                    })) as any;

                // Response now has { total, data } structure
                const newItems: WorkItem[] = response.data || [];
                const total = response.total || 0;

                setTotalItems(total);

                if (reset) {
                    setWorkItems(newItems);
                    setPage(2); // Next page to load
                } else {
                    setWorkItems((prev) => [...prev, ...newItems]);
                    setPage((prev) => prev + 1);
                }

                // Check if there are more items to load
                const currentItemsCount = reset
                    ? newItems.length
                    : workItems.length + newItems.length;
                setHasMore(currentItemsCount < total);
            } catch (error) {
                console.log('🚀 ~ WorkItemsListPage ~ error:', error);
                // console.error('Error loading work items:', error);
                toast.error('Failed to load work items');
            } finally {
                if (reset) {
                    setLoading(false);
                }
            }
        },
        [
            groupData,
            page,
            filteredAssignees,
            filteredSprints,
            filteredStatuses,
            filteredTypes,
            debouncedSearchQuery,
            workItems.length,
            filteredFromDate,
            filteredToDate,
            isLecturerTaskFilter,
        ]
    );

    const applyFilters = (newFilters?: {
        assigneeIds?: Set<number>;
        sprintIds?: Set<number>;
        statuses?: Set<WorkItemStatus>;
        types?: Set<string>;
        fromDate?: string;
        toDate?: string;
        isLecturerTask?: boolean;
    }) => {
        loadWorkItems(true, newFilters);
    };

    const clearAllFilters = () => {
        setFilteredAssignees(new Set());
        setFilteredSprints(new Set());
        setFilteredStatuses(new Set());
        setFilteredTypes(new Set());
        setSearchQuery('');
        setFilteredFromDate(null);
        setFilteredToDate(null);
        setDebouncedSearchQuery('');
        setIsLecturerTaskFilter(false);
        loadWorkItems(true, {
            assigneeIds: new Set(),
            sprintIds: new Set(),
            statuses: new Set(),
            types: new Set(),
            searchQuery: '',
            fromDate: '',
            toDate: '',
            isLecturerTask: undefined,
        });
    };

    const loadMoreItems = () => {
        if (!loading && hasMore) {
            loadWorkItems(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-6 ml-4 px-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">
                            Loading work items...
                        </p>
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
                        <List className="h-4 w-4 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Work Items List
                    </h1>
                </div>
                <p className="text-gray-600 ml-11 font-medium">
                    View and manage all work items
                </p>

                {/* Search and Filter Bar */}
                <div className="mt-6 ml-11 flex items-center space-x-4 flex-wrap gap-2">
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

                    {/* Date Range Filters */}
                    {/* <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <Input
                            type="date"
                            placeholder="From date"
                            value={filteredFromDate || ''}
                            onChange={(e) =>
                                setFilteredFromDate(e.target.value || null)
                            }
                            className="w-40 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-700"
                        />
                        <span className="text-gray-500 text-sm">to</span>
                        <Input
                            type="date"
                            placeholder="To date"
                            value={filteredToDate || ''}
                            onChange={(e) =>
                                setFilteredToDate(e.target.value || null)
                            }
                            min={filteredFromDate || ''}
                            className="w-40 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-700"
                        />
                    </div> */}

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
                        <DropdownMenuContent
                            className="w-64 p-2"
                            // onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                            <div className="space-y-2">
                                <div className="font-medium text-sm text-gray-700 px-2 py-1">
                                    Filter by Assignee
                                </div>
                                <DropdownMenuSeparator />

                                {/* Unassigned Option */}
                                <div
                                    className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Checkbox
                                        id="unassigned"
                                        checked={filteredAssignees.has(0)}
                                        onCheckedChange={(checked) => {
                                            const newFilters = new Set(
                                                filteredAssignees
                                            );
                                            if (checked) {
                                                newFilters.add(0);
                                            } else {
                                                newFilters.delete(0);
                                            }
                                            setFilteredAssignees(newFilters);
                                        }}
                                    />
                                    <span className="text-sm text-gray-700">
                                        Unassigned
                                    </span>
                                </div>

                                {/* Group Members */}
                                {groupMembers.map((member) => (
                                    <div
                                        key={member.studentProjectId}
                                        className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded"
                                        onClick={(e) => e.stopPropagation()}
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
                                                if (checked) {
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
                                        <span className="text-sm text-gray-700 truncate">
                                            {member.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Status Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center space-x-2 bg-white border-gray-200 hover:bg-gray-50"
                            >
                                <Target className="h-4 w-4" />
                                <span>Status</span>
                                {filteredStatuses.size > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 bg-green-100 text-green-800"
                                    >
                                        {filteredStatuses.size}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-48 p-2"
                            // onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                            <div className="space-y-2">
                                <div className="font-medium text-sm text-gray-700 px-2 py-1">
                                    Filter by Status
                                </div>
                                <DropdownMenuSeparator />
                                {(
                                    [
                                        'TO DO',
                                        'IN PROGRESS',
                                        'WAIT FOR REVIEW',
                                        'DONE',
                                    ] as WorkItemStatus[]
                                ).map((status) => (
                                    <div
                                        key={status}
                                        className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Checkbox
                                            id={`status-${status}`}
                                            checked={filteredStatuses.has(
                                                status
                                            )}
                                            onCheckedChange={(checked) => {
                                                const newFilters = new Set(
                                                    filteredStatuses
                                                );
                                                if (checked) {
                                                    newFilters.add(status);
                                                } else {
                                                    newFilters.delete(status);
                                                }
                                                setFilteredStatuses(newFilters);
                                            }}
                                        />
                                        <div className="flex items-center space-x-2">
                                            {getStatusIcon(status)}
                                            <span className="text-sm text-gray-700">
                                                {status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Type Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center space-x-2 bg-white border-gray-200 hover:bg-gray-50"
                            >
                                <Filter className="h-4 w-4" />
                                <span>Type</span>
                                {filteredTypes.size > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 bg-purple-100 text-purple-800"
                                    >
                                        {filteredTypes.size}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-48 p-2"
                            // onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                            <div className="space-y-2">
                                <div className="font-medium text-sm text-gray-700 px-2 py-1">
                                    Filter by Type
                                </div>
                                <DropdownMenuSeparator />
                                {['Epic', 'Story', 'Task', 'Subtask'].map(
                                    (type) => (
                                        <div
                                            key={type}
                                            className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                id={`type-${type}`}
                                                checked={filteredTypes.has(
                                                    type
                                                )}
                                                onCheckedChange={(checked) => {
                                                    const newFilters = new Set(
                                                        filteredTypes
                                                    );
                                                    if (checked) {
                                                        newFilters.add(type);
                                                    } else {
                                                        newFilters.delete(type);
                                                    }
                                                    setFilteredTypes(
                                                        newFilters
                                                    );
                                                }}
                                            />
                                            <div className="flex items-center space-x-2">
                                                <span>{getTypeIcon(type)}</span>
                                                <span className="text-sm text-gray-700">
                                                    {type}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                                        className="ml-1 bg-indigo-100 text-indigo-800"
                                    >
                                        {filteredSprints.size}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-64 p-2"
                            // onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                            <div className="space-y-2">
                                <div className="font-medium text-sm text-gray-700 px-2 py-1">
                                    Filter by Sprint
                                </div>
                                <DropdownMenuSeparator />

                                {/* No Sprint Option */}
                                <div
                                    className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Checkbox
                                        id="no-sprint"
                                        checked={filteredSprints.has(0)}
                                        onCheckedChange={(checked) => {
                                            const newFilters = new Set(
                                                filteredSprints
                                            );
                                            if (checked) {
                                                newFilters.add(0);
                                            } else {
                                                newFilters.delete(0);
                                            }
                                            setFilteredSprints(newFilters);
                                        }}
                                    />
                                    <span className="text-sm text-gray-700">
                                        No Sprint
                                    </span>
                                </div>

                                {/* Sprint Options */}
                                {sprints.map((sprint) => (
                                    <div
                                        key={sprint.id}
                                        className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded"
                                        onClick={(e) => e.stopPropagation()}
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
                                                if (checked) {
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
                                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
                                                <span className="text-xs text-white font-bold">
                                                    S{sprint.number}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {sprint.name ||
                                                        `Sprint ${sprint.number}`}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Status: {sprint.status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {sprints.length === 0 && (
                                    <div className="text-center py-4 text-gray-400">
                                        <p className="text-sm">
                                            No sprints available
                                        </p>
                                    </div>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Lecturer Tasks Filter Toggle */}
                    <Button
                        variant={isLecturerTaskFilter ? 'default' : 'outline'}
                        onClick={() =>
                            setIsLecturerTaskFilter(!isLecturerTaskFilter)
                        }
                        className={`flex items-center space-x-2 ${
                            isLecturerTaskFilter
                                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                                : 'bg-white border-gray-200 hover:bg-orange-50 hover:border-orange-300 text-gray-700'
                        }`}
                        title={
                            isLecturerTaskFilter
                                ? 'Show all tasks'
                                : 'Show only lecturer-assigned tasks'
                        }
                    >
                        <User className="h-4 w-4" />
                        <span>Lecturer Only</span>
                        {isLecturerTaskFilter && (
                            <Badge
                                variant="secondary"
                                className="ml-1 bg-white/20 text-white"
                            >
                                Active
                            </Badge>
                        )}
                    </Button>

                    {/* Apply Filters Button */}
                    <Button
                        onClick={() =>
                            applyFilters({
                                assigneeIds: filteredAssignees,
                                sprintIds: filteredSprints,
                                statuses: filteredStatuses,
                                types: filteredTypes,
                                fromDate: filteredFromDate || undefined,
                                toDate: filteredToDate || undefined,
                                isLecturerTask: isLecturerTaskFilter
                                    ? true
                                    : undefined,
                            })
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Apply Filters
                    </Button>

                    {/* Clear Filters */}
                    {(filteredAssignees.size > 0 ||
                        filteredSprints.size > 0 ||
                        filteredStatuses.size > 0 ||
                        filteredTypes.size > 0 ||
                        searchQuery ||
                        filteredFromDate ||
                        filteredToDate ||
                        isLecturerTaskFilter) && (
                        <Button
                            variant="ghost"
                            onClick={clearAllFilters}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Work Items List */}
            <div className="ml-11">
                <Card className="bg-white shadow-lg border-0">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">
                                Work Items (total {totalItems} items)
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            id="scrollableDiv"
                            style={{ height: '70vh', overflow: 'auto' }}
                        >
                            <InfiniteScroll
                                dataLength={workItems.length}
                                next={loadMoreItems}
                                hasMore={hasMore}
                                loader={
                                    <div className="flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                }
                                endMessage={
                                    <div className="text-center py-4 text-gray-500">
                                        <p>You&apos;ve reached the end! 🎉</p>
                                    </div>
                                }
                                scrollableTarget="scrollableDiv"
                            >
                                <div className="overflow-x-auto">
                                    <Table
                                        className="w-full table-fixed"
                                        style={{ minWidth: '1200px' }}
                                    >
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '80px' }}
                                                >
                                                    Type
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '80px' }}
                                                >
                                                    Key
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '200px' }}
                                                >
                                                    Summary
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '200px' }}
                                                >
                                                    Assignee
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '200px' }}
                                                >
                                                    Reporter
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '120px' }}
                                                >
                                                    Sprint
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '150px' }}
                                                >
                                                    Status
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '80px' }}
                                                >
                                                    Rating
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '130px' }}
                                                >
                                                    Start
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '130px' }}
                                                >
                                                    End
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '150px' }}
                                                >
                                                    Created
                                                </TableHead>
                                                <TableHead
                                                    className="text-nowrap"
                                                    style={{ width: '150px' }}
                                                >
                                                    Updated
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {workItems.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    className="hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedWorkItem(
                                                            item
                                                        );
                                                    }}
                                                >
                                                    <TableCell className="whitespace-nowrap">
                                                        <Badge
                                                            variant="outline"
                                                            className={`${getTypeBadgeColor(
                                                                item.type
                                                            )} border-0 text-xs`}
                                                        >
                                                            <span className="mr-1">
                                                                {getTypeIcon(
                                                                    item.type
                                                                )}
                                                            </span>
                                                            {item.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                            {item.key}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-xs">
                                                            <p className="font-medium text-sm text-gray-900 truncate">
                                                                {item.summary}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {item.assignee
                                                            ?.studentClassroom
                                                            ?.student ? (
                                                            <div className="flex items-center space-x-2 min-w-0">
                                                                <div
                                                                    className={`w-6 h-6 ${getAvatarColor(
                                                                        item
                                                                            .assignee
                                                                            .studentClassroom
                                                                            .student
                                                                            .name
                                                                    )} rounded-full flex items-center justify-center flex-shrink-0`}
                                                                >
                                                                    <span className="text-xs text-white font-bold">
                                                                        {generateInitials(
                                                                            item
                                                                                .assignee
                                                                                .studentClassroom
                                                                                .student
                                                                                .name
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-gray-700 truncate">
                                                                    {
                                                                        item
                                                                            .assignee
                                                                            .studentClassroom
                                                                            .student
                                                                            .name
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {item.reporter ? (
                                                            <div className="flex items-center space-x-2 min-w-0">
                                                                <div
                                                                    className={`w-6 h-6 ${getAvatarColor(
                                                                        item
                                                                            .reporter
                                                                            .name
                                                                    )} rounded-full flex items-center justify-center flex-shrink-0`}
                                                                >
                                                                    <span className="text-xs text-white font-bold">
                                                                        {generateInitials(
                                                                            item
                                                                                .reporter
                                                                                .name
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-gray-700 truncate">
                                                                    {
                                                                        item
                                                                            .reporter
                                                                            .name
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">
                                                                No reporter
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {item.sprint ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-indigo-100 text-indigo-800 border-indigo-300 text-xs"
                                                            >
                                                                {
                                                                    item.sprint
                                                                        .name
                                                                }
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">
                                                                No sprint
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <Badge
                                                            variant="outline"
                                                            className={`${getStatusBadgeColor(
                                                                item.status
                                                            )} border-0 text-xs`}
                                                        >
                                                            <span className="mr-1">
                                                                {getStatusIcon(
                                                                    item.status
                                                                )}
                                                            </span>
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {item.rating ? (
                                                            <div className="flex items-center space-x-1">
                                                                <span className="text-yellow-500">
                                                                    ⭐
                                                                </span>
                                                                <span className="text-xs font-medium text-gray-900">
                                                                    {
                                                                        item.rating
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">
                                                                -
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="text-xs text-gray-500">
                                                            {item.startDate ? (
                                                                <span>
                                                                    {formatDate(
                                                                        item.startDate,
                                                                        'hh:mm - dd MMM, yyyy'
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">
                                                                    Not set
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="text-xs text-gray-500">
                                                            {item.endDate ? (
                                                                <span>
                                                                    {formatDate(
                                                                        item.endDate,
                                                                        'hh:mm - dd MMM, yyyy'
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">
                                                                    Not set
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="text-xs text-gray-500">
                                                            <span>
                                                                {formatDate(
                                                                    item.createdAt,
                                                                    'hh:mm - dd MMM, yyyy'
                                                                )}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="text-xs text-gray-500">
                                                            <span>
                                                                {formatDate(
                                                                    item.updatedAt,
                                                                    'hh:mm - dd MMM, yyyy'
                                                                )}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    {/* <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                setSelectedWorkItem(
                                                                    item
                                                                )
                                                            }
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell> */}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </InfiniteScroll>
                        </div>

                        {workItems.length === 0 && (
                            <div className="text-center py-12">
                                <List className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No work items found
                                </h3>
                                <p className="text-gray-500">
                                    {searchQuery ||
                                    filteredAssignees.size > 0 ||
                                    filteredStatuses.size > 0 ||
                                    filteredTypes.size > 0
                                        ? 'Try adjusting your filters or search query.'
                                        : 'No work items have been created yet.'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Work Item Detail Modal */}
            {selectedWorkItem && (
                <WorkItemDetailModal
                    isOpen={!!selectedWorkItem}
                    onClose={() => setSelectedWorkItem(null)}
                    workItemId={selectedWorkItem.id}
                    onUpdate={() => loadWorkItems(true)}
                    isGroupLeader={isGroupLeader}
                    onOpenSubtask={(subtaskId) => {
                        setSelectedWorkItem({ id: subtaskId } as WorkItem);
                    }}
                />
            )}
        </div>
    );
}
