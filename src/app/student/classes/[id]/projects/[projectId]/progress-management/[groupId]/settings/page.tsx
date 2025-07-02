'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Select from 'react-select';
import { useGroupContext } from '@/context/group-context';
import { toast } from 'react-toastify';
import {
    Github,
    Loader2,
    Plus,
    BookOpen,
    X,
    Eye,
    GitPullRequest,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import {
    getAvailableRepository,
    getGitAccountInProject,
    getGitHubAccounts,
    setRepository,
    updateGitAccountInProject,
    getGroupRepositories,
    getInstallAppUrl,
    getAuthUrl,
    removeRepository,
} from '@/services/api/github';
import { getProjectTopics } from '@/services/api/project';
import {
    updateGroupTopic,
    requestNewTopic,
    getTopicRequest,
} from '@/services/api/group';
import {
    updateTopicRequest,
    deleteTopicRequest,
} from '@/services/api/topic/request-topic';
import { Topic } from '@/services/api/project/interface';
import { useStudentProjectContext } from '@/context/student-project-context';
import { WarningModal } from '@/components/warning-modal';
import { formatDate } from '@/helper/date-formatter';

// TopicDetailModal component for viewing topic details
const TopicDetailModal = ({
    topic,
    isOpen,
    onClose,
}: {
    topic: Topic | null;
    isOpen: boolean;
    onClose: () => void;
}) => {
    if (!topic) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Dialog.Content
                    className={cn(
                        'fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-50',
                        'w-[90vw] max-w-[600px] max-h-[80vh]',
                        'bg-white rounded-lg shadow-lg focus:outline-none flex flex-col'
                    )}
                >
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <Dialog.Title className="text-xl font-semibold text-gray-900">
                                {topic.title}
                            </Dialog.Title>
                            <Dialog.Close asChild>
                                <button className="text-gray-400 hover:text-gray-500">
                                    <X className="h-5 w-5" />
                                </button>
                            </Dialog.Close>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-2">
                                    Mô tả
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4 border max-h-60 overflow-y-auto overflow-x-hidden">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-all overflow-wrap-anywhere">
                                        {topic.description
                                            ? topic.description
                                            : 'Không có mô tả'}
                                    </p>
                                </div>
                            </div>

                            {topic.attachments &&
                                topic.attachments.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                                            Tài liệu đính kèm (
                                            {topic.attachments.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {topic.attachments.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                                >
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center flex-1"
                                                    >
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 mr-3 text-blue-500">
                                                                📄
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {file.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {file.type}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

interface GitAccount {
    id: number;
    username: string;
    isDefault: boolean;
    userId: number;
    connectedAt: string;
    installedApp: boolean;
}

interface Repository {
    id: number;
    name: string;
    fullname: string;
}

interface GroupRepository {
    id: number;
    name: string;
    alias: string;
    groupId: number;
}

interface SelectOption {
    value: string;
    label: string;
}

interface TopicRequest {
    id: number;
    title: string;
    description: string;
    isAccept: boolean;
}

export default function GroupSettings() {
    const { groupData, isGroupLeader, refetchGroup } = useGroupContext();
    const [loading, setLoading] = useState(true);
    const [gitAccount, setGitAccount] = useState<GitAccount | null>(null);
    const [availableAccounts, setAvailableAccounts] = useState<GitAccount[]>(
        []
    );
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [groupRepositories, setGroupRepositories] = useState<
        GroupRepository[]
    >([]);
    const [selectedRepo, setSelectedRepo] = useState<SelectOption | null>(null);
    const [repoAlias, setRepoAlias] = useState<string>('');
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [showAddRepo, setShowAddRepo] = useState(false);
    const [showAccountSelection, setShowAccountSelection] = useState(false);
    const { projectData } = useStudentProjectContext();
    // Topic selection states
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showRequestTopicModal, setShowRequestTopicModal] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [newTopicDescription, setNewTopicDescription] = useState('');
    // Topic requests states
    const [topicRequests, setTopicRequests] = useState<TopicRequest[]>([]);
    const [loadingTopicRequests, setLoadingTopicRequests] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<TopicRequest | null>(
        null
    );
    const [editingRequest, setEditingRequest] = useState<TopicRequest | null>(
        null
    );
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [showRemoveRepoWarning, setShowRemoveRepoWarning] = useState(false);
    const [selectedRepoToRemove, setSelectedRepoToRemove] =
        useState<GroupRepository | null>(null);
    useEffect(() => {
        if (groupData) {
            loadGitAccount();
            loadTopicRequests();
            loadGroupRepositories();
        }
    }, [groupData]);

    const loadGitAccount = async () => {
        try {
            setLoading(true);
            const data = await getGitAccountInProject(groupData.projectId);

            if (!data) {
                // No associated account, fetch available accounts
                const accountsData = await getGitHubAccounts();
                setAvailableAccounts(accountsData);

                // if (accountsData.length === 0) {
                //     // No accounts, need to authorize
                //     await handleGitHubAuth();
                // }
            } else {
                setGitAccount(data);
            }
        } catch (error) {
            console.log('🚀 ~ loadGitAccount ~ error:', error);
            toast.error('Lỗi khi tải thông tin tài khoản GitHub');
        } finally {
            setLoading(false);
        }
    };

    const loadGroupRepositories = async () => {
        try {
            const repos = await getGroupRepositories(groupData.id);
            setGroupRepositories(repos);
        } catch (error) {
            console.log('🚀 ~ loadGroupRepositories ~ error:', error);
            toast.error('Lỗi khi tải thông tin repository');
        }
    };

    const loadAvailableRepositories = async () => {
        try {
            setLoadingRepos(true);
            const data = await getAvailableRepository(groupData.id);
            setRepositories(data);
            setShowAddRepo(true);
        } catch (error) {
            console.log('🚀 ~ loadAvailableRepositories ~ error:', error);
            toast.error('Lỗi khi tải danh sách repository');
        } finally {
            setLoadingRepos(false);
        }
    };

    const handleGitHubAuth = async () => {
        try {
            const url = await getAuthUrl();
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const authWindow = window.open(
                url,
                'GitHub Authorization',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            if (authWindow) {
                const messageHandler = async (event: MessageEvent) => {
                    if (event.data?.type === 'github-auth-success') {
                        authWindow.close();
                        toast.success(
                            'Tài khoản GitHub đã được kết nối thành công!'
                        );

                        window.removeEventListener('message', messageHandler);

                        // If we're in account selection mode, refresh available accounts
                        if (showAccountSelection) {
                            const accountsData = await getGitHubAccounts();
                            setAvailableAccounts(accountsData);
                        } else {
                            await loadGitAccount();
                        }
                    } else if (event.data?.type === 'github-auth-error') {
                        window.removeEventListener('message', messageHandler);
                        toast.error('Lỗi khi xác thực tài khoản GitHub');
                    }
                };

                window.addEventListener('message', messageHandler);
            }
        } catch (error) {
            console.log('🚀 ~ handleGitHubAuth ~ error:', error);
            toast.error('Lỗi khi bắt đầu xác thực tài khoản GitHub');
        }
    };

    const handleInstallApp = async () => {
        try {
            const url = await getInstallAppUrl();
            const width = 1000;
            const height = 800;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const installWindow = window.open(
                url,
                'GitHub App Installation',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            if (installWindow) {
                const messageHandler = async (event: MessageEvent) => {
                    if (event.data?.type === 'github-install-success') {
                        installWindow.close();
                        window.removeEventListener('message', messageHandler);
                        toast.success('GitHub app đã được cài đặt thành công!');

                        await loadGitAccount();
                    } else if (event.data?.type === 'github-install-error') {
                        toast.error('Lỗi khi cài đặt GitHub app');
                    }
                };

                window.addEventListener('message', messageHandler);
            }
        } catch (error) {
            console.log('🚀 ~ handleInstallApp ~ error:', error);
            toast.error('Lỗi khi bắt đầu cài đặt GitHub app');
        }
    };

    const handleAccountSelect = async (accountId: string) => {
        try {
            await updateGitAccountInProject(
                groupData.projectId,
                parseInt(accountId)
            );
            const selectedAccount = availableAccounts.find(
                (acc) => acc.id.toString() === accountId
            );
            if (selectedAccount) {
                setGitAccount(selectedAccount);
                if (isGroupLeader) {
                    await loadGroupRepositories();
                }
            }
        } catch (error) {
            console.log('🚀 ~ handleAccountSelect ~ error:', error);
            toast.error('Lỗi khi chọn tài khoản GitHub');
        }
    };

    const handleRepositorySelect = async () => {
        if (!selectedRepo || !repoAlias) {
            toast.error('Vui lòng chọn một repository và cung cấp một alias');
            return;
        }

        try {
            await setRepository(groupData.id, selectedRepo.value, repoAlias);
            toast.success('Repository đã được thêm vào dự án thành công!');
            // Reset form and reload repositories
            setSelectedRepo(null);
            setRepoAlias('');
            setShowAddRepo(false);
            await loadGroupRepositories();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
    };

    const handleRemoveRepository = async (repoId: number | undefined) => {
        if (!repoId) {
            toast.error('Vui lòng chọn một repository để xóa!');
            return;
        }
        try {
            await removeRepository(groupData.id, repoId);
            toast.success('Repository đã được xóa thành công!');
            setShowRemoveRepoWarning(false);
            setSelectedRepoToRemove(null);
            await loadGroupRepositories();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Lỗi khi xóa repository');
            }
        }
    };

    const loadAvailableTopics = async () => {
        try {
            setLoadingTopics(true);
            const topics = await getProjectTopics(groupData.projectId);
            setAvailableTopics(topics);
            setShowTopicModal(true);
        } catch (error) {
            console.log('🚀 ~ loadAvailableTopics ~ error:', error);
            toast.error('Lỗi khi tải danh sách chủ đề');
        } finally {
            setLoadingTopics(false);
        }
    };

    const handleTopicSelect = async (topicId: number) => {
        try {
            await updateGroupTopic(groupData.id, topicId);
            toast.success('Chủ đề của nhóm đã được cập nhật thành công!');
            setShowTopicModal(false);
            await refetchGroup(); // Refresh group data to show new topic
        } catch (error: any) {
            console.log('🚀 ~ handleTopicSelect ~ error:', error);
            toast.error(error.message || 'Lỗi khi cập nhật chủ đề');
        }
    };

    const handleRequestNewTopic = async () => {
        if (!newTopicTitle.trim()) {
            toast.error('Vui lòng nhập tiêu đề của chủ đề');
            return;
        }

        try {
            await requestNewTopic(groupData.id, {
                title: newTopicTitle.trim(),
                description: newTopicDescription
                    ? newTopicDescription.trim()
                    : undefined,
            });
            toast.success('Yêu cầu chủ đề mới đã được tạo thành công!');
            setShowRequestTopicModal(false);
            setNewTopicTitle('');
            setNewTopicDescription('');
            loadTopicRequests(); // Refresh the list
        } catch (error: any) {
            console.log('🚀 ~ handleRequestNewTopic ~ error:', error);
            toast.error(error.message || 'Lỗi khi tạo yêu cầu chủ đề');
        }
    };

    const loadTopicRequests = async () => {
        if (!groupData?.id) return;

        try {
            setLoadingTopicRequests(true);
            const data = await getTopicRequest(groupData.id);
            setTopicRequests(data);
        } catch (error: any) {
            console.log('🚀 ~ loadTopicRequests ~ error:', error);
            toast.error('Lỗi khi tải danh sách yêu cầu chủ đề mới');
        } finally {
            setLoadingTopicRequests(false);
        }
    };

    const handleEditRequest = (request: TopicRequest) => {
        setEditingRequest(request);
        setEditTitle(request.title);
        setEditDescription(request.description);
    };

    const handleSaveEdit = async () => {
        if (!editingRequest || !editTitle.trim()) {
            toast.error('Vui lòng nhập tiêu đề của chủ đề');
            return;
        }

        try {
            await updateTopicRequest(editingRequest.id, {
                title: editTitle.trim(),
                description: editDescription
                    ? editDescription.trim()
                    : undefined,
            });
            toast.success('Yêu cầu chủ đề đã được cập nhật thành công!');
            setEditingRequest(null);
            setEditTitle('');
            setEditDescription('');
            loadTopicRequests(); // Refresh the list
        } catch (error: any) {
            console.log('🚀 ~ handleSaveEdit ~ error:', error);
            toast.error(error.message || 'Lỗi khi cập nhật yêu cầu chủ đề');
        }
    };

    const handleDeleteRequest = (request: TopicRequest) => {
        setRequestToDelete(request);
        setShowWarningModal(true);
    };

    const confirmDeleteRequest = async () => {
        if (!requestToDelete) return;

        try {
            await deleteTopicRequest(requestToDelete.id);
            toast.success('Yêu cầu chủ đề mới đã được xóa thành công!');
            loadTopicRequests(); // Refresh the list
        } catch (error: any) {
            console.log('🚀 ~ confirmDeleteRequest ~ error:', error);
            toast.error(error.message || 'Lỗi khi xóa yêu cầu chủ đề mới');
        } finally {
            setRequestToDelete(null);
            setShowWarningModal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-8 space-y-6">
            {/* Topic Selection Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Chủ đề của nhóm</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {groupData.topic ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium">
                                        Chủ đề hiện tại
                                    </h3>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {groupData.topic.title}
                                    </p>
                                </div>
                                {isGroupLeader && (
                                    <Button
                                        variant="outline"
                                        onClick={loadAvailableTopics}
                                        disabled={loadingTopics}
                                    >
                                        Thay đổi chủ đề
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-gray-600">
                                Chưa có chủ đề nào được chọn. Vui lòng chọn một
                                chủ đề.
                            </p>
                            {isGroupLeader && (
                                <Button
                                    onClick={loadAvailableTopics}
                                    disabled={loadingTopics}
                                >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Chọn chủ đề
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Topic Requests Card */}
            {projectData?.allowStudentCreateTopic && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <GitPullRequest className="h-5 w-5" />
                            <span>Yêu cầu chủ đề mới</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loadingTopicRequests ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : topicRequests.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-600">
                                    Không tìm thấy yêu cầu chủ đề mới. Mỗi nhóm
                                    có thể yêu cầu một chủ đề.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowTopicModal(false);
                                        setShowRequestTopicModal(true);
                                    }}
                                    className="w-fit"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Yêu cầu chủ đề mới
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {topicRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className={`border rounded-lg p-4 ${
                                            request.isAccept
                                                ? 'border-green-200 bg-green-50'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        {editingRequest?.id === request.id ? (
                                            <div className="space-y-3">
                                                <Input
                                                    value={editTitle}
                                                    onChange={(e) =>
                                                        setEditTitle(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Tiêu đề của chủ đề"
                                                    className="font-semibold"
                                                />
                                                <Textarea
                                                    value={editDescription}
                                                    onChange={(e) =>
                                                        setEditDescription(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Mô tả"
                                                    className="min-h-[100px] bg-white"
                                                />
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={handleSaveEdit}
                                                        disabled={
                                                            !editTitle.trim()
                                                        }
                                                    >
                                                        Lưu
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingRequest(
                                                                null
                                                            );
                                                            setEditTitle('');
                                                            setEditDescription(
                                                                ''
                                                            );
                                                        }}
                                                    >
                                                        Hủy
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="font-semibold text-gray-900">
                                                                {request.title}
                                                            </h3>
                                                            <span
                                                                className={`px-2 py-1 text-xs rounded-full ${
                                                                    request.isAccept
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                }`}
                                                            >
                                                                {request.isAccept
                                                                    ? 'Đã chấp nhận'
                                                                    : 'Đang chờ duyệt'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            {request.description ||
                                                                'Không có mô tả'}
                                                        </p>
                                                    </div>
                                                    {isGroupLeader && (
                                                        <div className="flex space-x-2 ml-4">
                                                            {!request.isAccept && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleEditRequest(
                                                                            request
                                                                        )
                                                                    }
                                                                >
                                                                    Cập nhật
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleDeleteRequest(
                                                                        request
                                                                    )
                                                                }
                                                            >
                                                                Xóa
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* GitHub Integration Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Kết nối GitHub</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <h3 className="text-sm font-medium">
                        Tài khoản GitHub của bạn
                    </h3>
                    {!gitAccount && availableAccounts.length > 0 ? (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">
                                Chọn tài khoản GitHub
                            </h3>
                            <Select
                                options={availableAccounts.map((account) => ({
                                    value: account.id.toString(),
                                    label: account.username,
                                }))}
                                onChange={(option) =>
                                    option && handleAccountSelect(option.value)
                                }
                                placeholder="Select an account"
                                className="basic-select"
                                classNamePrefix="select"
                            />
                        </div>
                    ) : !gitAccount ? (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-gray-600">
                                Không có tài khoản GitHub được kết nối. Vui lòng
                                kết nối tài khoản GitHub để tiếp tục.
                            </p>
                            <Button onClick={handleGitHubAuth}>
                                <Github className="mr-2 h-4 w-4" />
                                Kết nối tài khoản GitHub
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!showAccountSelection ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <Github className="h-6 w-6" />
                                        <div>
                                            <p className="font-medium">
                                                {gitAccount.username}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Đã kết nối lúc{' '}
                                                {formatDate(
                                                    gitAccount.connectedAt,
                                                    'dd/MM/yyyy HH:mm'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowAccountSelection(true);
                                            // Load available accounts when showing selection
                                            getGitHubAccounts().then(
                                                setAvailableAccounts
                                            );
                                        }}
                                    >
                                        Thay đổi tài khoản
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">
                                            Chọn tài khoản GitHub
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setShowAccountSelection(false)
                                            }
                                        >
                                            Hủy
                                        </Button>
                                    </div>

                                    {availableAccounts.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm text-gray-600">
                                                Tài khoản GitHub có sẵn:
                                            </h4>
                                            <Select
                                                options={availableAccounts
                                                    .filter(
                                                        (account) =>
                                                            account.id !==
                                                            gitAccount?.id
                                                    )
                                                    .map((account) => ({
                                                        value: account.id.toString(),
                                                        label: account.username,
                                                    }))}
                                                onChange={(option) => {
                                                    if (option) {
                                                        handleAccountSelect(
                                                            option.value
                                                        );
                                                        setShowAccountSelection(
                                                            false
                                                        );
                                                    }
                                                }}
                                                placeholder="Chọn tài khoản khác"
                                                className="basic-select"
                                                classNamePrefix="select"
                                            />
                                        </div>
                                    )}

                                    <div className="pt-2 border-t">
                                        <p className="text-sm text-gray-600 mb-2">
                                            Không thấy tài khoản bạn muốn?
                                        </p>
                                        <Button
                                            onClick={handleGitHubAuth}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Github className="mr-2 h-4 w-4" />
                                            Thêm tài khoản GitHub mới
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!gitAccount.installedApp && (
                                <div className="text-center space-y-4">
                                    <p className="text-sm text-gray-600">
                                        Vui lòng cài đặt GitHub app của chúng
                                        tôi để hoàn thành việc tích hợp.
                                    </p>
                                    <Button onClick={handleInstallApp}>
                                        <Github className="mr-2 h-4 w-4" />
                                        Cài đặt GitHub App
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">
                                        Repository của nhóm
                                    </h3>
                                    {!showAddRepo &&
                                        isGroupLeader &&
                                        gitAccount.installedApp && (
                                            <Button
                                                onClick={
                                                    loadAvailableRepositories
                                                }
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Thêm Repository
                                            </Button>
                                        )}
                                </div>

                                {groupRepositories.length > 0 && (
                                    <div className="space-y-2">
                                        {groupRepositories.map((repo) => (
                                            <div
                                                key={repo.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <Github className="h-4 w-4 text-gray-500" />
                                                        <p className="font-medium text-gray-900">
                                                            {repo.name}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        Alias:{' '}
                                                        <span className="font-medium text-gray-700">
                                                            {repo.alias}
                                                        </span>
                                                    </p>
                                                </div>
                                                {isGroupLeader && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedRepoToRemove(
                                                                repo
                                                            );
                                                            setShowRemoveRepoWarning(
                                                                true
                                                            );
                                                        }}
                                                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                                    >
                                                        <X className="h-4 w-4 mr-1" />
                                                        Xóa
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showAddRepo && (
                                    <div className="space-y-2">
                                        {loadingRepos ? (
                                            <div className="flex items-center space-x-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="text-sm text-gray-500">
                                                    Đang tải repository...
                                                </span>
                                            </div>
                                        ) : (
                                            <>
                                                <Select
                                                    options={repositories.map(
                                                        (repo) => ({
                                                            value: repo.name,
                                                            label: repo.fullname,
                                                        })
                                                    )}
                                                    value={selectedRepo}
                                                    onChange={(option) =>
                                                        setSelectedRepo(option)
                                                    }
                                                    placeholder="Chọn repository"
                                                    className="basic-select"
                                                    classNamePrefix="select"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Alias của repository"
                                                    className="w-full px-3 py-2 border rounded-md"
                                                    value={repoAlias}
                                                    onChange={(e) =>
                                                        setRepoAlias(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <div className="flex space-x-2">
                                                    <Button
                                                        onClick={
                                                            handleRepositorySelect
                                                        }
                                                        disabled={
                                                            !selectedRepo ||
                                                            !repoAlias
                                                        }
                                                    >
                                                        Thêm Repository
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowAddRepo(
                                                                false
                                                            );
                                                            setSelectedRepo(
                                                                null
                                                            );
                                                            setRepoAlias('');
                                                        }}
                                                    >
                                                        Hủy
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Topic Selection Modal */}
            <Dialog.Root open={showTopicModal} onOpenChange={setShowTopicModal}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
                    <Dialog.Content
                        className={cn(
                            'fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-50',
                            'w-[90vw] max-w-[700px] max-h-[80vh]',
                            'bg-white rounded-lg shadow-lg focus:outline-none flex flex-col'
                        )}
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <Dialog.Title className="text-xl font-semibold text-gray-900">
                                    Chọn chủ đề
                                </Dialog.Title>
                                <Dialog.Close asChild>
                                    <button className="text-gray-400 hover:text-gray-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingTopics ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                            ) : availableTopics.length > 0 ? (
                                <div className="space-y-4">
                                    {availableTopics.map((topic) => (
                                        <div
                                            key={topic.id}
                                            className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {topic.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1 truncate max-w-48">
                                                        {topic.description}
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2 ml-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSelectedTopic(
                                                                topic
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Xem chi tiết
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleTopicSelect(
                                                                topic.id
                                                            )
                                                        }
                                                    >
                                                        Chọn
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {projectData?.allowStudentCreateTopic &&
                                        topicRequests.length === 0 && (
                                            <div className="pt-4 border-t">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setShowTopicModal(
                                                            false
                                                        );
                                                        setShowRequestTopicModal(
                                                            true
                                                        );
                                                    }}
                                                    className="w-full"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Yêu cầu chủ đề mới
                                                </Button>
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-8">
                                    <p className="text-gray-500">
                                        Không có chủ đề nào có sẵn.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Request New Topic Modal */}
            <Dialog.Root
                open={showRequestTopicModal}
                onOpenChange={setShowRequestTopicModal}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
                    <Dialog.Content
                        className={cn(
                            'fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-50',
                            'w-[90vw] max-w-[500px]',
                            'bg-white rounded-lg shadow-lg focus:outline-none'
                        )}
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <Dialog.Title className="text-xl font-semibold text-gray-900">
                                    Yêu cầu chủ đề mới
                                </Dialog.Title>
                                <Dialog.Close asChild>
                                    <button className="text-gray-400 hover:text-gray-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tiêu đề chủ đề
                                </label>
                                <Input
                                    value={newTopicTitle}
                                    onChange={(e) =>
                                        setNewTopicTitle(e.target.value)
                                    }
                                    placeholder="Nhập tiêu đề chủ đề"
                                    className="w-full text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mô tả
                                </label>
                                <Textarea
                                    value={newTopicDescription}
                                    onChange={(e) =>
                                        setNewTopicDescription(e.target.value)
                                    }
                                    placeholder="Nhập mô tả chủ đề"
                                    className="w-full min-h-[100px] bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                                />
                            </div>
                            <div className="flex space-x-2 pt-4">
                                <Button
                                    onClick={handleRequestNewTopic}
                                    disabled={!newTopicTitle.trim()}
                                >
                                    Gửi yêu cầu
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowRequestTopicModal(false);
                                        setNewTopicTitle('');
                                        setNewTopicDescription('');
                                    }}
                                >
                                    Hủy
                                </Button>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Topic Detail Modal */}
            {selectedTopic && (
                <TopicDetailModal
                    topic={selectedTopic}
                    isOpen={!!selectedTopic}
                    onClose={() => setSelectedTopic(null)}
                />
            )}

            {/* Delete Warning Modal */}
            <WarningModal
                isOpen={showWarningModal}
                onClose={() => {
                    setShowWarningModal(false);
                    setRequestToDelete(null);
                }}
                onConfirm={confirmDeleteRequest}
                title="Xóa yêu cầu chủ đề mới"
                description={`Bạn có chắc chắn muốn xóa yêu cầu chủ đề mới "${requestToDelete?.title}"? Việc này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
            />
            <WarningModal
                isOpen={showRemoveRepoWarning}
                onClose={() => setShowRemoveRepoWarning(false)}
                onConfirm={() =>
                    handleRemoveRepository(selectedRepoToRemove?.id)
                }
                title="Xóa repository"
                description={`Bạn có chắc chắn muốn xóa repository "${selectedRepoToRemove?.name}" khỏi dự án?`}
                confirmText="Xóa"
                cancelText="Hủy"
            />
        </div>
    );
}
