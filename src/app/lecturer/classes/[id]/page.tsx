'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Edit,
    Save,
    X,
    Plus,
    Download,
    Upload,
    Users,
    UserCheck,
    Mail,
    BookOpen,
    Trash2,
    UserPlus,
    GraduationCap,
    Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useClassContext } from '@/context/class-context';
import {
    addLecturerToClass,
    getClassStudents,
    importStudentToClass,
    updateClassInfo,
    addStudentToClass,
    removeStudentInClass,
    removeLecturerFromClass,
    deleteClass,
} from '@/services/api/class';
import type { User } from '@/services/api/class/interface';
import { downloadImportTemplate } from '@/services/api/user';
import { ImportErrorModal } from '@/components/import-error-modal';
import { AddLecturerModal } from '@/components/add-lecturer-modal';
import { AddStudentModal } from '@/components/add-student-modal';
import { WarningModal } from '@/components/warning-modal';
import { useProfile } from '@/context/profile-context';
import { Avatar } from '@/components/avatar';
interface ImportErrorDetail {
    row: number;
    cause: string;
}

interface ImportErrorSheet {
    sheetName: string;
    details: ImportErrorDetail[];
}

interface ImportError {
    message: ImportErrorSheet[] | string;
    error: string;
    statusCode: number;
}

export default function ClassInfoPage() {
    const params = useParams();
    const classId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [students, setStudents] = useState<
        (User & { studentClassroomId: number })[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [importError, setImportError] = useState<ImportError | null>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        externalId: '',
        description: '',
    });
    const { classData, updateClass } = useClassContext();
    const { profile } = useProfile();
    const [showAddLecturerModal, setShowAddLecturerModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showWarningDeleteStudentModal, setShowWarningDeleteStudentModal] =
        useState(false);
    const [selectedStudent, setSelectedStudent] = useState<
        (User & { studentClassroomId: number }) | null
    >(null);
    const [showWarningDeleteLecturerModal, setShowWarningDeleteLecturerModal] =
        useState(false);
    const [selectedLecturer, setSelectedLecturer] = useState<User | null>(null);
    const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
    const router = useRouter();
    useEffect(() => {
        const fetchClassData = async () => {
            try {
                setLoading(true);
                if (classData) {
                    setEditForm({
                        name: classData.name,
                        externalId: classData.externalId,
                        description: classData.description || '',
                    });
                    getClassStudents(classData?.id).then((data) =>
                        setStudents(data)
                    );
                }
            } catch (error: any) {
                console.error('Error fetching class details:', error);
                toast.error('Failed to load class details');
            } finally {
                setLoading(false);
            }
        };

        if (classId) {
            fetchClassData();
        }
    }, [classId, classData]);

    const handleEdit = () => {
        setEditMode(true);
    };

    const handleSave = async () => {
        try {
            if (classData?.id)
                await updateClassInfo(classData?.id, {
                    name: editForm.name,
                    externalId: editForm.externalId,
                    description: editForm.description,
                });

            if (classData) {
                updateClass({
                    ...classData,
                    name: editForm.name,
                    externalId: editForm.externalId,
                    description: editForm.description,
                });
            }

            setEditMode(false);
            toast.success('Class updated successfully!');
        } catch (error) {
            console.log('🚀 ~ handleSave ~ error:', error);
            toast.error('Failed to update class');
        }
    };

    const handleCancel = () => {
        if (classData) {
            setEditForm({
                name: classData.name,
                externalId: classData.externalId,
                description: classData.description || '',
            });
        }
        setEditMode(false);
    };

    const handleAddLecturer = () => {
        setShowAddLecturerModal(true);
    };

    const handleAddStudent = () => {
        setShowAddStudentModal(true);
    };

    const handleAddLecturerToClass = async (lecturerId: number) => {
        try {
            if (!classData) return;

            await addLecturerToClass(classData.id, lecturerId);

            toast.success('Lecturer added successfully!');
            updateClass({});
            setShowAddLecturerModal(false);
        } catch (error: any) {
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Failed to create semester');
            }
        }
    };

    const handleAddTA = () => {
        toast.info('Add teaching assistant functionality will be implemented');
    };

    const handleAddStudentToClass = async (studentId: number) => {
        try {
            if (!classData) return;

            await addStudentToClass(classData.id, studentId);

            toast.success('Student added successfully!');
            updateClass({});
            setShowAddStudentModal(false);
        } catch (error: any) {
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Failed to create semester');
            }
        }
    };
    const handleDownloadTemplate = async () => {
        try {
            await downloadImportTemplate('student');
            toast.success('Template downloaded successfully');
        } catch (error) {
            console.log('🚀 ~ handleDownloadTemplate ~ error:', error);
            toast.error('Failed to download template');
        }
    };

    const handleImportStudentsClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file || !classData) return;

        // Validate file type
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error(
                'Please select a valid Excel (.xlsx, .xls) or CSV file'
            );
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            toast.error('File size must be less than 10MB');
            return;
        }

        try {
            setImporting(true);
            await handleImportStudents(classData.id, file);
        } catch (error) {
            console.error('Import failed:', error);
        } finally {
            setImporting(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleImportStudents = async (classId: number, file: File) => {
        try {
            await importStudentToClass(classId, file);
            if (classData) {
                const updatedStudents = await getClassStudents(classData.id);
                updateClass({ numberOfStudents: updatedStudents.length });
                setStudents(updatedStudents);
            }
            toast.success('Students imported successfully');
        } catch (error: any) {
            console.log('🚀 ~ handleImportStudents ~ error:', error);

            // Handle detailed import errors
            if (error?.message && Array.isArray(error.message)) {
                setImportError(error);
                setShowErrorModal(true);
            } else if (error?.message && typeof error.message === 'string') {
                setImportError(error);
                setShowErrorModal(true);
            } else {
                // Fallback for simple errors
                toast.error(error?.message ?? 'Failed to import students');
            }
        }
    };

    const handleRemoveStudent = async (studentClassroomId: number) => {
        try {
            if (classData) {
                await removeStudentInClass(classData?.id, studentClassroomId);
                setStudents(
                    students.filter(
                        (s) => s.studentClassroomId !== studentClassroomId
                    )
                );
                toast.success('Student removed from class');
                setShowWarningDeleteStudentModal(false);
                setSelectedStudent(null);
            }
        } catch (error: any) {
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(
                    error?.message ?? 'Failed to remove student from class'
                );
            }
        }
    };

    const handleRemoveLecturer = async (id: number) => {
        try {
            if (classData) {
                await removeLecturerFromClass(classData?.id, id);
                updateClass({
                    ...classData,
                    lecturers: classData.lecturers.filter((l) => l.id !== id),
                });
                toast.success('Lecturer removed from class');
                setShowWarningDeleteLecturerModal(false);
                setSelectedLecturer(null);
            }
        } catch (error: any) {
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(
                    error?.message ?? 'Failed to remove lecturer from class'
                );
            }
        }
    };

    const handleRemoveTA = (taId: number) => {
        console.log('🚀 ~ handleRemoveTA ~ taId:', taId);
        toast.info(
            'Remove teaching assistant functionality will be implemented'
        );
    };

    const handleCloseErrorModal = () => {
        setShowErrorModal(false);
        setImportError(null);
    };

    const handleConfirmDeleteClass = async () => {
        if (!classData) return;
        try {
            await deleteClass(classData.id);
            toast.success(`Class "${classData.name}" deleted successfully.`);
            setShowDeleteClassModal(false);
            router.push('/lecturer/home');
        } catch (error: any) {
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Failed to delete class.');
            }
            setShowDeleteClassModal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
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

    return (
        <div className="space-y-8 px-6 py-6 max-w-[1600px] mx-auto w-full">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Import Error Modal */}
            <ImportErrorModal
                isOpen={showErrorModal}
                onClose={handleCloseErrorModal}
                error={importError}
                title="Student Import Errors"
                description="The following errors occurred while importing students:"
            />

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
                                Manage your class details and settings
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {editMode ? (
                            <>
                                <Button
                                    onClick={handleSave}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    variant="outline"
                                    size="sm"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={handleEdit}
                                    variant="outline"
                                    size="sm"
                                    className="bg-white"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Information
                                </Button>
                                <Button
                                    onClick={() =>
                                        setShowDeleteClassModal(true)
                                    }
                                    variant="destructive"
                                    size="sm"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Class
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Class Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Class Name Card */}
                    <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <Label className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                            Class Name
                        </Label>
                        {editMode ? (
                            <Input
                                value={editForm.name}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Enter class name"
                                className="text-2xl font-bold border-0 p-0 h-auto focus:ring-0"
                            />
                        ) : (
                            <h2 className="text-2xl font-bold text-gray-900">
                                {classData.name}
                            </h2>
                        )}
                    </div>

                    {/* Class ID Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <Label className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                            Class ID
                        </Label>
                        {editMode ? (
                            <Input
                                value={editForm.externalId}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        externalId: e.target.value,
                                    })
                                }
                                placeholder="Enter class ID"
                                className="text-xl font-bold border-0 p-0 h-auto focus:ring-0"
                            />
                        ) : (
                            <p className="text-xl font-bold text-gray-900">
                                {classData.externalId}
                            </p>
                        )}
                    </div>

                    {/* Semester Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <Label className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                            Semester
                        </Label>
                        <p className="text-xl font-bold text-gray-900">
                            {classData.semester.name}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <Label className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 block">
                        Description
                    </Label>
                    {editMode ? (
                        <textarea
                            value={editForm.description}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Enter class description"
                            className="w-full min-h-[100px] text-lg border-0 p-0 focus:ring-0 resize-none"
                        />
                    ) : (
                        <p className="text-lg text-gray-700 leading-relaxed">
                            {classData.description || 'No description provided'}
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-6 pt-5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-600">
                                    Students Enrolled
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                    {students.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardContent className="p-6 pt-5">
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
                    <CardContent className="p-6 pt-5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <UserCheck className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-purple-600">
                                    Teaching Assistants
                                </p>
                                <p className="text-2xl font-bold text-purple-700">
                                    {classData.teacherAssistance
                                        ? classData.teacherAssistance.length
                                        : 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                    <CardContent className="p-6 pt-5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-orange-600">
                                    Created At
                                </p>
                                <p className="text-sm font-bold text-orange-700">
                                    {new Date(
                                        classData.createdAt
                                    ).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lecturers and Teaching Assistants */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Lecturers */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <UserCheck className="h-5 w-5" />
                                    Lecturers
                                </CardTitle>
                                <CardDescription>
                                    Manage class lecturers
                                </CardDescription>
                            </div>
                            <Button onClick={handleAddLecturer} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Lecturer
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {classData.lecturers.map((lecturer) => (
                                <div
                                    key={lecturer.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
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
                                            <div className="flex gap-2 mt-1">
                                                {lecturer.roles.map((role) => (
                                                    <span
                                                        key={role}
                                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                                    >
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Mail className="h-4 w-4" />
                                        </Button>
                                        {profile?.id != lecturer.id && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedLecturer(
                                                        lecturer
                                                    );
                                                    setShowWarningDeleteLecturerModal(
                                                        true
                                                    );
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Teaching Assistants */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Teaching Assistants
                                </CardTitle>
                                <CardDescription>
                                    Manage teaching assistants
                                </CardDescription>
                            </div>
                            <Button
                                onClick={handleAddTA}
                                variant="outline"
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add TA
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {classData.teacherAssistance &&
                        classData.teacherAssistance.length > 0 ? (
                            <div className="space-y-4">
                                {classData.teacherAssistance.map(
                                    ({ student: ta }) => (
                                        <div
                                            key={ta.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
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
                                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                        Teaching Assistant
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleRemoveTA(ta.id)
                                                    }
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No teaching assistants assigned</p>
                                <p className="text-sm">
                                    Click &quot;Add TA&quot; to assign teaching
                                    assistants
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Students */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Students ({students.length})
                            </CardTitle>
                            <CardDescription>
                                Manage class enrollment and student list
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleDownloadTemplate}
                                variant="outline"
                                size="sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Template
                            </Button>
                            <Button
                                onClick={handleAddStudent}
                                variant="outline"
                                size="sm"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Student
                            </Button>
                            <Button
                                onClick={handleImportStudentsClick}
                                size="sm"
                                disabled={importing}
                            >
                                {importing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import Students
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {students.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No students added
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Add students manually or import them using the
                                Excel template.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    onClick={handleAddStudent}
                                    variant="outline"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Student
                                </Button>
                                <Button
                                    onClick={handleImportStudentsClick}
                                    disabled={importing}
                                >
                                    {importing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Import Students
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Student ID
                                        </th>
                                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Name
                                        </th>
                                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Email
                                        </th>
                                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="border border-gray-200 px-4 py-3 font-medium">
                                                {student.externalId}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                {student.name}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                {student.email}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Mail className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedStudent(
                                                                student
                                                            );
                                                            setShowWarningDeleteStudentModal(
                                                                true
                                                            );
                                                        }}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* Add Lecturer Modal */}
            <AddLecturerModal
                isOpen={showAddLecturerModal}
                onClose={() => setShowAddLecturerModal(false)}
                onAddLecturer={handleAddLecturerToClass}
                classId={classData?.id || 0}
            />
            <AddStudentModal
                isOpen={showAddStudentModal}
                onClose={() => setShowAddStudentModal(false)}
                onAddStudent={handleAddStudentToClass}
                classId={classData?.id || 0}
            />
            <WarningModal
                isOpen={showWarningDeleteStudentModal}
                onClose={() => {
                    setShowWarningDeleteStudentModal(false);
                    setSelectedStudent(null);
                }}
                onConfirm={() => {
                    if (selectedStudent) {
                        handleRemoveStudent(selectedStudent.studentClassroomId);
                    }
                }}
                title={`Delete ${
                    selectedStudent?.name ?? selectedStudent?.email
                } from class`}
                description="Are you sure you want to delete this student?"
            />
            <WarningModal
                isOpen={showWarningDeleteLecturerModal}
                onClose={() => setShowWarningDeleteLecturerModal(false)}
                onConfirm={() => {
                    if (selectedLecturer) {
                        handleRemoveLecturer(selectedLecturer.id);
                    }
                }}
                title={`Delete ${
                    selectedLecturer?.name ?? selectedLecturer?.email
                } from class`}
                description="Are you sure you want to delete this lecturer?"
            />
            <WarningModal
                isOpen={showDeleteClassModal}
                onClose={() => setShowDeleteClassModal(false)}
                onConfirm={handleConfirmDeleteClass}
                title="Delete Class"
                description={`Are you sure you want to delete the class "${classData?.name}"? All projects and student data within this class will be permanently removed. This action cannot be undone.`}
                confirmText="Delete Class"
            />
        </div>
    );
}
