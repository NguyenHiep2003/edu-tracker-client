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
    useEffect(() => {
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
                console.error('Error fetching data:', error);
                setError(error.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

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
            console.error('Error refetching data:', error);
        }
    };

    const handleViewMembers = async (group: ProjectGroup) => {
        setSelectedGroup(group);
        setShowMembersModal(true);
        try {
            setLoadingMembers(true);
            // TODO: Replace with actual API call to get group members
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
            toast.success('Member removed from group');
            // Refresh members list
            if (groupMembers.length > 1) {
                const updatedMembers = await getUserInGroup(selectedGroup.id);
                setGroupMembers(updatedMembers);
            } else {
                setShowMembersModal(false);
                setSelectedGroup(null);
            }
            // Refresh groups to update member count
            if (projectData?.id) {
                const [groupsData] = await Promise.all([
                    getProjectGroups(projectData.id),
                ]);
                setGroups(groupsData);
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
                    Error loading groups
                </div>
                <div className="text-gray-600 mb-4">{error}</div>
                <Button onClick={() => window.location.reload()}>
                    Try Again
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
                        Project Groups
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage groups participating in this project
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
                            Auto Divide Groups
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
                                    Total Groups
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
                                    With Topics
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
                        placeholder="Search by group number, leader, or topic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
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
                                        Group
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Leader
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Members
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Topic
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
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
                                                No groups found
                                            </h3>
                                            <p className="text-gray-600">
                                                {searchTerm
                                                    ? 'Try adjusting your search criteria.'
                                                    : 'No groups have been created for this project yet.'}
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
                                                            Group{' '}
                                                            {group?.number}
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
                                                                'No Name'}
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
                                                        member
                                                        {group.numberOfMember !==
                                                        1
                                                            ? 's'
                                                            : ''}
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
                                                        : 'Not chosen yet'}
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
                                                            View All Works
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.push(
                                                                    `groups/${group.id}/statistics`
                                                                )
                                                            }
                                                        >
                                                            <BarChart3 className="w-4 h-4 mr-2" />
                                                            View Statistics
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
                                                                View All Members
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
                                        Group {selectedGroup?.number} Members
                                    </Dialog.Title>
                                    <p className="text-gray-600 mb-6">
                                        Manage members of this group
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
                                                                        'No Name'}
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
                title="Remove Member"
                description={`Are you sure you want to remove ${
                    memberToRemove?.name || 'this member'
                } from the group? This action cannot be undone.`}
                confirmText="Remove"
                cancelText="Cancel"
            />
        </div>
    );
}
