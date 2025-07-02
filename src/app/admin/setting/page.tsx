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
    Building2,
    Settings,
    Upload,
    Save,
    Plus,
    Calendar,
    Users,
    Shield,
    Mail,
    Phone,
    MapPin,
    ImageIcon,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import {
    getOwnOrganizationDetails,
    updateOrganizationInfo,
    updateOrganizationSettings,
} from '@/services/api/organization';
import type {
    IOrganizationDetails,
    UpdateOrganizationInfoRequest,
    UpdateOrganizationSettingsRequest,
} from '@/services/api/organization/interface';
import { useOrganization } from '@/context/organization-context';
import { formatDate } from '@/helper/date-formatter';

export default function OrganizationSettingPage() {
    const [organizationDetail, setOrganizationDetail] =
        useState<IOrganizationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Organization Info State
    const [orgInfo, setOrgInfo] = useState({
        name: '',
        acronym: '',
        phoneNumber: '',
        address: '',
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [updatingInfo, setUpdatingInfo] = useState(false);

    // Organization Settings State
    const [orgSettings, setOrgSettings] = useState({
        whitelistMailDomain: [] as string[],
        allowLecturerAddNewStudent: false,
    });
    const [newDomain, setNewDomain] = useState('');
    const [updatingSettings, setUpdatingSettings] = useState(false);
    const { organization, setOrganization } = useOrganization();
    // Fetch organization data
    const fetchOrganization = async () => {
        try {
            setRefreshing(true);
            const data = await getOwnOrganizationDetails();
            setOrganizationDetail(data);
            setOrganization(data);
            // Set organization info
            setOrgInfo({
                name: data.name,
                acronym: data.acronym,
                phoneNumber: data.phoneNumber,
                address: data.address,
            });
            setImagePreview(data.image.url);

            // Set organization settings
            setOrgSettings({
                whitelistMailDomain: data.setting.whitelistMailDomain || [],
                allowLecturerAddNewStudent:
                    data.setting.allowLecturerAddNewStudent,
            });
        } catch (error: any) {
            console.log("🚀 ~ fetchOrganization ~ error:", error)
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(
                    error?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu của tổ chức'
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrganization();
    }, []);

    // Handle image selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước file ảnh phải nhỏ hơn 5MB.');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file ảnh hợp lệ.');
                return;
            }

            setSelectedImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Update organization info
    const handleUpdateInfo = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setUpdatingInfo(true);

            const updateData: UpdateOrganizationInfoRequest = {
                name: orgInfo.name,
                acronym: orgInfo.acronym,
                phoneNumber: orgInfo.phoneNumber,
                address: orgInfo.address,
            };

            if (selectedImage) {
                updateData.image = selectedImage;
            }

            await updateOrganizationInfo(updateData, organization?.id);
            toast.success('Cập nhật thông tin tổ chức thành công');

            // Refresh data
            await fetchOrganization();
            setSelectedImage(null);
        } catch (error: any) {
            console.log("🚀 ~ handleUpdateInfo ~ error:", error)
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(
                    error?.message ??
                        'Đã xảy ra lỗi khi cập nhật thông tin tổ chức'
                );
            }
        } finally {
            setUpdatingInfo(false);
        }
    };

    // Add whitelist domain
    const handleAddDomain = () => {
        if (!newDomain.trim()) {
            toast.error('Vui lòng nhập tên miền');
            return;
        }

        // Basic domain validation
        const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
        if (!domainRegex.test(newDomain.trim())) {
            toast.error('Vui lòng nhập tên miền hợp lệ (ví dụ: example.com)');
            return;
        }

        if (orgSettings.whitelistMailDomain.includes(newDomain.trim())) {
            toast.error('Tên miền đã tồn tại trong whitelist');
            return;
        }

        setOrgSettings((prev) => ({
            ...prev,
            whitelistMailDomain: [
                ...prev.whitelistMailDomain,
                newDomain.trim(),
            ],
        }));
        setNewDomain('');
    };

    // Remove whitelist domain
    const handleRemoveDomain = (domain: string) => {
        setOrgSettings((prev) => ({
            ...prev,
            whitelistMailDomain: prev.whitelistMailDomain.filter(
                (d) => d !== domain
            ),
        }));
    };

    // Update organization settings
    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setUpdatingSettings(true);

            const updateData: UpdateOrganizationSettingsRequest = {
                whitelistMailDomain: orgSettings.whitelistMailDomain,
                allowLecturerAddNewStudent:
                    orgSettings.allowLecturerAddNewStudent,
            };

            await updateOrganizationSettings(organization?.id, updateData);
            toast.success('Cập nhật cài đặt của tổ chức thành công');

            // Refresh data
            await fetchOrganization();
        } catch (error: any) {
            console.log("🚀 ~ handleUpdateSettings ~ error:", error)
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(
                    error?.message ?? 'Đã xảy ra lỗi khi cập nhật cài đặt của tổ chức'
                );
            }
        } finally {
            setUpdatingSettings(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">
                            Đang tải cài đặt của tổ chức...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!organizationDetail) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <p className="text-gray-500">
                        Đã xảy ra lỗi khi tải dữ liệu của tổ chức
                    </p>
                    <Button onClick={fetchOrganization} className="mt-4">
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Cài đặt của tổ chức
                    </h1>
                    <p className="text-gray-600">
                        Cấu hình các thông tin và cài đặt của tổ chức
                    </p>
                </div>
                <Button
                    onClick={fetchOrganization}
                    disabled={refreshing}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${
                            refreshing ? 'animate-spin' : ''
                        }`}
                    />
                    Làm mới
                </Button>
            </div>

            {/* Organization Information Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <CardTitle>Thông tin của tổ chức</CardTitle>
                    </div>
                    <CardDescription>
                        Cập nhật các thông tin của tổ chức
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateInfo} className="space-y-6">
                        {/* Organization Image */}
                        <div className="space-y-4">
                            <Label>Logo của tổ chức</Label>
                            <div className="flex items-start space-x-6">
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
                                        {imagePreview ? (
                                            <Image
                                                src={
                                                    imagePreview ||
                                                    '/placeholder.svg'
                                                }
                                                alt="Organization logo"
                                                width={96}
                                                height={96}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="organization-image"
                                        disabled={updatingInfo}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            document
                                                .getElementById(
                                                    'organization-image'
                                                )
                                                ?.click()
                                        }
                                        className="flex items-center gap-2"
                                        disabled={updatingInfo}
                                    >
                                        <Upload className="h-4 w-4" />
                                        Thay đổi Logo
                                    </Button>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Kích thước tối đa: 5MB. Định dạng hỗ trợ: JPG, PNG
                                    </p>
                                    {selectedImage && (
                                        <p className="text-xs text-green-600 mt-1">
                                            Ảnh mới được chọn:{' '}
                                            {selectedImage.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="org-name"
                                    className="flex items-center gap-2"
                                >
                                    <Building2 className="h-4 w-4" />
                                    Tên tổ chức
                                </Label>
                                <Input
                                    id="org-name"
                                    value={orgInfo.name}
                                    onChange={(e) =>
                                        setOrgInfo((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Nhập tên tổ chức"
                                    disabled={updatingInfo}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="org-acronym"
                                    className="flex items-center gap-2"
                                >
                                    <Shield className="h-4 w-4" />
                                    Tên viết tắt
                                </Label>
                                <Input
                                    id="org-acronym"
                                    value={orgInfo.acronym}
                                    onChange={(e) =>
                                        setOrgInfo((prev) => ({
                                            ...prev,
                                            acronym:
                                                e.target.value.toUpperCase(),
                                        }))
                                    }
                                    placeholder="Ví dụ: HUST, MIT"
                                    disabled={updatingInfo}
                                    style={{ textTransform: 'uppercase' }}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="org-phone"
                                    className="flex items-center gap-2"
                                >
                                    <Phone className="h-4 w-4" />
                                    Số điện thoại
                                </Label>
                                <Input
                                    id="org-phone"
                                    value={orgInfo.phoneNumber}
                                    onChange={(e) =>
                                        setOrgInfo((prev) => ({
                                            ...prev,
                                            phoneNumber: e.target.value,
                                        }))
                                    }
                                    placeholder="Nhập số điện thoại"
                                    disabled={updatingInfo}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="org-address"
                                    className="flex items-center gap-2"
                                >
                                    <MapPin className="h-4 w-4" />
                                    Địa chỉ
                                </Label>
                                <Input
                                    id="org-address"
                                    value={orgInfo.address}
                                    onChange={(e) =>
                                        setOrgInfo((prev) => ({
                                            ...prev,
                                            address: e.target.value,
                                        }))
                                    }
                                    placeholder="Nhập địa chỉ của tổ chức"
                                    disabled={updatingInfo}
                                    required
                                />
                            </div>
                        </div>

                        {/* Read-only Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                            <div className="space-y-2">
                                <Label className="text-gray-500">
                                    Nhà cung cấp xác thực
                                </Label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    <span className="text-gray-700">
                                        {organizationDetail.authProvider.name}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-500 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Thời hạn hợp đồng
                                </Label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    <span className="text-gray-700">
                                        {formatDate(
                                            organizationDetail.contactTo, 'dd/MM/yyyy'
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-500 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Số tài khoản cung cấp
                                </Label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    <span className="text-gray-700">
                                        {organizationDetail.accountSupplied}{' '}
                                        tài khoản
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={updatingInfo}
                                className="flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {updatingInfo
                                    ? 'Đang cập nhật...'
                                    : 'Cập nhật thông tin'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Organization Settings Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-green-600" />
                        <CardTitle>Cài đặt của tổ chức</CardTitle>
                    </div>
                    <CardDescription>
                        Cấu hình các cài đặt và quyền hạn của tổ chức
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateSettings} className="space-y-6">
                        {/* Whitelist Mail Domains */}
                        <div className="space-y-4">
                            <div>
                                <Label className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Tên miền trong whitelist
                                </Label>
                                <p className="text-sm text-gray-500 mt-1">
                                    Chỉ có người dùng với email từ các tên miền này mới có thể được thêm vào tổ chức
                                </p>
                            </div>

                            {/* Add new domain */}
                            <div className="flex gap-2">
                                <Input
                                    value={newDomain}
                                    onChange={(e) =>
                                        setNewDomain(e.target.value)
                                    }
                                    placeholder="Nhập tên miền (ví dụ: example.com)"
                                    disabled={updatingSettings}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddDomain();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    onClick={handleAddDomain}
                                    disabled={updatingSettings}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Thêm
                                </Button>
                            </div>

                            {/* Domain list */}
                            <div className="space-y-2">
                                {orgSettings.whitelistMailDomain.length ===
                                0 ? (
                                    <div className="p-4 bg-gray-50 rounded-md text-center">
                                        <p className="text-gray-500">
                                            Không có tên miền trong whitelist
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Người dùng với bất kỳ tên miền email nào có thể tham gia tổ chức
                                        </p>
                                    </div>
                                ) : (
                                    orgSettings.whitelistMailDomain.map(
                                        (domain, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-blue-50 rounded-md"
                                            >
                                                <span className="text-blue-800 font-medium">
                                                    {domain}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleRemoveDomain(
                                                            domain
                                                        )
                                                    }
                                                    disabled={updatingSettings}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )
                                    )
                                )}
                            </div>
                        </div>

                        {/* Lecturer Permissions */}
                        <div className="space-y-4">
                            <div>
                                <Label className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Quyền hạn của giảng viên
                                </Label>
                                <p className="text-sm text-gray-500 mt-1">
                                    Cấu hình các hành động mà giảng viên có thể thực hiện
                                    trong tổ chức
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900">
                                        Cho phép giảng viên thêm sinh viên mới
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        Giảng viên có thể thêm sinh viên mới vào tổ chức thông qua việc nhập file danh sách sinh viên vào lớp học
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={
                                            orgSettings.allowLecturerAddNewStudent
                                        }
                                        onChange={(e) =>
                                            setOrgSettings((prev) => ({
                                                ...prev,
                                                allowLecturerAddNewStudent:
                                                    e.target.checked,
                                            }))
                                        }
                                        disabled={updatingSettings}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={updatingSettings}
                                className="flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {updatingSettings
                                    ? 'Đang cập nhật...'
                                    : 'Cập nhật cài đặt'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
