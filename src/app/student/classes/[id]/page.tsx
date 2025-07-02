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
import {
    Clock,
    Users,
    UserCheck,
    Mail,
    BookOpen,
    GraduationCap,
    User,
} from 'lucide-react';
import { useClassContext } from '@/context/class-context';
import { getClassStudents } from '@/services/api/class';
import { Avatar } from '@/components/avatar';

interface Student {
    id: number;
    name: string;
    email: string;
    externalId: string;
    createdAt: string;
}

export default function StudentClassInfoPage() {
    const params = useParams();
    const classId = params.id as string;

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const { classData } = useClassContext();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const students = await getClassStudents(Number(classId));
                setStudents(students);
            } catch (error: any) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        };

        if (classId) {
            fetchStudents();
        }
    }, [classId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Loading class information...
                    </p>
                </div>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Class not found</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-8 px-6">
            {/* Class Information Hero Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Class Information
                            </h1>
                            <p className="text-gray-600">
                                View your class details and classmates
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Class Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Class Name Card */}
                    <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Class Name
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {classData.name}
                        </h2>
                    </div>

                    {/* Class ID Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Class ID
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                            {classData.externalId}
                        </p>
                    </div>

                    {/* Semester Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Semester
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-xl font-bold text-gray-900">
                                {classData.semester.name}
                            </p>
                            <Badge
                                variant={
                                    classData.semester.status === 'ACTIVE'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className="text-xs"
                            >
                                {classData.semester.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Description
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        {classData.description || 'Không có mô tả'}
                    </p>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="px-4 py-4 pt-5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-600">
                                    Total Students
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                    {classData.numberOfStudents}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardContent className="px-4 py-4 pt-5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <GraduationCap className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-600">
                                    Lecturers
                                </p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {classData.lecturers.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                    <CardContent className="px-4 py-4 pt-5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <UserCheck className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-purple-600">
                                    Teaching Assistants
                                </p>
                                <p className="text-2xl font-bold text-purple-700">
                                    {classData.teacherAssistance.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                    <CardContent className="px-4 py-4 pt-5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-orange-600">
                                    Created
                                </p>
                                <p className="text-sm font-bold text-orange-700">
                                    {formatDate(classData.createdAt)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lecturers and Students */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Lecturers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            Lecturers
                        </CardTitle>
                        <CardDescription>
                            Your class instructors
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {classData.lecturers.map((lecturer) => (
                                <div
                                    key={lecturer.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        {/* <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-medium">
                                                {lecturer?.name
                                                    ?.split(' ')
                                                    ?.map((n) => n[0])
                                                    ?.join('')
                                                    ?.toUpperCase()}
                                            </span>
                                        </div> */}
                                        <Avatar
                                            name={lecturer.name}
                                            size={12}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {lecturer.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {lecturer.email}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                ID: {lecturer.externalId}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                {lecturer.roles.map((role) => (
                                                    <Badge
                                                        key={role}
                                                        variant="outline"
                                                        className="text-xs text-gray-500"
                                                    >
                                                        {role}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={`mailto:${lecturer.email}`}
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        <Mail className="h-4 w-4" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Students List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Classmates ({students.length})
                        </CardTitle>
                        <CardDescription>
                            Students enrolled in this class
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {students.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <Avatar name={student.name} size={12} />
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                {student.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {student.email}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                ID: {student.externalId}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={`mailto:${student.email}`}
                                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                    >
                                        <Mail className="h-3 w-3" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Teaching Assistants (if any) */}
            {classData.teacherAssistance &&
                classData.teacherAssistance.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Teaching Assistants
                            </CardTitle>
                            <CardDescription>
                                Your class teaching assistants
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {classData.teacherAssistance.map(
                                    ({ student: ta }) => (
                                        <div
                                            key={ta.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-medium">
                                                        {ta.name
                                                            .split(' ')
                                                            .map((n) => n[0])
                                                            .join('')
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {ta.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {ta.email}
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs mt-1"
                                                    >
                                                        Teaching Assistant
                                                    </Badge>
                                                </div>
                                            </div>
                                            <a
                                                href={`mailto:${ta.email}`}
                                                className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                                            >
                                                <Mail className="h-4 w-4" />
                                            </a>
                                        </div>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
        </div>
    );
}
