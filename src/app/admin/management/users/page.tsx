/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Download,
    Upload,
    Search,
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    HelpCircle,
    X,
    Info,
    Users,
} from 'lucide-react';
import {
    addUserToOrganization,
    deleteUser,
    downloadImportTemplate,
    getUsersInOrganization,
    importLecturer,
    importStudent,
    updateUser,
} from '@/services/api/user';
import type { IUser } from '@/services/api/user/interface';
import { UserRole } from '@/hooks/use-auth-protection';
import { getAuthData } from '@/services/local-storage/auth';
import { useOrganization } from '@/context/organization-context';
import { toast } from 'react-toastify';

interface UserListResponse {
    total: number;
    data: IUser[];
    statusCode: number;
}

function HelpModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Import/Export Guide
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 text-sm text-gray-600">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                            How to Import Users:
                        </h4>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>
                                Download the template file by clicking
                                &quot;Download Template&quot;
                            </li>
                            <li>
                                Fill in the required fields: EMAIL, NAME
                                (optional, if not provided we will use name
                                return by auth provider when user login), ID
                                (optional),
                            </li>
                            <li>Save the file as CSV or Excel format</li>
                            <li>Use the import button to upload your file</li>
                            <li>Check the Import Log for processing status</li>
                        </ol>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                            Template Fields:
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                <strong>NAME:</strong> Full name of the user
                                (optional)
                            </li>
                            <li>
                                <strong>EMAIL:</strong> Valid email address use
                                in your organization (required)
                            </li>
                            <li>
                                <strong>ID:</strong> User ID in your
                                organization (optional)
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                            Export Options:
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                Export Students: Downloads all users with
                                STUDENT role
                            </li>
                            <li>
                                Export Lecturers: Downloads all users with
                                LECTURER role
                            </li>
                            <li>
                                Files are exported in Excel format for easy
                                editing
                            </li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-yellow-800">
                            <strong>Note:</strong> Large imports may take some
                            time to process. Check the Import Log page for
                            detailed status and error reports.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Update User Modal Component
function UpdateUserModal({
    isOpen,
    onClose,
    user,
    onUpdate,
}: {
    isOpen: boolean;
    onClose: () => void;
    user: IUser | null;
    onUpdate: (
        id: number,
        updatedUser: Pick<IUser, 'externalId' | 'name' | 'roles'>
    ) => void;
}) {
    const currentUserRoles = getAuthData()?.roles;

    const [formData, setFormData] = useState({
        name: '',
        externalId: '',
        roles: [] as UserRole[],
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                externalId: user.externalId || '',
                roles: user.roles,
            });
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {
            onUpdate(user.id, formData);
            onClose();
        }
    };

    const handleRoleToggle = (role: UserRole) => {
        setFormData((prev) => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter((r) => r !== role)
                : [...prev.roles, role],
        }));
    };

    if (!isOpen || !user) return null;

    const availableRoles =
        (currentUserRoles as any) == UserRole.SUPER_ADMIN
            ? Object.values(UserRole)
            : Object.values(UserRole).filter(
                  (val) => val != UserRole.SUPER_ADMIN
              );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Update User
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name" className="text-gray-900">
                            Full Name
                        </Label>
                        <Input
                            className="text-gray-700"
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            placeholder="Enter user's full name"
                        />
                    </div>

                    <div>
                        <Label htmlFor="externalId" className="text-gray-900">
                            External ID
                        </Label>
                        <Input
                            className="text-gray-700"
                            id="externalId"
                            value={formData.externalId}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    externalId: e.target.value,
                                })
                            }
                            placeholder="Enter student/employee ID"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Optional - organization&apos;s internal user
                            identifier
                        </p>
                    </div>

                    <div>
                        <Label>User Roles</Label>
                        <div className="space-y-2 mt-2">
                            {availableRoles.map((role) => (
                                <label
                                    key={role}
                                    className="flex items-center space-x-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.roles.includes(role)}
                                        onChange={() => handleRoleToggle(role)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        {role.replace('_', ' ')}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Required - select at least one role
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={formData.roles.length === 0}
                        >
                            Update User
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
                </form>
            </div>
        </div>
    );
}

// Add User Modal Component
function AddUserModal({
    isOpen,
    onClose,
    onAdd,
}: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (
        newUser: Omit<
            IUser,
            'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'organizationId'
        >
    ) => void;
}) {
    const currentUserRoles = getAuthData()?.roles;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        externalId: '',
        roles: [] as UserRole[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.email && formData.roles.length > 0) {
            onAdd({
                name: formData.name || undefined, // Use email prefix if no name
                email: formData.email,
                externalId: formData.externalId || null,
                roles: formData.roles,
            });
            setFormData({ name: '', email: '', externalId: '', roles: [] });
            onClose();
        }
    };

    const handleRoleToggle = (role: UserRole) => {
        setFormData((prev) => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter((r) => r !== role)
                : [...prev.roles, role],
        }));
    };

    if (!isOpen) return null;

    const availableRoles =
        (currentUserRoles as any) == UserRole.SUPER_ADMIN
            ? Object.values(UserRole)
            : Object.values(UserRole).filter(
                  (val) => val != UserRole.SUPER_ADMIN
              );
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Add New User
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="add-name" className="text-gray-900">
                            Full Name
                        </Label>
                        <Input
                            className="text-gray-700"
                            id="add-name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            placeholder="Enter user's full name"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Optional - will use name provided by auth provider
                            when user login if left empty
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="add-email" className="text-gray-900">
                            Email Address *
                        </Label>
                        <Input
                            className="text-gray-700"
                            id="add-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value,
                                })
                            }
                            placeholder="user@example.com"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Required - must be a valid email address
                        </p>
                    </div>

                    <div>
                        <Label
                            htmlFor="add-externalId"
                            className="text-gray-900"
                        >
                            External ID
                        </Label>
                        <Input
                            className="text-gray-700"
                            id="add-externalId"
                            value={formData.externalId}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    externalId: e.target.value,
                                })
                            }
                            placeholder="Enter student/employee ID"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Optional - organization&apos;s internal user
                            identifier
                        </p>
                    </div>

                    <div>
                        <Label className="text-gray-900">User Roles *</Label>
                        <div className="space-y-2 mt-2">
                            {availableRoles.map((role) => (
                                <label
                                    key={role}
                                    className="flex items-center space-x-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.roles.includes(role)}
                                        onChange={() => handleRoleToggle(role)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        {role.replace('_', ' ')}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Required - select at least one role
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={
                                !formData.email || formData.roles.length === 0
                            }
                        >
                            Add User
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
                </form>
            </div>
        </div>
    );
}
// Delete Confirmation Modal Component
function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    user,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    user: IUser | null;
}) {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Confirm Delete User
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                        Are you sure you want to delete this user? This action
                        cannot be undone.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">
                                Name:
                            </span>
                            <span className="text-gray-900">{user.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">
                                Email:
                            </span>
                            <span className="text-gray-900">{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">
                                Roles:
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {user.roles.map((role) => (
                                    <span
                                        key={role}
                                        className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                                    >
                                        {role.replace('_', ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete User
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
        </div>
    );
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<IUser[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [selectedImportStudentFile, setSelectedImportStudentFile] =
        useState<File | null>(null);
    const [selectedImportLecturerFile, setSelectedImportLecturerFile] =
        useState<File | null>(null);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');
    const [externalIdFilter, setExternalIdFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const { organization } = useOrganization();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
    const currentUserRoles = getAuthData()?.roles;

    // Fetch users with API call and pagination
    useEffect(() => {
        const fetchUsers = async () => {
            if (!organization) return;

            try {
                setLoading(true);
                const response = await getUsersInOrganization(
                    organization.id,
                    {
                        role: roleFilter as UserRole,
                        externalId: externalIdFilter
                            ? Number(externalIdFilter)
                            : undefined,
                        email: emailFilter,
                        name: nameFilter,
                    },
                    currentPage,
                    itemsPerPage
                );
                setUsers(response.data);
                setTotalUsers(response.total);
            } catch (error) {
                console.error('Error fetching users:', error);
                toast.error('Failed to load users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [
        nameFilter,
        emailFilter,
        externalIdFilter,
        roleFilter,
        currentPage,
        itemsPerPage,
        organization,
        shouldRefresh,
    ]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [nameFilter, emailFilter, externalIdFilter, roleFilter]);

    // Pagination using API response total
    const totalPages = Math.ceil(totalUsers / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalUsers);

    const handleFileStudentChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImportStudentFile(file);
        }
    };

    const handleImportStudent = async (type: 'student') => {
        if (!selectedImportStudentFile) {
            toast.error('Please select a file first');
            return;
        }
        await importStudent(selectedImportStudentFile);
        toast.success(
            `Importing ${type}s from ${selectedImportStudentFile.name}.  View import log to check progress!`
        );
    };

    const handleFileLecturerChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImportLecturerFile(file);
        }
    };

    const handleImportLecturer = async (type: 'lecturer') => {
        if (!selectedImportLecturerFile) {
            toast.error('Please select a file first');
            return;
        }
        await importLecturer(selectedImportLecturerFile);
        toast.success(
            `Importing ${type}s from ${selectedImportLecturerFile.name}.  View import log to check progress!`
        );
    };

    const handleExportUsers = (type: 'student' | 'lecturer') => {
        // TODO: Implement export logic
        // toast.(`Exporting ${type}s...`, 'success');
    };

    const downloadTemplate = (type: string) => {
        try {
            downloadImportTemplate(type);
            // showToast('Template downloaded successfully', 'success');
        } catch (error) {
            toast.error('Failed to download template');
        }
    };

    const handleUpdateUser = async (
        id: number,
        updatedUser: Pick<IUser, 'externalId' | 'name' | 'roles'>
    ) => {
        try {
            await updateUser(id, updatedUser);
            setShouldRefresh((val) => !val);
            toast.success('Updated user successfully');
        } catch (error: any) {
            console.log('🚀 ~ UserManagementPage ~ error:', error);
            if (Array.isArray(error?.message)) toast.error(error.message[0]);
            toast.error(error?.message ?? 'Internal server error');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        try {
            await deleteUser(userId);
            setShouldRefresh((val) => !val);
            toast.success('Deleted user successfully');
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (error: any) {
            console.log('🚀 ~ UserManagementPage ~ error:', error);
            if (Array.isArray(error?.message)) toast.error(error.message[0]);
            toast.error(error?.message ?? 'Internal server error');
        }
    };

    const openDeleteModal = (user: IUser) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };
    const canDeleteUser = (user: IUser): boolean => {
        const userRoles = user.roles;
        const isUserNotAdmin =
            !userRoles.includes(UserRole.ADMIN) &&
            !userRoles.includes(UserRole.SUPER_ADMIN);
        const currentUserIsSuperAdmin = currentUserRoles?.includes(
            UserRole.SUPER_ADMIN
        );

        return (
            (isUserNotAdmin ||
                (currentUserIsSuperAdmin &&
                    !userRoles.includes(UserRole.SUPER_ADMIN))) ??
            false
        );
    };

    const canUpdateUser = (user: IUser): boolean => {
        const userRoles = user.roles;
        const isUserNotAdmin =
            !userRoles.includes(UserRole.ADMIN) &&
            !userRoles.includes(UserRole.SUPER_ADMIN);
        const currentUserIsSuperAdmin = currentUserRoles?.includes(
            UserRole.SUPER_ADMIN
        );

        return (
            (isUserNotAdmin ||
                (currentUserIsSuperAdmin &&
                    !userRoles.includes(UserRole.SUPER_ADMIN))) ??
            false
        );
    };

    // Updated getRoleColor function for multiple roles
    const getRoleColor = (role: UserRole) => {
        if (role == UserRole.SUPER_ADMIN) {
            return 'bg-red-100 text-red-800';
        }
        if (role == UserRole.ADMIN) {
            return 'bg-blue-100 text-blue-800';
        }
        if (role == UserRole.LECTURER) {
            return 'bg-green-100 text-green-800';
        }
        if (role == UserRole.STUDENT) {
            return 'bg-purple-100 text-purple-800';
        }
        return 'bg-gray-100 text-gray-800';
    };

    const handleAddUser = async (
        newUserData: Omit<
            IUser,
            'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'organizationId'
        >
    ) => {
        // TODO: Implement API call to add user

        try {
            await addUserToOrganization(newUserData);
            setShouldRefresh((val) => !val);
            toast.success('User added successfully');
        } catch (error: any) {
            console.log('🚀 ~ UserManagementPage ~ error:', error);
            if (Array.isArray(error?.message)) toast.error(error.message[0]);
            toast.error(error?.message ?? 'Internal server error');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    User Management
                </h1>
                <p className="text-gray-600">
                    Manage users in your organization
                </p>
            </div>

            {/* Import/Export Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Import/Export */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Student Management</CardTitle>
                                <CardDescription>
                                    Import and export student data
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHelpModal(true)}
                                className="flex items-center gap-2"
                            >
                                <HelpCircle className="h-4 w-4" />
                                Help
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    onClick={() => downloadTemplate('student')}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Template
                                </Button>
                                <Button
                                    onClick={() => handleExportUsers('student')}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export Students
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileStudentChange}
                                    className="flex-1"
                                    required
                                />
                                <Button
                                    onClick={() =>
                                        handleImportStudent('student')
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Import Students
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lecturer Import/Export */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Lecturer Management</CardTitle>
                                <CardDescription>
                                    Import and export lecturer data
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHelpModal(true)}
                                className="flex items-center gap-2"
                            >
                                <HelpCircle className="h-4 w-4" />
                                Help
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    onClick={() => downloadTemplate('lecturer')}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Template
                                </Button>
                                <Button
                                    onClick={() =>
                                        handleExportUsers('lecturer')
                                    }
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export Lecturers
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileLecturerChange}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={() =>
                                        handleImportLecturer('lecturer')
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Import Lecturers
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User List Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>User List</CardTitle>
                            <CardDescription>
                                Filter and manage existing users
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                            <Label htmlFor="search-name">Search by Name</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search-name"
                                    placeholder="Enter name..."
                                    value={nameFilter}
                                    onChange={(e) =>
                                        setNameFilter(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="search-email">
                                Search by Email
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search-email"
                                    placeholder="Enter email..."
                                    value={emailFilter}
                                    onChange={(e) =>
                                        setEmailFilter(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="search-external">
                                Search by External ID
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search-external"
                                    placeholder="Enter external ID..."
                                    value={externalIdFilter}
                                    onChange={(e) =>
                                        setExternalIdFilter(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="role-filter">Filter by Role</Label>
                            <Select
                                value={roleFilter}
                                onValueChange={setRoleFilter}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={''}>-</SelectItem>
                                    <SelectItem value={UserRole.SUPER_ADMIN}>
                                        Super Admin
                                    </SelectItem>
                                    <SelectItem value={UserRole.ADMIN}>
                                        Admin
                                    </SelectItem>
                                    <SelectItem value={UserRole.LECTURER}>
                                        Lecturer
                                    </SelectItem>
                                    <SelectItem value={UserRole.STUDENT}>
                                        Student
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-visible relative z-10">
                        <table className="w-full border-collapse border border-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-200 px-4 py-2 text-left">
                                        Email
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">
                                        Name
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">
                                        <div className="flex items-center gap-1">
                                            External ID
                                            <div className="group relative">
                                                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                    User ID in your organization
                                                    system
                                                </div>
                                            </div>
                                        </div>
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">
                                        Roles
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">
                                        Added By
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="border border-gray-200 px-4 py-8 text-center"
                                        >
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                <span className="ml-2">
                                                    Loading users...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="border border-gray-200 px-4 py-8 text-center text-gray-500"
                                        >
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="border border-gray-200 px-4 py-2">
                                                {user.email}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 font-medium">
                                                {user.name}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                {user.externalId || '-'}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.map((role) => (
                                                        <span
                                                            key={role}
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                                                role
                                                            )}`}
                                                        >
                                                            {role.replace(
                                                                '_',
                                                                ' '
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                {/* TODO: Add actual added by user info */}
                                                <span className="text-gray-500">
                                                    {user?.addedBy?.name ??
                                                        'System'}
                                                </span>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <div className="flex gap-2">
                                                    {canUpdateUser(user) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedUser(
                                                                    user
                                                                );
                                                                setShowUpdateModal(
                                                                    true
                                                                );
                                                            }}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                            Update
                                                        </Button>
                                                    )}
                                                    {canDeleteUser(user) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    user
                                                                )
                                                            }
                                                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-600">
                            Showing {startIndex + 1} to {endIndex} of{' '}
                            {totalUsers} users
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1)
                                    )
                                }
                                disabled={currentPage === 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>

                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages)
                                    )
                                }
                                disabled={currentPage === totalPages || loading}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            <HelpModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
            />
            <UpdateUserModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                user={selectedUser}
                onUpdate={handleUpdateUser}
            />
            <AddUserModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddUser}
            />
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                }}
                onConfirm={() =>
                    userToDelete && handleDeleteUser(userToDelete.id)
                }
                user={userToDelete}
            />
        </div>
    );
}
