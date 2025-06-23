'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    FileText,
    AlertCircle,
    CheckCircle,
    Target,
} from 'lucide-react';
import { useStudentProjectContext } from '@/context/student-project-context';

export default function StudentProjectOverviewPage() {
    const { projectData, loading } = useStudentProjectContext();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Loading project details...
                    </p>
                </div>
            </div>
        );
    }

    if (!projectData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Project not found</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getDaysUntilDeadline = (dateString: string) => {
        const deadline = new Date(dateString);
        const now = new Date();
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysUntilEnd = getDaysUntilDeadline(projectData.endDate);
    const isOverdue = daysUntilEnd < 0;
    const isDueSoon = daysUntilEnd <= 3 && daysUntilEnd >= 0;

    return (
        <div className="max-w-8xl mx-auto space-y-8 px-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {projectData.title}
                        </h1>
                        <div className="flex items-center gap-3 mt-4">
                            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                                {projectData.type == 'TEAM' ? 'Team' : 'Solo'}{' '}
                                Project
                            </Badge>
                            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                                {projectData.participationMode == 'mandatory'
                                    ? 'Required all students to join'
                                    : 'Optional participation'}
                            </Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-blue-100 opacity-80">
                            Days Remaining
                        </div>
                        <div className="text-4xl font-bold">
                            {daysUntilEnd > 0 ? daysUntilEnd : 'Overdue'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Status Alert */}
            {!projectData.isJoined && projectData.status === 'OPEN' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-semibold text-amber-800">
                                Ready to Join?
                            </h3>
                            <p className="text-amber-700 mt-1">
                                Start your journey with this{' '}
                                {projectData.type.toLowerCase()} project and
                                unlock your potential!
                            </p>
                        </div>
                        <Button
                            size="lg"
                            className="ml-4 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            Join Project
                        </Button>
                    </div>
                </div>
            )}

            {/* Deadline Warning */}
            {/* {projectData.isJoined && (isOverdue || isDueSoon) && (
                <div
                    className={`rounded-xl p-6 border ${
                        isOverdue
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                    }`}
                >
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <AlertCircle
                                className={`h-7 w-7 ${
                                    isOverdue
                                        ? 'text-red-500'
                                        : 'text-yellow-500'
                                }`}
                            />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3
                                className={`text-xl font-bold ${
                                    isOverdue
                                        ? 'text-red-800'
                                        : 'text-yellow-800'
                                }`}
                            >
                                {isOverdue
                                    ? '⏰ Project Overdue!'
                                    : '⚡ Deadline Approaching'}
                            </h3>
                            <p
                                className={`text-lg mt-2 ${
                                    isOverdue
                                        ? 'text-red-700'
                                        : 'text-yellow-700'
                                }`}
                            >
                                {isOverdue
                                    ? `This project was due ${Math.abs(
                                          daysUntilEnd
                                      )} days ago. Please submit as soon as possible!`
                                    : `Only ${daysUntilEnd} day${
                                          daysUntilEnd === 1 ? '' : 's'
                                      } left! Time to finalize your work.`}
                            </p>
                        </div>
                    </div>
                </div>
            )} */}

            {/* Project Information Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Project Info */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Description */}
                    <Card className="shadow-sm border border-gray-200">
                        <CardHeader className="bg-blue-50 border-b border-blue-200">
                            <CardTitle className="flex items-center gap-3 text-xl text-blue-900">
                                <FileText className="h-6 w-6 text-blue-600" />
                                Project Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="prose prose-lg text-gray-700">
                                {projectData.description ? (
                                    <p className="leading-relaxed text-lg">
                                        {projectData.description}
                                    </p>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg">
                                            No description provided for this
                                            project.
                                        </p>
                                        <p className="text-sm mt-2">
                                            More details will be added soon!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Project Timeline */}
                    <Card className="shadow-sm border border-gray-200">
                        <CardHeader className="bg-green-50 border-b border-green-200">
                            <CardTitle className="flex items-center gap-3 text-xl text-green-900">
                                <Calendar className="h-6 w-6 text-green-600" />
                                Project Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-5">
                            <div className="space-y-6">
                                <div className="relative">
                                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-lg">
                                                    Project Started
                                                </p>
                                                <p className="text-gray-600 text-base">
                                                    {formatDate(
                                                        projectData.startDate
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {projectData.joinProjectDeadline &&
                                    projectData.participationMode ===
                                        'optional' && (
                                        <div className="relative">
                                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-lg">
                                                            Join Project
                                                            Deadline
                                                        </p>
                                                        <p className="text-gray-600 text-base">
                                                            {formatDate(
                                                                projectData.joinProjectDeadline
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                {projectData.formGroupDeadline &&
                                    projectData.type === 'TEAM' && (
                                        <div className="relative">
                                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-lg">
                                                            Form Group Deadline
                                                        </p>
                                                        <p className="text-gray-600 text-base">
                                                            {formatDate(
                                                                projectData.formGroupDeadline
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                <div className="relative">
                                    <div
                                        className={`flex items-center justify-between p-6 rounded-xl border ${
                                            isOverdue
                                                ? 'bg-red-50 border-red-200'
                                                : isDueSoon
                                                ? 'bg-yellow-50 border-yellow-200'
                                                : 'bg-gray-50 border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-4 h-4 rounded-full ${
                                                    isOverdue
                                                        ? 'bg-red-500'
                                                        : isDueSoon
                                                        ? 'bg-yellow-500'
                                                        : 'bg-blue-500'
                                                }`}
                                            ></div>
                                            <div>
                                                <p
                                                    className={`font-semibold text-lg ${
                                                        isOverdue
                                                            ? 'text-red-900'
                                                            : isDueSoon
                                                            ? 'text-yellow-900'
                                                            : 'text-gray-900'
                                                    }`}
                                                >
                                                    {isOverdue
                                                        ? 'Deadline Passed'
                                                        : isDueSoon
                                                        ? 'Due Soon'
                                                        : 'Project Deadline'}
                                                </p>
                                                <p
                                                    className={`text-base ${
                                                        isOverdue
                                                            ? 'text-red-700'
                                                            : isDueSoon
                                                            ? 'text-yellow-700'
                                                            : 'text-gray-600'
                                                    }`}
                                                >
                                                    {formatDate(
                                                        projectData.endDate
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge
                                            className={`px-4 py-2 text-sm font-semibold ${
                                                isOverdue
                                                    ? 'bg-red-100 text-red-800 border-red-300'
                                                    : isDueSoon
                                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                    : 'bg-blue-100 text-blue-800 border-blue-300'
                                            }`}
                                        >
                                            {isOverdue
                                                ? `${Math.abs(
                                                      daysUntilEnd
                                                  )} days overdue`
                                                : `${daysUntilEnd} days left`}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Quick Stats */}
                    <Card className="shadow-sm border border-gray-200">
                        <CardHeader className="bg-purple-50 border-b border-purple-200">
                            <CardTitle className="flex items-center gap-3 text-xl text-purple-900">
                                <Target className="h-6 w-6 text-purple-600" />
                                Project Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6 pt-5">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-base font-medium text-gray-700">
                                    Type
                                </span>
                                <Badge
                                    className={`px-3 py-1 text-sm font-semibold ${
                                        projectData.type === 'TEAM'
                                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                                            : 'bg-purple-100 text-purple-800 border-purple-300'
                                    }`}
                                >
                                    {projectData.type == 'TEAM'
                                        ? 'Team'
                                        : 'Solo'}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-base font-medium text-gray-700">
                                    Mode
                                </span>
                                <Badge className="px-3 py-1 text-sm font-semibold bg-yellow-100 text-yellow-800 border-yellow-300">
                                    {projectData.participationMode ==
                                    'mandatory'
                                        ? 'Mandatory'
                                        : 'Optional'}
                                </Badge>
                            </div>
                            {projectData.type == 'TEAM' && <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-base font-medium text-gray-700">
                                    Allow Form Group
                                </span>
                                <Badge className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 border-blue-300">
                                    {projectData.allowStudentFormTeam == true
                                        ? 'Yes'
                                        : 'No'}
                                </Badge>
                            </div>}

                            {projectData.isJoined && (
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-base font-medium text-gray-700">
                                        Your Status
                                    </span>
                                    <Badge className="px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 border-green-300">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Joined
                                    </Badge>
                                </div>
                            )}

                            {projectData.groupNumber && (
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-base font-medium text-gray-700">
                                        Your Group
                                    </span>
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                        Group {projectData.groupNumber}
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
