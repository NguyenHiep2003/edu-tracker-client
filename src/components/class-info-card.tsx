'use client';

import { useClassContext } from '@/context/class-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Edit, Users, Calendar, Hash } from 'lucide-react';

export function ClassInfoCard() {
    const {
        classData,
        loading,
        error,
        refreshClass,
        updateClass,
        isCurrentUserLecturer,
        classInitials,
        classGradient,
    } = useClassContext();

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-red-600">
                        <p>Error: {error}</p>
                        <Button
                            onClick={refreshClass}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!classData) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-gray-500 text-center">
                        No class data available
                    </p>
                </CardContent>
            </Card>
        );
    }

    const handleUpdateClassName = async () => {
        try {
            await updateClass({
                name: 'Updated ' + classData.name,
            });
        } catch (error) {
            console.error('Failed to update class name:', error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                        <div
                            className={`w-10 h-10 bg-gradient-to-br ${classGradient} rounded-lg flex items-center justify-center shadow-md`}
                        >
                            <div className="text-white text-sm font-bold">
                                {classInitials}
                            </div>
                        </div>
                        <span>Class Information</span>
                    </CardTitle>
                    <div className="flex space-x-2">
                        <Button
                            onClick={refreshClass}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        {isCurrentUserLecturer && (
                            <Button
                                onClick={handleUpdateClassName}
                                variant="outline"
                                size="sm"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Hash className="h-4 w-4" />
                            <span>Class ID</span>
                        </div>
                        <p className="font-medium">{classData.externalId}</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Semester</span>
                        </div>
                        <p className="font-medium">{classData.semester.name}</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>Students</span>
                        </div>
                        <p className="font-medium">
                            {classData.numberOfStudents}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>Lecturers</span>
                        </div>
                        <p className="font-medium">
                            {classData.lecturers.length}
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600 text-sm">
                        Introduction to Artificial Intelligence course covering
                        fundamental concepts and applications.
                    </p>
                </div>

                {isCurrentUserLecturer && (
                    <div className="pt-4 border-t">
                        <p className="text-sm text-green-600">
                            ✓ You have lecturer permissions for this class
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
