'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { User, Mail, Search, UsersIcon, Crown } from 'lucide-react';
import { useStudentProjectContext } from '@/context/student-project-context';
import { getProjectStudents } from '@/services/api/project';
import { Avatar } from '@/components/avatar';

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
    role: 'LEADER' | null;
}

export default function StudentProjectStudentsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { loading: projectLoading } = useStudentProjectContext();

    const [students, setStudents] = useState<ProjectStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const students: any = await getProjectStudents(Number(projectId));

                setStudents(students);
            } catch (error) {
                console.log("🚀 ~ fetchStudents ~ error:", error)
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchStudents();
        }
    }, [projectId]);

    const filteredStudents = students.filter(
        (student) =>
            (student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
                false) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.externalId?.includes(searchTerm) ?? false) ||
            student.groupNumber?.toString().includes(searchTerm)
    );

    if (projectLoading || loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải danh sách sinh viên...</p>
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
                        Danh sách sinh viên tham gia dự án
                    </h1>
                    <p className="text-gray-600">
                        {students.length} sinh viên đã tham gia dự án
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Tìm kiếm sinh viên theo tên, email, ID hoặc số nhóm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Students Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5" />
                        Danh sách sinh viên ({filteredStudents.length})
                    </CardTitle>
                    <CardDescription>
                        Tất cả sinh viên đã tham gia dự án
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        Tên
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        Email
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        ID
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        Nhóm
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        Vai trò
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center space-x-3">
                                                <Avatar name={student.name} size={11} />
                                                <span className="font-medium text-gray-900">
                                                    {student.name ||
                                                        'Không có tên'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {student.email}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {student.externalId || '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                            {student.groupNumber ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs text-gray-600"
                                                >
                                                    Nhóm {student.groupNumber}
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400 text-sm">
                                                    Chưa có nhóm
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {student.role === 'LEADER' ? (
                                                <Badge className="bg-yellow-100 text-yellow-800 text-xs flex items-center gap-1 w-fit">
                                                    <Crown className="h-3 w-3" />
                                                    Trưởng nhóm
                                                </Badge>
                                            ) : student.role === 'MEMBER' ? (
                                                <span className="text-gray-600 text-sm">
                                                    Thành viên
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">
                                                   -
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <a
                                                href={`mailto:${student.email}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition-colors"
                                                title={`Email ${
                                                    student.name || 'student'
                                                }`}
                                            >
                                                <Mail className="h-4 w-4" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {filteredStudents.length === 0 && (
                        <div className="text-center py-12">
                            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {searchTerm
                                    ? 'Không tìm thấy sinh viên nào phù hợp với tìm kiếm của bạn.'
                                    : 'Không có sinh viên nào đã tham gia dự án.'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
