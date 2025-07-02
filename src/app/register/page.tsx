'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import Select from 'react-select';
import { SuccessModal } from '@/components/ui/success-modal';
import { ArrowLeft, Upload } from 'lucide-react';
import { getAuthProvider } from '@/services/api/auth';
import type { AuthProvider } from '@/services/api/auth/interface';
import {
    registrationSchema,
    type RegistrationFormData,
} from '@/lib/validations/registration';
import { registerOrganization } from '@/services/api/registration';

export default function RegisterPage() {
    const router = useRouter();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [authProviders, setAuthProviders] = useState<AuthProvider[]>([]);
    const [fetchingProviders, setFetchingProviders] = useState(true);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
        reset,
    } = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            name: '',
            acronym: '',
            email: '',
            phoneNumber: '',
            address: '',
            authProviderId: '',
        },
    });

    const watchedAuthProviderId = watch('authProviderId');

    // Fetch auth providers on component mount
    useEffect(() => {
        const fetchAuthProviders = async () => {
            try {
                const providers = await getAuthProvider();
                setAuthProviders(providers);
            } catch (error: any) {
                console.log("🚀 ~ fetchAuthProviders ~ error:", error)
                if (Array.isArray(error?.message)) {
                    toast.error(error.message[0]);
                } else {
                    toast.error(
                        error?.message ??
                            'Đã xảy ra lỗi khi tải các nhà cung cấp xác thực'
                    );
                }
            } finally {
                setFetchingProviders(false);
            }
        };

        fetchAuthProviders();
    }, []);

    const onSubmit = async (data: RegistrationFormData) => {
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', data.name);
            formDataToSend.append('acronym', data.acronym);
            formDataToSend.append('email', data.email);
            formDataToSend.append('phoneNumber', data.phoneNumber);
            formDataToSend.append('address', data.address);
            formDataToSend.append('authProviderId', data.authProviderId);

            if (imageFile) {
                formDataToSend.append('image', imageFile);
            }

            await registerOrganization(formDataToSend);

            reset();
            setImageFile(null);

            // Show success modal
            setShowSuccessModal(true);
        } catch (error: any) {
            console.log("🚀 ~ onSubmit ~ error:", error)
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Đã xảy ra lỗi khi đăng ký tổ chức');
            }
        }
    };

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

            setImageFile(file);
        }
    };

    const handleGoHome = () => {
        router.push('/');
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
    };

    const handleAuthProviderChange = (selectedOption: any) => {
        setValue('authProviderId', selectedOption?.value || '', {
            shouldValidate: true,
        });
    };

    // Transform auth providers for React Select
    const authProviderOptions = authProviders.map((provider) => ({
        value: provider.id.toString(),
        label: provider.name,
    }));

    // Find the selected option based on current value
    const selectedAuthProvider = authProviderOptions.find(
        (option) => option.value === watchedAuthProviderId
    );

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
                <div className="container mx-auto max-w-2xl">
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
                            Đăng ký tổ chức
                        </h1>
                        <p className="text-gray-600">
                            Tạo tài khoản tổ chức và bắt đầu quản lý các tài nguyên giáo dục của bạn
                        </p>
                    </div>

                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle>Đăng ký tổ chức</CardTitle>
                            <CardDescription>
                                Điền các thông tin bên dưới để đăng ký tổ chức của bạn.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="space-y-6"
                            >
                                {/* Organization Information */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">
                                                Tên tổ chức *
                                            </Label>
                                            <Input
                                                id="name"
                                                {...register('name')}
                                                placeholder="Nhập tên tổ chức"
                                                disabled={isSubmitting}
                                                className={
                                                    errors.name
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            />
                                            {errors.name && (
                                                <p className="text-sm text-red-600">
                                                    {errors.name.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="acronym">
                                                Tên viết tắt *
                                            </Label>
                                            <Input
                                                id="acronym"
                                                {...register('acronym')}
                                                placeholder="Ví dụ: HUST, MIT"
                                                disabled={isSubmitting}
                                                className={
                                                    errors.acronym
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                                style={{
                                                    textTransform: 'uppercase',
                                                }}
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value.toUpperCase();
                                                    setValue('acronym', value, {
                                                        shouldValidate: true,
                                                    });
                                                }}
                                            />
                                            {errors.acronym && (
                                                <p className="text-sm text-red-600">
                                                    {errors.acronym.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            Email liên hệ *
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            {...register('email')}
                                            placeholder="organization@example.com"
                                            disabled={isSubmitting}
                                            className={
                                                errors.email
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-600">
                                                {errors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="phoneNumber">
                                                Số điện thoại *
                                            </Label>
                                            <Input
                                                id="phoneNumber"
                                                type="tel"
                                                {...register('phoneNumber')}
                                                placeholder="0123456789"
                                                disabled={isSubmitting}
                                                className={
                                                    errors.phoneNumber
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            />
                                            {errors.phoneNumber && (
                                                <p className="text-sm text-red-600">
                                                    {errors.phoneNumber.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="authProviderId">
                                                Nhà cung cấp xác thực *
                                            </Label>
                                            <Select
                                                id="authProviderId"
                                                value={selectedAuthProvider}
                                                onChange={
                                                    handleAuthProviderChange
                                                }
                                                options={authProviderOptions}
                                                placeholder={
                                                    fetchingProviders
                                                        ? 'Đang tải...'
                                                        : 'Chọn nhà cung cấp'
                                                }
                                                isDisabled={
                                                    isSubmitting ||
                                                    fetchingProviders
                                                }
                                                isLoading={fetchingProviders}
                                                className={
                                                    errors.authProviderId
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                                classNamePrefix="react-select"
                                                styles={{
                                                    control: (
                                                        provided,
                                                        state
                                                    ) => ({
                                                        ...provided,
                                                        borderColor:
                                                            errors.authProviderId
                                                                ? '#ef4444'
                                                                : state.isFocused
                                                                ? '#3b82f6'
                                                                : '#d1d5db',
                                                        boxShadow:
                                                            state.isFocused
                                                                ? '0 0 0 1px #3b82f6'
                                                                : 'none',
                                                        '&:hover': {
                                                            borderColor:
                                                                errors.authProviderId
                                                                    ? '#ef4444'
                                                                    : '#9ca3af',
                                                        },
                                                    }),
                                                    option: (
                                                        provided,
                                                        state
                                                    ) => ({
                                                        ...provided,
                                                        backgroundColor:
                                                            state.isSelected
                                                                ? '#3b82f6'
                                                                : state.isFocused
                                                                ? '#f3f4f6'
                                                                : 'white',
                                                        color: state.isSelected
                                                            ? 'white'
                                                            : '#374151',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                state.isSelected
                                                                    ? '#3b82f6'
                                                                    : '#f3f4f6',
                                                        },
                                                    }),
                                                    singleValue: (
                                                        provided
                                                    ) => ({
                                                        ...provided,
                                                        color: '#374151',
                                                    }),
                                                    placeholder: (
                                                        provided
                                                    ) => ({
                                                        ...provided,
                                                        color: '#9ca3af',
                                                    }),
                                                }}
                                            />
                                            {errors.authProviderId && (
                                                <p className="text-sm text-red-600">
                                                    {
                                                        errors.authProviderId
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">
                                            Địa chỉ *
                                        </Label>
                                        <Input
                                            id="address"
                                            {...register('address')}
                                            placeholder="Nhập địa chỉ tổ chức"
                                            disabled={isSubmitting}
                                            className={
                                                errors.address
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        {errors.address && (
                                            <p className="text-sm text-red-600">
                                                {errors.address.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="image">
                                            Logo tổ chức
                                        </Label>
                                        <div className="flex items-center space-x-4">
                                            <Input
                                                id="image"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                disabled={isSubmitting}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    document
                                                        .getElementById('image')
                                                        ?.click()
                                                }
                                                className="flex items-center space-x-2"
                                                disabled={isSubmitting}
                                            >
                                                <Upload className="h-4 w-4" />
                                                <span>Chọn ảnh</span>
                                            </Button>
                                            {imageFile && (
                                                <span className="text-sm text-gray-600">
                                                    {imageFile.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Kích thước tối đa: 5MB. Định dạng hỗ trợ: JPG, PNG
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={
                                            isSubmitting || fetchingProviders
                                        }
                                    >
                                        {isSubmitting
                                            ? 'Đang đăng ký...'
                                            : 'Đăng ký tổ chức'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        asChild
                                        disabled={isSubmitting}
                                    >
                                        <Link href="/login">
                                            Đã có tài khoản? Đăng nhập
                                        </Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={handleCloseSuccessModal}
                title="Đăng ký thành công!"
                message="Cảm ơn bạn đã đăng ký tổ chức. Chúng tôi đã nhận được đơn đăng ký của bạn và sẽ liên hệ với bạn sớm nhất có thể để hoàn thành quá trình cài đặt."
                actionLabel="Quay về trang chủ"
                onAction={handleGoHome}
            />
        </>
    );
}
