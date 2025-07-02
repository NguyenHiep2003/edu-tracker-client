'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Calendar, Users, User, AlertCircle, BarChart3 } from 'lucide-react';
import { toast } from 'react-toastify';
import type { CreateProjectRequest } from '@/services/api/project/interface';
import { createProject } from '@/services/api/project';

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectAdded: () => void;
    classId: number;
}

export function AddProjectModal({
    isOpen,
    onClose,
    onProjectAdded,
    classId,
}: AddProjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [useDefaultGradeTitle, setUseDefaultGradeTitle] = useState(true);
    // Helper function to get current datetime in user's timezone for datetime-local input
    const getCurrentDateTimeLocal = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState<CreateProjectRequest>({
        title: '',
        description: '',
        key: '',
        startDate: getCurrentDateTimeLocal(),
        endDate: '',
        // status: 'SCHEDULED',
        type: 'TEAM',
        participationMode: 'mandatory',
        allowStudentFormTeam: false,
        allowStudentCreateTopic: false,
        formGroupDeadline: '',
        joinProjectDeadline: '',
        createGradeComponent: true,
        gradeComponent: {
            title: '',
            description: '',
            maxScore: 10,
            scale: 2,
        },
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Auto-calculate default status based on start date (but allow user to override)
    // useEffect(() => {
    //     if (formData.startDate) {
    //         const now = new Date();
    //         const startDate = new Date(formData.startDate);
    //         const defaultStatus = startDate <= now ? 'OPEN' : 'SCHEDULED';

    //         // Only auto-set if user hasn't manually changed it
    //         if (formData.status === 'SCHEDULED' || formData.status === 'OPEN') {
    //             setFormData((prev) => ({ ...prev, status: defaultStatus }));
    //         }
    //     }
    // }, [formData.startDate]);

    // Auto-update grade component title when project title changes
    useEffect(() => {
        if (
            formData.createGradeComponent &&
            formData.title &&
            formData.gradeComponent
        ) {
            const defaultGradeTitle = `Điểm ${formData.title}`;
            // Only update if it's still the default or empty
            if (
             useDefaultGradeTitle
            ) {
                setFormData((prev) => ({
                    ...prev,
                    gradeComponent: {
                        ...prev.gradeComponent!,
                        title: defaultGradeTitle,
                    },
                }));
            }
        }
    }, [formData.title, formData.createGradeComponent, useDefaultGradeTitle]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: '',
                description: '',
                key: '',
                startDate: getCurrentDateTimeLocal(),
                endDate: '',
                // status: defaultStatus,
                type: 'TEAM',
                participationMode: 'mandatory',
                allowStudentFormTeam: false,
                allowStudentCreateTopic: false,
                formGroupDeadline: '',
                joinProjectDeadline: '',
                createGradeComponent: true,
                gradeComponent: {
                    title: '',
                    description: '',
                    maxScore: 10,
                    scale: 2,
                },
            });
            setErrors({});
        }
    }, [isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Required fields
        if (!formData.title.trim()) {
            newErrors.title = 'Tên dự án là bắt buộc';
        }

        if (!formData.key.trim()) {
            newErrors.key = 'Mã dự án là bắt buộc';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc';
        }

        // Grade component validation
        if (formData.createGradeComponent && formData.gradeComponent) {
            if (!formData.gradeComponent.title.trim()) {
                newErrors.gradeTitle = 'Tên đầu điểm là bắt buộc';
            }

            if (
                !formData.gradeComponent.maxScore ||
                formData.gradeComponent.maxScore <= 0 || 
                formData.gradeComponent.maxScore > 10000
            ) {
                newErrors.gradeMaxScore = 'Điểm tối đa phải lớn hơn 0 và nhỏ hơn 10000';
            }
            if (
                !formData.gradeComponent.scale ||
                formData.gradeComponent.scale <= 0 || 
                formData.gradeComponent.scale > 4
            ) {
                newErrors.gradeScale = 'Số chữ số sau dấu phẩy phải lớn hơn 0 và nhỏ hơn 4';
            }
        }

        // Date validations
        const now = new Date();
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        if (formData.endDate && endDate <= now) {
            newErrors.endDate = 'Ngày kết thúc phải là ngày trong tương lai';
        }

        if (formData.startDate && formData.endDate && endDate <= startDate) {
            newErrors.endDate = 'Ngày kết thúc phải là ngày sau ngày bắt đầu';
        }
        if (
            formData.type === 'TEAM' &&
            formData.allowStudentFormTeam &&
            !formData.formGroupDeadline
        ) {
            newErrors.formGroupDeadline = 'Ngày kết thúc nhóm phải được đặt';
        }
        // Team-specific validations
        if (formData.type === 'TEAM' && formData.formGroupDeadline) {
            const formGroupDate = new Date(formData.formGroupDeadline);
            if (formGroupDate <= startDate) {
                newErrors.formGroupDeadline =
                    'Ngày kết thúc nhóm phải sau ngày bắt đầu';
            }
            if (formGroupDate >= endDate) {
                newErrors.formGroupDeadline =
                    'Hạn lập nhóm phải trước ngày kết thúc';
            }
        }

        // Optional project validation
        if (
            formData.participationMode === 'optional' &&
            formData.joinProjectDeadline
        ) {
            const joinDate = new Date(formData.joinProjectDeadline);
            if (joinDate <= startDate) {
                newErrors.joinProjectDeadline =
                    'Hạn đăng ký tham gia dự án phải sau ngày bắt đầu';
            }
            if (joinDate >= endDate) {
                newErrors.joinProjectDeadline =
                    'Hạn đăng ký tham gia dự án phải trước ngày kết thúc';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            // Prepare data for submission
            const submitData = { ...formData };

            // Convert dates to ISO strings
            submitData.startDate = new Date(formData.startDate).toISOString();
            submitData.endDate = new Date(formData.endDate).toISOString();

            if (formData.type === 'TEAM' && formData.formGroupDeadline) {
                submitData.formGroupDeadline = new Date(
                    formData.formGroupDeadline
                ).toISOString();
            } else {
                delete submitData.formGroupDeadline;
            }

            if (
                formData.participationMode === 'optional' &&
                formData.joinProjectDeadline
            ) {
                submitData.joinProjectDeadline = new Date(
                    formData.joinProjectDeadline
                ).toISOString();
            } else {
                delete submitData.joinProjectDeadline;
            }

            // Clear team-specific fields for SOLO projects
            if (formData.type === 'SOLO') {
                submitData.allowStudentFormTeam = false;
                delete submitData.formGroupDeadline;
            }
            if (!submitData.formGroupDeadline)
                delete submitData?.formGroupDeadline;

            // Handle grade component
            if (!formData.createGradeComponent) {
                delete submitData.gradeComponent;
            }

            await createProject(classId, formData);

            toast.success(
                formData.createGradeComponent
                    ? 'Dự án và điểm được tạo thành công!'
                    : 'Dự án được tạo thành công!'
            );
            onProjectAdded();
            onClose();
        } catch (error: any) {
            console.log("🚀 ~ handleSubmit ~ error:", error)
            toast.error(error.message || 'Tạo dự án thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (
        field: keyof CreateProjectRequest,
        value: any
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleGradeComponentChange = (
        field: keyof NonNullable<CreateProjectRequest['gradeComponent']>,
        value: any
    ) => {
        setFormData((prev) => ({
            ...prev,
            gradeComponent: {
                ...prev.gradeComponent!,
                [field]: value,
            },
        }));

        // Clear error when user starts typing
        const errorKey = `grade${
            field.charAt(0).toUpperCase() + field.slice(1)
        }`;
        if (errors[errorKey]) {
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Tạo dự án mới"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        Thông tin cơ bản
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label
                                htmlFor="title"
                                className="text-gray-900 font-medium"
                            >
                                Tên dự án *
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    handleInputChange('title', e.target.value)
                                }
                                placeholder="Nhập tên dự án"
                                className={`text-gray-900 placeholder-gray-500 ${
                                    errors.title ? 'border-red-500' : ''
                                }`}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label
                                htmlFor="key"
                                className="text-gray-900 font-medium"
                            >
                                Mã dự án *
                            </Label>
                            <Input
                                id="key"
                                value={formData.key}
                                onChange={(e) =>
                                    handleInputChange(
                                        'key',
                                        e.target.value.toUpperCase()
                                    )
                                }
                                placeholder="Ví dụ: KAN"
                                className={`text-gray-900 placeholder-gray-500 ${
                                    errors.key ? 'border-red-500' : ''
                                }`}
                            />
                            {errors.key && (
                                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.key}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label
                            htmlFor="description"
                            className="text-gray-900 font-medium"
                        >
                            Mô tả
                        </Label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                handleInputChange('description', e.target.value)
                            }
                            placeholder="Nhập mô tả dự án (tùy chọn)"
                            className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                        />
                    </div>
                </div>

                {/* Dates */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Mốc thời gian dự án
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label
                                htmlFor="startDate"
                                className="text-gray-900 font-medium"
                            >
                                Ngày bắt đầu *
                            </Label>
                            <Input
                                id="startDate"
                                type="datetime-local"
                                value={
                                    formData.startDate
                                        ? (() => {
                                              const date = new Date(
                                                  formData.startDate
                                              );
                                              // Convert to local timezone for datetime-local input
                                              const offset =
                                                  date.getTimezoneOffset();
                                              const localDate = new Date(
                                                  date.getTime() -
                                                      offset * 60 * 1000
                                              );
                                              return localDate
                                                  .toISOString()
                                                  .slice(0, 16);
                                          })()
                                        : ''
                                }
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({
                                        ...formData,
                                        startDate: value
                                            ? new Date(value).toISOString()
                                            : '',
                                    });
                                }}
                                className={`text-gray-900 ${
                                    errors.startDate ? 'border-red-500' : ''
                                }`}
                            />
                            {errors.startDate && (
                                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.startDate}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label
                                htmlFor="endDate"
                                className="text-gray-900 font-medium"
                            >
                                Ngày kết thúc *
                            </Label>
                            <Input
                                id="endDate"
                                type="datetime-local"
                                value={
                                    formData.endDate
                                        ? (() => {
                                              const date = new Date(
                                                  formData.endDate
                                              );
                                              // Convert to local timezone for datetime-local input
                                              const offset =
                                                  date.getTimezoneOffset();
                                              const localDate = new Date(
                                                  date.getTime() -
                                                      offset * 60 * 1000
                                              );
                                              return localDate
                                                  .toISOString()
                                                  .slice(0, 16);
                                          })()
                                        : ''
                                }
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({
                                        ...formData,
                                        endDate: value
                                            ? new Date(value).toISOString()
                                            : '',
                                    });
                                }}
                                className={`text-gray-900 ${
                                    errors.endDate ? 'border-red-500' : ''
                                }`}
                            />
                            {errors.endDate && (
                                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.endDate}
                                </p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Project Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        Cấu hình dự án
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-900 font-medium">
                                Loại dự án
                            </Label>
                            <div className="mt-2 space-y-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="TEAM"
                                        checked={formData.type === 'TEAM'}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'type',
                                                e.target.value
                                            )
                                        }
                                        className="text-blue-600"
                                    />
                                    <Users className="h-4 w-4" />
                                    <span className="text-gray-900">
                                        Dự án nhóm
                                    </span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="SOLO"
                                        checked={formData.type === 'SOLO'}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'type',
                                                e.target.value
                                            )
                                        }
                                        className="text-blue-600"
                                    />
                                    <User className="h-4 w-4" />
                                    <span className="text-gray-900">
                                        Dự án cá nhân
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-900 font-medium">
                                Chế độ tham gia
                            </Label>
                            <div className="mt-2 space-y-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="participationMode"
                                        value="mandatory"
                                        checked={
                                            formData.participationMode ===
                                            'mandatory'
                                        }
                                        onChange={(e) =>
                                            handleInputChange(
                                                'participationMode',
                                                e.target.value
                                            )
                                        }
                                        className="text-blue-600"
                                    />
                                    <span className="text-gray-900">
                                        Bắt buộc
                                    </span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="participationMode"
                                        value="optional"
                                        checked={
                                            formData.participationMode ===
                                            'optional'
                                        }
                                        onChange={(e) =>
                                            handleInputChange(
                                                'participationMode',
                                                e.target.value
                                            )
                                        }
                                        className="text-blue-600"
                                    />
                                    <span className="text-gray-900">
                                        Tùy chọn
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Join Project Deadline - Only for Optional projects */}
                {formData.participationMode === 'optional' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            Cấu hình dự án tùy chọn
                        </h3>
                        <div>
                            <Label
                                htmlFor="joinProjectDeadline"
                                className="text-gray-900 font-medium"
                            >
                                Hạn đăng ký tham gia dự án
                            </Label>
                            <Input
                                id="joinProjectDeadline"
                                type="datetime-local"
                                value={
                                    formData.joinProjectDeadline
                                        ? (() => {
                                              const date = new Date(
                                                  formData.joinProjectDeadline
                                              );
                                              // Convert to local timezone for datetime-local input
                                              const offset =
                                                  date.getTimezoneOffset();
                                              const localDate = new Date(
                                                  date.getTime() -
                                                      offset * 60 * 1000
                                              );
                                              return localDate
                                                  .toISOString()
                                                  .slice(0, 16);
                                          })()
                                        : ''
                                }
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({
                                        ...formData,
                                        joinProjectDeadline: value
                                            ? new Date(value).toISOString()
                                            : '',
                                    });
                                }}
                                className={`text-gray-900 ${
                                    errors.joinProjectDeadline
                                        ? 'border-red-500'
                                        : ''
                                }`}
                            />
                            {errors.joinProjectDeadline && (
                                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.joinProjectDeadline}
                                </p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">
                                Phải nằm giữa ngày bắt đầu và ngày kết thúc
                            </p>
                        </div>
                    </div>
                )}

                {/* Team-specific Settings */}
                {formData.type === 'TEAM' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Cấu hình nhóm
                        </h3>

                        <div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.allowStudentFormTeam}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'allowStudentFormTeam',
                                            e.target.checked
                                        )
                                    }
                                    className="text-blue-600"
                                />
                                <span className="text-gray-900">
                                    Cho phép sinh viên lập nhóm
                                </span>
                            </label>
                        </div>

                        {formData.allowStudentFormTeam && (
                            <div>
                                <Label
                                    htmlFor="formGroupDeadline"
                                    className="text-gray-900 font-medium"
                                >
                                    Hạn lập nhóm
                                </Label>
                                <Input
                                    id="formGroupDeadline"
                                    type="datetime-local"
                                    value={
                                        formData.formGroupDeadline
                                            ? (() => {
                                                  const date = new Date(
                                                      formData.formGroupDeadline
                                                  );
                                                  // Convert to local timezone for datetime-local input
                                                  const offset =
                                                      date.getTimezoneOffset();
                                                  const localDate = new Date(
                                                      date.getTime() -
                                                          offset * 60 * 1000
                                                  );
                                                  return localDate
                                                      .toISOString()
                                                      .slice(0, 16);
                                              })()
                                            : ''
                                    }
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({
                                            ...formData,
                                            formGroupDeadline: value
                                                ? new Date(value).toISOString()
                                                : '',
                                        });
                                    }}
                                    className={`text-gray-900 ${
                                        errors.formGroupDeadline
                                            ? 'border-red-500'
                                            : ''
                                    }`}
                                />
                                {errors.formGroupDeadline && (
                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.formGroupDeadline}
                                    </p>
                                )}
                                <p className="text-sm text-gray-600 mt-1">
                                    Phải nằm giữa ngày bắt đầu và ngày kết thúc
                                </p>
                            </div>
                        )}
                    </div>
                )}
                <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Cấu hình chủ đề
                        </h3>

                        <div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.allowStudentCreateTopic}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'allowStudentCreateTopic',
                                            e.target.checked
                                        )
                                    }
                                    className="text-blue-600"
                                />
                                <span className="text-gray-900">
                                    Cho phép sinh viên yêu cầu tạo chủ đề mới
                                </span>
                            </label>
                        </div>
                </div>

                {/* Grade Component Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Điểm thành phần
                    </h3>

                    <div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.createGradeComponent}
                                onChange={(e) =>
                                    handleInputChange(
                                        'createGradeComponent',
                                        e.target.checked
                                    )
                                }
                                className="text-blue-600"
                            />
                            <span className="text-gray-900">
                                Tạo điểm thành phần cho dự án này
                            </span>
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                            Tự động tạo điểm thành phần để theo dõi hiệu suất sinh viên
                        </p>
                    </div>

                    {formData.createGradeComponent && (
                        <div className="space-y-4 pl-6 border-l-2 border-blue-200 bg-blue-50 p-4 rounded-r-lg">
                            <div>
                                <Label
                                    htmlFor="gradeTitle"
                                    className="text-gray-900 font-medium"
                                >
                                    Tên điểm thành phần *
                                </Label>
                                <Input
                                    id="gradeTitle"
                                    value={formData.gradeComponent?.title || ''}
                                    onChange={(e) => {
                                        setUseDefaultGradeTitle(false);
                                        handleGradeComponentChange(
                                            'title',
                                            e.target.value
                                        )
                                    }}
                                    placeholder="Nhập tên điểm thành phần"
                                    className={`text-gray-900 placeholder-gray-500 ${
                                        errors.gradeTitle
                                            ? 'border-red-500'
                                            : ''
                                    }`}
                                />
                                {errors.gradeTitle && (
                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.gradeTitle}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label
                                    htmlFor="gradeDescription"
                                    className="text-gray-900 font-medium"
                                >
                                    Mô tả điểm thành phần
                                </Label>
                                <textarea
                                    id="gradeDescription"
                                    value={
                                        formData.gradeComponent?.description ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        handleGradeComponentChange(
                                            'description',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nhập mô tả điểm thành phần (tùy chọn)"
                                    className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="gradeMaxScore"
                                    className="text-gray-900 font-medium"
                                >
                                    Điểm tối đa *
                                </Label>
                                <Input
                                    id="gradeMaxScore"
                                    type="number"
                                    min="1"
                                    max="10000"
                                    step="0.1"
                                    value={
                                        formData.gradeComponent?.maxScore || ''
                                    }
                                    onChange={(e) =>
                                        handleGradeComponentChange(
                                            'maxScore',
                                            Number.parseFloat(e.target.value) ||
                                                0
                                        )
                                    }
                                    placeholder="Nhập điểm tối đa"
                                    className={`text-gray-900 placeholder-gray-500 ${
                                        errors.gradeMaxScore
                                            ? 'border-red-500'
                                            : ''
                                    }`}
                                />
                                {errors.gradeMaxScore && (
                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.gradeMaxScore}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label
                                    htmlFor="gradeScale"
                                    className="text-gray-900 font-medium"
                                >
                                    Số chữ số sau dấu phẩy *
                                </Label>
                                <Input
                                    id="gradeScale"
                                    type="number"
                                    min="0"
                                    max="4"
                                    step="1"
                                    value={formData.gradeComponent?.scale || ''}
                                    onChange={(e) =>
                                        handleGradeComponentChange(
                                            'scale',
                                            Number(e.target.value) || 0
                                        )
                                    }
                                    placeholder="Nhập số chữ số sau dấu phẩy"
                                    className={`text-gray-900 placeholder-gray-500 ${
                                        errors.gradeScale
                                            ? 'border-red-500'
                                            : ''
                                    }`}
                                />
                                {errors.gradeScale && (
                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.gradeScale}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Đang tạo...
                            </>
                        ) : (
                            'Tạo dự án'
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
