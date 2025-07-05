'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users, Mail, Search, User, Crown, BookOpen, Plus } from 'lucide-react';
import { useStudentProjectContext } from '@/context/student-project-context';
import {
    getProjectGroups,
    createOwnGroup,
    joinGroup,
} from '@/services/api/project';
import { toast } from 'react-toastify';
import { ProjectGroup } from '@/services/api/project/interface';
import { formatDate } from '@/helper/date-formatter';


export default function StudentProjectGroupsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const {
        loading: projectLoading,
        projectData,
        refetchProject,
    } = useStudentProjectContext();

    const [groups, setGroups] = useState<ProjectGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
    const [isJoiningGroup, setIsJoiningGroup] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<ProjectGroup | null>(
        null
    );

    const fetchGroups = async () => {
        try {
            const data = await getProjectGroups(Number(projectId));

            setGroups(data);
        } catch (error) {
            console.log("🚀 ~ fetchGroups ~ error:", error)
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (projectId) {
            fetchGroups();
        }
    }, [projectId]);

    const handleCreateGroup = async () => {
        setIsCreatingGroup(true);
        try {
            await createOwnGroup(Number(projectId));
            toast.success('Nhóm đã được tạo thành công!');
            setShowCreateGroupModal(false);
            refetchProject();
            // fetchGroups();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Đã xảy ra lỗi khi tạo nhóm');
            }
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const handleJoinGroup = async () => {
        setIsJoiningGroup(true);
        try {
            await joinGroup(Number(projectId), Number(selectedGroup?.id));
            toast.success('Đã gửi yêu cầu tham gia nhóm thành công!');
            setShowJoinGroupModal(false);
            setSelectedGroup(null);
            refetchProject();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Đã xảy ra lỗi khi gửi yêu cầu tham gia nhóm');
            }
        } finally {
            setIsJoiningGroup(false);
        }
    };
    const getButtonDisabledState = () => {
        if (!projectData)
            return { disabled: true, tooltip: 'Đang tải dữ liệu dự án...' };

        if (!projectData.allowStudentFormTeam) {
            return {
                disabled: true,
                tooltip:
                    'Sinh viên không được phép lập nhóm cho dự án này',
            };
        }

        if (
            projectData.formGroupDeadline &&
            new Date(projectData.formGroupDeadline) < new Date()
        ) {
            return {
                disabled: true,
                tooltip: 'Thời gian lập nhóm đã quá hạn',
            };
        }

        if (projectData.groupId != null) {
            return { disabled: true, tooltip: 'Bạn đã tham gia nhóm' };
        }

        return { disabled: false, tooltip: '' };
    };

    const getJoinGroupButtonDisabledState = (group: ProjectGroup) => {
       if(getButtonDisabledState().disabled) return getButtonDisabledState();
       if(group.joinRequestCreated) return { disabled: true, tooltip: 'Bạn đã gửi yêu cầu tham gia nhóm này' };
       return { disabled: false, tooltip: '' };
    };

    const buttonState = getButtonDisabledState();

    const filteredGroups = groups.filter(
        (group) =>
            group.number.toString().includes(searchTerm) ||
            group.leader.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            group.leader.email
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            group.leader.externalId?.includes(searchTerm)
    );

    const totalMembers = groups.reduce(
        (sum, group) => sum + group.numberOfMember,
        0
    );
    const groupsWithTopics = groups.filter(
        (group) => group.topic !== null
    ).length;

    if (projectLoading || loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải danh sách nhóm...</p>
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
                        Danh sách nhóm của dự án
                    </h1>
                    <p className="text-gray-600">
                        {groups.length} nhóm với {totalMembers} thành viên
                    </p>
                </div>
                {projectData?.type == 'TEAM' && projectData.isJoined && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        onClick={() =>
                                            setShowCreateGroupModal(true)
                                        }
                                        className="flex items-center gap-2"
                                        disabled={buttonState.disabled}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tạo nhóm của bạn
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {buttonState.tooltip && (
                                <TooltipContent>
                                    <p className="text-xs text-gray-600">
                                        {buttonState.tooltip}
                                    </p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Tìm kiếm nhóm theo số nhóm, tên trưởng nhóm hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card>
                    <CardContent className="px-4 py-4 pt-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-blue-100 rounded-md">
                                <Users className="h-7 w-7 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-blue-600">
                                    Tổng số nhóm
                                </p>
                                <p className="text-lg font-bold text-blue-700">
                                    {groups.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="px-4 py-4 pt-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-green-100 rounded-md">
                                <User className="h-7 w-7 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-green-600">
                                    Tổng số thành viên
                                </p>
                                <p className="text-lg font-bold text-green-700">
                                    {totalMembers}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="px-4 py-4 pt-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-purple-100 rounded-md">
                                <Users className="h-7 w-7 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-purple-600">
                                    Trung bình số thành viên
                                </p>
                                <p className="text-lg font-bold text-purple-700">
                                    {groups.length > 0
                                        ? Math.round(
                                              (totalMembers / groups.length) *
                                                  10
                                          ) / 10
                                        : 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="px-4 py-4 pt-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-orange-100 rounded-md">
                                <BookOpen className="h-7 w-7 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-orange-600">
                                    Số nhóm có chủ đề
                                </p>
                                <p className="text-lg font-bold text-orange-700">
                                    {groupsWithTopics}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Groups List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredGroups.map((group) => (
                    <Card
                        key={group.number}
                        className="hover:shadow-md transition-shadow"
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    Nhóm {group.number}
                                    {group.id === projectData?.groupId &&
                                        ' (Nhóm của bạn)'}
                                </CardTitle>
                                <Badge
                                    variant="outline"
                                    className="text-xs text-gray-600"
                                >
                                    {group.numberOfMember} thành viên
                                </Badge>
                            </div>
                            {/* <CardDescription>
                                {group.topic
                                    ? 'Đã có chủ đề'
                                    : 'Chưa có chủ đề'}
                            </CardDescription> */}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Group Leader */}
                                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                                                <Crown className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">
                                                        {group.leader?.name ||
                                                            'Không có tên'}
                                                    </p>
                                                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                                        Trưởng nhóm
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {group.leader?.email}
                                                </p>
                                                {group.leader?.externalId && (
                                                    <p className="text-xs text-gray-500">
                                                        ID:{' '}
                                                        {
                                                            group.leader?.externalId
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {group.leader?.email && (
                                            <a
                                            href={`mailto:${group.leader?.email}`}
                                            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                                        >
                                                <Mail className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Topic Information */}
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BookOpen className="h-4 w-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Chủ đề
                                        </span>
                                    </div>
                                    {group.topic ? (
                                        <div>
                                            <p className="text-sm text-gray-900 font-medium">
                                                {group.topic.title}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">
                                            Chưa có chủ đề
                                        </p>
                                    )}
                                </div>

                                {/* Group Info */}
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <p>
                                            Tạo:{' '}
                                            {formatDate(
                                                group.createdAt,
                                                'dd/MM/yyyy HH:mm'
                                            )}
                                        </p>
                                        <p>
                                            Cập nhật:{' '}
                                            {formatDate(
                                                group.updatedAt,
                                                'dd/MM/yyyy HH:mm'
                                            )}
                                        </p>
                                    </div>
                                    {projectData?.type == 'TEAM' &&
                                        !projectData?.groupId && projectData.isJoined && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div>
                                                            <Button
                                                                onClick={() => {
                                                                    setShowJoinGroupModal(
                                                                        true
                                                                    );
                                                                    setSelectedGroup(
                                                                        group
                                                                    );
                                                                }}
                                                                className="flex items-center gap-2"
                                                                disabled={
                                                                    getJoinGroupButtonDisabledState(group).disabled
                                                                }
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                                Gửi yêu cầu tham gia nhóm
                                                            </Button>
                                                        </div>
                                                    </TooltipTrigger>
                                                    {getJoinGroupButtonDisabledState(group).tooltip && (
                                                        <TooltipContent>
                                                            <p className="text-xs text-gray-600">
                                                                {
                                                                    getJoinGroupButtonDisabledState(group).tooltip
                                                                }
                                                            </p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {filteredGroups.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12 pt-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                            {searchTerm
                                ? 'Không tìm thấy nhóm nào phù hợp với tìm kiếm của bạn.'
                                : 'Chưa có nhóm nào được tạo.'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Create Group Modal */}
            <Dialog
                open={showCreateGroupModal}
                onOpenChange={setShowCreateGroupModal}
            >
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">
                            Tạo nhóm của bạn
                        </DialogTitle>
                        <DialogDescription className="text-gray-900">
                            Bạn có chắc chắn muốn tạo nhóm của bạn? Bạn sẽ trở thành trưởng nhóm.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateGroupModal(false)}
                            disabled={isCreatingGroup}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleCreateGroup}
                            disabled={isCreatingGroup}
                        >
                            {isCreatingGroup ? 'Đang tạo...' : 'Tạo nhóm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showJoinGroupModal}
                onOpenChange={setShowJoinGroupModal}
            >
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">
                            Yêu cầu tham gia nhóm
                        </DialogTitle>
                        <DialogDescription className="text-gray-900">
                            Bạn có chắc chắn muốn tham gia nhóm {selectedGroup?.number}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowJoinGroupModal(false)}
                            disabled={isJoiningGroup}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleJoinGroup}
                            disabled={isJoiningGroup}
                        >
                            {isJoiningGroup ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
