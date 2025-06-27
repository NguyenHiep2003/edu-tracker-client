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
            const defaultGradeTitle = `${formData.title} Grade`;
            // Only update if it's still the default or empty
            if (
                !formData.gradeComponent.title ||
                formData.gradeComponent.title.endsWith(' Grade')
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
    }, [formData.title, formData.createGradeComponent]);

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
            newErrors.title = 'Project title is required';
        }

        if (!formData.key.trim()) {
            newErrors.key = 'Project key is required';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'End date is required';
        }

        // Grade component validation
        if (formData.createGradeComponent && formData.gradeComponent) {
            if (!formData.gradeComponent.title.trim()) {
                newErrors.gradeTitle = 'Grade component title is required';
            }

            if (
                !formData.gradeComponent.maxScore ||
                formData.gradeComponent.maxScore <= 0
            ) {
                newErrors.gradeMaxScore = 'Max score must be greater than 0';
            }
            if (
                !formData.gradeComponent.scale ||
                formData.gradeComponent.scale <= 0
            ) {
                newErrors.gradeScale = 'Scale must be greater than 0';
            }
        }

        // Date validations
        const now = new Date();
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        if (formData.endDate && endDate <= now) {
            newErrors.endDate = 'End date must be in the future';
        }

        if (formData.startDate && formData.endDate && endDate <= startDate) {
            newErrors.endDate = 'End date must be after start date';
        }
        if (
            formData.type === 'TEAM' &&
            formData.allowStudentFormTeam &&
            !formData.formGroupDeadline
        ) {
            newErrors.formGroupDeadline = 'Form group deadline must be set';
        }
        // Team-specific validations
        if (formData.type === 'TEAM' && formData.formGroupDeadline) {
            const formGroupDate = new Date(formData.formGroupDeadline);
            if (formGroupDate <= startDate) {
                newErrors.formGroupDeadline =
                    'Form group deadline must be after start date';
            }
            if (formGroupDate >= endDate) {
                newErrors.formGroupDeadline =
                    'Form group deadline must be before end date';
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
                    'Join project deadline must be after start date';
            }
            if (joinDate >= endDate) {
                newErrors.joinProjectDeadline =
                    'Join project deadline must be before end date';
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
                    ? 'Project and grade component created successfully!'
                    : 'Project created successfully!'
            );
            onProjectAdded();
            onClose();
        } catch (error: any) {
            console.error('Error creating project:', error);
            toast.error(error.message || 'Failed to create project');
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
            title="Create New Project"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        Basic Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label
                                htmlFor="title"
                                className="text-gray-900 font-medium"
                            >
                                Project Title *
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    handleInputChange('title', e.target.value)
                                }
                                placeholder="Enter project title"
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
                                Project Key *
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
                                placeholder="e.g., KAN"
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
                            Description
                        </Label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                handleInputChange('description', e.target.value)
                            }
                            placeholder="Enter project description (optional)"
                            className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                        />
                    </div>
                </div>

                {/* Dates */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Project Timeline
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label
                                htmlFor="startDate"
                                className="text-gray-900 font-medium"
                            >
                                Start Date & Time *
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
                                End Date & Time *
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

                    {/* <div>
                        <Label className="text-gray-900 font-medium">
                            Status
                        </Label> */}
                    {/* <div className="mt-2 space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="status"
                                    value="OPEN"
                                    checked={formData.status === 'OPEN'}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'status',
                                            e.target.value
                                        )
                                    }
                                    className="text-blue-600"
                                />
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-gray-900">Open</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="status"
                                    value="SCHEDULED"
                                    checked={formData.status === 'SCHEDULED'}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'status',
                                            e.target.value
                                        )
                                    }
                                    className="text-blue-600"
                                />
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-gray-900">Scheduled</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="status"
                                    value="CLOSE"
                                    checked={formData.status === 'CLOSE'}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'status',
                                            e.target.value
                                        )
                                    }
                                    className="text-blue-600"
                                />
                                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                                <span className="text-gray-900">Closed</span>
                            </label>
                        </div> */}
                    {/* <p className="text-sm text-gray-600 mt-1">
                            Default is auto-calculated based on start date
                        </p> */}
                    {/* </div> */}
                </div>

                {/* Project Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        Project Settings
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-900 font-medium">
                                Project Type
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
                                        Team Project
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
                                        Solo Project
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-900 font-medium">
                                Participation Mode
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
                                        Mandatory
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
                                        Optional
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
                            Optional Project Settings
                        </h3>
                        <div>
                            <Label
                                htmlFor="joinProjectDeadline"
                                className="text-gray-900 font-medium"
                            >
                                Join Project Deadline
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
                                Must be between start date and end date
                            </p>
                        </div>
                    </div>
                )}

                {/* Team-specific Settings */}
                {formData.type === 'TEAM' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Settings
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
                                    Allow students to form their own teams
                                </span>
                            </label>
                        </div>

                        {formData.allowStudentFormTeam && (
                            <div>
                                <Label
                                    htmlFor="formGroupDeadline"
                                    className="text-gray-900 font-medium"
                                >
                                    Form Group Deadline
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
                                    Must be between start date and end date
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Grade Component Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Grade Component
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
                                Create grade component for this project
                            </span>
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                            Automatically create a grading component to track
                            student performance
                        </p>
                    </div>

                    {formData.createGradeComponent && (
                        <div className="space-y-4 pl-6 border-l-2 border-blue-200 bg-blue-50 p-4 rounded-r-lg">
                            <div>
                                <Label
                                    htmlFor="gradeTitle"
                                    className="text-gray-900 font-medium"
                                >
                                    Grade Component Title *
                                </Label>
                                <Input
                                    id="gradeTitle"
                                    value={formData.gradeComponent?.title || ''}
                                    onChange={(e) =>
                                        handleGradeComponentChange(
                                            'title',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter grade component title"
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
                                    Grade Component Description
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
                                    placeholder="Enter grade component description (optional)"
                                    className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="gradeMaxScore"
                                    className="text-gray-900 font-medium"
                                >
                                    Max Score *
                                </Label>
                                <Input
                                    id="gradeMaxScore"
                                    type="number"
                                    min="1"
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
                                    placeholder="Enter maximum score"
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
                                    Scale *
                                </Label>
                                <Input
                                    id="gradeScale"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.gradeComponent?.scale || ''}
                                    onChange={(e) =>
                                        handleGradeComponentChange(
                                            'scale',
                                            Number(e.target.value) || 0
                                        )
                                    }
                                    placeholder="Enter scale"
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
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating...
                            </>
                        ) : (
                            'Create Project'
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
