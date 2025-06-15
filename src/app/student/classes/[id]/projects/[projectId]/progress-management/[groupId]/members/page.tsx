'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGroupContext } from '@/context/group-context';
import { toast } from 'react-toastify';
import {
    Loader2,
    Crown,
    Mail,
    IdCard,
    UserMinus,
    LogOut,
    UserCheck,
} from 'lucide-react';
import { useStudentProjectContext } from '@/context/student-project-context';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    getUserInGroup,
    transferLeadership,
    getJoinGroupRequest,
    acceptJoinGroupRequest,
    removeStudentFromGroup,
    leaveGroup,
} from '@/services/api/group';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useParams } from 'next/navigation';

interface GroupMember {
    id: number;
    email: string;
    name: string;
    externalId: string | null;
    roleInGroup: 'LEADER' | 'MEMBER';
    studentProjectId: number;
}

interface JoinRequest {
    id: number;
    createdAt: string;
    updatedAt: string;
    studentProjectId: number;
    groupId: number;
    studentProject: {
        id: number;
        createdAt: string;
        updatedAt: string;
        studentClassroomId: number;
        projectId: number;
        groupId: number;
        statusOnRepo: string;
        role: 'MEMBER';
        githubAccountId: number | null;
        studentClassroom: {
            id: number;
            createdAt: string;
            updatedAt: string;
            studentId: number;
            classroomId: number;
            role: 'STUDENT';
            student: {
                id: number;
                createdAt: string;
                updatedAt: string;
                email: string;
                name: string;
                externalId: string | null;
                roles: string[];
                organizationId: number;
                addedById: number;
            };
        };
        student: {
            id: number;
            createdAt: string;
            updatedAt: string;
            email: string;
            name: string;
            externalId: string | null;
            roles: string[];
            organizationId: number;
            addedById: number;
        };
    };
}

export default function GroupMembersManagement() {
    const { groupData, isGroupLeader, setIsGroupLeader } = useGroupContext();
    const { projectData } = useStudentProjectContext();
    const [loading, setLoading] = useState(true);
    const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
    const params = useParams();
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [selectedMember, setSelectedMember] = useState<GroupMember | null>(
        null
    );

    useEffect(() => {
        if (groupData) {
            loadGroupMembers();
            loadJoinRequests();
        }
    }, [groupData, isGroupLeader]);

    const loadGroupMembers = async () => {
        try {
            const data = await getUserInGroup(groupData.id);
            setMembers(data);
        } catch (error) {
            console.error('Error loading group members:', error);
            toast.error('Failed to load group members');
        } finally {
            setLoading(false);
        }
    };

    const loadJoinRequests = async () => {
        try {
            setJoinRequestsLoading(true);
            const data = await getJoinGroupRequest(groupData.id);
            setJoinRequests(data);
        } catch (error) {
            console.error('Error loading join requests:', error);
            toast.error('Failed to load join requests');
        } finally {
            setJoinRequestsLoading(false);
        }
    };

    const handleTransferLeadership = async () => {
        if (!selectedMember) return;

        try {
            await transferLeadership(
                groupData.id,
                selectedMember.studentProjectId
            );
            toast.success(`Leadership transferred to ${selectedMember.name}`);
            await loadGroupMembers();
            setIsGroupLeader(false);
            setShowTransferDialog(false);
            setSelectedMember(null);
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
    };

    const handleAcceptJoinRequest = async (requestId: number) => {
        try {
            await acceptJoinGroupRequest(groupData.id, requestId);
            toast.success('Join request accepted successfully');
            await loadJoinRequests();
            await loadGroupMembers();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to accept join request');
            }
        }
    };

    const handleRemoveMember = async () => {
        if (!selectedMember) return;

        try {
            await removeStudentFromGroup(
                selectedMember.studentProjectId,
                groupData.id
            );
            toast.success(
                `${selectedMember.name} has been removed from the group`
            );
            await loadGroupMembers();
            setShowRemoveDialog(false);
            setSelectedMember(null);
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to remove member');
            }
        }
    };

    const handleLeaveGroup = async () => {
        try {
            await leaveGroup(groupData.id);
            toast.success('You have left the group');
            // Redirect or refresh the page
            window.location.href = `/student/classes/${params.id}/projects`;
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to leave group');
            }
        }
    };

    const getDeadlineTooltip = () => {
        if (
            projectData?.formGroupDeadline &&
            new Date(projectData.formGroupDeadline) < new Date()
        ) {
            return 'Group formation deadline has passed. Contact lecturer for changes.';
        }
        return '';
    };

    const isDeadlinePassed = () => {
        return !!(
            projectData?.formGroupDeadline &&
            new Date(projectData.formGroupDeadline) < new Date()
        );
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
            <Card>
                <CardHeader>
                    <CardTitle>Group Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900">
                                            {member.name}{' '}
                                            {isGroupLeader &&
                                                member.roleInGroup ===
                                                    'LEADER' &&
                                                '(YOU)'}
                                        </span>
                                        {member.roleInGroup === 'LEADER' && (
                                            <Crown className="h-4 w-4 text-yellow-500" />
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                        <div className="flex items-center space-x-1">
                                            <Mail className="h-4 w-4" />
                                            <span>{member.email}</span>
                                        </div>
                                        {member.externalId && (
                                            <div className="flex items-center space-x-1">
                                                <IdCard className="h-4 w-4" />
                                                <span>{member.externalId}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    {isGroupLeader &&
                                        member.roleInGroup === 'MEMBER' && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedMember(
                                                            member
                                                        );
                                                        setShowTransferDialog(
                                                            true
                                                        );
                                                    }}
                                                >
                                                    Transfer Leadership
                                                </Button>
                                                {projectData?.type === 'TEAM' &&
                                                    projectData.allowStudentFormTeam && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <div>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setSelectedMember(
                                                                                    member
                                                                                );
                                                                                setShowRemoveDialog(
                                                                                    true
                                                                                );
                                                                            }}
                                                                            disabled={isDeadlinePassed()}
                                                                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                                                        >
                                                                            <UserMinus className="h-4 w-4 mr-1" />
                                                                            Remove
                                                                        </Button>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                {!!getDeadlineTooltip() && (
                                                                    <TooltipContent>
                                                                        <p className="text-xs">
                                                                            {getDeadlineTooltip()}
                                                                        </p>
                                                                    </TooltipContent>
                                                                )}
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                            </>
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            {projectData?.type === 'TEAM' &&
                projectData.allowStudentFormTeam && (
                <Card>
                    <CardHeader>
                        <CardTitle>Join Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {joinRequestsLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            </div>
                        ) : joinRequests.length > 0 ? (
                            <div className="space-y-4">
                                {joinRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-900">
                                                    {
                                                        request.studentProject
                                                            .student.name
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <Mail className="h-4 w-4" />
                                                    <span>
                                                        {
                                                            request
                                                                .studentProject
                                                                .student.email
                                                        }
                                                    </span>
                                                </div>
                                                {request.studentProject.student
                                                    .externalId && (
                                                    <div className="flex items-center space-x-1">
                                                        <IdCard className="h-4 w-4" />
                                                        <span>
                                                            {
                                                                request
                                                                    .studentProject
                                                                    .student
                                                                    .externalId
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Requested:{' '}
                                                {new Date(
                                                    request.createdAt
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                        {isGroupLeader && (
                                            <div className="flex space-x-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleAcceptJoinRequest(
                                                                            request.id
                                                                        )
                                                                    }
                                                                    disabled={isDeadlinePassed()}
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <UserCheck className="h-4 w-4 mr-1" />
                                                                    Accept
                                                                </Button>
                                                            </div>
                                                        </TooltipTrigger>
                                                        {!!getDeadlineTooltip() && (
                                                            <TooltipContent>
                                                                <p className="text-xs">
                                                                    {getDeadlineTooltip()}
                                                                </p>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">
                                No pending join requests
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Leave Group Button - Bottom Right */}
            {projectData?.type === 'TEAM' &&
                projectData.allowStudentFormTeam && (
                <div className="flex justify-end">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowLeaveDialog(true)}
                                    disabled={isDeadlinePassed()}
                                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                >
                                    <LogOut className="h-4 w-4 mr-1" />
                                    Leave Group
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {!!getDeadlineTooltip() && (
                            <TooltipContent>
                                <p className="text-xs">
                                    {getDeadlineTooltip()}
                                </p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            {/* Transfer Leadership Dialog */}
            <Dialog
                open={showTransferDialog}
                onOpenChange={setShowTransferDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transfer Group Leadership</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to transfer leadership to{' '}
                            {selectedMember?.name}? This action cannot be undone
                            and you will lose leader privileges.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowTransferDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleTransferLeadership}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Transfer Leadership
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Member Dialog */}
            <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Group Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove{' '}
                            {selectedMember?.name} from the group? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRemoveDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRemoveMember}
                        >
                            Remove Member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Leave Group Dialog */}
            <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave Group</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to leave this group? You will
                            lose access to all group activities and progress.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowLeaveDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLeaveGroup}
                        >
                            Leave Group
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
