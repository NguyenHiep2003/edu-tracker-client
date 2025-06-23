'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Clock,
    Users,
    Calendar,
    Loader2,
    Star,
    AlertTriangle,
    Award,
    Paperclip,
    Eye,
    CheckCircle,
} from 'lucide-react';
import { getLecturerAssignedItemSubmission } from '@/services/api/work_items';
import { toast } from 'react-toastify';
import { getStatusBadge } from '@/helper/get-status-badge';
import { WorkItemStatus } from '@/services/api/work_items/interface';
import { Progress } from '@/components/ui/progress';
import { GradeModal } from '@/components/grade-modal';
import { formatDate } from '@/helper/date-formatter';
import instance from '@/services/api/common/axios';
import { GroupSubmissionProgressModal } from '@/components/group-submission-progress-modal';

// Interfaces based on API response
interface Student {
    groupRole: 'LEADER' | 'MEMBER';
    name: string;
}

interface CloneItem {
    status: WorkItemStatus;
    updatedAt: string;
    numOfMembers: number;
    numOfGradedMembers: number;
    groupNumber: number;
    groupId: number;
    students: Student[];
}

interface TaskSubmissionDetails {
    summary: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    numbOfGroup: number;
    numbOfGroupSubmitted: number;
    grade?: {
        id: number;
        maxScore: number;
        scale: number;
        title: string;
    };
    attachments: {
        id: number;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        cloudId: string;
        url: string;
        name: string;
        type: string;
    }[];
    cloneItems: CloneItem[];
}

export default function TaskDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.taskId as string;

    const [details, setDetails] = useState<TaskSubmissionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [students, setStudents] = useState([]);
    const [isSubmissionProgressModalOpen, setIsSubmissionProgressModalOpen] =
        useState(false);
    const [selectedGroupForProgress, setSelectedGroupForProgress] = useState<{
        groupId: number;
        groupNumber: number;
    } | null>(null);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const data = await getLecturerAssignedItemSubmission(
                Number(taskId)
            );
            setDetails(data);
        } catch (err: any) {
            setError('Failed to load submission details.');
            toast.error(
                err.message || 'An error occurred while fetching data.'
            );
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (taskId) {
            fetchSubmissions();
        }
    }, [taskId]);

    const handleGradeClick = async (groupNumber: number) => {
        if (!details?.grade?.id) return;

        try {
            const response = await instance.get(
                `/v1/group/${groupNumber}/member-grade/${details.grade.id}`
            );
            setStudents(response.data);
            setIsGradeModalOpen(true);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load student grade data');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">
                    Loading submission details...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                    Something went wrong
                </h3>
                <p>{error}</p>
                <Button onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    if (!details) {
        return (
            <div className="text-center py-12 text-gray-600">
                <p>No submission details found.</p>
            </div>
        );
    }

    const submissionProgress =
        details.numbOfGroup > 0
            ? (details.numbOfGroupSubmitted / details.numbOfGroup) * 100
            : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-9 w-9"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {details.summary}
                    </h1>
                    <p className="text-gray-600">
                        View and manage group submissions for this task.
                    </p>
                </div>
            </div>

            {/* Task Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Task Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-800">
                            Description
                        </p>
                        <p className="text-sm text-gray-600">
                            {details.description || 'No description provided.'}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <div>
                                <div className="text-sm font-medium">
                                    Start Date
                                </div>
                                <div className="text-sm text-gray-600">
                                    {details.startDate
                                        ? formatDate(
                                              details.startDate,
                                              'dd/MM/yyyy HH:mm'
                                          )
                                        : 'Not set'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-gray-500" />
                            <div>
                                <div className="text-sm font-medium">
                                    End Date
                                </div>
                                <div className="text-sm text-gray-600">
                                    {details.endDate
                                        ? formatDate(
                                              details.endDate,
                                              'dd/MM/yyyy HH:mm'
                                          )
                                        : 'Not set'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Submission Progress</span>
                                <span>
                                    {details.numbOfGroupSubmitted} /{' '}
                                    {details.numbOfGroup} Groups
                                </span>
                            </div>
                            <Progress
                                value={submissionProgress}
                                className="h-2"
                            />
                        </div>
                    </div>

                    {/* Attachments Section */}
                    {details.attachments && details.attachments.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Paperclip className="h-4 w-4 text-gray-500" />
                                <p className="text-sm font-medium text-gray-800">
                                    Attachments ({details.attachments.length})
                                </p>
                            </div>
                            <div className="space-y-2">
                                {details.attachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {attachment.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {attachment.type} •{' '}
                                                    {formatDate(
                                                        attachment.createdAt,
                                                        'dd/MM/yyyy'
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                window.open(
                                                    attachment.url,
                                                    '_blank'
                                                )
                                            }
                                            className="flex items-center gap-1"
                                        >
                                            <Eye className="h-3 w-3" />
                                            View
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Submissions List */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Submissions
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {details.cloneItems.map((submission, index) => {
                        const isLate =
                            details.endDate &&
                            submission.status === 'DONE' &&
                            new Date(submission.updatedAt) >
                                new Date(details.endDate);

                        return (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">
                                            Group {submission.groupNumber}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {isLate && (
                                                <Badge
                                                    variant="destructive"
                                                    className="border-0"
                                                >
                                                    Submitted Late
                                                </Badge>
                                            )}
                                            {getStatusBadge(submission.status)}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 pt-1">
                                        Last updated:{' '}
                                        {formatDate(
                                            submission.updatedAt,
                                            'dd/MM/yyyy HH:mm'
                                        )}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {details.grade && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium mb-1">
                                                Grading Progress
                                            </p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>
                                                        {
                                                            submission.numOfGradedMembers
                                                        }{' '}
                                                        /{' '}
                                                        {
                                                            submission.numOfMembers
                                                        }{' '}
                                                        Members Graded
                                                    </span>
                                                    <span>
                                                        {submission.numOfMembers >
                                                        0
                                                            ? `${Math.round(
                                                                  (submission.numOfGradedMembers /
                                                                      submission.numOfMembers) *
                                                                      100
                                                              )}%`
                                                            : '0%'}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        submission.numOfMembers >
                                                        0
                                                            ? (submission.numOfGradedMembers /
                                                                  submission.numOfMembers) *
                                                              100
                                                            : 0
                                                    }
                                                    className="h-2"
                                                />
                                            </div>

                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleGradeClick(
                                                            submission.groupId
                                                        )
                                                    }
                                                >
                                                    <Award className="h-4 w-4 mr-1" />
                                                    Grade
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedGroupForProgress(
                                                            {
                                                                groupId:
                                                                    submission.groupId,
                                                                groupNumber:
                                                                    submission.groupNumber,
                                                            }
                                                        );
                                                        setIsSubmissionProgressModalOpen(
                                                            true
                                                        );
                                                    }}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    View Progress
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Group Members
                                        </p>
                                        <ul className="space-y-1">
                                            {submission.students.map(
                                                (student, sIndex) => (
                                                    <li
                                                        key={sIndex}
                                                        className="flex items-center justify-between text-sm text-gray-700"
                                                    >
                                                        <span>
                                                            {student.name}
                                                        </span>
                                                        {student.groupRole ===
                                                            'LEADER' && (
                                                            <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                                        )}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Grade Modal */}
            {details?.grade && (
                <GradeModal
                    isOpen={isGradeModalOpen}
                    onClose={() => {
                        setIsGradeModalOpen(false);
                        fetchSubmissions();
                    }}
                    students={students}
                    grade={{
                        id: details.grade.id,
                        title: details.grade.title,
                        description: '',
                        type: '',
                        maxScore: details.grade.maxScore,
                        scale: details.grade.scale,
                        createdAt: '',
                        updatedAt: '',
                        deletedAt: null,
                        fileId: null,
                        visibility: '',
                    }}
                />
            )}

            {selectedGroupForProgress && (
                <GroupSubmissionProgressModal
                    isOpen={isSubmissionProgressModalOpen}
                    onClose={() => {
                        setIsSubmissionProgressModalOpen(false);
                        setSelectedGroupForProgress(null);
                    }}
                    itemId={Number(taskId)}
                    groupId={selectedGroupForProgress.groupId}
                    groupNumber={selectedGroupForProgress.groupNumber}
                />
            )}
        </div>
    );
}
