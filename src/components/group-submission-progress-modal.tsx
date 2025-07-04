'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    X,
    GitCommit,
    ExternalLink,
    FileText,
    Paperclip,
    Star,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { getLecturerAssignedItemSubmissionDetailOfGroup } from '@/services/api/work_items';
import { toast } from 'react-toastify';
import { getStatusBadge } from '@/helper/get-status-badge';
import { formatDate } from '@/helper/date-formatter';
import { getTypeIcon } from '@/helper/get-type-icon';
import { WorkItemStatus } from '@/services/api/work_items/interface';
import { Avatar } from './avatar';

interface Commit {
    url: string;
    numberOfLineAdded: number;
    numberOfLineDeleted: number;
    recordedAt: string;
    message: string;
    url_source_at_commit?: string;
}

interface Attachment {
    url: string;
    name: string;
    type: string;
    createdAt: string;
}

interface ItemToAttachment {
    id: number;
    attachment: Attachment;
}

interface Assignee {
    id: number;
    studentClassroom: {
        id: number;
        student: {
            id: number;
            email: string;
            name: string;
            externalId: string;
        };
    };
}

interface SubItem {
    type: string;
    summary: string;
    status: WorkItemStatus;
    storyPoints: number | null;
    rating: number | null;
    itemToAttachments: ItemToAttachment[];
    commits: Commit[];
    assignee: Assignee;
    updatedAt: string;
}

interface CloneItem {
    updatedAt: string;
    status: WorkItemStatus;
    storyPoints: number | null;
    rating: number | null;
    subItems: SubItem[];
    itemToAttachments: ItemToAttachment[];
    commits: Commit[];
    assignee: Assignee;
}

interface GroupSubmissionProgress {
    summary: string;
    cloneItems: CloneItem[];
}

interface GroupSubmissionProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: number;
    groupId: number;
    groupNumber: number;
}

export function GroupSubmissionProgressModal({
    isOpen,
    onClose,
    itemId,
    groupId,
    groupNumber,
}: GroupSubmissionProgressModalProps) {
    const [data, setData] = useState<GroupSubmissionProgress | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && itemId && groupId) {
            fetchData();
        }
    }, [isOpen, itemId, groupId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response =
                await getLecturerAssignedItemSubmissionDetailOfGroup(
                    itemId,
                    groupId
                );
            setData(response);
        } catch (error: any) {
            console.log("🚀 ~ fetchData ~ error:", error)
            toast.error(error.message || 'Lỗi khi tải dữ liệu bài nộp');
        } finally {
            setLoading(false);
        }
    };

    const renderCommits = (commits: Commit[], title: string) => {
        if (!commits || commits.length === 0) {
            return (
                <div className="text-sm text-gray-500 italic">
                    Không có commit cho {title}.
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {commits.map((commit, index) => (
                    <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200"
                    >
                        <GitCommit className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs text-gray-600">
                                    {formatDate(
                                        commit.recordedAt,
                                        'dd/MM/yyyy HH:mm'
                                    )}
                                </span>
                            </div>
                            {commit.message && (
                                <div className="text-sm text-gray-900 mb-1">
                                    {commit.message}
                                </div>
                            )}
                            <div className="text-xs text-gray-600">
                                <span className="text-green-700">
                                    +{commit.numberOfLineAdded}
                                </span>{' '}
                                <span className="text-red-700">
                                    -{commit.numberOfLineDeleted}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={() =>
                                    window.open(commit.url, '_blank')
                                }
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Xem Commit"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </button>
                            {commit.url_source_at_commit && (
                                <button
                                    onClick={() =>
                                        window.open(
                                            commit.url_source_at_commit,
                                            '_blank'
                                        )
                                    }
                                    className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Xem mã nguồn"
                                >
                                    <FileText className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderAttachments = (
        attachments: ItemToAttachment[],
        title: string
    ) => {
        if (!attachments || attachments.length === 0) {
            return (
                <div className="text-sm text-gray-500 italic">
                    Không có tập tin đính kèm cho {title}.
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {attachments.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200"
                    >
                        <div className="flex items-center space-x-3">
                            <Paperclip className="h-4 w-4 text-gray-500" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {item.attachment.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {item.attachment.type} •{' '}
                                    {formatDate(
                                        item.attachment.createdAt,
                                        'dd/MM/yyyy HH:mm'
                                    )}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                window.open(item.attachment.url, '_blank')
                            }
                        >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Xem
                        </Button>
                    </div>
                ))}
            </div>
        );
    };

    const renderAssignee = (assignee: Assignee) => {
        return (
            <div className="flex items-center space-x-2">
                <Avatar
                    name={assignee?.studentClassroom?.student?.name}
                ></Avatar>
                {assignee?.studentClassroom?.student ? <div>
                    <p className="text-sm font-medium text-gray-900">
                        {assignee.studentClassroom.student.name}
                    </p>
                    <p className="text-xs text-gray-500">
                        {assignee.studentClassroom.student.email}
                    </p>
                    <p className="text-xs text-gray-500">
                        ID: {assignee.studentClassroom.student.externalId}
                    </p>
                </div> : <div>
                    <p className="text-sm font-medium text-gray-900">
                        Không được giao
                    </p>
                </div>}
            </div>
        );
    };

    if (loading) {
        return (
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-gray-600">
                                    Đang tải dữ liệu bài nộp...
                                </p>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        );
    }

    if (!data || !data.cloneItems || data.cloneItems.length === 0) {
        return (
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <div className="text-center">
                                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">
                                    Không tìm thấy dữ liệu bài nộp
                                </p>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        );
    }

    const cloneItem = data.cloneItems[0]; // Always at index 0 as mentioned

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b">
                                    <div>
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-semibold text-gray-900"
                                        >
                                            Tiến độ bài nộp nhóm {groupNumber}
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 max-h-[80vh] overflow-y-auto">
                                    <div className="space-y-6">
                                        {/* Main Task Info */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    {getTypeIcon('Task')}
                                                    {data.summary}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(
                                                            cloneItem.status
                                                        )}
                                                        <span className="text-sm text-gray-600">
                                                            Cập nhật gần nhất:{' '}
                                                            {formatDate(
                                                                cloneItem.updatedAt,
                                                                'dd/MM/yyyy HH:mm'
                                                            )}
                                                        </span>
                                                    </div>
                                                    {cloneItem.rating && (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                            <span className="text-sm font-medium">
                                                                {
                                                                    cloneItem.rating
                                                                }
                                                                /5
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                        Thành viên được giao
                                                    </h4>
                                                    {renderAssignee(
                                                        cloneItem.assignee
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                        Tài liệu minh chứng
                                                    </h4>
                                                    {renderAttachments(
                                                        cloneItem.itemToAttachments,
                                                        data.summary
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                        Commits
                                                    </h4>
                                                    {renderCommits(
                                                        cloneItem.commits,
                                                        `công việc chính "${data.summary}"`
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Subtasks */}
                                        {cloneItem.subItems &&
                                            cloneItem.subItems.length > 0 && (
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            <CheckCircle className="h-5 w-5" />
                                                            Công việc con (
                                                            {
                                                                cloneItem
                                                                    .subItems
                                                                    .length
                                                            }
                                                            )
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-4">
                                                            {cloneItem.subItems.map(
                                                                (
                                                                    subItem,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="border-2 border-gray-200 rounded-lg p-4 space-y-3"
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                {getTypeIcon(
                                                                                    subItem.type
                                                                                )}
                                                                                <span className="font-medium">
                                                                                    {
                                                                                        subItem.summary
                                                                                    }
                                                                                </span>
                                                                                {getStatusBadge(
                                                                                    subItem.status
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs text-gray-500">
                                                                                    {formatDate(
                                                                                        subItem.updatedAt,
                                                                                        'dd/MM/yyyy HH:mm'
                                                                                    )}
                                                                                </span>
                                                                                {subItem.rating && (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                                                        <span className="text-sm font-medium">
                                                                                            {
                                                                                                subItem.rating
                                                                                            }
                                                                                            /5
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <h5 className="text-sm font-medium text-gray-900 mb-2">
                                                                                Thành viên được giao
                                                                            </h5>
                                                                            {renderAssignee(
                                                                                subItem.assignee
                                                                            )}
                                                                        </div>

                                                                        <div>
                                                                            <h5 className="text-sm font-medium text-gray-900 mb-2">
                                                                                Tài liệu minh chứng
                                                                            </h5>
                                                                            {renderAttachments(
                                                                                subItem.itemToAttachments,
                                                                                `subtask "${subItem.summary}"`
                                                                            )}
                                                                        </div>

                                                                        <div>
                                                                            <h5 className="text-sm font-medium text-gray-900 mb-2">
                                                                                Commits
                                                                            </h5>
                                                                            {renderCommits(
                                                                                subItem.commits,
                                                                                `công việc con "${subItem.summary}"`
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
