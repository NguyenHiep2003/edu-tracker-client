'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileCheck, GitCommit, GitPullRequest, Code } from 'lucide-react';
import instance from '@/services/api/common/axios';
import { useParams } from 'next/navigation';

interface GroupWorkOverview {
    group_id: number;
    group_created_at: string;
    group_updated_at: string;
    group_deleted_at: null | string;
    group_number: number;
    group_project_id: number;
    group_topic_id: null | number;
    total_epic_done: string;
    total_task_done: string;
    total_story_done: string;
    total_sub_task_done: string;
    total_commit: string;
    total_of_line_code_add: string;
    total_of_line_code_deleted: string;
    file_work_evidences: string;
}

export default function GroupStatisticsPage() {
    const [overview, setOverview] = useState<GroupWorkOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const params = useParams();

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                setLoading(true);
                const response = await instance.get(
                    `/v1/group/${params.groupId}/work/overview`
                );
                setOverview(response.data);
            } catch (error) {
                console.error('Error fetching group overview:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, [params.groupId]);

    const StatCard = ({
        title,
        value,
        icon: Icon,
        description,
    }: {
        title: string;
        value: string | number;
        icon: any;
        description?: string;
    }) => (
        <Card className="bg-white">
            <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <div className="mt-2 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">
                            {value}
                        </p>
                        {description && (
                            <p className="ml-2 text-xs text-gray-500">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <Icon className="h-5 w-5 text-gray-400" />
                </div>
            </div>
        </Card>
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i} className="bg-white">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[100px]" />
                                        <Skeleton className="h-8 w-[60px]" />
                                    </div>
                                    <Skeleton className="h-5 w-5 rounded" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!overview) {
        return (
            <div className="p-6">
                <p className="text-center text-gray-500">No data available</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">
                    Group {overview.group_number} Statistics
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Overview of work items, commits, and evidence submissions
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Work Items Section */}
                <StatCard
                    title="Epics Completed"
                    value={overview.total_epic_done}
                    icon={GitPullRequest}
                />
                <StatCard
                    title="Stories Completed"
                    value={overview.total_story_done}
                    icon={FileCheck}
                />
                <StatCard
                    title="Tasks Completed"
                    value={overview.total_task_done}
                    icon={FileCheck}
                />
                <StatCard
                    title="Subtasks Completed"
                    value={overview.total_sub_task_done}
                    icon={FileCheck}
                />

                {/* Development Section */}
                <StatCard
                    title="Total Commits"
                    value={overview.total_commit}
                    icon={GitCommit}
                />
                <StatCard
                    title="Lines Added"
                    value={overview.total_of_line_code_add}
                    icon={Code}
                    description="lines of code"
                />
                <StatCard
                    title="Lines Deleted"
                    value={overview.total_of_line_code_deleted}
                    icon={Code}
                    description="lines of code"
                />
                <StatCard
                    title="Work Evidence Files"
                    value={overview.file_work_evidences}
                    icon={FileCheck}
                    description="files submitted"
                />
            </div>
        </div>
    );
}
