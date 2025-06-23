'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, FileText, Loader2, Star } from 'lucide-react';
import { getGroupWorkItemsList } from '@/services/api/group';
import { toast } from 'react-toastify';
import { getTypeIcon } from '@/helper/get-type-icon';
import { formatDate } from '@/helper/date-formatter';
import { WorkItem } from '@/services/api/work_items/interface';
import { getStatusBadge } from '@/helper/get-status-badge';

interface WorkItemsResponse {
    data: WorkItem[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

interface StudentWorkItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: {
        student_id: number;
        student_name: string;
        student_email: string;
        student_externalid: string;
        student_project_id: number;
    };
    groupId: number;
}

export function StudentWorkItemsModal({
    isOpen,
    onClose,
    student,
    groupId,
}: StudentWorkItemsModalProps) {
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchWorkItems = useCallback(
        async (page: number = 1, append: boolean = false) => {
            try {
                setLoading(true);

                const query = {
                    assigneeIds: student.student_project_id.toString(),
                    page: page,
                    size: 20,
                };

                const response: WorkItemsResponse =
                    (await getGroupWorkItemsList(
                        groupId,
                        query
                    )) as unknown as WorkItemsResponse;

                if (append) {
                    setWorkItems((prev) => [...prev, ...response.data]);
                } else {
                    setWorkItems(response.data);
                }

                setHasMore(page < response.totalPages);
                setCurrentPage(page);
            } catch (error: any) {
                console.error('Error fetching work items:', error);
                toast.error('Failed to load work items');
            } finally {
                setLoading(false);
            }
        },
        [groupId, student.student_project_id]
    );

    // Initial load
    useEffect(() => {
        if (isOpen && student.student_project_id) {
            setWorkItems([]);
            setCurrentPage(1);
            setHasMore(true);
            fetchWorkItems(1, false);
        }
    }, [isOpen, student.student_project_id, fetchWorkItems]);

    // Handle load more
    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchWorkItems(currentPage + 1, true);
        }
    };

    const renderRating = (rating: number | null | undefined) => {
        if (rating === null || rating === undefined) return null;

        return (
            <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-600">
                    {rating.toFixed(1)}
                </span>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-blue-600" />
                        Work Items -{' '}
                        {student.student_name || student.student_email}
                    </DialogTitle>
                </DialogHeader>

                {/* Work Items List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {workItems.length === 0 && !loading ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No work items found
                            </h3>
                            <p className="text-gray-500">
                                This student has no assigned work items yet.
                            </p>
                        </div>
                    ) : (
                        workItems.map((item) => (
                            <Card
                                key={item.id}
                                className="hover:shadow-md transition-shadow"
                            >
                                <CardContent className="p-4 pt-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getTypeIcon(item.type)}
                                                <h3 className="font-medium text-gray-900">
                                                    {item.summary}
                                                </h3>
                                                {item.storyPoints &&
                                                    item.storyPoints > 0 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {item.storyPoints}{' '}
                                                            SP
                                                        </Badge>
                                                    )}
                                            </div>

                                            {item.description && (
                                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>
                                                    Created:{' '}
                                                    {formatDate(
                                                        item.createdAt,
                                                        'dd/MM/yyyy'
                                                    )}
                                                </span>
                                                {item.endDate && (
                                                    <span>
                                                        Due:{' '}
                                                        {formatDate(
                                                            item.endDate,
                                                            'dd/MM/yyyy'
                                                        )}
                                                    </span>
                                                )}
                                                {item.sprint && (
                                                    <span>
                                                        Sprint:{' '}
                                                        {item.sprint.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            {getStatusBadge(item.status)}
                                            {item.status === 'DONE' &&
                                                renderRating(item.rating)}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="text-center py-4">
                            <Button
                                onClick={handleLoadMore}
                                disabled={loading}
                                variant="outline"
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Load More'
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
