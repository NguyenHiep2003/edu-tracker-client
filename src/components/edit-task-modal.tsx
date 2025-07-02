'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import {
    getLecturerAssignedItemInfo,
    updateLecturerAssignedItem,
} from '@/services/api/work_items';

interface LecturerAssignedItem {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    type: 'Task' | 'Story';
    summary: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    reporterId: number;
    projectId: number;
    assignType: 'ALL' | 'SPECIFIC';
    groupIds: string | null;
    scheduledJobId: string;
    itemToAttachments: Array<{
        id: number;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        attachment: {
            id: number;
            createdAt: string;
            updatedAt: string;
            deletedAt: string | null;
            cloudId: string;
            url: string;
            name: string;
            type: string;
        };
    }>;
}

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
    jobStatus: string;
    onUpdate: () => void;
}

export function EditTaskModal({
    isOpen,
    onClose,
    taskId,
    jobStatus,
    onUpdate,
}: EditTaskModalProps) {
    const [task, setTask] = useState<LecturerAssignedItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editedTask, setEditedTask] =
        useState<Partial<LecturerAssignedItem> | null>(null);
    const [isStartDateChanged, setIsStartDateChanged] = useState(false);
    const [newAttachments, setNewAttachments] = useState<File[]>([]);
    const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>(
        []
    );

    useEffect(() => {
        if (isOpen && taskId) {
            fetchTaskDetails();
        }
    }, [isOpen, taskId]);

    const fetchTaskDetails = async () => {
        try {
            setLoading(true);
            const taskData = await getLecturerAssignedItemInfo(taskId);
            setTask(taskData);
            setEditedTask(taskData);
            setNewAttachments([]);
            setDeletedAttachmentIds([]);
        } catch (error: any) {
            console.log("🚀 ~ fetchTaskDetails ~ error:", error)
            toast.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editedTask || !task) return;
        if (
            editedTask.endDate &&
            editedTask.startDate &&
            new Date(editedTask.endDate) < new Date(editedTask.startDate)
        ) {
            toast.error('Ngày kết thúc không thể trước ngày bắt đầu');
            return;
        }
        try {
            setSaving(true);
            const updatedData = {
                type: editedTask.type,
                summary: editedTask.summary,
                description: editedTask.description,
                startDate: isStartDateChanged
                    ? editedTask.startDate
                    : undefined,
                endDate: editedTask.endDate,
                deletedAttachmentIds: deletedAttachmentIds,
                attachments:
                    newAttachments.length > 0 ? newAttachments : undefined,
            };
            await updateLecturerAssignedItem(taskId, updatedData);

            toast.success('Công việc đã được cập nhật thành công');
            setIsStartDateChanged(false);
            setNewAttachments([]);
            setDeletedAttachmentIds([]);
            onUpdate();
            onClose();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Lỗi khi cập nhật công việc');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAttachment = (attachmentId: number) => {
        setDeletedAttachmentIds([...deletedAttachmentIds, attachmentId]);
    };

    const handleAddAttachments = (files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            setNewAttachments([...newAttachments, ...fileArray]);
        }
    };

    const handleRemoveNewAttachment = (index: number) => {
        setNewAttachments(newAttachments.filter((_, i) => i !== index));
    };

    const getExistingAttachments = () => {
        if (!task) return [];
        return task.itemToAttachments.filter(
            (itemToAttachment) =>
                !deletedAttachmentIds.includes(itemToAttachment.attachment.id)
        );
    };

    if (!isOpen) return null;

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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium text-gray-900"
                                    >
                                        Chỉnh sửa công việc
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xl font-bold"
                                    >
                                        ×
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-2 text-gray-600">
                                            Đang tải dữ liệu chi tiết...
                                        </span>
                                    </div>
                                ) : task && editedTask ? (
                                    <div className="space-y-4">
                                        {/* Type */}
                                        <div>
                                            <Label
                                                htmlFor="type"
                                                className="text-gray-900"
                                            >
                                                Type
                                            </Label>
                                            <select
                                                id="type"
                                                value={
                                                    editedTask.type || task.type
                                                }
                                                onChange={(e) =>
                                                    setEditedTask({
                                                        ...editedTask,
                                                        type: e.target.value as
                                                            | 'Task'
                                                            | 'Story',
                                                    })
                                                }
                                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="Task">
                                                    Task
                                                </option>
                                                <option value="Story">
                                                    Story
                                                </option>
                                            </select>
                                        </div>

                                        {/* Summary */}
                                        <div>
                                            <Label
                                                htmlFor="summary"
                                                className="text-gray-900"
                                            >
                                                Tóm tắt công việc
                                            </Label>
                                            <Input
                                                id="summary"
                                                value={
                                                    editedTask.summary ||
                                                    task.summary
                                                }
                                                onChange={(e) =>
                                                    setEditedTask({
                                                        ...editedTask,
                                                        summary: e.target.value,
                                                    })
                                                }
                                                placeholder="Nhập tóm tắt công việc"
                                                className="text-gray-700"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <Label
                                                htmlFor="description"
                                                className="text-gray-900"
                                            >
                                                Mô tả
                                            </Label>
                                            <Textarea
                                                id="description"
                                                value={
                                                    editedTask.description ||
                                                    task.description
                                                }
                                                onChange={(e) =>
                                                    setEditedTask({
                                                        ...editedTask,
                                                        description:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="Nhập mô tả công việc"
                                                className="text-gray-700"
                                                rows={4}
                                            />
                                        </div>

                                        {/* Start Date */}
                                        <div>
                                            <Label
                                                htmlFor="startDate"
                                                className="text-gray-900"
                                            >
                                                Ngày bắt đầu
                                            </Label>
                                            <Input
                                                id="startDate"
                                                type="datetime-local"
                                                value={
                                                    editedTask.startDate
                                                        ? (() => {
                                                              const date =
                                                                  new Date(
                                                                      editedTask.startDate
                                                                  );
                                                              // Convert to local timezone for datetime-local input
                                                              const offset =
                                                                  date.getTimezoneOffset();
                                                              const localDate =
                                                                  new Date(
                                                                      date.getTime() -
                                                                          offset *
                                                                              60 *
                                                                              1000
                                                                  );
                                                              return localDate
                                                                  .toISOString()
                                                                  .slice(0, 16);
                                                          })()
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    setEditedTask({
                                                        ...editedTask,
                                                        startDate: value
                                                            ? new Date(
                                                                  value
                                                              ).toISOString()
                                                            : null,
                                                    });
                                                    setIsStartDateChanged(true);
                                                }}
                                                disabled={jobStatus === 'DONE'}
                                                className="text-gray-700"
                                            />
                                            {jobStatus === 'DONE' && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Ngày bắt đầu không thể chỉnh sửa
                                                    khi công việc đã được xuất bản
                                                </p>
                                            )}
                                        </div>

                                        {/* End Date */}
                                        <div>
                                            <Label
                                                htmlFor="endDate"
                                                className="text-gray-900"
                                            >
                                                Ngày kết thúc
                                            </Label>
                                            <Input
                                                id="endDate"
                                                type="datetime-local"
                                                value={
                                                    editedTask.endDate
                                                        ? (() => {
                                                              const date =
                                                                  new Date(
                                                                      editedTask.endDate
                                                                  );
                                                              // Convert to local timezone for datetime-local input
                                                              const offset =
                                                                  date.getTimezoneOffset();
                                                              const localDate =
                                                                  new Date(
                                                                      date.getTime() -
                                                                          offset *
                                                                              60 *
                                                                              1000
                                                                  );
                                                              return localDate
                                                                  .toISOString()
                                                                  .slice(0, 16);
                                                          })()
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    setEditedTask({
                                                        ...editedTask,
                                                        endDate: value
                                                            ? new Date(
                                                                  value
                                                              ).toISOString()
                                                            : null,
                                                    });
                                                }}
                                                className="text-gray-700"
                                            />
                                        </div>

                                        {/* Attachments */}
                                        <div>
                                            <Label className="text-gray-900">
                                                Tập tin đính kèm
                                            </Label>

                                            {/* Existing Attachments */}
                                            {getExistingAttachments().length >
                                                0 && (
                                                <div className="mt-2 space-y-2">
                                                    <p className="text-sm font-medium text-gray-700">
                                                        Tập tin đính kèm đã có:
                                                    </p>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        {getExistingAttachments().map(
                                                            (
                                                                itemAttachment
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        itemAttachment.id
                                                                    }
                                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border"
                                                                >
                                                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                                        <span className="text-sm text-gray-700 truncate">
                                                                            {
                                                                                itemAttachment
                                                                                    .attachment
                                                                                    .name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleDeleteAttachment(
                                                                                itemAttachment
                                                                                    .attachment
                                                                                    .id
                                                                            )
                                                                        }
                                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center"
                                                                    >
                                                                        ×
                                                                    </Button>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* New Attachments Upload */}
                                            <div className="mt-3">
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        onChange={(e) =>
                                                            handleAddAttachments(
                                                                e.target.files
                                                            )
                                                        }
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        id="file-upload"
                                                    />
                                                    <label
                                                        htmlFor="file-upload"
                                                        className="flex items-center justify-center h-12 px-4 border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <div className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
                                                                Chọn tập tin
                                                            </div>
                                                            <span className="text-gray-500">
                                                                hoặc kéo và thả
                                                            </span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* New Attachments Preview */}
                                            {newAttachments.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    <p className="text-sm font-medium text-gray-700">
                                                        Tập tin đính kèm mới (
                                                        {newAttachments.length}
                                                        ):
                                                    </p>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        {newAttachments.map(
                                                            (file, index) => (
                                                                <div
                                                                    key={`${file.name}-${index}`}
                                                                    className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200"
                                                                >
                                                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
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
                                                                        onClick={() =>
                                                                            handleRemoveNewAttachment(
                                                                                index
                                                                            )
                                                                        }
                                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center"
                                                                    >
                                                                        ×
                                                                    </Button>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Assign Type (Read-only) */}
                                        <div>
                                            <Label
                                                htmlFor="assignType"
                                                className="text-gray-900"
                                            >
                                                Loại giao công việc
                                            </Label>
                                            <Input
                                                id="assignType"
                                                value={task.assignType}
                                                disabled
                                                className="text-gray-500 bg-gray-100"
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end space-x-2 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={onClose}
                                            >
                                                Hủy
                                            </Button>
                                            <Button
                                                onClick={handleSave}
                                                disabled={saving}
                                            >
                                                {saving ? (
                                                    <div className="flex items-center space-x-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        <span>Đang lưu...</span>
                                                    </div>
                                                ) : (
                                                    'Lưu thay đổi'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-600">
                                            Lỗi khi tải dữ liệu chi tiết
                                        </p>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
