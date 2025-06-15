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
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {projectData.title}
                        </h1>
                        {/* <p className="text-blue-100 text-lg opacity-90">
                            {projectData.description ||
                                'Explore this exciting project and showcase your skills!'}
                        </p> */}
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
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl p-6 shadow-sm">
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
                            className="ml-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg transform hover:scale-105 transition-all"
                        >
                            Join Project
                        </Button>
                    </div>
                </div>
            )}

            {/* Deadline Warning */}
            {projectData.isJoined && (isOverdue || isDueSoon) && (
                <div
                    className={`rounded-2xl p-6 shadow-lg border-l-4 ${
                        isOverdue
                            ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400'
                            : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-400'
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
            )}

            {/* Project Information Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Project Info */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Description */}
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-white">
                        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <FileText className="h-6 w-6" />
                                </div>
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
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-white">
                        <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg mb-4">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                Project Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                <div className="relative">
                                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-400 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
                                            <div>
                                                <p className="font-semibold text-green-900 text-lg">
                                                    Project Started
                                                </p>
                                                <p className="text-green-700 text-base">
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
                                            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-400 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-4 h-4 bg-purple-500 rounded-full shadow-lg"></div>
                                                    <div>
                                                        <p className="font-semibold text-purple-900 text-lg">
                                                            Join Project
                                                            Deadline
                                                        </p>
                                                        <p className="text-purple-700 text-base">
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
                                            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-400 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-4 h-4 bg-purple-500 rounded-full shadow-lg"></div>
                                                    <div>
                                                        <p className="font-semibold text-purple-900 text-lg">
                                                            Form Group Deadline
                                                        </p>
                                                        <p className="text-purple-700 text-base">
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
                                        className={`flex items-center justify-between p-6 rounded-xl border-l-4 shadow-sm ${
                                            isOverdue
                                                ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400'
                                                : isDueSoon
                                                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-400'
                                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-4 h-4 rounded-full shadow-lg ${
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
                                                            : 'text-blue-900'
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
                                                            : 'text-blue-700'
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
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-white">
                        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Target className="h-6 w-6" />
                                </div>
                                Project Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                <span className="text-base font-medium text-gray-700">
                                    📋 Type
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

                            {/* <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg"> */}
                            {/* <span className="text-base font-medium text-gray-700">
                                    🟢 Status
                                </span>
                                <Badge
                                    className={`px-3 py-1 text-sm font-semibold ${
                                        projectData.status === 'OPEN'
                                            ? 'bg-green-100 text-green-800 border-green-300'
                                            : 'bg-gray-100 text-gray-800 border-gray-300'
                                    }`}
                                >
                                    {projectData.status}
                                </Badge> */}
                            {/* </div> */}

                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg">
                                <span className="text-base font-medium text-gray-700">
                                    ⚡ Mode
                                </span>
                                <Badge className="px-3 py-1 text-sm font-semibold bg-yellow-100 text-yellow-800 border-yellow-300">
                                    {projectData.participationMode ==
                                    'mandatory'
                                        ? 'Mandatory'
                                        : 'Optional'}
                                </Badge>
                            </div>

                            {/* <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                                <span className="text-base font-medium text-gray-700">
                                    👥 Students
                                </span>
                                <span className="text-lg font-bold text-purple-800">
                                    {projectData.numberOfStudents || 0}
                                </span>
                            </div> */}

                            {projectData.isJoined && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        Your Status
                                    </span>
                                    <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Joined
                                    </Badge>
                                </div>
                            )}

                            {projectData.groupNumber && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        Your Group
                                    </span>
                                    <Badge className="bg-blue-100 text-blue-800">
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
