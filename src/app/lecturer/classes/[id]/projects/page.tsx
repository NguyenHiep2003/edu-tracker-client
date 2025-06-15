'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Plus,
    FolderOpen,
    Calendar,
    Users,
    User,
    Clock,
    MoreVertical,
} from 'lucide-react';
import { AddProjectModal } from '@/components/add-project-modal';
import { toast } from 'react-toastify';
import type { Project } from '@/services/api/project/interface';
import { getProjectInClass } from '@/services/api/project';

export default function ProjectsPage() {
    const params = useParams();
    const classId = Number.parseInt(params.id as string);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const [projectsData, setProjectsData] = useState<{
        [key: number]: {
            daysRemaining: number;
            formattedStartDate: string;
            formattedEndDate: string;
            isOverdue: boolean;
            isUrgent: boolean;
        };
    }>({});

    useEffect(() => {
        setMounted(true);
        fetchProjects();
    }, []);

    useEffect(() => {
        if (projects.length > 0) {
            const newProjectsData = projects.reduce((acc, project) => {
                const now = new Date();
                const endDate = new Date(project.endDate);
                const daysRemaining = differenceInDays(endDate, now);

                acc[project.id] = {
                    daysRemaining,
                    formattedStartDate: format(
                        new Date(project.startDate),
                        'MMM d, yyyy'
                    ),
                    formattedEndDate: format(
                        new Date(project.endDate),
                        'MMM d, yyyy'
                    ),
                    isOverdue: daysRemaining <= 0,
                    isUrgent: daysRemaining > 0 && daysRemaining <= 7,
                };
                return acc;
            }, {} as typeof projectsData);

            setProjectsData(newProjectsData);
        }
    }, [projects]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await getProjectInClass(classId);

            setProjects(data.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleProjectAdded = () => {
        fetchProjects();
    };

    const getTypeIcon = (type: Project['type']) => {
        return type === 'TEAM' ? (
            <Users className="h-4 w-4 text-blue-600" />
        ) : (
            <User className="h-4 w-4 text-purple-600" />
        );
    };

    const getParticipationColor = (mode: Project['participationMode']) => {
        return mode === 'mandatory'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-yellow-50 text-yellow-700 border-yellow-200';
    };

    if (!mounted || loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading projects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 px-6 py-6">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FolderOpen className="h-6 w-6 text-blue-600" />
                            Projects ({projects.length})
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage class projects and assignments
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                    </Button>
                </div>
            </div>

            {/* Projects List */}
            {projects.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-200">
                    <CardContent className="text-center py-16">
                        <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            No projects yet
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Create your first project to get started with
                            assignments and track student progress.
                        </p>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Project
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {projects.map((project) => {
                        const data = projectsData[project.id];
                        if (!data) return null;

                        const daysRemaining = data.daysRemaining;
                        const isOverdue = data.isOverdue;
                        const isUrgent = data.isUrgent;

                        return (
                            <Card
                                key={project.id}
                                className="hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden group"
                            >
                                <CardContent className="p-0">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            {/* Left side - Project info */}
                                            <div className="flex-1 space-y-4">
                                                {/* Title and Key */}
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {project.title}
                                                    </h3>
                                                    <span className="text-sm font-mono bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                                                        {project.key}
                                                    </span>
                                                </div>

                                                {/* Status and Type Row */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                                                        {getTypeIcon(
                                                            project.type
                                                        )}
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {project.type}
                                                        </span>
                                                    </div>

                                                    <span
                                                        className={`text-xs px-3 py-1.5 rounded-full border ${getParticipationColor(
                                                            project.participationMode
                                                        )}`}
                                                    >
                                                        {project.participationMode.toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Dates and Students Row */}
                                                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 pt-2">
                                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                                                        <Calendar className="h-4 w-4 text-gray-500" />
                                                        <span>
                                                            {
                                                                data.formattedStartDate
                                                            }
                                                            {' - '}
                                                            {
                                                                data.formattedEndDate
                                                            }
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                                                        <Users className="h-4 w-4 text-gray-500" />
                                                        <span>
                                                            {
                                                                project.numberOfStudents
                                                            }{' '}
                                                            students
                                                        </span>
                                                    </div>

                                                    {daysRemaining > 0 && (
                                                        <div
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                                                                isUrgent
                                                                    ? 'bg-red-50'
                                                                    : 'bg-gray-50'
                                                            }`}
                                                        >
                                                            <Clock
                                                                className={`h-4 w-4 ${
                                                                    isUrgent
                                                                        ? 'text-red-500'
                                                                        : 'text-gray-500'
                                                                }`}
                                                            />
                                                            <span
                                                                className={
                                                                    isUrgent
                                                                        ? 'text-red-600 font-medium'
                                                                        : ''
                                                                }
                                                            >
                                                                {daysRemaining}{' '}
                                                                days left
                                                            </span>
                                                        </div>
                                                    )}

                                                    {isOverdue && (
                                                        <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
                                                            <Clock className="h-4 w-4 text-red-500" />
                                                            <span className="text-red-600 font-medium">
                                                                {daysRemaining ===
                                                                0
                                                                    ? 'Due today'
                                                                    : `${Math.abs(
                                                                          daysRemaining
                                                                      )} days overdue`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right side - Actions */}
                                            <div className="flex items-center gap-2 ml-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        router.push(
                                                            `/lecturer/classes/${classId}/projects/${project.id}`
                                                        );
                                                    }}
                                                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                                >
                                                    View Details
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="hover:bg-gray-50"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add Project Modal */}
            <AddProjectModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onProjectAdded={handleProjectAdded}
                classId={classId}
            />
        </div>
    );
}
