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
    downloadLecturersExport,
    downloadStudentsExport,
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
import useDebounce from '@/hooks/use-debounce';
import ReactSelect from 'react-select';

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
                        Hướng dẫn nhập/xuất dữ liệu bằng file Excel
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
                            Cách nhập dữ liệu:
                        </h4>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>
                                Tải file template bằng cách nhấn vào nút
                                &quot;Tải template&quot;
                            </li>
                            <li>
                                Điền các trường bắt buộc: EMAIL, ID, NAME (tùy
                                chọn, nếu bỏ trống thì hệ thống sẽ sử dụng tên
                                trả về bởi nhà cung cấp xác thực khi người dùng
                                đăng nhập)
                            </li>
                            <li>Lưu file dưới dạng Excel</li>
                            <li>Sử dụng nút nhập từ Excel để tải lên file</li>
                            <li>
                                Kiểm tra log nhập file để xem trạng thái xử lý
                            </li>
                        </ol>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                            Các trường trong file template:
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                <strong>NAME:</strong> Tên người dùng (tùy chọn)
                            </li>
                            <li>
                                <strong>EMAIL:</strong> Email của người dùng sử
                                dụng trong tổ chức (bắt buộc)
                            </li>
                            <li>
                                <strong>ID:</strong> ID của người dùng trong tổ
                                chức (bắt buộc nếu người dùng có vai trò là sinh
                                viên)
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                            Các tùy chọn xuất dữ liệu:
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                Tải về danh sách sinh viên: Xuất ra file Excel
                                chứa tất cả người dùng có vai trò &quot;Sinh
                                viên&quot;
                            </li>
                            <li>
                                Tải về danh sách giảng viên: Xuất ra file Excel
                                chứa tất cả người dùng có vai trò &quot;Giảng
                                viên&quot;
                            </li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-yellow-800">
                            <strong>Lưu ý:</strong> Nhập file lớn có thể mất
                            nhiều thời gian để xử lý. Kiểm tra log nhập file để
                            xem trạng thái và báo cáo lỗi chi tiết.
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

    // Function to get Vietnamese label for role
    const getRoleLabel = (role: UserRole): string => {
        const roleLabels: Record<UserRole, string> = {
            [UserRole.STUDENT]: 'Sinh viên',
            [UserRole.LECTURER]: 'Giảng viên',
            [UserRole.ADMIN]: 'Quản trị viên',
            [UserRole.SUPER_ADMIN]: 'Quản trị viên cấp cao',
        };
        return roleLabels[role] || role;
    };

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
                : role == UserRole.STUDENT
                ? [...prev.roles.filter((r) => r !== UserRole.LECTURER), role]
                : role == UserRole.LECTURER
                ? [...prev.roles.filter((r) => r !== UserRole.STUDENT), role]
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
                        Cập nhật người dùng
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
                            Tên người dùng
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
                            placeholder="Nhập tên người dùng"
                        />
                    </div>

                    <div>
                        <Label htmlFor="externalId" className="text-gray-900">
                            ID người dùng
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
                            placeholder="Nhập ID người dùng"
                            required={formData.roles.includes(UserRole.STUDENT)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Tùy chọn - ID người dùng trong tổ chức (bắt buộc nếu
                            người dùng có vai trò là sinh viên)
                        </p>
                    </div>

                    <div>
                        <Label>Vai trò người dùng</Label>
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
                                        {getRoleLabel(role)}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Bắt buộc - cần chọn ít nhất một vai trò, vai trò
                            sinh viên và giảng viên không thể cùng sử dụng cho
                            người dùng
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={formData.roles.length === 0}
                        >
                            Cập nhật người dùng
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Hủy
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

    // Function to get Vietnamese label for role
    const getRoleLabel = (role: UserRole): string => {
        const roleLabels: Record<UserRole, string> = {
            [UserRole.STUDENT]: 'Sinh viên',
            [UserRole.LECTURER]: 'Giảng viên',
            [UserRole.ADMIN]: 'Quản trị viên',
            [UserRole.SUPER_ADMIN]: 'Quản trị viên cấp cao',
        };
        return roleLabels[role] || role;
    };

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
                : role == UserRole.STUDENT
                ? [...prev.roles.filter((r) => r !== UserRole.LECTURER), role]
                : role == UserRole.LECTURER
                ? [...prev.roles.filter((r) => r !== UserRole.STUDENT), role]
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
                        Thêm người dùng mới
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
                            Tên người dùng
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
                            placeholder="Nhập tên người dùng"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Tùy chọn - sẽ sử dụng tên được cung cấp bởi nhà cung
                            cấp xác thực khi người dùng đăng nhập nếu bỏ trống
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="add-email" className="text-gray-900">
                            Email người dùng *
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
                            Bắt buộc - phải là một địa chỉ email hợp lệ và phải
                            thuộc tổ chức
                        </p>
                    </div>

                    <div>
                        <Label
                            htmlFor="add-externalId"
                            className="text-gray-900"
                        >
                            ID người dùng
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
                            placeholder="Nhập ID người dùng"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Bắt buộc - ID người dùng trong tổ chức (bắt buộc nếu
                            người dùng có vai trò là sinh viên)
                        </p>
                    </div>

                    <div>
                        <Label className="text-gray-900">
                            Vai trò người dùng *
                        </Label>
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
                                        {getRoleLabel(role)}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Bắt buộc - cần chọn ít nhất một vai trò, vai trò
                            sinh viên và giảng viên không thể cùng sử dụng cho
                            người dùng
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
                            Thêm người dùng
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Hủy
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
    // Function to get Vietnamese label for role
    const getRoleLabel = (role: UserRole): string => {
        const roleLabels: Record<UserRole, string> = {
            [UserRole.STUDENT]: 'Sinh viên',
            [UserRole.LECTURER]: 'Giảng viên',
            [UserRole.ADMIN]: 'Quản trị viên',
            [UserRole.SUPER_ADMIN]: 'Quản trị viên cấp cao',
        };
        return roleLabels[role] || role;
    };

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
                        Xác nhận xóa người dùng
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
                        Bạn có chắc chắn muốn xóa người dùng này không? Hành
                        động này không thể được hoàn tác.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">
                                Tên người dùng:
                            </span>
                            <span className="text-gray-900">{user.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">
                                Email người dùng:
                            </span>
                            <span className="text-gray-900">{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">
                                Vai trò người dùng:
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {user.roles.map((role) => (
                                    <span
                                        key={role}
                                        className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                                    >
                                        {getRoleLabel(role)}
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
                        Xóa người dùng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Hủy
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
    const [isImportingStudent, setIsImportingStudent] = useState(false);
    const [isImportingLecturer, setIsImportingLecturer] = useState(false);

    // Debounced search filters
    const debouncedNameFilter = useDebounce(nameFilter, 500);
    const debouncedEmailFilter = useDebounce(emailFilter, 500);
    const debouncedExternalIdFilter = useDebounce(externalIdFilter, 500);

    // Role options for react-select
    const roleOptions = [
        { value: '', label: 'Tất cả vai trò' },
        { value: UserRole.SUPER_ADMIN, label: 'Quản trị viên cấp cao' },
        { value: UserRole.ADMIN, label: 'Quản trị viên' },
        { value: UserRole.LECTURER, label: 'Giảng viên' },
        { value: UserRole.STUDENT, label: 'Sinh viên' },
    ];

    // Function to get Vietnamese label for role
    const getRoleLabel = (role: UserRole): string => {
        const roleLabels: Record<UserRole, string> = {
            [UserRole.STUDENT]: 'Sinh viên',
            [UserRole.LECTURER]: 'Giảng viên',
            [UserRole.ADMIN]: 'Quản trị viên',
            [UserRole.SUPER_ADMIN]: 'Quản trị viên cấp cao',
        };
        return roleLabels[role] || role;
    };

    useEffect(() => {
        const fetchUsers = async () => {
            if (!organization) return;

            try {
                setLoading(true);
                const filters = {
                    role: roleFilter ? (roleFilter as UserRole) : undefined,
                    externalId: debouncedExternalIdFilter
                        ? Number(debouncedExternalIdFilter)
                        : undefined,
                    email: debouncedEmailFilter,
                    name: debouncedNameFilter,
                };
                console.log('🚀 ~ fetchUsers ~ filters:', filters);

                const response = await getUsersInOrganization(
                    organization.id,
                    filters,
                    currentPage,
                    itemsPerPage
                );
                setUsers(response.data);
                setTotalUsers(response.total);
            } catch (error) {
                console.log('🚀 ~ fetchUsers ~ error:', error);
                toast.error('Đã xảy ra lỗi khi tải danh sách người dùng');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [
        debouncedNameFilter,
        debouncedEmailFilter,
        debouncedExternalIdFilter,
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
            toast.error('Vui lòng chọn file của bạn');
            return;
        }
        setIsImportingStudent(true);
        try {
            await importStudent(selectedImportStudentFile);
            toast.success(
                `Đang nhập sinh viên từ ${selectedImportStudentFile.name}. Kiểm tra log nhập để xem tiến trình!`
            );
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(
                    error.message || `Đã xảy ra lỗi khi nhập sinh viên`
                );
            }
        } finally {
            setIsImportingStudent(false);
            setSelectedImportStudentFile(null);
        }
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
            toast.error('Vui lòng chọn file của bạn');
            return;
        }
        setIsImportingLecturer(true);
        try {
            await importLecturer(selectedImportLecturerFile);
            toast.success(
                `Đang nhập giảng viên từ ${selectedImportLecturerFile.name}. Kiểm tra log nhập để xem tiến trình!`
            );
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(
                    error.message || `Đã xảy ra lỗi khi nhập giảng viên`
                );
            }
        } finally {
            setIsImportingLecturer(false);
            setSelectedImportLecturerFile(null);
        }
    };

    const handleExportUsers = (type: 'student' | 'lecturer') => {
        if (type === 'student') {
            downloadStudentsExport('student');
        } else {
            downloadLecturersExport('lecturer');
        }
    };

    const downloadTemplate = (type: string) => {
        try {
            downloadImportTemplate(type);
            // showToast('Template downloaded successfully', 'success');
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi tải template');
        }
    };

    const handleUpdateUser = async (
        id: number,
        updatedUser: Pick<IUser, 'externalId' | 'name' | 'roles'>
    ) => {
        try {
            await updateUser(id, updatedUser);
            setShouldRefresh((val) => !val);
            toast.success('Cập nhật người dùng thành công');
        } catch (error: any) {
            console.log('🚀 ~ UserManagementPage ~ error:', error);
            if (Array.isArray(error?.message)) toast.error(error.message[0]);
            toast.error(error?.message ?? 'Lỗi hệ thống');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        try {
            await deleteUser(userId);
            setShouldRefresh((val) => !val);
            toast.success('Xóa người dùng thành công');
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (error: any) {
            console.log('🚀 ~ UserManagementPage ~ error:', error);
            if (Array.isArray(error?.message)) toast.error(error.message[0]);
            toast.error(error?.message ?? 'Lỗi hệ thống');
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
            toast.success('Thêm người dùng thành công');
        } catch (error: any) {
            console.log('🚀 ~ UserManagementPage ~ error:', error);
            if (Array.isArray(error?.message)) toast.error(error.message[0]);
            toast.error(error?.message ?? 'Lỗi hệ thống');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Quản lý người dùng
                </h1>
                <p className="text-gray-600">
                    Quản lý người dùng trong tổ chức của bạn
                </p>
            </div>

            {/* Import/Export Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Import/Export */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Quản lý sinh viên</CardTitle>
                                <CardDescription>
                                    Nhập và xuất dữ liệu sinh viên
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHelpModal(true)}
                                className="flex items-center gap-2"
                            >
                                <HelpCircle className="h-4 w-4" />
                                Hướng dẫn
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
                                    Tải template
                                </Button>
                                <Button
                                    onClick={() => handleExportUsers('student')}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Tải xuống danh sách sinh viên
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
                                    disabled={isImportingStudent}
                                    className="flex items-center gap-2"
                                >
                                    {isImportingStudent ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Đang nhập file...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Nhập file sinh viên
                                        </>
                                    )}
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
                                <CardTitle>Quản lý giảng viên</CardTitle>
                                <CardDescription>
                                    Nhập và xuất dữ liệu giảng viên
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHelpModal(true)}
                                className="flex items-center gap-2"
                            >
                                <HelpCircle className="h-4 w-4" />
                                Hướng dẫn
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
                                    Tải template
                                </Button>
                                <Button
                                    onClick={() =>
                                        handleExportUsers('lecturer')
                                    }
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Tải xuống danh sách giảng viên
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
                                    disabled={isImportingLecturer}
                                    className="flex items-center gap-2"
                                >
                                    {isImportingLecturer ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Đang nhập file...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Nhập file giảng viên
                                        </>
                                    )}
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
                            <CardTitle>Danh sách người dùng</CardTitle>
                            <CardDescription>
                                Lọc và quản lý người dùng hiện có
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            Thêm người dùng
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                            <Label htmlFor="search-name">
                                Tìm kiếm theo tên
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search-name"
                                    placeholder="Nhập tên..."
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
                                Tìm kiếm theo email
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search-email"
                                    placeholder="Nhập email..."
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
                                Tìm kiếm theo ID người dùng
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search-external"
                                    placeholder="Nhập ID người dùng..."
                                    value={externalIdFilter}
                                    onChange={(e) =>
                                        setExternalIdFilter(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="role-filter">
                                Lọc theo vai trò
                            </Label>
                            <ReactSelect
                                value={roleOptions.find(
                                    (option) => option.value === roleFilter
                                )}
                                onChange={(selectedOption) => {
                                    console.log(
                                        '🚀 ~ roleFilter changed:',
                                        selectedOption?.value
                                    );
                                    setRoleFilter(selectedOption?.value || '');
                                }}
                                options={roleOptions}
                                placeholder="Tất cả vai trò"
                                isClearable
                                className="w-full"
                                classNamePrefix="react-select"
                                menuPortalTarget={
                                    typeof window !== 'undefined'
                                        ? document.body
                                        : null
                                }
                                styles={{
                                    control: (provided) => ({
                                        ...provided,
                                        minHeight: '40px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                    }),
                                    placeholder: (provided) => ({
                                        ...provided,
                                        color: '#9ca3af',
                                    }),
                                    menuPortal: (base) => ({
                                        ...base,
                                        zIndex: 9999,
                                    }),
                                    option: (base) => ({
                                        ...base,
                                        color: 'black',
                                    }),
                                }}
                            />
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
                                        Tên người dùng
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">
                                        <div className="flex items-center gap-1">
                                            ID người dùng
                                            <div className="group relative">
                                                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                    ID người dùng trong tổ chức
                                                </div>
                                            </div>
                                        </div>
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">
                                        Vai trò
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">
                                        Thêm bởi
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">
                                        Hành động
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
                                                    Đang tải danh sách người
                                                    dùng...
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
                                            Không tìm thấy người dùng
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
                                                            {getRoleLabel(role)}
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
                                                            Cập nhật
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
                                                            Xóa
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
                            Hiển thị {startIndex + 1} đến {endIndex} trên{' '}
                            {totalUsers} người dùng
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
                                Trước
                            </Button>

                            <span className="text-sm text-gray-600">
                                Trang {currentPage} trên {totalPages}
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
                                Tiếp
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
