'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Select from 'react-select';
import { ArrowLeft, Shield, GraduationCap, Users } from 'lucide-react';
import type { Organization } from '@/services/api/organization/interface';
import { getAvailableOrganization } from '@/services/api/organization';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLoginUrl } from '@/services/api/auth';

interface SelectOption {
    value: string;
    label: React.ReactNode;
    data?: any;
}

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const loginRole = localStorage.getItem('loginRole');
        const accessToken = localStorage.getItem('accessToken');
        if (loginRole && accessToken) {
            if (loginRole === 'lecturer') {
                router.push('/lecturer/home');
            } else if (loginRole === 'student') {
                router.push('/student/home');
            } else if (loginRole === 'admin') {
                router.push('/admin/home');
            }
        }
    }, [router]);

    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        organization: '',
        role: '',
    });

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [fetchingOrganizations, setFetchingOrganizations] = useState(true);

    // Get error status and message from URL params
    const errorStatus = searchParams.get('status');
    const errorMessage = searchParams.get('message');
    const hasError = errorStatus === 'error' && errorMessage;

    const roles = [
        {
            id: 'admin',
            name: 'Quản trị viên',
            icon: Shield,
            description: 'Quản lý tài nguyên và người dùng',
            homePagePath: '/admin/home',
        },
        {
            id: 'lecturer',
            name: 'Giảng viên',
            icon: GraduationCap,
            description: 'Tạo, quản lý lớp học và dự án',
            homePagePath: '/lecturer/home',
        },
        {
            id: 'student',
            name: 'Sinh viên',
            icon: Users,
            description: 'Tham gia lớp học và theo dõi tiến trình học tập',
            homePagePath: '/student/home',
        },
    ];

    // Fetch organizations on component mount
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const organizations = await getAvailableOrganization();
                setOrganizations(organizations);
            } catch (error) {
                console.log("🚀 ~ fetchOrganizations ~ error:", error)
            } finally {
                setFetchingOrganizations(false);
            }
        };

        fetchOrganizations();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.organization || !formData.role) {
            alert('Please select both organization and role');
            return;
        }

        const selectedOrg = organizations.find(
            (org) => org.id.toString() === formData.organization
        );

        if (!selectedOrg) {
            alert('Selected organization not found');
            return;
        }

        const loginUrl = getLoginUrl(
            Number(formData.organization),
            formData.role,
            roles.filter((role) => role.id == formData.role)[0]?.homePagePath
        );
        localStorage.setItem('loginRole', formData.role);
        window.location.href = loginUrl;
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const formatOrganizationOption = (org: Organization): SelectOption => ({
        value: org.id.toString(),
        label: (
            <div className="flex items-center space-x-3">
                <Image
                    src={org.image.url || '/placeholder.svg'}
                    alt={org.name}
                    width={24}
                    height={24}
                    className="rounded-sm object-cover"
                />
                <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-gray-500">{org.acronym}</div>
                </div>
            </div>
        ),
        data: org,
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="container mx-auto max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay về trang chủ
                    </Link>
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Image
                            src="/logo-icon.svg"
                            alt="EduTracker"
                            width={55}
                            height={55}
                        />
                        <span className="text-2xl font-bold text-gray-900">
                            EduTracker
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Chào mừng trở lại
                    </h1>
                    <p className="text-gray-600">
                        Chọn tổ chức và vai trò để tiếp tục
                    </p>
                </div>

                {/* Error Alert */}
                {hasError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-red-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Xác thực thất bại
                                </h3>
                                <div className="mt-1 text-sm text-red-700">
                                    {decodeURIComponent(errorMessage)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle>Đăng nhập</CardTitle>
                        <CardDescription>
                            Chọn tổ chức và vai trò để tiếp tục với OAuth.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Organization Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="organization">
                                    Chọn tổ chức
                                </Label>
                                <Select
                                    id="organization"
                                    isLoading={fetchingOrganizations}
                                    options={organizations.map(
                                        formatOrganizationOption
                                    )}
                                    value={
                                        formData.organization
                                            ? formatOrganizationOption(
                                                  organizations.find(
                                                      (org) =>
                                                          org.id.toString() ===
                                                          formData.organization
                                                  )!
                                              )
                                            : null
                                    }
                                    onChange={(option) =>
                                        handleInputChange(
                                            'organization',
                                            option?.value || ''
                                        )
                                    }
                                    placeholder={
                                        fetchingOrganizations
                                            ? 'Đang tải tổ chức...'
                                            : 'Chọn tổ chức'
                                    }
                                    className="basic-select"
                                    classNamePrefix="select"
                                    isDisabled={fetchingOrganizations}
                                    instanceId="organization-select"
                                />
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-3">
                                <Label>Chọn vai trò</Label>
                                <div className="grid gap-3">
                                    {roles.map((role) => {
                                        const Icon = role.icon;
                                        return (
                                            <div
                                                key={role.id}
                                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                    formData.role === role.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() =>
                                                    handleInputChange(
                                                        'role',
                                                        role.id
                                                    )
                                                }
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <Icon
                                                        className={`h-5 w-5 mt-0.5 ${
                                                            formData.role ===
                                                            role.id
                                                                ? 'text-blue-600'
                                                                : 'text-gray-400'
                                                        }`}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                name="role"
                                                                value={role.id}
                                                                checked={
                                                                    formData.role ===
                                                                    role.id
                                                                }
                                                                onChange={(e) =>
                                                                    handleInputChange(
                                                                        'role',
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="text-blue-600"
                                                            />
                                                            <span className="font-medium text-gray-900">
                                                                {role.name}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {role.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={
                                        fetchingOrganizations ||
                                        !formData.organization ||
                                        !formData.role
                                    }
                                >
                                    Tiếp tục với OAuth
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        Không có tài khoản tổ chức?{' '}
                        <Link
                            href="/register"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Đăng ký tổ chức
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
