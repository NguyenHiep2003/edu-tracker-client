'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FileText,
    Users,
    User,
    Clock,
    Paperclip,
    Eye,
    Check,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { previewTemplate } from '@/services/api/template';
import { formatDate } from '@/helper/date-formatter';
import { getTypeIcon } from '@/helper/get-type-icon';

interface TemplatePreviewData {
    projectConfigPreview: {
        key: string;
        type: 'TEAM' | 'SOLO';
        grade: {
            title: string;
            description: string;
            maxScore: number;
            scale: number;
        } | null;
        title: string;
        description: string | null;
        formGroupDeadline: string;
        participationMode: 'mandatory' | 'optional';
        joinProjectDeadline: string | null;
        allowStudentFormTeam: boolean;
        allowStudentCreateTopic: boolean;
        joinProjectDeadlineOffset: number | null;
        formGroupDeadlineOffset: number | null;
    };
    numOfTopic: number;
    topicsPreview: Array<{
        title: string;
        description: string | null;
        numOfAttachments: number;
    }>;
    numOfItem: number;
    lecturerItemsPreview: Array<{
        summary: string;
        description: string;
        assignType: string;
        type: string;
        grade: {
            scale: number;
            title: string;
            maxScore: number;
            description: string;
        };
        taskTimeOffset: number;
        startDate: string;
        endDate: string;
        taskTime: number;
        numOfAttachments: number;
    }>;
}

interface TemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateId: number | null;
    templateTitle: string;
    onConfirmImport?: (
        templateId: number,
        projectStartAt: string
    ) => Promise<void>;
}

export default function TemplatePreviewModal({
    isOpen,
    onClose,
    templateId,
    templateTitle,
    onConfirmImport,
}: TemplatePreviewModalProps) {
    const [previewData, setPreviewData] = useState<TemplatePreviewData | null>(
        null
    );
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [projectStartDateTime, setProjectStartDateTime] = useState(() => {
        // Set default to now in datetime-local format
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
    });
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (isOpen && templateId) {
            fetchPreviewData();
        }
    }, [isOpen, templateId, projectStartDateTime]);

    const fetchPreviewData = async () => {
        if (!templateId) return;

        try {
            setLoading(true);
            // Send the datetime string if provided, otherwise send empty string
            const startDateTime = projectStartDateTime
                ? new Date(projectStartDateTime).toISOString()
                : '';
            const data = await previewTemplate(templateId, startDateTime);
            setPreviewData(data);
        } catch (error) {
            console.error('Error fetching template preview:', error);
            toast.error('Failed to load template preview');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!onConfirmImport || !templateId) return;

        setIsConfirming(true);
        try {
            await onConfirmImport(templateId, projectStartDateTime);
        } finally {
            setIsConfirming(false);
        }
    };

    const formatDuration = (milliseconds: number) => {
        const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);

        if (years > 0) {
            return `${years} year${years > 1 ? 's' : ''}`;
        } else if (months > 0) {
            return `${months} month${months > 1 ? 's' : ''}`;
        } else {
            return `${days} day${days > 1 ? 's' : ''}`;
        }
    };

    const formatTimeOffset = (milliseconds: number) => {
        const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);

        if (years > 0) {
            return `${years} year${years > 1 ? 's' : ''}`;
        } else if (months > 0) {
            return `${months} month${
                months > 1 ? 's' : ''
            } after project start`;
        } else {
            return `${days} day${days > 1 ? 's' : ''}`;
        }
    };

    const getProjectTypeIcon = (type: string) => {
        return type === 'TEAM' ? (
            <Users className="h-4 w-4 text-blue-600" />
        ) : (
            <User className="h-4 w-4 text-purple-600" />
        );
    };

    const getParticipationColor = (mode: string) => {
        return mode === 'mandatory'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-yellow-50 text-yellow-700 border-yellow-200';
    };

    const tabs = [
        {
            id: 'basic',
            label: 'Basic Info',
            icon: FileText,
            count: null,
        },
        {
            id: 'topics',
            label: 'Topics',
            icon: FileText,
            count: previewData?.numOfTopic || 0,
        },
        {
            id: 'tasks',
            label: 'Tasks',
            icon: Clock,
            count: previewData?.numOfItem || 0,
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-600" />
                        Template Preview: {templateTitle}
                    </DialogTitle>
                    <DialogDescription>
                        Preview the template configuration and content
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 min-h-0">
                    {/* Left Sidebar with Tabs */}
                    <div className="w-70 border-r border-gray-200 bg-gray-50">
                        {/* Project Start Date Input */}
                        <div className="p-4 border-b border-gray-200">
                            <Label
                                htmlFor="project-start-datetime"
                                className="text-sm font-medium text-gray-700"
                            >
                                Project Start Date
                            </Label>
                            <Input
                                id="project-start-datetime"
                                type="datetime-local"
                                value={projectStartDateTime}
                                onChange={(e) =>
                                    setProjectStartDateTime(e.target.value)
                                }
                                className="text-gray-700 mt-2"
                            />
                        </div>

                        {/* Tab Navigation */}
                        <nav className="p-4">
                            <div className="space-y-1">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                                isActive
                                                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span className="flex-1 text-left">
                                                {tab.label}
                                            </span>
                                            {tab.count !== null && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {tab.count}
                                                </Badge>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-64 w-full" />
                            </div>
                        ) : previewData ? (
                            <div>
                                {/* Basic Info Tab */}
                                {activeTab === 'basic' && (
                                    <div className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-blue-600" />
                                                    Project Configuration
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-700">
                                                            Title
                                                        </Label>
                                                        <p className="text-gray-900">
                                                            {
                                                                previewData
                                                                    .projectConfigPreview
                                                                    .title
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-700">
                                                            Key
                                                        </Label>
                                                        <p className="text-gray-900 font-mono">
                                                            {
                                                                previewData
                                                                    .projectConfigPreview
                                                                    .key
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-700">
                                                            Type
                                                        </Label>
                                                        <div className="flex items-center gap-2">
                                                            {getProjectTypeIcon(
                                                                previewData
                                                                    .projectConfigPreview
                                                                    .type
                                                            )}
                                                            <span className="text-gray-900">
                                                                {
                                                                    previewData
                                                                        .projectConfigPreview
                                                                        .type
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-700">
                                                            Participation Mode
                                                        </Label>
                                                        <div className="mt-1">
                                                            <Badge
                                                                className={getParticipationColor(
                                                                    previewData
                                                                        .projectConfigPreview
                                                                        .participationMode
                                                                )}
                                                            >
                                                                {previewData.projectConfigPreview.participationMode.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Deadlines with offsets */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {previewData
                                                        .projectConfigPreview
                                                        .type === 'TEAM' && (
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-700">
                                                                Form Group
                                                                Deadline
                                                            </Label>
                                                            <div className="space-y-1">
                                                                <p className="text-gray-900">
                                                                    {previewData
                                                                        .projectConfigPreview
                                                                        .formGroupDeadline ? (
                                                                        formatDate(
                                                                            previewData
                                                                                .projectConfigPreview
                                                                                .formGroupDeadline,
                                                                            'dd/MM/yyyy HH:mm'
                                                                        )
                                                                    ) : (
                                                                        <>
                                                                            Not
                                                                            set
                                                                        </>
                                                                    )}
                                                                </p>
                                                                {previewData
                                                                    .projectConfigPreview
                                                                    .formGroupDeadlineOffset !==
                                                                    null && (
                                                                    <p className="text-xs text-gray-500">
                                                                        {formatTimeOffset(
                                                                            previewData
                                                                                .projectConfigPreview
                                                                                .formGroupDeadlineOffset
                                                                        )}{' '}
                                                                        after
                                                                        project
                                                                        start
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {previewData
                                                        .projectConfigPreview
                                                        .participationMode ===
                                                        'optional' && (
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-700">
                                                                Join Project
                                                                Deadline
                                                            </Label>
                                                            <div className="space-y-1">
                                                                {previewData
                                                                    .projectConfigPreview
                                                                    .joinProjectDeadline ? (
                                                                    <p className="text-gray-900">
                                                                        {formatDate(
                                                                            previewData
                                                                                .projectConfigPreview
                                                                                .joinProjectDeadline,
                                                                            'dd/MM/yyyy HH:mm'
                                                                        )}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-gray-900">
                                                                        Not set
                                                                    </p>
                                                                )}
                                                                {previewData
                                                                    .projectConfigPreview
                                                                    .joinProjectDeadlineOffset !==
                                                                    null && (
                                                                    <p className="text-xs text-gray-500">
                                                                        {formatTimeOffset(
                                                                            previewData
                                                                                .projectConfigPreview
                                                                                .joinProjectDeadlineOffset
                                                                        )}{' '}
                                                                        after
                                                                        project
                                                                        start
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {previewData
                                                    .projectConfigPreview
                                                    .description && (
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-700">
                                                            Description
                                                        </Label>
                                                        <p className="text-gray-900">
                                                            {
                                                                previewData
                                                                    .projectConfigPreview
                                                                    .description
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Student Permissions */}
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700 mb-2">
                                                        Student Permissions
                                                    </Label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                                            <span className="text-sm text-gray-700">
                                                                Allow Student
                                                                Form Team
                                                            </span>
                                                            <span
                                                                className={`px-2 py-1 text-xs font-medium rounded-md ${
                                                                    previewData
                                                                        .projectConfigPreview
                                                                        .allowStudentFormTeam
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}
                                                            >
                                                                {previewData
                                                                    .projectConfigPreview
                                                                    .allowStudentFormTeam
                                                                    ? 'Yes'
                                                                    : 'No'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                                            <span className="text-sm text-gray-700">
                                                                Allow Student
                                                                Create Topic
                                                            </span>
                                                            <span
                                                                className={`px-2 py-1 text-xs font-medium rounded-md ${
                                                                    previewData
                                                                        .projectConfigPreview
                                                                        .allowStudentCreateTopic
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}
                                                            >
                                                                {previewData
                                                                    .projectConfigPreview
                                                                    .allowStudentCreateTopic
                                                                    ? 'Yes'
                                                                    : 'No'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {previewData
                                                    .projectConfigPreview
                                                    .grade && (
                                                    <Card className="bg-blue-50 border-blue-200">
                                                        <CardHeader>
                                                            <CardTitle className="text-blue-900">
                                                                Grade
                                                                Configuration
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="space-y-2">
                                                            <div>
                                                                <Label className="text-sm font-medium text-blue-700">
                                                                    Grade Title
                                                                </Label>
                                                                <p className="text-blue-900">
                                                                    {
                                                                        previewData
                                                                            .projectConfigPreview
                                                                            .grade
                                                                            .title
                                                                    }
                                                                </p>
                                                            </div>
                                                            {previewData
                                                                .projectConfigPreview
                                                                .grade
                                                                .description && (
                                                                <div>
                                                                    <Label className="text-sm font-medium text-blue-700">
                                                                        Description
                                                                    </Label>
                                                                    <p className="text-blue-900">
                                                                        {
                                                                            previewData
                                                                                .projectConfigPreview
                                                                                .grade
                                                                                .description
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <Label className="text-sm font-medium text-blue-700">
                                                                        Max
                                                                        Score
                                                                    </Label>
                                                                    <p className="text-blue-900">
                                                                        {
                                                                            previewData
                                                                                .projectConfigPreview
                                                                                .grade
                                                                                .maxScore
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-sm font-medium text-blue-700">
                                                                        Scale
                                                                    </Label>
                                                                    <p className="text-blue-900">
                                                                        {
                                                                            previewData
                                                                                .projectConfigPreview
                                                                                .grade
                                                                                .scale
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Topics Tab */}
                                {activeTab === 'topics' && (
                                    <div className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-green-600" />
                                                    Topics (
                                                    {
                                                        previewData
                                                            .topicsPreview
                                                            .length
                                                    }
                                                    )
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {previewData.topicsPreview
                                                    .length === 0 ? (
                                                    <p className="text-gray-500 text-center py-8">
                                                        No topics in this
                                                        template
                                                    </p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {previewData.topicsPreview.map(
                                                            (topic, index) => (
                                                                <Card
                                                                    key={index}
                                                                    className="border border-gray-200"
                                                                >
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="font-medium text-gray-900 mb-2">
                                                                                    {
                                                                                        topic.title
                                                                                    }
                                                                                </h4>
                                                                                {topic.description && (
                                                                                    <p className="text-sm text-gray-600 mb-2 break-all">
                                                                                        {
                                                                                            topic.description
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 ml-4">
                                                                                <Paperclip className="h-4 w-4 text-gray-400" />
                                                                                <span className="text-sm text-gray-500">
                                                                                    {
                                                                                        topic.numOfAttachments
                                                                                    }{' '}
                                                                                    attachment
                                                                                    {topic.numOfAttachments !==
                                                                                    1
                                                                                        ? 's'
                                                                                        : ''}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Tasks Tab */}
                                {activeTab === 'tasks' && (
                                    <div className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Clock className="h-5 w-5 text-orange-600" />
                                                    Lecturer Assigned Items (
                                                    {
                                                        previewData
                                                            .lecturerItemsPreview
                                                            .length
                                                    }
                                                    )
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {previewData
                                                    .lecturerItemsPreview
                                                    .length === 0 ? (
                                                    <p className="text-gray-500 text-center py-8">
                                                        No tasks in this
                                                        template
                                                    </p>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {previewData.lecturerItemsPreview.map(
                                                            (item, index) => (
                                                                <Card
                                                                    key={index}
                                                                    className="border border-gray-200"
                                                                >
                                                                    <CardContent className="p-4">
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-start justify-between">
                                                                                <div className="flex-1">
                                                                                    <h4 className="font-medium text-gray-900 mb-1">
                                                                                        {
                                                                                            item.summary
                                                                                        }
                                                                                    </h4>
                                                                                    {item.description && (
                                                                                        <p className="text-sm text-gray-600 mb-2">
                                                                                            {
                                                                                                item.description
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-2 ml-4">
                                                                                    <span>
                                                                                        {getTypeIcon(
                                                                                            item.type
                                                                                        )}
                                                                                    </span>

                                                                                    <span className="text-sm text-gray-700">
                                                                                        {
                                                                                            item.type
                                                                                        }
                                                                                    </span>
                                                                                    <Badge variant="outline">
                                                                                        {
                                                                                            item.assignType
                                                                                        }
                                                                                    </Badge>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-700">
                                                                                        Start
                                                                                        Date
                                                                                    </Label>
                                                                                    <p className="text-gray-900">
                                                                                        {formatDate(
                                                                                            item.startDate,
                                                                                            'dd/MM/yyyy HH:mm'
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-700">
                                                                                        End
                                                                                        Date
                                                                                    </Label>
                                                                                    <p className="text-gray-900">
                                                                                        {formatDate(
                                                                                            item.endDate,
                                                                                            'dd/MM/yyyy HH:mm'
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-700">
                                                                                        Time
                                                                                        Offset
                                                                                    </Label>
                                                                                    <p className="text-gray-900">
                                                                                        {formatTimeOffset(
                                                                                            item.taskTimeOffset
                                                                                        )}{' '}
                                                                                        from
                                                                                        project
                                                                                        start
                                                                                        date
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-700">
                                                                                        Duration
                                                                                    </Label>
                                                                                    <p className="text-gray-900">
                                                                                        {formatDuration(
                                                                                            item.taskTime
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {item.grade && (
                                                                                <Card className="bg-green-50 border-green-200">
                                                                                    <CardContent className="p-3">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <div>
                                                                                                <h5 className="font-medium text-green-900 text-sm">
                                                                                                    {
                                                                                                        item
                                                                                                            .grade
                                                                                                            .title
                                                                                                    }
                                                                                                </h5>
                                                                                                {item
                                                                                                    .grade
                                                                                                    .description && (
                                                                                                    <p className="text-green-700 text-xs">
                                                                                                        {
                                                                                                            item
                                                                                                                .grade
                                                                                                                .description
                                                                                                        }
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="text-right">
                                                                                                <p className="text-green-900 font-medium">
                                                                                                    Max:{' '}
                                                                                                    {
                                                                                                        item
                                                                                                            .grade
                                                                                                            .maxScore
                                                                                                    }
                                                                                                </p>
                                                                                                <p className="text-green-700 text-xs">
                                                                                                    Scale:{' '}
                                                                                                    {
                                                                                                        item
                                                                                                            .grade
                                                                                                            .scale
                                                                                                    }
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </CardContent>
                                                                                </Card>
                                                                            )}

                                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                                <Paperclip className="h-4 w-4" />
                                                                                <span>
                                                                                    {
                                                                                        item.numOfAttachments
                                                                                    }{' '}
                                                                                    attachment
                                                                                    {item.numOfAttachments !==
                                                                                    1
                                                                                        ? 's'
                                                                                        : ''}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                No preview data available
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {onConfirmImport && (
                        <Button
                            onClick={handleConfirm}
                            disabled={isConfirming}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isConfirming ? (
                                'Confirming...'
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Confirm
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
