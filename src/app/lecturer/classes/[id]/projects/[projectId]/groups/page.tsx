'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProjectContext } from '@/context/project-context';
import { getProjectGroups, getProjectStudents } from '@/services/api/project';
import { AutoDivideGroupsModal } from '@/components/auto-divide-groups-modal';
import {
    Users,
    BookOpen,
    Search,
    Filter,
    Eye,
    BarChart3,
    MoreHorizontal,
    Shuffle,
    Mail,
    IdCard,
    Crown,
    UserMinus,
    Workflow,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { WarningModal } from '@/components/warning-modal';
import { getUserInGroup, removeStudentFromGroup } from '@/services/api/group';
import { toast } from 'react-toastify';

interface Leader {
    id: number;
    createdAt: string;
    updatedAt: string;
    email: string;
    name: string | null;
    externalId: string | null;
    roles: string[];
    organizationId: number;
    addedById: number;
}

interface Topic {
    title: string;
}

interface ProjectGroup {
    number: number;
    leader: Leader;
    numberOfMember: number;
    topic: Topic | null;
    id: number;
}

interface ProjectStudent {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    email: string;
    name: string | null;
    externalId: string | null;
    roles: string[];
    organizationId: number;
    addedById: number;
    groupNumber: number | null;
    role: 'LEADER' | 'MEMBER' | null;
}

interface GroupMember {
    id: number;
    name: string | null;
    email: string;
    externalId: string | null;
    roleInGroup: 'LEADER' | 'MEMBER';
    studentProjectId: number;
}

export default function GroupsPage() {
    const { projectData } = useProjectContext();
    const [groups, setGroups] = useState<ProjectGroup[]>([]);
    const [students, setStudents] = useState<ProjectStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAutoDivideModal, setShowAutoDivideModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<ProjectGroup | null>(
        null
    );
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showRemoveWarning, setShowRemoveWarning] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(
        null
    );
    const router = useRouter();
    const fetchData = async () => {
        if (!projectData?.id) return;

        try {
            setLoading(true);
            setError(null);
            const [groupsData, studentsData] = await Promise.all([
                getProjectGroups(projectData.id),
                getProjectStudents(projectData.id),
            ]);
            setGroups(groupsData);
            setStudents(studentsData);
        } catch (error: any) {
            console.log('🚀 ~ fetchData ~ error:', error);
            setError(error.message || 'Đã xảy ra lỗi khi tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [projectData?.id]);

    const filteredGroups = groups.filter((group) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            group.number.toString().includes(searchLower) ||
            group.leader.name?.toLowerCase().includes(searchLower) ||
            group.leader.email.toLowerCase().includes(searchLower) ||
            group.topic?.title?.toLowerCase().includes(searchLower)
        );
    });

    const totalGroups = groups.length;
    const groupsWithTopics = groups.filter(
        (group) => group.topic !== null
    ).length;
    // const groupsWithoutTopics = groups.filter(
    //     (group) => group.topic === null
    // ).length;
    const totalStudents = students.length;
    const studentsWithoutGroup = students.filter(
        (student) => !student.groupNumber
    ).length;

    const handleGroupsDivided = async () => {
        // Refetch data after auto-dividing groups
        if (!projectData?.id) return;

        try {
            const [groupsData, studentsData] = await Promise.all([
                getProjectGroups(projectData.id),
                getProjectStudents(projectData.id),
            ]);
            setGroups(groupsData);
            setStudents(studentsData);
        } catch (error: any) {
            console.log('🚀 ~ handleGroupsDivided ~ error:', error);
        }
    };

    const handleViewMembers = async (group: ProjectGroup) => {
        setSelectedGroup(group);
        setShowMembersModal(true);
        try {
            setLoadingMembers(true);
            const members = await getUserInGroup(group.id);
            setGroupMembers(members);
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleRemoveMember = (member: GroupMember) => {
        setMemberToRemove(member);
        setShowRemoveWarning(true);
    };

    const handleConfirmRemove = async () => {
        if (!memberToRemove || !selectedGroup) return;

        try {
            await removeStudentFromGroup(
                memberToRemove.studentProjectId,
                selectedGroup.id
            );
            toast.success('Thành viên đã được xóa khỏi nhóm');
            // Refresh members list
            if (groupMembers.length > 1) {
                const updatedMembers = await getUserInGroup(selectedGroup.id);
                setGroupMembers(updatedMembers);
            } else {
                setShowMembersModal(false);
                setSelectedGroup(null);
            }
            if (projectData?.id) {
            const [groupsData, studentsData] = await Promise.all([
                getProjectGroups(projectData.id),
                getProjectStudents(projectData.id),
            ]);
                setGroups(groupsData);
                setStudents(studentsData);
            }
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
        setShowRemoveWarning(false);
        setMemberToRemove(null);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
                    </div>
                    <div className="flex space-x-3">
                        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-24 bg-gray-200 rounded-lg animate-pulse"
                        />
                    ))}
                </div>

                <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="text-red-500 text-lg font-medium mb-2">
                    Đã xảy ra lỗi khi tải nhóm
                </div>
                <div className="text-gray-600 mb-4">{error}</div>
                <Button onClick={() => window.location.reload()}>
                    Thử lại
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Danh sách nhóm dự án
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Quản lý nhóm tham gia dự án này
                    </p>
                </div>
                <div className="flex space-x-3">
                    {projectData?.type == 'TEAM' && (
                        <Button
                            variant="outline"
                            onClick={() => setShowAutoDivideModal(true)}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                            <Shuffle className="w-4 h-4 mr-2" />
                            Tự động chia nhóm
                        </Button>
                    )}
                    {/* <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Group
                    </Button> */}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-7 pt-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalGroups}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Tổng số nhóm
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-7 pt-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-100 rounded-full">
                                <BookOpen className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {groupsWithTopics}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Số nhóm có chủ đề
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-orange-100 rounded-full">
                                <Hash className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {studentsWithoutGroup}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Without Group
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card> */}
            </div>

            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Tìm kiếm theo số nhóm, trưởng nhóm, hoặc chủ đề..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Lọc
                </Button>
            </div>

            {/* Groups Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nhóm
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trưởng nhóm
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Số thành viên
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chủ đề
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredGroups.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center"
                                        >
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Không tìm thấy nhóm
                                            </h3>
                                            <p className="text-gray-600">
                                                {searchTerm
                                                    ? 'Vui lòng điều chỉnh tiêu chí tìm kiếm.'
                                                    : 'Không có nhóm nào được tạo cho dự án này.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredGroups?.map((group) => (
                                        <tr
                                            key={group.number}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">
                                                            {group?.number}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            Nhóm {group?.number}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <Crown className="w-4 h-4 text-yellow-500" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {group?.leader
                                                                ?.name ||
                                                                'Không có tên'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {
                                                                group?.leader
                                                                    ?.email
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {group.numberOfMember}{' '}
                                                        thành viên
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant={
                                                        group.topic
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {group.topic
                                                        ? group.topic.title
                                                        : 'Chưa chọn'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-48"
                                                    >
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.push(
                                                                    `groups/${group.id}/works`
                                                                )
                                                            }
                                                        >
                                                            <Workflow className="w-4 h-4 mr-2" />
                                                            Xem tất cả các công
                                                            việc
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.push(
                                                                    `groups/${group.id}/statistics`
                                                                )
                                                            }
                                                        >
                                                            <BarChart3 className="w-4 h-4 mr-2" />
                                                            Xem thống kê
                                                        </DropdownMenuItem>
                                                        {projectData?.type ==
                                                            'TEAM' && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleViewMembers(
                                                                        group
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Xem tất cả thành
                                                                viên
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Auto Divide Groups Modal */}
            <AutoDivideGroupsModal
                isOpen={showAutoDivideModal}
                onClose={() => setShowAutoDivideModal(false)}
                onGroupsDivided={handleGroupsDivided}
                projectId={projectData?.id || 0}
                existingGroupsCount={totalGroups}
                totalStudents={totalStudents}
                studentsWithoutGroup={studentsWithoutGroup}
            />

            {/* Group Members Modal */}
            <Transition appear show={showMembersModal} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setShowMembersModal(false)}
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
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-xl font-semibold leading-6 text-gray-900 mb-2"
                                    >
                                        Thành viên nhóm {selectedGroup?.number}
                                    </Dialog.Title>
                                    <p className="text-gray-600 mb-6">
                                        Quản lý thành viên của nhóm này
                                    </p>

                                    <div className="py-4">
                                        {loadingMembers ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {groupMembers.map((member) => (
                                                    <div
                                                        key={
                                                            member.studentProjectId
                                                        }
                                                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-medium text-gray-900">
                                                                    {member.name ||
                                                                        'Không có tên'}
                                                                </span>
                                                                {member.roleInGroup ===
                                                                    'LEADER' && (
                                                                    <Crown className="h-4 w-4 text-yellow-500" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                                <div className="flex items-center space-x-1">
                                                                    <Mail className="h-4 w-4" />
                                                                    <span>
                                                                        {
                                                                            member.email
                                                                        }
                                                                    </span>
                                                                </div>
                                                                {member.externalId && (
                                                                    <div className="flex items-center space-x-1">
                                                                        <IdCard className="h-4 w-4" />
                                                                        <span>
                                                                            {
                                                                                member.externalId
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleRemoveMember(
                                                                    member
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <UserMinus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Remove Member Warning Modal */}
            <WarningModal
                isOpen={showRemoveWarning}
                onClose={() => {
                    setShowRemoveWarning(false);
                    setMemberToRemove(null);
                }}
                onConfirm={handleConfirmRemove}
                title="Xóa thành viên"
                description={`Bạn có chắc chắn muốn xóa ${
                    memberToRemove?.name || 'thành viên này'
                } khỏi nhóm? Thao tác này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
            />
        </div>
    );
}
