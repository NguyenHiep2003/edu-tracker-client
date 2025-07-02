'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProjectContext } from '@/context/project-context';
import {
    getProjectStudents,
    getNotJoinedStudents,
    addStudentsToProject,
    getProjectGroups,
    removeStudentFromProject,
} from '@/services/api/project';
import {
    Search,
    Users,
    UserCheck,
    Mail,
    Hash,
    Crown,
    User,
    Plus,
    MoreVertical,
    UserPlus,
    UserMinus,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    ProjectStudent,
    ProjectGroup as IProjectGroup,
} from '@/services/api/project/interface';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WarningModal } from '@/components/warning-modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { assignStudentToGroup } from '@/services/api/group';
import { Avatar } from '@/components/avatar';

interface NotJoinedStudent {
    id: number;
    studentId: number;
    student: {
        id: number;
        email: string;
        name: string;
        externalId: string | null;
    };
}

export default function ProjectStudentsPage() {
    const { projectData } = useProjectContext();
    const [students, setStudents] = useState<ProjectStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notJoinedStudents, setNotJoinedStudents] = useState<
        NotJoinedStudent[]
    >([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [loadingNotJoined, setLoadingNotJoined] = useState(false);

    // New states for remove warning modal
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [studentToRemove, setStudentToRemove] =
        useState<ProjectStudent | null>(null);

    // New states for assign group modal
    const [isAssignGroupModalOpen, setIsAssignGroupModalOpen] = useState(false);
    const [studentToAssign, setStudentToAssign] =
        useState<ProjectStudent | null>(null);
    const [projectGroups, setProjectGroups] = useState<IProjectGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [loadingGroups, setLoadingGroups] = useState(false);

    const fetchStudents = async () => {
        if (!projectData?.id) return;

        try {
            setLoading(true);
            setError(null);
            const data = await getProjectStudents(projectData.id);
            setStudents(data);
        } catch (error: any) {
            console.log("🚀 ~ fetchStudents ~ error:", error)
            setError(error.message || 'Đã xảy ra lỗi khi tải sinh viên.');
            toast.error('Đã xảy ra lỗi khi tải sinh viên.');
        } finally {
            setLoading(false);
        }
    };

    const fetchNotJoinedStudents = async () => {
        if (!projectData?.id) return;

        try {
            setLoadingNotJoined(true);
            const data = await getNotJoinedStudents(projectData.id);
            setNotJoinedStudents(data);
        } catch (error: any) {
            console.log("🚀 ~ fetchNotJoinedStudents ~ error:", error)
            toast.error('Đã xảy ra lỗi khi tải sinh viên chưa tham gia.');
        } finally {
            setLoadingNotJoined(false);
        }
    };

    const fetchProjectGroups = async () => {
        if (!projectData?.id) return;

        try {
            setLoadingGroups(true);
            const data = await getProjectGroups(projectData.id);
            // Sort groups by number of members
            const sortedGroups = data.sort(
                (a, b) => a.numberOfMember - b.numberOfMember
            );
            setProjectGroups(sortedGroups);
        } catch (error) {
            console.log("🚀 ~ fetchProjectGroups ~ error:", error)
            toast.error('Đã xảy ra lỗi khi tải nhóm.');
        } finally {
            setLoadingGroups(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [projectData?.id]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
        fetchNotJoinedStudents();
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStudents([]);
    };

    const toggleSelectAll = () => {
        if (selectedStudents.length === notJoinedStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(notJoinedStudents.map((s) => s.id));
        }
    };

    const toggleStudentSelection = (id: number) => {
        setSelectedStudents((prev) =>
            prev.includes(id)
                ? prev.filter((studentId) => studentId !== id)
                : [...prev, id]
        );
    };

    const handleAddSelectedStudents = async () => {
        if (selectedStudents.length === 0) {
            toast.warning('Vui lòng chọn ít nhất một sinh viên');
            return;
        }

        try {
            if (!projectData?.id) {
                toast.error('ID của dự án không khả dụng');
                return;
            }
            await addStudentsToProject(projectData.id, selectedStudents);
            toast.success('Sinh viên đã được thêm thành công');
            handleCloseModal();
            fetchStudents();
        } catch (error: any) {
            console.log('🚀 ~ handleAddSelectedStudents ~ error:', error.message);
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Đã xảy ra lỗi khi thêm sinh viên.');
            }
        }
    };

    // Filter students based on search term
    const filteredStudents = students.filter((student) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            student.name?.toLowerCase().includes(searchLower) ||
            student.email?.toLowerCase().includes(searchLower) ||
            student.externalId?.toLowerCase().includes(searchLower)
        );
    });

    const getRoleColor = (role: string | null) => {
        switch (role) {
            case 'LEADER':
                return 'bg-yellow-500 hover:bg-yellow-600';
            case 'MEMBER':
                return 'bg-blue-500 hover:bg-blue-600';
            default:
                return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const getRoleIcon = (role: string | null) => {
        switch (role) {
            case 'LEADER':
                return <Crown className="h-3 w-3" />;
            case 'MEMBER':
                return <User className="h-3 w-3" />;
            default:
                return <User className="h-3 w-3" />;
        }
    };

    const getGroupStats = () => {
        const groupCounts = students.reduce((acc, student) => {
            const group = student.groupNumber || 0;
            acc[group] = (acc[group] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const totalGroups = Object.keys(groupCounts).filter(
            (group) => group !== '0'
        ).length;
        const studentsWithoutGroup = groupCounts[0] || 0;

        return { totalGroups, studentsWithoutGroup, groupCounts };
    };

    const stats = getGroupStats();

    const handleRemoveStudent = (student: ProjectStudent) => {
        setStudentToRemove(student);
        setIsRemoveModalOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (!studentToRemove || !projectData?.id) return;

        try {
            await removeStudentFromProject(
                projectData.id,
                studentToRemove.studentProjectId
            );
            toast.success('Sinh viên đã được xóa khỏi dự án');
            fetchStudents();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
        setIsRemoveModalOpen(false);
        setStudentToRemove(null);
    };

    const handleAssignGroup = async (student: ProjectStudent) => {
        setStudentToAssign(student);
        setSelectedGroupId('');
        setIsAssignGroupModalOpen(true);
        fetchProjectGroups();
    };

    const handleConfirmAssignGroup = async () => {
        if (!studentToAssign || !projectData?.id || !selectedGroupId) {
            toast.warning('Vui lòng chọn một nhóm');
            return;
        }

        try {
            await assignStudentToGroup(
                studentToAssign.studentProjectId,
                parseInt(selectedGroupId)
            );
            toast.success('Sinh viên đã được thêm vào nhóm');
            fetchStudents();
            setIsAssignGroupModalOpen(false);
            setStudentToAssign(null);
            setSelectedGroupId('');
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Đã xảy ra lỗi khi thêm sinh viên vào nhóm.');
            }
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="h-24 bg-gray-200 rounded"
                            ></div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="h-20 bg-gray-200 rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-red-500 text-lg font-semibold mb-2">
                        Lỗi khi tải sinh viên
                    </div>
                    <div className="text-gray-600 mb-4">{error}</div>
                    <Button onClick={fetchStudents} variant="outline">
                        Thử lại
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
                    <h2 className="text-2xl font-bold text-gray-900">
                        Sinh viên tham gia dự án
                    </h2>
                    <p className="text-gray-600">
                        Quản lý sinh viên tham gia dự án này
                    </p>
                </div>
                <Button onClick={handleOpenModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm sinh viên
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-6">
                <Card className="bg-blue-50">
                    <CardContent className="p-7 pt-5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {students.length}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Tổng số sinh viên
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-7 pt-5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <UserCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {stats.totalGroups}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Số nhóm
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-7 pt-5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <User className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {stats.studentsWithoutGroup}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Số sinh viên chưa có nhóm
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm theo tên, email, hoặc ID sinh viên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">Lọc</Button>
            </div>

            {/* Students List */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Sinh viên ({filteredStudents.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {searchTerm
                                ? 'Không tìm thấy sinh viên phù hợp với tìm kiếm.'
                                : 'Không có sinh viên trong dự án này.'}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-4">
                                        <Avatar
                                            name={student.name}
                                            size={11}
                                        ></Avatar>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {student.name}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center space-x-4">
                                                <span className="flex items-center">
                                                    <Mail className="h-3 w-3 mr-1" />
                                                    {student.email}
                                                </span>
                                                {student.externalId && (
                                                    <span className="flex items-center">
                                                        <Hash className="h-3 w-3 mr-1" />
                                                        {student.externalId}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge
                                            className={`flex items-center space-x-1 text-white font-medium px-3 py-1 ${getRoleColor(
                                                student.role
                                            )}`}
                                        >
                                            {getRoleIcon(student.role)}
                                            <span>
                                                {student.role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}
                                            </span>
                                        </Badge>
                                        {student.groupNumber ? (
                                            <Badge
                                                variant="secondary"
                                                className="bg-green-500 px-3 py-1"
                                            >
                                                Nhóm {student.groupNumber}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="bg-red-500 px-3 py-1"
                                            >
                                                Chưa có nhóm
                                            </Badge>
                                        )}
                                        <div className="relative">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 p-0 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                                                    >
                                                        <span className="sr-only">
                                                            Mở menu
                                                        </span>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-[200px] z-50"
                                                >
                                                    {!student.groupNumber && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleAssignGroup(
                                                                    student
                                                                )
                                                            }
                                                            className="cursor-pointer hover:bg-gray-100"
                                                        >
                                                            <UserPlus className="mr-2 h-4 w-4" />
                                                            <span>
                                                                Thêm vào nhóm
                                                            </span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        className="text-red-600 cursor-pointer hover:bg-red-50 focus:text-red-600"
                                                        onClick={() =>
                                                            handleRemoveStudent(
                                                                student
                                                            )
                                                        }
                                                    >
                                                        <UserMinus className="mr-2 h-4 w-4" />
                                                        <span>
                                                            Xóa khỏi dự án
                                                        </span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Students Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white text-gray-900">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                            Thêm sinh viên vào dự án
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Chọn sinh viên từ lớp để thêm vào dự án này
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {notJoinedStudents.length > 0 ? (
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="select-all"
                                        checked={
                                            selectedStudents.length ===
                                                notJoinedStudents.length &&
                                            notJoinedStudents.length > 0
                                        }
                                        onCheckedChange={toggleSelectAll}
                                    />
                                    <label
                                        htmlFor="select-all"
                                        className="text-sm font-medium text-gray-900"
                                    >
                                        Chọn tất cả
                                    </label>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {selectedStudents.length} đã chọn
                                </span>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600">
                                    Không có sinh viên nào có thể thêm vào dự án
                                </p>
                            </div>
                        )}

                        {loadingNotJoined ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                                <p className="mt-2 text-gray-600">
                                    Đang tải sinh viên có thể thêm vào dự án...
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-4">
                                    {notJoinedStudents.map((student) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded-lg"
                                        >
                                            <Checkbox
                                                id={`student-${student.id}`}
                                                checked={selectedStudents.includes(
                                                    student.id
                                                )}
                                                onCheckedChange={() =>
                                                    toggleStudentSelection(
                                                        student.id
                                                    )
                                                }
                                            />
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={`student-${student.id}`}
                                                    className="font-medium text-gray-900 cursor-pointer"
                                                >
                                                    {student.student.name}
                                                </label>
                                                <div className="text-sm text-gray-500 flex items-center space-x-4">
                                                    <span className="flex items-center">
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        {student.student.email}
                                                    </span>
                                                    {student.student
                                                        .externalId && (
                                                        <span className="flex items-center">
                                                            <Hash className="h-3 w-3 mr-1" />
                                                            {
                                                                student.student
                                                                    .externalId
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseModal}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleAddSelectedStudents}
                            disabled={selectedStudents.length === 0}
                        >
                            Thêm ({selectedStudents.length}) sinh viên
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Student Warning Modal */}
            <WarningModal
                isOpen={isRemoveModalOpen}
                onClose={() => {
                    setIsRemoveModalOpen(false);
                    setStudentToRemove(null);
                }}
                onConfirm={handleConfirmRemove}
                title="Xóa sinh viên"
                description={`Bạn có chắc chắn muốn xóa ${studentToRemove?.name} khỏi dự án này? Thao tác này không thể hoàn tác.`}
                confirmText="Xóa sinh viên"
                cancelText="Hủy"
            />

            {/* Assign Group Modal */}
            <Dialog
                open={isAssignGroupModalOpen}
                onOpenChange={setIsAssignGroupModalOpen}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Thêm vào nhóm</DialogTitle>
                        <DialogDescription>
                            Chọn một nhóm để thêm {studentToAssign?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {loadingGroups ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                                <p className="mt-2 text-gray-600">
                                    Đang tải nhóm...
                                </p>
                            </div>
                        ) : (
                            <RadioGroup
                                value={selectedGroupId}
                                onValueChange={setSelectedGroupId}
                                className="space-y-3"
                            >
                                {projectGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="flex items-center space-x-2"
                                    >
                                        <RadioGroupItem
                                            value={group.id.toString()}
                                            id={`group-${group.id}`}
                                        />
                                        <Label
                                            htmlFor={`group-${group.id}`}
                                            className="flex-1"
                                        >
                                            <span className="font-medium">
                                                Nhóm {group.number}
                                            </span>
                                            <span className="text-gray-500 ml-2">
                                                ({group.numberOfMember} thành viên)
                                            </span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAssignGroupModalOpen(false);
                                setStudentToAssign(null);
                                setSelectedGroupId('');
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleConfirmAssignGroup}
                            disabled={!selectedGroupId || loadingGroups}
                        >
                            Thêm vào nhóm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
