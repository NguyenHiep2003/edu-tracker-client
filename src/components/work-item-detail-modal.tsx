'use client';

import { Button } from '@/components/ui/button';
import {
    X,
    User,
    Paperclip,
    FileCheck,
    Edit2,
    Upload,
    Trash2,
    GitCommit,
    Star,
    ThumbsUp,
    ThumbsDown,
    Plus,
    MoreVertical,
} from 'lucide-react';
import {
    WorkItem,
    ItemToAttachment,
} from '@/services/api/work_items/interface';
import { useEffect, useState } from 'react';
import {
    approveWorkItem,
    getWorkItemDetail,
    rejectWorkItem,
    updateWorkItem,
    deleteWorkItem,
} from '@/services/api/work_items';
import {
    getEpicInGroup,
    getSprintNameInGroup,
    getUserInGroup,
    createWorkItems,
} from '@/services/api/group';
import { toast } from 'react-toastify';
import Select from 'react-select';
import instance from '@/services/api/common/axios';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/profile-context';
import { ApprovalDialog } from './approval-dialog';
import { generateInitials, getAvatarColor } from './avatar';
import { getTypeIcon } from '@/helper/get-type-icon';
import { formatDate } from '@/helper/date-formatter';
import { WarningModal } from './warning-modal';

type WorkItemStatus = 'TO DO' | 'IN PROGRESS' | 'WAIT FOR REVIEW' | 'DONE';

interface Epic {
    id: number;
    key: string;
    name: string;
    summary: string;
}

interface GroupMember {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    studentProjectId: number;
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

interface Feedback {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    type: 'APPROVE' | 'REJECT';
    comment: string;
    workItemId: number;
}

interface WorkItemWithFeedback extends WorkItem {
    rating?: number;
    feedbacks?: Feedback[];
}

export interface WorkItemDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    workItemId: number;
    onUpdate?: () => void;
    isGroupLeader: boolean;
    onOpenSubtask?: (subtaskId: number) => void;
    viewOnly?: boolean;
    userId?: number;
    defaultAssigneeId?: number | null;
}

interface RejectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (comment: string) => void;
    workItem: WorkItemWithFeedback;
}

interface SubtaskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    workItem: WorkItemWithFeedback;
    onSubtaskCreated?: () => void;
    defaultAssigneeId?: number | null;
}

const RejectDialog = ({
    isOpen,
    onClose,
    onSubmit,
    workItem,
}: RejectDialogProps) => {
    const [comment, setComment] = useState('');

    useEffect(() => {
        setComment('');
    }, [isOpen]);

    const handleSubmit = () => {
        onSubmit(comment);
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
                                    Từ chối {workItem?.key} {workItem?.summary}
                                </HeadlessDialog.Title>

                                <div className="mt-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">
                                            Nhận xét (tùy chọn)
                                        </Label>
                                        <Textarea
                                            value={comment}
                                            onChange={(e) =>
                                                setComment(e.target.value)
                                            }
                                            placeholder="Thêm nhận xét..."
                                            className="min-h-[100px] w-full bg-white text-black"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <Button variant="outline" onClick={onClose}>
                                        Hủy
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleSubmit}
                                    >
                                        Từ chối
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

const SubtaskDialog = ({
    isOpen,
    onClose,
    workItem,
    onSubtaskCreated,
    defaultAssigneeId,
}: SubtaskDialogProps) => {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const { profile } = useProfile();

    useEffect(() => {
        setSummary('');
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!summary.trim()) {
            toast.error('Vui lòng nhập tóm tắt');
            return;
        }

        if (!workItem.reporter?.id) {
            toast.error('Thông tin người tạo công việc bị thiếu');
            return;
        }

        try {
            setLoading(true);
            await createWorkItems(workItem.groupId, {
                type: 'Subtask',
                summary: summary.trim(),
                status: 'TO DO',
                parentItemId: workItem.id,
                reporterId: profile?.id,
                assigneeId: defaultAssigneeId,
            });

            toast.success('Công việc con đã được tạo thành công');
            onSubtaskCreated?.();
            onClose();
        } catch (error: any) {
            console.log('🚀 ~ handleSubmit ~ error:', error);
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Lỗi khi tạo công việc con');
            }
        } finally {
            setLoading(false);
        }
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
                                    Tạo subtask
                                </HeadlessDialog.Title>

                                <div className="mt-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">
                                            Tóm tắt
                                        </Label>
                                        <input
                                            type="text"
                                            value={summary}
                                            onChange={(e) =>
                                                setSummary(e.target.value)
                                            }
                                            placeholder="Nhập tóm tắt subtask"
                                            className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === 'Enter' &&
                                                    !e.shiftKey
                                                ) {
                                                    e.preventDefault();
                                                    handleSubmit();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <Button variant="outline" onClick={onClose}>
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Đang tạo...
                                            </div>
                                        ) : (
                                            'Tạo'
                                        )}
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

export function WorkItemDetailModal({
    isOpen,
    onClose,
    workItemId,
    onUpdate,
    isGroupLeader,
    onOpenSubtask,
    viewOnly = false,
    userId,
    defaultAssigneeId,
}: WorkItemDetailModalProps) {
    const [workItem, setWorkItem] = useState<WorkItemWithFeedback | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedWorkItem, setEditedWorkItem] =
        useState<Partial<WorkItem> | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loading, setLoading] = useState(false);
    const [newAttachments, setNewAttachments] = useState<{
        ATTACHMENT: File[];
        'WORK EVIDENCE': File[];
    }>({
        ATTACHMENT: [],
        'WORK EVIDENCE': [],
    });
    const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>(
        []
    );
    const [epics, setEpics] = useState<Epic[]>([]);
    const [showSubtaskDialog, setShowSubtaskDialog] = useState(false);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    useEffect(() => {
        if (workItemId) {
            getWorkItemDetail(workItemId).then((workItem) => {
                setWorkItem(workItem);
                setEditedWorkItem(workItem);
            });
        }
    }, [workItemId, isEditing]);

    const loadModalData = async () => {
        try {
            if (!workItem?.groupId) return;
            setLoading(true);

            const [membersData, sprintsData, epicsData] = await Promise.all([
                getUserInGroup(workItem.groupId),
                getSprintNameInGroup(workItem.groupId, {
                    status: 'INACTIVE,IN PROGRESS',
                }),
                getEpicInGroup(workItem.groupId),
            ]);

            setGroupMembers(membersData || []);
            setSprints(sprintsData || []);
            setEpics(epicsData || []);
        } catch (error) {
            console.log('🚀 ~ loadModalData ~ error:', error);
            toast.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAttachment = (attachmentId: number) => {
        setDeletedAttachmentIds((prev) => [...prev, attachmentId]);
    };

    const handleSave = async () => {
        if (!editedWorkItem || !workItem) return;
        if (
            editedWorkItem.status == 'DONE' &&
            workItem?.subItems?.some((subItem) => subItem.status != 'DONE')
        ) {
            if (workItem.type == 'Epic') {
                toast.error(
                    'Tất cả công việc con phải được hoàn thành trước khi epic được đánh dấu là hoàn thành'
                );
            } else {
                toast.error(
                    'Tất cả subtask phải được hoàn thành trước khi công việc được đánh dấu là hoàn thành'
                );
            }
            return;
        }
        try {
            setLoading(true);
            const updatedData = {
                summary: editedWorkItem.summary,
                description: editedWorkItem.description,
                status: editedWorkItem.status,
                assigneeId: editedWorkItem.assigneeId?.toString(),
                sprintId: editedWorkItem.sprintId?.toString(),
                storyPoints: editedWorkItem.storyPoints,
                startDate: editedWorkItem.startDate,
                endDate: editedWorkItem.endDate,
                parentItemId: editedWorkItem.parentItemId?.toString(),
                deletedAttachmentIds: deletedAttachmentIds,
            };

            const updated = await updateWorkItem(workItemId, updatedData);
            setWorkItem(updated);
            setEditedWorkItem(updated);
            setIsEditing(false);
            setDeletedAttachmentIds([]);
            toast.success('Công việc đã được cập nhật thành công');
            onUpdate?.();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Lỗi khi cập nhật công việc');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            handleSave();
        } else {
            setIsEditing(true);
            setDeletedAttachmentIds([]);
            loadModalData();
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedWorkItem(workItem);
        setDeletedAttachmentIds([]);
        setNewAttachments({
            ATTACHMENT: [],
            'WORK EVIDENCE': [],
        });
    };

    const removeNewFile = (
        type: 'ATTACHMENT' | 'WORK EVIDENCE',
        index: number
    ) => {
        setNewAttachments((prev) => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index),
        }));

        // Reset the file input value
        const inputId =
            type === 'ATTACHMENT' ? 'attachment-upload' : 'evidence-upload';
        const fileInput = document.getElementById(inputId) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'ATTACHMENT' | 'WORK EVIDENCE'
    ) => {
        const files = Array.from(e.target.files || []);
        setNewAttachments((prev) => ({
            ...prev,
            [type]: [...prev[type], ...files],
        }));
        // Reset the input value after files are added
        e.target.value = '';
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

    const handleAttachmentUpload = async (
        type: 'ATTACHMENT' | 'WORK EVIDENCE'
    ) => {
        if (newAttachments[type].length === 0) return;

        try {
            setLoading(true);
            const formData = new FormData();

            newAttachments[type].forEach((file) => {
                formData.append(
                    type === 'ATTACHMENT' ? 'attachments' : 'evidences',
                    file
                );
            });

            await instance.patch(
                `/v1/work-item/${workItemId}/attachments`,
                formData
            );

            // Refresh work item data
            const updatedWorkItem = await getWorkItemDetail(workItemId);
            setWorkItem(updatedWorkItem as WorkItemWithFeedback);
            setNewAttachments((prev) => ({
                ...prev,
                [type]: [],
            }));
            toast.success('Tập tin đã được tải lên thành công');
            onUpdate?.();
        } catch (error) {
            console.log('🚀 ~ handleAttachmentUpload ~ error:', error);
            toast.error('Lỗi khi tải lên tập tin');
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (rating: number, comment: string) => {
        try {
            await approveWorkItem(workItemId, rating, comment);
            const updatedWorkItem = await getWorkItemDetail(workItemId);
            setWorkItem(updatedWorkItem);
            toast.success('Công việc đã được phê duyệt thành công');
            onUpdate?.();
            onClose();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Lỗi khi phê duyệt công việc');
            }
        }
    };

    const handleReject = async (comment: string) => {
        try {
            await rejectWorkItem(workItemId, comment);

            const updatedWorkItem = await getWorkItemDetail(workItemId);
            setWorkItem(updatedWorkItem);
            toast.success('Công việc đã được từ chối thành công');
            onUpdate?.();
            onClose();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Lỗi khi từ chối công việc');
            }
        }
    };

    const handleDelete = async () => {
        try {
            await deleteWorkItem(workItemId);
            toast.success('Công việc đã được xóa thành công');
            onUpdate?.();
            onClose();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Lỗi khi xóa công việc');
            }
        }
    };

    // Check if user can delete the work item
    const canDelete =
        (isGroupLeader || (userId && workItem?.reporter?.id === userId)) &&
        !workItem?.parentLecturerWorkItemId;

    if (!isOpen) return null;

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Epic':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'Story':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'Task':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusColor = (status: string) => {
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

    const renderAttachmentCard = (item: ItemToAttachment) => {
        const isDeleted = deletedAttachmentIds.includes(item.attachment.id);

        return (
            <div
                key={item.id}
                className={`
                    w-full relative group p-3 rounded-lg border transition-all duration-200
                    ${
                        isDeleted
                            ? 'bg-blue-50 border-red-200'
                            : 'bg-blue-50 border-blue-100'
                    }
                `}
            >
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        <Paperclip className="h-5 w-5 text-gray-500" />
                    </div>

                    <div className="flex-grow min-w-0 flex items-center gap-2">
                        <span className="text-sm text-gray-900">
                            {item.attachment.name}
                        </span>
                        {/* <span className="text-xs text-gray-500">
                            {item.type}
                        </span> */}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-xs text-gray-500">
                            Đã thêm{' '}
                            {formatDate(item.createdAt, 'dd/MM/yyyy HH:mm')}
                        </div>

                        <a
                            href={item.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            Xem
                        </a>

                        {isEditing && (
                            <button
                                onClick={() => {
                                    if (isDeleted) {
                                        setDeletedAttachmentIds((prev) =>
                                            prev.filter(
                                                (id) =>
                                                    id !== item.attachment.id
                                            )
                                        );
                                    } else {
                                        handleDeleteAttachment(
                                            item.attachment.id
                                        );
                                    }
                                }}
                                className="text-gray-400 hover:text-red-500 p-1"
                                title={isDeleted ? 'Hủy xóa' : 'Xóa tập tin'}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {isDeleted && (
                    <div className="text-xs text-red-600 mt-1">
                        Tập tin này sẽ bị xóa khi bạn lưu
                    </div>
                )}
            </div>
        );
    };

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: 'white',
            borderColor: '#E2E8F0',
        }),
        option: (
            base: any,
            state: { isSelected: boolean; isFocused: boolean }
        ) => ({
            ...base,
            backgroundColor: state.isSelected
                ? '#3B82F6'
                : state.isFocused
                ? '#EFF6FF'
                : 'white',
            color: state.isSelected ? 'white' : '#1F2937',
            ':active': {
                backgroundColor: '#3B82F6',
                color: 'white',
            },
        }),
        singleValue: (base: any) => ({
            ...base,
            color: '#1F2937',
        }),
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-black bg-opacity-50"
                    onClick={onClose}
                />
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div className="flex items-center space-x-3">
                            {/* Work Item Type Icon */}
                            {workItem?.type && getTypeIcon(workItem.type)}
                            <span className="text-sm font-mono text-blue-600">
                                {workItem?.key}
                            </span>
                        </div>
                        {!viewOnly && (
                            <div className="flex items-center space-x-2">
                                {!isEditing &&
                                    workItem?.type !== 'Subtask' &&
                                    workItem?.status != 'DONE' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setShowSubtaskDialog(true)
                                            }
                                            className="text-gray-600 hover:text-gray-900"
                                            disabled={loading}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Tạo subtask
                                        </Button>
                                    )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleEdit}
                                    className="text-gray-600 hover:text-gray-900"
                                    disabled={
                                        loading || workItem?.status === 'DONE'
                                    }
                                >
                                    {isEditing ? (
                                        loading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                <span>Đang lưu...</span>
                                            </div>
                                        ) : (
                                            'Lưu'
                                        )
                                    ) : (
                                        <>
                                            <Edit2 className="h-4 w-4 mr-1" />
                                            Sửa
                                        </>
                                    )}
                                </Button>
                                {isEditing && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        Hủy
                                    </Button>
                                )}

                                {/* Options Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setShowOptionsMenu(!showOptionsMenu)
                                        }
                                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    >
                                        <MoreVertical className="h-5 w-5" />
                                    </button>

                                    {showOptionsMenu && (
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                            <button
                                                onClick={() => {
                                                    setShowOptionsMenu(false);
                                                    setShowDeleteDialog(true);
                                                }}
                                                disabled={!canDelete}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Xóa công việc
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        onClose();
                                    }}
                                    className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div className="grid grid-cols-3 gap-6">
                            {/* Left Column - Main Content */}
                            <div className="col-span-2 space-y-6">
                                {/* Summary */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-900">
                                        Tóm tắt
                                    </h3>
                                    {isEditing &&
                                    !workItem?.parentLecturerWorkItemId ? (
                                        <input
                                            type="text"
                                            value={
                                                editedWorkItem?.summary || ''
                                            }
                                            onChange={(e) =>
                                                setEditedWorkItem((prev) => ({
                                                    ...prev,
                                                    summary: e.target.value,
                                                }))
                                            }
                                            className="text-xl font-semibold text-gray-900 border border-gray-300 rounded px-3 py-2 w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Nhập tóm tắt"
                                        />
                                    ) : (
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {workItem?.summary}
                                        </h2>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-900">
                                        Mô tả
                                    </h3>
                                    {isEditing &&
                                    !workItem?.parentLecturerWorkItemId ? (
                                        <div className="prose prose-sm max-w-none">
                                            <textarea
                                                value={
                                                    editedWorkItem?.description ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    setEditedWorkItem(
                                                        (prev) => ({
                                                            ...prev,
                                                            description:
                                                                e.target.value,
                                                        })
                                                    )
                                                }
                                                className="w-full min-h-[200px] p-3 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                placeholder="Nhập mô tả..."
                                            />
                                        </div>
                                    ) : (
                                        <div className="prose prose-sm max-w-none text-gray-700">
                                            {workItem?.description ||
                                                'Không có mô tả.'}
                                        </div>
                                    )}
                                </div>

                                {/* Subtasks Section */}
                                {workItem?.subItems &&
                                    workItem.subItems.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    {workItem.type == 'Epic'
                                                        ? 'Công việc con'
                                                        : 'Subtasks'}{' '}
                                                    (
                                                    {(
                                                        (workItem.subItems.filter(
                                                            (wi) =>
                                                                wi.status ==
                                                                'DONE'
                                                        ).length /
                                                            workItem.subItems
                                                                .length) *
                                                        100
                                                    ).toFixed(0)}
                                                    % Done)
                                                </h3>
                                            </div>
                                            <div className="space-y-2">
                                                {workItem.subItems.map(
                                                    (subItem) => (
                                                        <div
                                                            key={subItem.id}
                                                            onClick={() => {
                                                                onClose();
                                                                // Small delay to avoid modal transition conflicts
                                                                setTimeout(
                                                                    () => {
                                                                        onOpenSubtask?.(
                                                                            subItem.id
                                                                        );
                                                                    },
                                                                    100
                                                                );
                                                            }}
                                                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer group transition-all duration-200"
                                                        >
                                                            {getTypeIcon(
                                                                subItem.type
                                                            )}
                                                            <div className="flex-shrink-0">
                                                                <span className="text-sm font-mono text-blue-600">
                                                                    {
                                                                        subItem.key
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex-grow min-w-0">
                                                                <span className="text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                    {
                                                                        subItem.summary
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                <span
                                                                    className={`
                                                                text-xs px-2 py-1 rounded-full
                                                                ${getStatusColor(
                                                                    subItem.status
                                                                )}
                                                            `}
                                                                >
                                                                    {
                                                                        subItem.status
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Parent Item */}
                                {workItem?.type != 'Epic' && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-gray-900">
                                            {workItem?.type == 'Subtask'
                                                ? 'Công việc cha'
                                                : 'Epic cha'}
                                        </h3>
                                        {isEditing &&
                                        !workItem?.parentLecturerWorkItemId &&
                                        workItem?.type !== 'Subtask' ? (
                                            <Select
                                                value={
                                                    epics?.find(
                                                        (epic) =>
                                                            epic.id ===
                                                            editedWorkItem?.parentItemId
                                                    )
                                                        ? {
                                                              value:
                                                                  editedWorkItem?.parentItemId?.toString() ||
                                                                  '',
                                                              label: `${
                                                                  epics.find(
                                                                      (epic) =>
                                                                          epic.id ===
                                                                          editedWorkItem?.parentItemId
                                                                  )?.key
                                                              } - ${
                                                                  epics.find(
                                                                      (epic) =>
                                                                          epic.id ===
                                                                          editedWorkItem?.parentItemId
                                                                  )?.summary
                                                              }`,
                                                          }
                                                        : null
                                                }
                                                onChange={(option) => {
                                                    setEditedWorkItem(
                                                        (prev) => ({
                                                            ...prev,
                                                            parentItemId: option
                                                                ? Number(
                                                                      option.value
                                                                  )
                                                                : undefined,
                                                        })
                                                    );
                                                }}
                                                options={[
                                                    {
                                                        value: '',
                                                        label:
                                                            workItem?.type ==
                                                            'Task'
                                                                ? 'Không epic cha'
                                                                : 'Không công việc cha',
                                                    },
                                                    ...epics.map((epic) => ({
                                                        value: epic.id.toString(),
                                                        label: `${epic.key} - ${epic.summary}`,
                                                    })),
                                                ]}
                                                className="text-sm"
                                                classNamePrefix="react-select"
                                                placeholder={
                                                    workItem?.type != 'Subtask'
                                                        ? 'Chọn epic cha'
                                                        : 'Chọn công việc cha'
                                                }
                                                isClearable
                                                styles={selectStyles}
                                            />
                                        ) : (
                                            <div className="text-sm text-gray-700">
                                                {workItem?.parentItem ? (
                                                    <div className="flex items-center space-x-2">
                                                        {getTypeIcon(
                                                            workItem?.parentItem
                                                                ?.type
                                                        )}
                                                        <span className="font-mono text-blue-600">
                                                            {
                                                                workItem
                                                                    .parentItem
                                                                    .key
                                                            }
                                                        </span>
                                                        <span>
                                                            {
                                                                workItem
                                                                    .parentItem
                                                                    .summary
                                                            }
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">
                                                        {workItem?.type ==
                                                        'Task'
                                                            ? 'Không có epic cha'
                                                            : 'Không có công việc cha'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Attachments Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Tập tin đính kèm
                                        </h3>
                                    </div>

                                    {/* Attachment Upload Area */}
                                    {isEditing &&
                                        !workItem?.parentLecturerWorkItemId && (
                                            <div className="space-y-4">
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                                                    <div className="text-center">
                                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                        <div className="mt-4">
                                                            <label
                                                                htmlFor="attachment-upload"
                                                                className="cursor-pointer"
                                                            >
                                                                <span className="text-blue-600 hover:text-blue-500 font-medium">
                                                                    Chọn tập tin
                                                                </span>
                                                                <span className="text-gray-500">
                                                                    {' '}
                                                                    hoặc kéo thả
                                                                </span>
                                                            </label>
                                                            <input
                                                                id="attachment-upload"
                                                                type="file"
                                                                multiple
                                                                className="hidden"
                                                                onChange={(e) =>
                                                                    handleFileChange(
                                                                        e,
                                                                        'ATTACHMENT'
                                                                    )
                                                                }
                                                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            PDF, DOC, TXT, Ảnh,
                                                            ZIP dung lượng tối
                                                            đa 5MB mỗi tập tin
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Selected Attachments */}
                                                {newAttachments.ATTACHMENT
                                                    .length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-gray-700">
                                                                Tập tin đã chọn
                                                                (
                                                                {
                                                                    newAttachments
                                                                        .ATTACHMENT
                                                                        .length
                                                                }
                                                                )
                                                            </p>
                                                            <Button
                                                                onClick={() =>
                                                                    handleAttachmentUpload(
                                                                        'ATTACHMENT'
                                                                    )
                                                                }
                                                                disabled={
                                                                    loading
                                                                }
                                                                size="sm"
                                                                variant="default"
                                                            >
                                                                {loading ? (
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                        <span>
                                                                            Đang
                                                                            tải
                                                                            lên...
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    'Tải lên tập tin'
                                                                )}
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {newAttachments.ATTACHMENT.map(
                                                                (
                                                                    file,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                                                    >
                                                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                                            <Paperclip className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                                    {
                                                                                        file.name
                                                                                    }
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
                                                                                removeNewFile(
                                                                                    'ATTACHMENT',
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
                                        )}

                                    {/* Existing Attachments */}
                                    {workItem?.itemToAttachments?.some(
                                        (item) => item.type === 'ATTACHMENT'
                                    ) ? (
                                        <div className="space-y-2">
                                            {workItem.itemToAttachments
                                                .filter(
                                                    (item) =>
                                                        item.type ===
                                                        'ATTACHMENT'
                                                )
                                                .map(renderAttachmentCard)}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700">
                                            Không có tập tin
                                        </p>
                                    )}
                                </div>

                                {/* Work Evidence Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Tài liệu minh chứng
                                        </h3>
                                    </div>

                                    {/* Evidence Upload Area */}
                                    {isEditing && (
                                        <div className="space-y-4">
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                                                <div className="text-center">
                                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                    <div className="mt-4">
                                                        <label
                                                            htmlFor="evidence-upload"
                                                            className="cursor-pointer"
                                                        >
                                                            <span className="text-blue-600 hover:text-blue-500 font-medium">
                                                                Chọn tập tin
                                                            </span>
                                                            <span className="text-gray-500">
                                                                {' '}
                                                                hoặc kéo thả
                                                            </span>
                                                        </label>
                                                        <input
                                                            id="evidence-upload"
                                                            type="file"
                                                            multiple
                                                            className="hidden"
                                                            onChange={(e) =>
                                                                handleFileChange(
                                                                    e,
                                                                    'WORK EVIDENCE'
                                                                )
                                                            }
                                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        PDF, DOC, TXT, Images,
                                                        ZIP dung lượng tối đa
                                                        5MB mỗi tập tin
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Selected Evidence */}
                                            {newAttachments['WORK EVIDENCE']
                                                .length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium text-gray-700">
                                                            Tập tin đã chọn (
                                                            {
                                                                newAttachments[
                                                                    'WORK EVIDENCE'
                                                                ].length
                                                            }
                                                            )
                                                        </p>
                                                        <Button
                                                            onClick={() =>
                                                                handleAttachmentUpload(
                                                                    'WORK EVIDENCE'
                                                                )
                                                            }
                                                            disabled={loading}
                                                            size="sm"
                                                            variant="default"
                                                        >
                                                            {loading ? (
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                    <span>
                                                                        Đang tải
                                                                        lên...
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                'Tải lên tài liệu minh chứng'
                                                            )}
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {newAttachments[
                                                            'WORK EVIDENCE'
                                                        ].map((file, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                                            >
                                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                                    <FileCheck className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                                            {
                                                                                file.name
                                                                            }
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
                                                                        removeNewFile(
                                                                            'WORK EVIDENCE',
                                                                            index
                                                                        )
                                                                    }
                                                                    className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Existing Evidence */}
                                    {workItem?.itemToAttachments?.some(
                                        (item) => item.type === 'WORK EVIDENCE'
                                    ) ? (
                                        <div className="space-y-2">
                                            {workItem.itemToAttachments
                                                .filter(
                                                    (item) =>
                                                        item.type ===
                                                        'WORK EVIDENCE'
                                                )
                                                .map(renderAttachmentCard)}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700">
                                            Không có tài liệu minh chứng
                                        </p>
                                    )}
                                </div>

                                {/* Development Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Phát triển mã nguồn
                                    </h3>
                                    {workItem?.commits &&
                                    workItem.commits.length > 0 ? (
                                        <div className="space-y-2">
                                            {workItem.commits.map((commit) => (
                                                <a
                                                    key={commit.id}
                                                    href={commit.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-start space-x-3 p-3 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                                                >
                                                    <GitCommit className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="text-sm font-mono text-gray-800">
                                                                {commit.id.substring(
                                                                    0,
                                                                    7
                                                                )}
                                                            </span>
                                                            <span className="text-xs text-gray-600">
                                                                {formatDate(
                                                                    commit.commitAt,
                                                                    'dd/MM/yyyy HH:mm'
                                                                )}
                                                            </span>
                                                        </div>
                                                        {commit.message && (
                                                            <div className="text-sm text-gray-900 mb-1 line-clamp-2">
                                                                {commit.message}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-600">
                                                            <span className="text-green-700">
                                                                +
                                                                {
                                                                    commit.numberOfLineAdded
                                                                }
                                                            </span>{' '}
                                                            <span className="text-red-700">
                                                                -
                                                                {
                                                                    commit.numberOfLineDeleted
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-700">
                                                Không có commits liên kết
                                            </p>
                                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                                <h4 className="text-sm font-medium text-blue-900 mb-2">
                                                    Cách liên kết commits
                                                </h4>
                                                <div className="space-y-2 text-sm text-blue-800">
                                                    <p>
                                                        Bao gồm mã công việc
                                                        (key) trong commit
                                                        message:
                                                    </p>
                                                    <pre className="bg-blue-100 p-2 rounded font-mono text-xs">
                                                        git commit -m &quot;
                                                        {workItem?.key} your
                                                        commit message&quot;
                                                    </pre>
                                                    <p>Ví dụ:</p>
                                                    <pre className="bg-blue-100 p-2 rounded font-mono text-xs">
                                                        git commit -m &quot;
                                                        {workItem?.key} add user
                                                        authentication&quot;
                                                    </pre>
                                                    <div className="mt-4 text-xs text-blue-700">
                                                        <p className="font-medium">
                                                            Tips:
                                                        </p>
                                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                                            <li>
                                                                Luôn bao gồm mã
                                                                công việc (key)
                                                                ở đầu commit
                                                                message
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Feedback Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Lịch sử nhận xét
                                    </h3>
                                    {workItem?.feedbacks &&
                                    workItem.feedbacks.length > 0 ? (
                                        <div className="space-y-3">
                                            {workItem.feedbacks.map(
                                                (feedback) => (
                                                    <div
                                                        key={feedback.id}
                                                        className={cn(
                                                            'p-4 rounded-lg border flex items-start space-x-3',
                                                            feedback.type ===
                                                                'APPROVE'
                                                                ? 'bg-green-50 border-green-200'
                                                                : 'bg-red-50 border-red-200'
                                                        )}
                                                    >
                                                        <div className="flex-shrink-0">
                                                            {feedback.type ===
                                                            'APPROVE' ? (
                                                                <ThumbsUp className="h-5 w-5 text-green-600" />
                                                            ) : (
                                                                <ThumbsDown className="h-5 w-5 text-red-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p
                                                                    className={cn(
                                                                        'text-sm font-medium',
                                                                        feedback.type ===
                                                                            'APPROVE'
                                                                            ? 'text-green-800'
                                                                            : 'text-red-800'
                                                                    )}
                                                                >
                                                                    {feedback.type ===
                                                                    'APPROVE'
                                                                        ? 'Phê duyệt'
                                                                        : 'Từ chối'}
                                                                </p>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatDate(
                                                                        feedback.createdAt,
                                                                        'dd/MM/yyyy HH:mm'
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {feedback.comment && (
                                                                <div className="mt-1">
                                                                    <p className="text-sm text-gray-700">
                                                                        {
                                                                            feedback.comment
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {feedback.type ===
                                                                'APPROVE' &&
                                                                typeof workItem?.rating ===
                                                                    'number' && (
                                                                    <div className="mt-2 flex items-center space-x-1">
                                                                        {[
                                                                            ...Array(
                                                                                5
                                                                            ),
                                                                        ].map(
                                                                            (
                                                                                _,
                                                                                index
                                                                            ) => (
                                                                                <Star
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                    className={cn(
                                                                                        'h-4 w-4',
                                                                                        index <
                                                                                            workItem.rating!
                                                                                            ? 'text-yellow-400 fill-current'
                                                                                            : 'text-gray-300'
                                                                                    )}
                                                                                />
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700">
                                            Không có nhận xét
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Details */}
                            <div className="space-y-6">
                                {/* Status */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-700">
                                        TRẠNG THÁI
                                    </h3>
                                    {isEditing ? (
                                        <Select
                                            value={{
                                                value:
                                                    editedWorkItem?.status ||
                                                    workItem?.status ||
                                                    '',
                                                label:
                                                    editedWorkItem?.status ||
                                                    workItem?.status ||
                                                    '',
                                            }}
                                            onChange={(option) => {
                                                if (option) {
                                                    setEditedWorkItem(
                                                        (prev) => ({
                                                            ...prev,
                                                            status: option.value as WorkItemStatus,
                                                        })
                                                    );
                                                }
                                            }}
                                            options={
                                                !workItem?.subItems?.length
                                                    ? [
                                                          {
                                                              value: 'TO DO',
                                                              label: 'TO DO',
                                                          },
                                                          {
                                                              value: 'IN PROGRESS',
                                                              label: 'IN PROGRESS',
                                                          },
                                                          {
                                                              value: 'WAIT FOR REVIEW',
                                                              label: 'WAIT FOR REVIEW',
                                                          },
                                                      ]
                                                    : [
                                                          {
                                                              value: 'TO DO',
                                                              label: 'TO DO',
                                                          },
                                                          {
                                                              value: 'IN PROGRESS',
                                                              label: 'IN PROGRESS',
                                                          },
                                                          {
                                                              value: 'WAIT FOR REVIEW',
                                                              label: 'WAIT FOR REVIEW',
                                                          },
                                                          //   {
                                                          //       value: 'DONE',
                                                          //       label: 'DONE',
                                                          //   },
                                                      ]
                                            }
                                            className="text-sm"
                                            classNamePrefix="react-select"
                                            placeholder="Chọn trạng thái"
                                            styles={selectStyles}
                                        />
                                    ) : (
                                        <div
                                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${getStatusColor(
                                                workItem?.status || ''
                                            )}`}
                                        >
                                            {workItem?.status || 'Không có trạng thái'}
                                        </div>
                                    )}
                                </div>
                                {/* Type */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-medium text-gray-500">
                                        LOẠI
                                    </h3>
                                    <div
                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${getTypeColor(
                                            workItem?.type || 'Task'
                                        )}`}
                                    >
                                        {workItem?.type || 'Task'}
                                    </div>
                                </div>
                                {/* Sprint */}
                                {workItem?.type !== 'Subtask' &&
                                    workItem?.type !== 'Epic' && (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-semibold text-gray-700">
                                                SPRINT
                                            </h3>
                                            {isEditing ? (
                                                <Select
                                                    value={
                                                        sprints?.find(
                                                            (sprint) =>
                                                                sprint.id ===
                                                                editedWorkItem?.sprintId
                                                        )
                                                            ? {
                                                                  value:
                                                                      editedWorkItem?.sprintId?.toString() ||
                                                                      '',
                                                                  label:
                                                                      sprints.find(
                                                                          (
                                                                              sprint
                                                                          ) =>
                                                                              sprint.id ===
                                                                              editedWorkItem?.sprintId
                                                                      )?.name ||
                                                                      `SPRINT ${
                                                                          sprints.find(
                                                                              (
                                                                                  sprint
                                                                              ) =>
                                                                                  sprint.id ===
                                                                                  editedWorkItem?.sprintId
                                                                          )
                                                                              ?.number
                                                                      }`,
                                                              }
                                                            : null
                                                    }
                                                    onChange={(option) => {
                                                        setEditedWorkItem(
                                                            (prev) => ({
                                                                ...prev,
                                                                sprintId: option
                                                                    ? Number(
                                                                          option.value
                                                                      )
                                                                    : undefined,
                                                            })
                                                        );
                                                    }}
                                                    options={[
                                                        {
                                                            value: '',
                                                            label: 'Không sprint',
                                                        },
                                                        ...sprints.map(
                                                            (sprint) => ({
                                                                value: sprint.id.toString(),
                                                                label:
                                                                    sprint.name ||
                                                                    `SPRINT ${sprint.number}`,
                                                            })
                                                        ),
                                                    ]}
                                                    className="text-sm"
                                                    classNamePrefix="react-select"
                                                    placeholder="Select sprint"
                                                    isClearable
                                                    styles={selectStyles}
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-900">
                                                    {workItem?.sprint
                                                        ? workItem.sprint
                                                              .name ||
                                                          `SPRINT ${workItem.sprint.number}`
                                                        : 'Không thuộc sprint nào'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                {/* Assignee */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-700">
                                        THÀNH VIÊN ĐƯỢC GIAO
                                    </h3>
                                    {isEditing ? (
                                        <Select
                                            value={
                                                groupMembers?.find(
                                                    (member) =>
                                                        member.studentProjectId ===
                                                        editedWorkItem?.assigneeId
                                                )
                                                    ? {
                                                          value:
                                                              editedWorkItem?.assigneeId?.toString() ||
                                                              '',
                                                          label:
                                                              groupMembers.find(
                                                                  (member) =>
                                                                      member.studentProjectId ===
                                                                      editedWorkItem?.assigneeId
                                                              )?.name || '',
                                                      }
                                                    : null
                                            }
                                            onChange={(option) => {
                                                setEditedWorkItem((prev) => ({
                                                    ...prev,
                                                    assigneeId: option
                                                        ? Number(option.value)
                                                        : undefined,
                                                }));
                                            }}
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'Chưa giao',
                                                },
                                                ...groupMembers.map(
                                                    (member) => ({
                                                        value: member.studentProjectId.toString(),
                                                        label: member.name,
                                                    })
                                                ),
                                            ]}
                                            className="text-sm"
                                            classNamePrefix="react-select"
                                            placeholder="Chọn thành viên được giao"
                                            isClearable
                                            styles={selectStyles}
                                        />
                                    ) : workItem?.assignee ? (
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center ${getAvatarColor(
                                                    workItem.assignee
                                                        .studentClassroom
                                                        .student.name
                                                )}`}
                                            >
                                                <span className="text-white text-xs font-medium">
                                                    {generateInitials(
                                                        workItem.assignee
                                                            .studentClassroom
                                                            .student.name
                                                    )}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-900">
                                                {
                                                    workItem.assignee
                                                        .studentClassroom
                                                        .student.name
                                                }
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2 text-gray-500">
                                            <User className="h-5 w-5" />
                                            <span className="text-sm">
                                                Chưa giao
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* Story Points */}
                                {workItem?.type != 'Epic' && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-semibold text-gray-700">
                                            STORY POINTS
                                        </h3>
                                        {isEditing &&
                                        !workItem?.parentLecturerWorkItemId ? (
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={
                                                    editedWorkItem?.storyPoints ||
                                                    ''
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    setEditedWorkItem(
                                                        (prev) => ({
                                                            ...prev,
                                                            storyPoints: value
                                                                ? Number(value)
                                                                : undefined,
                                                        })
                                                    );
                                                }}
                                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Nhập story points"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-900">
                                                {workItem?.storyPoints !==
                                                    undefined &&
                                                workItem?.storyPoints !== null
                                                    ? workItem.storyPoints
                                                    : 'Chưa ước tính'}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Start Date */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-700">
                                        NGÀY BẮT ĐẦU
                                    </h3>
                                    {isEditing &&
                                    !workItem?.parentLecturerWorkItemId ? (
                                        <input
                                            type="datetime-local"
                                            value={
                                                editedWorkItem?.startDate
                                                    ? (() => {
                                                          const date = new Date(
                                                              editedWorkItem.startDate
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
                                                    setEditedWorkItem(
                                                        (prev) => ({
                                                            ...prev,
                                                            startDate:
                                                                undefined,
                                                        })
                                                    );
                                                    return;
                                                }

                                                // Convert from local datetime-local to UTC
                                                const localDate = new Date(
                                                    e.target.value
                                                );
                                                setEditedWorkItem((prev) => ({
                                                    ...prev,
                                                    startDate:
                                                        localDate.toISOString(),
                                                }));
                                            }}
                                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-900">
                                            {workItem?.startDate
                                                ? formatDate(
                                                      workItem.startDate,
                                                      'dd/MM/yyyy HH:mm'
                                                  )
                                                : 'Không đặt ngày bắt đầu'}
                                        </span>
                                    )}
                                </div>
                                {/* End Date */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-700">
                                        NGÀY KẾT THÚC
                                    </h3>
                                    {isEditing &&
                                    !workItem?.parentLecturerWorkItemId ? (
                                        <input
                                            type="datetime-local"
                                            value={
                                                editedWorkItem?.endDate
                                                    ? (() => {
                                                          const date = new Date(
                                                              editedWorkItem.endDate
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
                                                    setEditedWorkItem(
                                                        (prev) => ({
                                                            ...prev,
                                                            endDate: undefined,
                                                        })
                                                    );
                                                    return;
                                                }

                                                // Convert from local datetime-local to UTC
                                                const localDate = new Date(
                                                    e.target.value
                                                );

                                                // Validate that end date is not before start date
                                                if (
                                                    editedWorkItem?.startDate &&
                                                    localDate <
                                                        new Date(
                                                            editedWorkItem.startDate
                                                        )
                                                ) {
                                                    return; // Don't update if end date is before start date
                                                }

                                                setEditedWorkItem((prev) => ({
                                                    ...prev,
                                                    endDate:
                                                        localDate.toISOString(),
                                                }));
                                            }}
                                            min={
                                                editedWorkItem?.startDate
                                                    ? (() => {
                                                          const date = new Date(
                                                              editedWorkItem.startDate
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
                                    ) : (
                                        <span className="text-sm text-gray-900">
                                            {workItem?.endDate
                                                ? formatDate(
                                                      workItem.endDate,
                                                      'dd/MM/yyyy HH:mm'
                                                  )
                                                : 'Không đặt ngày kết thúc'}
                                        </span>
                                    )}
                                </div>
                                {/* Created Date */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-medium text-gray-500">
                                        NGÀY TẠO
                                    </h3>
                                    <span className="text-sm text-gray-900">
                                        {workItem?.createdAt
                                            ? formatDate(
                                                  workItem.createdAt,
                                                  'dd/MM/yyyy HH:mm'
                                              )
                                            : 'Không xác định'}
                                    </span>
                                </div>
                                {/* Updated Date - Only show if different from created date */}
                                {workItem?.updatedAt &&
                                    workItem?.updatedAt !==
                                        workItem?.createdAt && (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-medium text-gray-500">
                                                NGÀY CẬP NHẬT
                                            </h3>
                                            <span className="text-sm text-gray-900">
                                                {formatDate(
                                                    workItem.updatedAt,
                                                    'dd/MM/yyyy HH:mm'
                                                )}
                                            </span>
                                        </div>
                                    )}
                                {/* Reporter Details */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-medium text-gray-500">
                                        NGƯỜI TẠO
                                    </h3>
                                    {workItem?.reporter ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${getAvatarColor(
                                                        workItem.reporter.name
                                                    )}`}
                                                >
                                                    <span className="text-white text-xs font-medium">
                                                        {generateInitials(
                                                            workItem.reporter
                                                                .name
                                                        )}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-gray-900">
                                                    {workItem.reporter.name}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <div>
                                                    {workItem.reporter.email}
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    {/* <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                                                        {workItem.reporter.roles.join(
                                                            ', '
                                                        )}
                                                    </span> */}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2 text-gray-500">
                                            <User className="h-5 w-5" />
                                            <span className="text-sm">
                                                Không xác định người tạo
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end px-6 py-1 border-t bg-gray-50 space-x-2">
                        {!isEditing && isGroupLeader && workItem && (
                            <>
                                {workItem.status !== 'DONE' &&
                                    ((workItem.commits &&
                                        workItem.commits.length > 0) ||
                                        (workItem.itemToAttachments &&
                                            workItem.itemToAttachments.filter(
                                                (item) =>
                                                    item.type ===
                                                    'WORK EVIDENCE'
                                            ).length > 0) ||
                                        (workItem.subItems &&
                                            workItem.subItems?.length > 0 &&
                                            workItem.subItems.every(
                                                (subItem) =>
                                                    subItem.status === 'DONE'
                                            ))) && (
                                        <Button
                                            variant="default"
                                            onClick={() =>
                                                setShowApprovalDialog(true)
                                            }
                                        >
                                            Phê duyệt
                                        </Button>
                                    )}
                                {workItem.status === 'WAIT FOR REVIEW' && (
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setShowRejectDialog(true)
                                        }
                                    >
                                        Từ chối
                                    </Button>
                                )}
                            </>
                        )}
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                        >
                            Đóng
                        </Button>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            {workItem && (
                <>
                    <ApprovalDialog
                        isOpen={showApprovalDialog}
                        onClose={() => setShowApprovalDialog(false)}
                        onSubmit={handleApproval}
                        workItem={workItem}
                    />
                    <RejectDialog
                        isOpen={showRejectDialog}
                        onClose={() => setShowRejectDialog(false)}
                        onSubmit={handleReject}
                        workItem={workItem}
                    />
                    <SubtaskDialog
                        isOpen={showSubtaskDialog}
                        onClose={() => setShowSubtaskDialog(false)}
                        workItem={workItem}
                        onSubtaskCreated={onUpdate}
                        defaultAssigneeId={defaultAssigneeId}
                    />
                </>
            )}

            {/* Warning Modal for Delete */}
            <WarningModal
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Xóa công việc"
                description={`Bạn có chắc chắn muốn xóa "${workItem?.key} - ${workItem?.summary}"? Hành động này không thể được hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
            />

            {/* Click outside to close options menu */}
            {showOptionsMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowOptionsMenu(false)}
                />
            )}
        </>
    );
}
