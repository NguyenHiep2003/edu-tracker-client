'use client';

import React, { useState, useEffect } from 'react';
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
import { Modal } from '@/components/ui/modal';
import {
    Plus,
    Edit,
    Trash2,
    Calendar,
    CheckCircle,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Save,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    getSemesters,
    createSemester,
    updateSemester,
    deleteSemester,
} from '@/services/api/semester';
import type {
    Semester,
    CreateSemesterRequest,
    UpdateSemesterRequest,
} from '@/services/api/semester/interface';
import Select from 'react-select';

// Create Semester Modal
function CreateSemesterModal({
    isOpen,
    onClose,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState<CreateSemesterRequest>({
        name: '',
        status: 'INACTIVE',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const statusOptions = [
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'ACTIVE', label: 'Active' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Semester name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            await createSemester(formData);
            toast.success('Semester created successfully');
            onSuccess();
            onClose();
            setFormData({ name: '', status: 'INACTIVE' });
        } catch (error: any) {
            console.error('Error creating semester:', error);
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Failed to create semester');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', status: 'INACTIVE' });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Semester"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="create-name" className="text-gray-800">
                        Semester Name *
                    </Label>
                    <Input
                        className="text-gray-700"
                        id="create-name"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                        placeholder="e.g., 2024.1, Spring 2024, Fall 2023"
                        disabled={isSubmitting}
                        required
                    />
                    <p className="text-xs text-gray-500">
                        Enter a unique name for the semester
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="create-status" className="text-gray-800">
                        Status *
                    </Label>
                    <Select
                        value={statusOptions.find(
                            (option) => option.value === formData.status
                        )}
                        onChange={(selectedOption: any) =>
                            setFormData((prev) => ({
                                ...prev,
                                status: selectedOption?.value as
                                    | 'ACTIVE'
                                    | 'INACTIVE',
                            }))
                        }
                        options={statusOptions}
                        isDisabled={isSubmitting}
                        placeholder="Select status..."
                        className="text-sm"
                        classNamePrefix="react-select"
                        styles={{
                            control: (provided: any, state: any) => ({
                                ...provided,
                                minHeight: '40px',
                                borderColor: state.isFocused
                                    ? '#3b82f6'
                                    : '#d1d5db',
                                boxShadow: state.isFocused
                                    ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
                                    : 'none',
                                '&:hover': {
                                    borderColor: '#3b82f6',
                                },
                            }),
                            option: (provided: any, state: any) => ({
                                ...provided,
                                backgroundColor: state.isSelected
                                    ? '#3b82f6'
                                    : state.isFocused
                                    ? '#f3f4f6'
                                    : 'white',
                                color: state.isSelected ? 'white' : '#374151',
                                '&:hover': {
                                    backgroundColor: state.isSelected
                                        ? '#3b82f6'
                                        : '#f3f4f6',
                                },
                            }),
                        }}
                    />
                    <p className="text-xs text-gray-500">
                        Select the initial status for this semester
                    </p>
                </div>

                {formData.status === 'ACTIVE' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                            <div>
                                <h4 className="font-medium text-yellow-900">
                                    Important Notice
                                </h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Setting this semester as ACTIVE will
                                    automatically set all other semesters to
                                    INACTIVE. Only one semester can be active at
                                    a time.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={isSubmitting}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Creating...' : 'Create Semester'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// Update Semester Modal
function UpdateSemesterModal({
    isOpen,
    onClose,
    semester,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    semester: Semester | null;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState<UpdateSemesterRequest>({
        name: '',
        status: 'INACTIVE',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const statusOptions = [
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'ACTIVE', label: 'Active' },
    ];

    useEffect(() => {
        if (semester) {
            setFormData({
                name: semester.name,
                status: semester.status,
            });
        }
    }, [semester]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!semester || !formData.name.trim()) {
            toast.error('Semester name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            await updateSemester(semester.id, formData);
            toast.success('Semester updated successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error updating semester:', error);
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Failed to update semester');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!semester) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Semester"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="update-name" className="text-gray-800">
                        Semester Name *
                    </Label>
                    <Input
                        className="text-gray-600"
                        id="update-name"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                        placeholder="e.g., 2024.1, Spring 2024, Fall 2023"
                        disabled={isSubmitting}
                        required
                    />
                    <p className="text-xs text-gray-500">
                        Enter a unique name for the semester
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="update-status" className="text-gray-800">
                        Status *
                    </Label>
                    <Select
                        value={statusOptions.find(
                            (option) => option.value === formData.status
                        )}
                        onChange={(selectedOption: any) =>
                            setFormData((prev) => ({
                                ...prev,
                                status: selectedOption?.value as
                                    | 'ACTIVE'
                                    | 'INACTIVE',
                            }))
                        }
                        options={statusOptions}
                        isDisabled={isSubmitting}
                        placeholder="Select status..."
                        className="text-sm"
                        classNamePrefix="react-select"
                        styles={{
                            control: (provided: any, state: any) => ({
                                ...provided,
                                minHeight: '40px',
                                borderColor: state.isFocused
                                    ? '#3b82f6'
                                    : '#d1d5db',
                                boxShadow: state.isFocused
                                    ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
                                    : 'none',
                                '&:hover': {
                                    borderColor: '#3b82f6',
                                },
                            }),
                            option: (provided: any, state: any) => ({
                                ...provided,
                                backgroundColor: state.isSelected
                                    ? '#3b82f6'
                                    : state.isFocused
                                    ? '#f3f4f6'
                                    : 'white',
                                color: state.isSelected ? 'white' : '#374151',
                                '&:hover': {
                                    backgroundColor: state.isSelected
                                        ? '#3b82f6'
                                        : '#f3f4f6',
                                },
                            }),
                        }}
                    />
                    <p className="text-xs text-gray-500">
                        Select the status for this semester
                    </p>
                </div>

                {formData.status === 'ACTIVE' &&
                    semester.status !== 'ACTIVE' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                                <div>
                                    <h4 className="font-medium text-yellow-900">
                                        Important Notice
                                    </h4>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Setting this semester as ACTIVE will
                                        automatically set all other semesters to
                                        INACTIVE. Only one semester can be
                                        active at a time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                <div className="flex gap-3 pt-4">
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={isSubmitting}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Updating...' : 'Update Semester'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// Delete Confirmation Modal
function DeleteConfirmationModal({
    isOpen,
    onClose,
    semester,
    onConfirm,
}: {
    isOpen: boolean;
    onClose: () => void;
    semester: Semester | null;
    onConfirm: () => void;
}) {
    if (!isOpen || !semester) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirm Delete Semester"
            size="md"
        >
            <div className="space-y-6">
                <div className="flex items-start">
                    <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                            Are you sure you want to delete this semester?
                        </h4>
                        <p className="text-gray-600 mb-4">
                            This action cannot be undone and may affect related
                            data.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-700">
                                    Name:
                                </span>
                                <span className="text-gray-900">
                                    {semester.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-700">
                                    Status:
                                </span>
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                        semester.status === 'ACTIVE'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    {semester.status === 'ACTIVE' ? (
                                        <CheckCircle className="h-3 w-3" />
                                    ) : (
                                        <XCircle className="h-3 w-3" />
                                    )}
                                    {semester.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-700">
                                    Created:
                                </span>
                                <span className="text-gray-900">
                                    {new Date(
                                        semester.createdAt
                                    ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Semester
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default function SemesterManagementPage() {
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState<Semester | null>(
        null
    );

    // Fetch semesters
    const fetchSemesters = async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await getSemesters();
            setSemesters(response.data);
        } catch (error: any) {
            console.error('Error fetching semesters:', error);
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Failed to load semesters');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSemesters();
    }, []);

    const handleRefresh = () => {
        fetchSemesters(true);
    };

    const handleCreateSuccess = () => {
        fetchSemesters();
    };

    const handleUpdateSuccess = () => {
        fetchSemesters();
        setSelectedSemester(null);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedSemester) return;

        try {
            await deleteSemester(selectedSemester.id);
            toast.success('Semester deleted successfully');
            fetchSemesters();
            setShowDeleteModal(false);
            setSelectedSemester(null);
        } catch (error: any) {
            console.error('Error deleting semester:', error);
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Failed to delete semester');
            }
        }
    };

    const openUpdateModal = (semester: Semester) => {
        setSelectedSemester(semester);
        setShowUpdateModal(true);
    };

    const openDeleteModal = (semester: Semester) => {
        setSelectedSemester(semester);
        setShowDeleteModal(true);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get status styling
    const getStatusColor = (status: string) => {
        return status === 'ACTIVE'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status: string) => {
        return status === 'ACTIVE' ? (
            <CheckCircle className="h-4 w-4" />
        ) : (
            <XCircle className="h-4 w-4" />
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Semester Management
                    </h1>
                    <p className="text-gray-600">
                        Manage academic semesters and terms for your
                        organization
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${
                                refreshing ? 'animate-spin' : ''
                            }`}
                        />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create Semester
                    </Button>
                </div>
            </div>

            {/* Semesters List */}
            <Card>
                <CardHeader>
                    <CardTitle>Semesters</CardTitle>
                    <CardDescription>
                        Manage your organization&apos;s academic semesters. Only
                        one semester can be active at a time.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">
                                    Loading semesters...
                                </p>
                            </div>
                        </div>
                    ) : semesters.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No semesters found
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Get started by creating your first semester.
                            </p>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create First Semester
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created At
                                        </th>
                                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Updated At
                                        </th>
                                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {semesters.map((semester) => (
                                        <tr
                                            key={semester.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="border border-gray-200 px-4 py-3">
                                                <div className="font-medium text-gray-900">
                                                    {semester.name}
                                                </div>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                        semester.status
                                                    )}`}
                                                >
                                                    {getStatusIcon(
                                                        semester.status
                                                    )}
                                                    {semester.status}
                                                </span>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(
                                                            semester.createdAt
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(
                                                            semester.updatedAt
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openUpdateModal(
                                                                semester
                                                            )
                                                        }
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                semester
                                                            )
                                                        }
                                                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Delete
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

            {/* Modals */}
            <CreateSemesterModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />

            <UpdateSemesterModal
                isOpen={showUpdateModal}
                onClose={() => {
                    setShowUpdateModal(false);
                    setSelectedSemester(null);
                }}
                semester={selectedSemester}
                onSuccess={handleUpdateSuccess}
            />

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedSemester(null);
                }}
                semester={selectedSemester}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
