'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    Download,
    Eye,
    Calendar,
    FileText,
    User,
} from 'lucide-react';
import Link from 'next/link';

interface TaskSubmission {
    id: number;
    groupId: number;
    groupName: string;
    groupMembers: string[];
    submittedAt: string | null;
    submissionFile?: string;
    submissionText?: string;
    status: 'submitted' | 'not_submitted' | 'late';
    grade?: number;
    feedback?: string;
}

interface TaskDetails {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    createdAt: string;
    totalGroups: number;
    submittedGroups: number;
}

// Mock data - replace with your API calls
const mockTaskDetails: TaskDetails = {
    id: 1,
    title: 'Project Proposal',
    description:
        'Submit your project proposal with detailed timeline and objectives',
    dueDate: '2024-12-15T23:59:00',
    createdAt: '2024-11-20T10:00:00',
    totalGroups: 8,
    submittedGroups: 3,
};

const mockSubmissions: TaskSubmission[] = [
    {
        id: 1,
        groupId: 1,
        groupName: 'Team Alpha',
        groupMembers: ['John Doe', 'Jane Smith', 'Bob Johnson'],
        submittedAt: '2024-12-10T14:30:00',
        submissionFile: 'team-alpha-proposal.pdf',
        submissionText:
            'Our project proposal focuses on developing a mobile application for task management.',
        status: 'submitted',
        grade: 85,
        feedback: 'Good proposal, needs more detail on timeline.',
    },
    {
        id: 2,
        groupId: 2,
        groupName: 'Code Warriors',
        groupMembers: ['Alice Brown', 'Charlie Wilson'],
        submittedAt: '2024-12-14T23:45:00',
        submissionFile: 'code-warriors-proposal.pdf',
        status: 'submitted',
    },
    {
        id: 3,
        groupId: 3,
        groupName: 'Tech Innovators',
        groupMembers: ['David Lee', 'Emma Davis', 'Frank Miller', 'Grace Chen'],
        submittedAt: '2024-12-16T10:15:00',
        submissionFile: 'tech-innovators-proposal.pdf',
        status: 'late',
    },
    {
        id: 4,
        groupId: 4,
        groupName: 'Digital Pioneers',
        groupMembers: ['Henry Taylor', 'Ivy Anderson'],
        submittedAt: null,
        status: 'not_submitted',
    },
    {
        id: 5,
        groupId: 5,
        groupName: 'Future Builders',
        groupMembers: ['Jack Robinson', 'Karen White', 'Leo Garcia'],
        submittedAt: null,
        status: 'not_submitted',
    },
];

export default function TaskDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id as string;
    const projectId = params.projectId as string;
    // const taskId = params.taskId as string;

    const [taskDetails, 
        // setTaskDetails
    ] =
        useState<TaskDetails>(mockTaskDetails);
    const [submissions, 
        // setSubmissions
    ] =
        useState<TaskSubmission[]>(mockSubmissions);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getSubmissionStatusBadge = (status: TaskSubmission['status']) => {
        switch (status) {
            case 'submitted':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        Submitted
                    </Badge>
                );
            case 'late':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        Late
                    </Badge>
                );
            case 'not_submitted':
                return (
                    <Badge className="bg-red-100 text-red-800">
                        Not Submitted
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getGradeBadge = (grade?: number) => {
        if (!grade) return null;

        if (grade >= 90) {
            return (
                <Badge className="bg-green-100 text-green-800">
                    A ({grade}%)
                </Badge>
            );
        } else if (grade >= 80) {
            return (
                <Badge className="bg-blue-100 text-blue-800">
                    B ({grade}%)
                </Badge>
            );
        } else if (grade >= 70) {
            return (
                <Badge className="bg-yellow-100 text-yellow-800">
                    C ({grade}%)
                </Badge>
            );
        } else if (grade >= 60) {
            return (
                <Badge className="bg-orange-100 text-orange-800">
                    D ({grade}%)
                </Badge>
            );
        } else {
            return (
                <Badge className="bg-red-100 text-red-800">F ({grade}%)</Badge>
            );
        }
    };

    const isOverdue = new Date(taskDetails.dueDate) < new Date();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Tasks
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {taskDetails.title}
                        </h1>
                        <p className="text-gray-600">
                            View and manage group submissions
                        </p>
                    </div>
                </div>
            </div>

            {/* Task Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Task Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                                <div className="text-sm font-medium">
                                    Created
                                </div>
                                <div className="text-sm text-gray-600">
                                    {formatDate(taskDetails.createdAt)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <div>
                                <div className="text-sm font-medium">
                                    Due Date
                                </div>
                                <div
                                    className={`text-sm ${
                                        isOverdue
                                            ? 'text-red-600'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {formatDate(taskDetails.dueDate)}
                                    {isOverdue && (
                                        <span className="ml-1 font-medium">
                                            (Overdue)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <div>
                                <div className="text-sm font-medium">
                                    Groups
                                </div>
                                <div className="text-sm text-gray-600">
                                    {taskDetails.totalGroups} total
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-gray-500" />
                            <div>
                                <div className="text-sm font-medium">
                                    Submitted
                                </div>
                                <div className="text-sm text-gray-600">
                                    {taskDetails.submittedGroups} of{' '}
                                    {taskDetails.totalGroups}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Description
                        </h4>
                        <p className="text-gray-600">
                            {taskDetails.description}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Submission Progress</span>
                            <span>
                                {Math.round(
                                    (taskDetails.submittedGroups /
                                        taskDetails.totalGroups) *
                                        100
                                )}
                                %
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{
                                    width: `${
                                        (taskDetails.submittedGroups /
                                            taskDetails.totalGroups) *
                                        100
                                    }%`,
                                }}
                            ></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Group Submissions */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                    Group Submissions
                </h2>

                {submissions.map((submission) => (
                    <Card
                        key={submission.id}
                        className="hover:shadow-lg transition-shadow"
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CardTitle className="text-lg">
                                            {submission.groupName}
                                        </CardTitle>
                                        {getSubmissionStatusBadge(
                                            submission.status
                                        )}
                                        {getGradeBadge(submission.grade)}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <User className="h-4 w-4 mr-1" />
                                        {submission.groupMembers.join(', ')}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {submission.status !== 'not_submitted' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {submission.submittedAt && (
                                            <div className="flex items-center space-x-2">
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        Submitted
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {formatDate(
                                                            submission.submittedAt
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {submission.submissionFile && (
                                            <div className="flex items-center space-x-2">
                                                <FileText className="h-4 w-4 text-gray-500" />
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        File
                                                    </div>
                                                    <div className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                                                        {
                                                            submission.submissionFile
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {submission.submissionText && (
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 mb-1">
                                                Submission Text
                                            </div>
                                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                {submission.submissionText}
                                            </p>
                                        </div>
                                    )}

                                    {submission.feedback && (
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 mb-1">
                                                Feedback
                                            </div>
                                            <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                                {submission.feedback}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex space-x-2">
                                        {submission.submissionFile && (
                                            <Button variant="outline" size="sm">
                                                <Download className="h-4 w-4 mr-2" />
                                                Download
                                            </Button>
                                        )}
                                        <Link
                                            href={`/lecturer/classes/${classId}/projects/${projectId}/groups/${submission.groupId}`}
                                        >
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Group
                                            </Button>
                                        </Link>
                                        <Button variant="outline" size="sm">
                                            Grade & Feedback
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-gray-500">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm">
                                            No submission yet
                                        </span>
                                    </div>
                                    <Link
                                        href={`/lecturer/classes/${classId}/projects/${projectId}/groups/${submission.groupId}`}
                                    >
                                        <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Group
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {submissions.length === 0 && (
                <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No groups found
                    </h3>
                    <p className="text-gray-600">
                        There are no groups assigned to this project yet.
                    </p>
                </div>
            )}
        </div>
    );
}
