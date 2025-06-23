'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    BookOpen,
    Plus,
    Search,
    Paperclip,
    Calendar,
    X,
    Upload,
    File,
    Trash2,
    GitPullRequest,
    Check,
    Users,
} from 'lucide-react';
import { useProjectContext } from '@/context/project-context';
import {
    getProjectTopics,
    updateProjectTopic,
    getProjectTopicRequest,
} from '@/services/api/project';
import { acceptTopicRequest } from '@/services/api/topic/request-topic';
import { AddTopicModal } from '@/components/add-topic-modal';
import { formatDate } from '@/lib/utils';
import { Topic } from '@/services/api/project/interface';
import { FileIcon } from 'react-file-icon';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';

interface TopicDetailModalProps {
    topic: Topic | null;
    isOpen: boolean;
    onClose: () => void;
    onTopicUpdated: () => void;
}

interface TopicRequest {
    id: number;
    title: string;
    description: string;
    isAccept: boolean;
    group: {
        number: number;
    };
}

const TopicDetailModal = ({
    topic,
    isOpen,
    onClose,
    onTopicUpdated,
}: TopicDetailModalProps) => {
    const { projectData } = useProjectContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [newAttachments, setNewAttachments] = useState<File[]>([]);
    const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>(
        []
    );
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        if (topic) {
            setEditedTitle(topic.title);
            setEditedDescription(topic.description ?? '');
            setNewAttachments([]);
            setAttachmentsToDelete([]);
        }
    }, [topic]);

    if (!topic) return null;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        setNewAttachments((prev) => [...prev, ...newFiles]);
    };

    const removeNewFile = (index: number) => {
        setNewAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const toggleDeleteAttachment = (attachmentId: number) => {
        setAttachmentsToDelete((prev) => {
            if (prev.includes(attachmentId)) {
                return prev.filter((id) => id !== attachmentId);
            }
            return [...prev, attachmentId];
        });
    };

    const handleSave = async () => {
        if (!projectData?.id) return;

        try {
            setLoading(true);
            await updateProjectTopic(topic.id, {
                title: editedTitle.trim(),
                description: editedDescription.trim(),
                attachments:
                    newAttachments.length > 0 ? newAttachments : undefined,
                attachmentsToDelete:
                    attachmentsToDelete.length > 0
                        ? attachmentsToDelete
                        : undefined,
            });
            toast.success('Topic updated successfully!');
            setIsEditing(false);
            onTopicUpdated();
        } catch (error: any) {
            console.error('Error updating topic:', error);
            toast.error(error.message || 'Failed to update topic');
        } finally {
            setLoading(false);
        }
    };

    const getFileIconProps = (fileType: string) => {
        const extension = fileType.split('/')[1];
        return {
            extension,
            type: extension,
        };
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

    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={() => {
                setIsEditing(false);
                onClose();
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Dialog.Content
                    className={cn(
                        'fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-50',
                        'w-[90vw] max-w-[800px] max-h-[90vh]',
                        'bg-white rounded-lg shadow-lg focus:outline-none flex flex-col'
                    )}
                >
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <Dialog.Title className="text-xl font-semibold text-gray-900">
                                    {isEditing ? (
                                        <div className="pr-4">
                                            <Input
                                                value={editedTitle}
                                                onChange={(e) =>
                                                    setEditedTitle(
                                                        e.target.value
                                                    )
                                                }
                                                className="text-xl font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Enter title"
                                            />
                                        </div>
                                    ) : (
                                        topic.title
                                    )}
                                </Dialog.Title>
                                {/* <Dialog.Description className="mt-1 text-sm text-gray-500">
                                    Created on {formatDate(topic.createdAt)}
                                </Dialog.Description> */}
                            </div>
                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(false)}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSave}
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Edit
                                    </Button>
                                )}
                                <Dialog.Close asChild>
                                    <button className="text-gray-400 hover:text-gray-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-2">
                                    Description
                                </h3>
                                {isEditing ? (
                                    <Textarea
                                        value={editedDescription}
                                        onChange={(e) =>
                                            setEditedDescription(e.target.value)
                                        }
                                        placeholder="Enter description"
                                        className="min-h-[100px] w-full resize-y break-words whitespace-pre-wrap bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                                    />
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] break-words">
                                        <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                            {topic.description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-2">
                                    Attachments
                                </h3>
                                {isEditing && (
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${
                                            dragActive
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600 mb-2">
                                            Drag and drop files here, or{' '}
                                            <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                                                browse
                                                <input
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) =>
                                                        handleFileSelect(
                                                            e.target.files
                                                        )
                                                    }
                                                />
                                            </label>
                                        </p>
                                    </div>
                                )}

                                {/* New Attachments */}
                                {newAttachments.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        <h4 className="text-sm font-medium text-gray-700">
                                            New Files:
                                        </h4>
                                        {newAttachments.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <File className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm text-gray-700 font-medium">
                                                        {file.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        (
                                                        {formatFileSize(
                                                            file.size
                                                        )}
                                                        )
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeNewFile(index)
                                                    }
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Existing Attachments */}
                                {topic.attachments &&
                                    topic.attachments.length > 0 && (
                                        <div className="space-y-2">
                                            {topic.attachments.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className={cn(
                                                        'flex items-center justify-between p-3 rounded-lg border',
                                                        attachmentsToDelete.includes(
                                                            file.id
                                                        )
                                                            ? 'bg-red-50 border-red-200'
                                                            : 'border-gray-200 hover:bg-gray-50'
                                                    )}
                                                >
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center flex-1"
                                                        onClick={(e) => {
                                                            if (isEditing)
                                                                e.preventDefault();
                                                        }}
                                                    >
                                                        <div className="w-8 h-8 mr-3">
                                                            <FileIcon
                                                                {...getFileIconProps(
                                                                    file.type
                                                                )}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p
                                                                className={cn(
                                                                    'text-sm font-medium truncate',
                                                                    attachmentsToDelete.includes(
                                                                        file.id
                                                                    )
                                                                        ? 'text-red-700 line-through'
                                                                        : 'text-gray-900 group-hover:text-blue-600'
                                                                )}
                                                            >
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {file.type}
                                                            </p>
                                                        </div>
                                                    </a>
                                                    {isEditing && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                toggleDeleteAttachment(
                                                                    file.id
                                                                )
                                                            }
                                                            className={cn(
                                                                'ml-2',
                                                                attachmentsToDelete.includes(
                                                                    file.id
                                                                )
                                                                    ? 'text-green-600 hover:text-green-700'
                                                                    : 'text-red-500 hover:text-red-700'
                                                            )}
                                                        >
                                                            {attachmentsToDelete.includes(
                                                                file.id
                                                            ) ? (
                                                                <Plus className="h-4 w-4" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

function TopicsPageContent() {
    const { projectData } = useProjectContext();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    // Topic requests state
    const [topicRequests, setTopicRequests] = useState<TopicRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'pending' | 'accepted'
    >('all');

    useEffect(() => {
        if (projectData?.id) {
            fetchTopics();
            fetchTopicRequests();
        }
    }, [projectData?.id]);

    const fetchTopics = async () => {
        if (!projectData?.id) return;

        try {
            setLoading(true);
            setError(null);
            const data = await getProjectTopics(projectData.id);
            setTopics(data);
        } catch (error: any) {
            console.error('Error fetching topics:', error);
            setError(error.message || 'Failed to load topics');
        } finally {
            setLoading(false);
        }
    };

    const fetchTopicRequests = async () => {
        if (!projectData?.id) return;

        try {
            setLoadingRequests(true);
            const data = await getProjectTopicRequest(projectData.id);
            setTopicRequests(data);
        } catch (error: any) {
            console.error('Error fetching topic requests:', error);
            // Don't show error toast as this might be a nice-to-have feature
        } finally {
            setLoadingRequests(false);
        }
    };

    const filteredTopics = topics.filter(
        (topic) =>
            topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (topic.description &&
                topic.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()))
    );

    const filteredTopicRequests = topicRequests.filter((request) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') return !request.isAccept;
        if (statusFilter === 'accepted') return request.isAccept;
        return true;
    });

    const handleTopicAdded = () => {
        fetchTopics();
        setShowAddModal(false);
    };

    const handleAcceptRequest = async (requestId: number) => {
        try {
            await acceptTopicRequest(requestId);
            toast.success('Topic request accepted successfully!');
            fetchTopicRequests(); // Refresh the list
            fetchTopics(); // Refresh topics in case a new one was created
        } catch (error: any) {
            console.error('Error accepting topic request:', error);
            toast.error(error.message || 'Failed to accept topic request');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Project Topics
                        </h1>
                        <p className="text-gray-600">
                            Manage topics for this project
                        </p>
                    </div>
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white p-6 rounded-lg border border-gray-200"
                        >
                            <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="bg-white p-6 rounded-lg border border-gray-200"
                        >
                            <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Failed to load topics
                    </h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchTopics} variant="outline">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Project Topics
                    </h1>
                    <p className="text-gray-600">
                        Manage topics for this project
                    </p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Topic</span>
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search topics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">Filter</Button>
            </div>

            {/* Topics Grid */}
            {filteredTopics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'No topics found' : 'No topics yet'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {searchTerm
                            ? 'Try adjusting your search terms'
                            : 'Get started by adding your first topic'}
                    </p>
                    {!searchTerm && (
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center space-x-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Topic</span>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTopics.map((topic) => (
                        <Card
                            key={topic.id}
                            className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                            onClick={() => setSelectedTopic(topic)}
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                                    {topic.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <p className="text-gray-600 line-clamp-3 overflow-hidden text-ellipsis">
                                        {topic.description}
                                    </p>
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            {formatDate(topic.createdAt)}
                                        </div>
                                        {topic.attachments &&
                                            topic.attachments.length > 0 && (
                                                <div className="flex items-center">
                                                    <Paperclip className="h-4 w-4 mr-1" />
                                                    {topic.attachments.length}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Topic Requests Section */}
            {projectData?.allowStudentCreateTopic && (
                <Card className="mt-8">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                                <GitPullRequest className="h-5 w-5" />
                                <span>Topic Requests from Students</span>
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-600">
                                    Filter by status:
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(
                                            e.target.value as
                                                | 'all'
                                                | 'pending'
                                                | 'accepted'
                                        )
                                    }
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="all">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingRequests ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredTopicRequests.length === 0 ? (
                            <div className="text-center py-8">
                                <GitPullRequest className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {statusFilter === 'all'
                                        ? 'No topic requests yet'
                                        : `No ${statusFilter} requests found`}
                                </h3>
                                <p className="text-gray-600">
                                    {statusFilter === 'all'
                                        ? 'Students have not submitted any topic requests yet.'
                                        : `There are no ${statusFilter} topic requests at the moment.`}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredTopicRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className={`border rounded-lg p-4 ${
                                            request.isAccept
                                                ? 'border-green-200 bg-green-50'
                                                : 'border-gray-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {request.title}
                                                    </h3>
                                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                        <Users className="h-4 w-4" />
                                                        <span>
                                                            Group{' '}
                                                            {
                                                                request.group
                                                                    .number
                                                            }
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                            request.isAccept
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    >
                                                        {request.isAccept
                                                            ? 'Accepted'
                                                            : 'Pending'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">
                                                    {request.description ||
                                                        'No description provided'}
                                                </p>
                                            </div>
                                            {!request.isAccept && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleAcceptRequest(
                                                            request.id
                                                        )
                                                    }
                                                    className="ml-4 flex items-center space-x-1"
                                                >
                                                    <Check className="h-4 w-4" />
                                                    <span>Accept</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Add Topic Modal */}
            <AddTopicModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onTopicAdded={handleTopicAdded}
                projectId={projectData?.id || 0}
            />

            {/* Topic Detail Modal */}
            <TopicDetailModal
                topic={selectedTopic}
                isOpen={!!selectedTopic}
                onClose={() => {
                    setSelectedTopic(null);
                }}
                onTopicUpdated={() => {
                    fetchTopics();
                    setSelectedTopic(null);
                }}
            />
        </div>
    );
}

// Loading skeleton component
function TopicsPageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-36 bg-gray-200 rounded" />
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white p-6 rounded-lg border border-gray-200"
                    >
                        <div className="h-6 bg-gray-200 rounded mb-4" />
                        <div className="h-4 bg-gray-200 rounded mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="bg-white p-6 rounded-lg border border-gray-200"
                    >
                        <div className="h-6 bg-gray-200 rounded mb-4" />
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded" />
                            <div className="h-4 bg-gray-200 rounded" />
                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ProjectTopicsPage() {
    return (
        <Suspense fallback={<TopicsPageSkeleton />}>
            <TopicsPageContent />
        </Suspense>
    );
}
