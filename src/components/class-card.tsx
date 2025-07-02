'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BookOpen, Users, UserCheck } from 'lucide-react';
import type { Class } from '@/services/api/class/interface';
import { formatDate } from '@/helper/date-formatter';

interface ClassCardProps {
    classData: Class;
    onClick?: () => void;
    showLecturerNames?: boolean;
}

// Generate a consistent color based on class name
const generateClassColor = (className: string): string => {
    const colors = [
        'from-blue-400 to-blue-600',
        'from-green-400 to-green-600',
        'from-purple-400 to-purple-600',
        'from-pink-400 to-pink-600',
        'from-indigo-400 to-indigo-600',
        'from-red-400 to-red-600',
        'from-yellow-400 to-yellow-600',
        'from-teal-400 to-teal-600',
        'from-orange-400 to-orange-600',
        'from-cyan-400 to-cyan-600',
    ];

    let hash = 0;
    for (let i = 0; i < className.length; i++) {
        hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};

// Generate initials from class name
const generateInitials = (className: string): string => {
    return className
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 3);
};

// Combine lecturer names
const getLecturerNames = (lecturers: Class['lecturers']): string => {
    if (!lecturers || lecturers.length === 0) {
        return 'No lecturers assigned';
    }

    if (lecturers.length === 1) {
        return lecturers[0].name;
    }

    if (lecturers.length === 2) {
        return `${lecturers[0].name} & ${lecturers[1].name}`;
    }

    // For more than 2 lecturers, show first name and count
    return `${lecturers[0].name} & ${lecturers.length - 1} others`;
};

export function ClassCard({ classData, onClick, showLecturerNames = true }: ClassCardProps) {
    const [mounted, setMounted] = useState(false);
    const [cardData, setCardData] = useState({
        gradientClass: '',
        initials: '',
        lecturerNames: '',
        formattedDate: '',
    });

    useEffect(() => {
        setMounted(true);
        setCardData({
            gradientClass: generateClassColor(classData.name),
            initials: generateInitials(classData.name),
            lecturerNames: getLecturerNames(classData.lecturers),
            formattedDate: formatDate(classData.createdAt, 'dd/MM/yyyy'),
        });
    }, [classData]);

    if (!mounted) {
        return (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                    <div className="w-full h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div
                    className={`w-full h-24 bg-gradient-to-br ${cardData.gradientClass} rounded-lg flex items-center justify-center`}
                >
                    <span className="text-2xl font-bold text-white">
                        {cardData.initials}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <CardTitle className="text-lg mb-3 line-clamp-2">
                    {classData.externalId} - {classData.name}
                </CardTitle>

                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{classData.semester.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                            {classData.numberOfStudents} sinh viên
                        </span>
                    </div>

                    {showLecturerNames && (
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            <span
                            className="line-clamp-1"
                            title={cardData.lecturerNames}
                        >
                                {cardData.lecturerNames}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Tạo {cardData.formattedDate}</span>
                    </div>

                    {/* {classData.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                            {classData.description}
                        </p>
                    )} */}
                </div>
            </CardContent>
        </Card>
    );
}
