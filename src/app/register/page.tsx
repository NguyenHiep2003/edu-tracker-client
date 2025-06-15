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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
                console.error('Error fetching auth providers:', error);
                if (Array.isArray(error?.message)) {
                    toast.error(error.message[0]);
                } else {
                    toast.error(
                        error?.message ??
                            'Failed to load authentication providers'
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
            console.error('Error submitting form:', error);
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Server error');
            }
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image file size must be less than 5MB.');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file.');
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

    const handleAuthProviderChange = (value: string) => {
        setValue('authProviderId', value, { shouldValidate: true });
    };

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
                            Back to Home
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
                            Register Your Organization
                        </h1>
                        <p className="text-gray-600">
                            Create your organization account and start managing
                            your educational resources
                        </p>
                    </div>

                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle>Organization Registration</CardTitle>
                            <CardDescription>
                                Fill in the details below to register your
                                organization.
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
                                                Organization Name *
                                            </Label>
                                            <Input
                                                id="name"
                                                {...register('name')}
                                                placeholder="Enter organization name"
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
                                                Acronym *
                                            </Label>
                                            <Input
                                                id="acronym"
                                                {...register('acronym')}
                                                placeholder="e.g., HUST, MIT"
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
                                            Email Address *
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
                                                Phone Number *
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
                                                Authentication Provider *
                                            </Label>
                                            <Select
                                                onValueChange={
                                                    handleAuthProviderChange
                                                }
                                                value={watchedAuthProviderId}
                                                disabled={
                                                    isSubmitting ||
                                                    fetchingProviders
                                                }
                                            >
                                                <SelectTrigger
                                                    className={
                                                        errors.authProviderId
                                                            ? 'border-red-500'
                                                            : ''
                                                    }
                                                >
                                                    <SelectValue
                                                        placeholder={
                                                            fetchingProviders
                                                                ? 'Loading...'
                                                                : 'Select provider'
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {authProviders.map(
                                                        (provider) => (
                                                            <SelectItem
                                                                key={
                                                                    provider.id
                                                                }
                                                                value={provider.id.toString()}
                                                            >
                                                                {provider.name}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
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
                                            Address *
                                        </Label>
                                        <Input
                                            id="address"
                                            {...register('address')}
                                            placeholder="Enter organization address"
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
                                            Organization Logo
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
                                                <span>Choose Image</span>
                                            </Button>
                                            {imageFile && (
                                                <span className="text-sm text-gray-600">
                                                    {imageFile.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Maximum file size: 5MB. Supported
                                            formats: JPG, PNG, GIF
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
                                            ? 'Registering...'
                                            : 'Register Organization'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        asChild
                                        disabled={isSubmitting}
                                    >
                                        <Link href="/login">
                                            Already have an account? Login
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
                title="Registration Received!"
                message="Thank you for registering your organization. We have received your application and will contact you soon to complete the setup process."
                actionLabel="Go to Homepage"
                onAction={handleGoHome}
            />
        </>
    );
}
