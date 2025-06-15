'use client';

import { useState } from 'react';
import { Users, User, Edit2, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/helper/date-formatter';
import { useProjectContext } from '@/context/project-context';
import { toast } from 'react-toastify';
import { updateProject } from '@/services/api/project';

export default function ProjectInformationPage() {
    const { projectData, loading, error, refetchProject } = useProjectContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(projectData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentParticipationMode, setCurrentParticipationMode] = useState(
        projectData?.participationMode
    );
    const [currentType, setCurrentType] = useState(projectData?.type);
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="h-32 bg-gray-200 rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-red-500 text-lg font-semibold mb-2">
                        Error Loading Project
                    </div>
                    <div className="text-gray-600">{error}</div>
                </div>
            </div>
        );
    }

    if (!projectData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">No project data available</div>
            </div>
        );
    }

    const validateForm = () => {
        if (!editedData) return false;
        const newErrors: Record<string, string> = {};

        // Required fields
        if (!editedData?.title.trim()) {
            newErrors.title = 'Project title is required';
        }

        if (!editedData?.key.trim()) {
            newErrors.key = 'Project key is required';
        }

        if (!editedData?.startDate) {
            newErrors.startDate = 'Start date is required';
        }

        if (!editedData?.endDate) {
            newErrors.endDate = 'End date is required';
        }

        // Date validations
        const startDate = new Date(editedData?.startDate);
        const endDate = new Date(editedData?.endDate);

        if (
            editedData.startDate &&
            editedData.endDate &&
            endDate <= startDate
        ) {
            newErrors.endDate = 'End date must be after start date';
        }

        // Team-specific validations
        if (
            editedData.type === 'TEAM' &&
            editedData.allowStudentFormTeam &&
            !editedData.formGroupDeadline
        ) {
            newErrors.formGroupDeadline =
                'Form group deadline must be set when allowing student team formation';
        }

        if (editedData.type === 'TEAM' && editedData.formGroupDeadline) {
            const formGroupDate = new Date(editedData.formGroupDeadline);
            if (formGroupDate <= startDate) {
                newErrors.formGroupDeadline =
                    'Form group deadline must be after start date';
            }
            if (formGroupDate >= endDate) {
                newErrors.formGroupDeadline =
                    'Form group deadline must be before end date';
            }
        }

        // Join project deadline validations (optional participation mode)
        if (
            editedData.participationMode === 'optional' &&
            editedData.joinProjectDeadline
        ) {
            const joinDeadlineDate = new Date(editedData.joinProjectDeadline);
            if (joinDeadlineDate <= startDate) {
                newErrors.joinProjectDeadline =
                    'Join project deadline must be after start date';
            }
            if (joinDeadlineDate >= endDate) {
                newErrors.joinProjectDeadline =
                    'Join project deadline must be before end date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEdit = () => {
        setEditedData(projectData);
        setCurrentType(projectData.type);
        setCurrentParticipationMode(projectData.participationMode);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedData(projectData);
        setErrors({});
    };

    const handleSave = async () => {
        if (!validateForm() || !editedData) {
            return;
        }
        console.log(currentType, editedData.type);
        console.log(currentParticipationMode, editedData.participationMode);
        try {
            await updateProject(projectData.id, {
                title: editedData.title,
                key: editedData.key,
                description: editedData.description,
                startDate: editedData.startDate,
                endDate: editedData.endDate,
                type:
                    currentType !== editedData.type
                        ? editedData.type
                        : undefined,
                participationMode:
                    currentParticipationMode !== editedData.participationMode
                        ? editedData.participationMode
                        : undefined,
                allowStudentFormTeam: editedData.allowStudentFormTeam,
                formGroupDeadline: editedData.formGroupDeadline,
                allowStudentCreateTopic: editedData.allowStudentCreateTopic,
                joinProjectDeadline: editedData.joinProjectDeadline,
            });
            toast.success('Project updated successfully!');
            setIsEditing(false);
            refetchProject();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update project');
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setEditedData((prev: any) => {
            const newData = { ...prev, [field]: value };

            // Reset team-specific fields when switching to SOLO
            if (field === 'type' && value === 'SOLO') {
                newData.allowStudentFormTeam = false;
                newData.formGroupDeadline = null;
            }

            // Reset join project deadline when switching from optional to mandatory
            if (field === 'participationMode' && value === 'mandatory') {
                newData.joinProjectDeadline = null;
            }

            return newData;
        });

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            {/* Header with Edit/Save Buttons */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Project Details
                </h1>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="gap-2">
                                <Save className="h-4 w-4" />
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleEdit}
                            variant="outline"
                            className="gap-2"
                        >
                            <Edit2 className="h-4 w-4" />
                            Edit Project
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-700">
                                Project Title
                            </Label>
                            {isEditing ? (
                                <div>
                                    <Input
                                        value={editedData?.title}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'title',
                                                e.target.value
                                            )
                                        }
                                        className={
                                            errors.title ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.title}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-lg font-medium">
                                    {projectData.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label className="text-gray-700">Project Key</Label>
                            {isEditing ? (
                                <div>
                                    <Input
                                        value={editedData?.key}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'key',
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                        className={
                                            errors.key ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.key && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.key}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="font-mono bg-gray-100 inline-block px-2 py-1 rounded">
                                    {projectData.key}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label className="text-gray-700">Description</Label>
                        {isEditing ? (
                            <Textarea
                                value={editedData?.description || ''}
                                onChange={(e) =>
                                    handleInputChange(
                                        'description',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter project description"
                                className="mt-1 bg-white text-gray-700"
                                rows={3}
                            />
                        ) : (
                            <p className="text-gray-600 mt-1">
                                {projectData.description ||
                                    'No description provided'}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-700">Start Date</Label>
                            {isEditing ? (
                                <div>
                                    <Input
                                        type="date"
                                        value={
                                            editedData?.startDate?.split('T')[0]
                                        }
                                        onChange={(e) =>
                                            handleInputChange(
                                                'startDate',
                                                e.target.value
                                            )
                                        }
                                        className={
                                            errors.startDate
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.startDate && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.startDate}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="font-medium">
                                    {formatDate(
                                        projectData.startDate,
                                        'dd/MM/yyyy'
                                    )}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label className="text-gray-700">End Date</Label>
                            {isEditing ? (
                                <div>
                                    <Input
                                        type="date"
                                        value={
                                            editedData?.endDate?.split('T')[0]
                                        }
                                        onChange={(e) =>
                                            handleInputChange(
                                                'endDate',
                                                e.target.value
                                            )
                                        }
                                        className={
                                            errors.endDate
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.endDate && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.endDate}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="font-medium">
                                    {formatDate(
                                        projectData.endDate,
                                        'dd/MM/yyyy'
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Project Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-700">
                                Project Type
                            </Label>
                            {isEditing ? (
                                <div className="mt-2 space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="TEAM"
                                            checked={
                                                editedData?.type === 'TEAM'
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'type',
                                                    e.target.value
                                                )
                                            }
                                            className="text-blue-600"
                                        />
                                        <Users className="h-4 w-4" />
                                        <span>Team Project</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="SOLO"
                                            checked={
                                                editedData?.type === 'SOLO'
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'type',
                                                    e.target.value
                                                )
                                            }
                                            className="text-blue-600"
                                        />
                                        <User className="h-4 w-4" />
                                        <span>Solo Project</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    {projectData.type === 'SOLO' ? (
                                        <User className="h-4 w-4 text-blue-500" />
                                    ) : (
                                        <Users className="h-4 w-4 text-purple-500" />
                                    )}
                                    <Badge
                                        className={
                                            projectData.type === 'SOLO'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-purple-100 text-purple-800'
                                        }
                                    >
                                        {projectData.type}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label className="text-gray-700">
                                Participation Mode
                            </Label>
                            {isEditing ? (
                                <div className="mt-2 space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="participationMode"
                                            value="mandatory"
                                            checked={
                                                editedData?.participationMode ===
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
                                        <span>Mandatory</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="participationMode"
                                            value="optional"
                                            checked={
                                                editedData?.participationMode ===
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
                                        <span>Optional</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="mt-1">
                                    <Badge
                                        className={
                                            projectData.participationMode ===
                                            'mandatory'
                                                ? 'bg-orange-100 text-orange-800'
                                                : 'bg-cyan-100 text-cyan-800'
                                        }
                                    >
                                        {projectData.participationMode.toUpperCase()}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* Join Project Deadline - Only show when participation is optional */}
                        {(editedData?.participationMode === 'optional' ||
                            (!isEditing &&
                                projectData.participationMode ===
                                    'optional')) && (
                            <div className="col-span-full">
                                <Label className="text-gray-700">
                                    Join Project Deadline
                                </Label>
                                {isEditing ? (
                                    <div>
                                        <Input
                                            type="date"
                                            value={
                                                editedData?.joinProjectDeadline
                                                    ? editedData.joinProjectDeadline.split(
                                                          'T'
                                                      )[0]
                                                    : ''
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'joinProjectDeadline',
                                                    e.target.value || null
                                                )
                                            }
                                            placeholder="Optional - Set deadline for students to join"
                                            className={
                                                errors.joinProjectDeadline
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        {errors.joinProjectDeadline && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {errors.joinProjectDeadline}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">
                                            Optional deadline for students to
                                            join the project. Leave empty for no
                                            deadline.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-1">
                                        {projectData.joinProjectDeadline ? (
                                            <p className="font-medium text-orange-600">
                                                {formatDate(
                                                    projectData.joinProjectDeadline,
                                                    'dd/MM/yyyy'
                                                )}
                                            </p>
                                        ) : (
                                            <p className="text-gray-500 italic">
                                                No deadline set
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Team Formation Settings - Only show for TEAM projects */}
            {(editedData?.type === 'TEAM' ||
                (!isEditing && projectData.type === 'TEAM')) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Team Formation Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isEditing ? (
                            <>
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={
                                                editedData?.allowStudentFormTeam
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'allowStudentFormTeam',
                                                    e.target.checked
                                                )
                                            }
                                            className="text-blue-600"
                                        />
                                        <span>
                                            Allow students to form their own
                                            teams
                                        </span>
                                    </label>
                                </div>

                                {editedData?.allowStudentFormTeam && (
                                    <div>
                                        <Label className="text-gray-700">
                                            Team Formation Deadline
                                        </Label>
                                        <Input
                                            type="date"
                                            value={
                                                editedData.formGroupDeadline
                                                    ? editedData.formGroupDeadline.split(
                                                          'T'
                                                      )[0]
                                                    : ''
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'formGroupDeadline',
                                                    e.target.value
                                                )
                                            }
                                            className={
                                                errors.formGroupDeadline
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        {errors.formGroupDeadline && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {errors.formGroupDeadline}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div>
                                    <Label className="text-gray-700">
                                        Student Team Formation
                                    </Label>
                                    <div className="mt-1">
                                        <Badge
                                            className={
                                                projectData.allowStudentFormTeam
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }
                                        >
                                            {projectData.allowStudentFormTeam
                                                ? 'ALLOWED'
                                                : 'NOT ALLOWED'}
                                        </Badge>
                                    </div>
                                </div>

                                {projectData.allowStudentFormTeam &&
                                    projectData.formGroupDeadline && (
                                        <div>
                                            <Label className="text-gray-700">
                                                Team Formation Deadline
                                            </Label>
                                            <p className="font-medium text-purple-600">
                                                {formatDate(
                                                    projectData.formGroupDeadline,
                                                    'dd/MM/yyyy'
                                                )}
                                            </p>
                                        </div>
                                    )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Topic Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Topic Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900">
                                Allow Students to Create Topic Requests
                            </h4>
                            <p className="text-sm text-gray-500">
                                Students can request new topics by providing
                                title and description
                            </p>
                        </div>
                        {isEditing ? (
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={
                                        editedData?.allowStudentCreateTopic
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            'allowStudentCreateTopic',
                                            e.target.checked
                                        )
                                    }
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        ) : (
                            <div className="mt-1">
                                <Badge
                                    className={
                                        projectData.allowStudentCreateTopic
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }
                                >
                                    {projectData.allowStudentCreateTopic
                                        ? 'ALLOWED'
                                        : 'NOT ALLOWED'}
                                </Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
