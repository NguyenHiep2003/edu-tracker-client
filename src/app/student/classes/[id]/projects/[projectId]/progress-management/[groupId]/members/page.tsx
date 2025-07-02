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
import { formatDate } from '@/helper/date-formatter';

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
            console.log("🚀 ~ loadGroupMembers ~ error:", error)
            toast.error('Lỗi khi tải danh sách thành viên nhóm');
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
            console.log("🚀 ~ loadJoinRequests ~ error:", error)
            toast.error('Lỗi khi tải danh sách yêu cầu tham gia nhóm');
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
            toast.success(`Quyền trưởng nhóm đã được chuyển cho ${selectedMember.name}`);
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
            toast.success('Yêu cầu tham gia nhóm đã được chấp nhận thành công');
            await loadJoinRequests();
            await loadGroupMembers();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Lỗi khi chấp nhận yêu cầu tham gia nhóm');
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
                `${selectedMember.name} đã bị xóa khỏi nhóm`
            );
            await loadGroupMembers();
            setShowRemoveDialog(false);
            setSelectedMember(null);
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Lỗi khi xóa thành viên khỏi nhóm');
            }
        }
    };

    const handleLeaveGroup = async () => {
        try {
            await leaveGroup(groupData.id);
            toast.success('Bạn đã rời khỏi nhóm');
            // Redirect or refresh the page
            window.location.href = `/student/classes/${params.id}/projects`;
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Lỗi khi rời khỏi nhóm');
            }
        }
    };

    const getDeadlineTooltip = () => {
        if (
            projectData?.formGroupDeadline &&
            new Date(projectData.formGroupDeadline) < new Date()
        ) {
            return 'Thời gian lập nhóm đã hết hạn. Vui lòng liên hệ giáo viên để thay đổi.';
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
                    <CardTitle>Thành viên nhóm</CardTitle>
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
                                                    Chuyển quyền trưởng nhóm
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
                                                                            Xóa
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
                        <CardTitle>Yêu cầu tham gia nhóm</CardTitle>
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
                                                Yêu cầu lúc:{' '}
                                                {formatDate(
                                                    request.createdAt,
                                                    'dd/MM/yyyy HH:mm'
                                                )}
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
                                                                    Chấp nhận
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
                                Không có yêu cầu tham gia nhóm nào đang chờ duyệt
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
                                    Rời nhóm
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
                        <DialogTitle>Chuyển quyền trưởng nhóm</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn chuyển quyền trưởng nhóm cho{' '}
                            {selectedMember?.name}? Việc này không thể hoàn tác
                            và bạn sẽ mất quyền trưởng nhóm.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowTransferDialog(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleTransferLeadership}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Chuyển quyền trưởng nhóm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Member Dialog */}
            <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa thành viên nhóm</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa{' '}
                            {selectedMember?.name} khỏi nhóm? Việc này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRemoveDialog(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRemoveMember}
                        >
                            Xóa thành viên
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Leave Group Dialog */}
            <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rời nhóm</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn rời khỏi nhóm? Bạn sẽ mất quyền truy cập vào tất cả hoạt động và tiến độ của nhóm.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowLeaveDialog(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLeaveGroup}
                        >
                            Rời nhóm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
