'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FileCheck,
    GitCommit,
    Code,
    Star,
    FileText,
    Users,
    Pencil,
    Eye,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import instance from '@/services/api/common/axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts';
import React from 'react';
import { Button } from '@headlessui/react';
import { useProjectContext } from '@/context/project-context';
import { GradeModal } from '@/components/grade-modal';
import { StudentWorkItemsModal } from '@/components/student-work-items-modal';

interface GroupWorkOverview {
    group_id: number;
    total_epic_done: string;
    total_task_done: string;
    total_story_done: string;
    total_sub_task_done: string;
    total_commit: string;
    total_of_line_code_add: string;
    total_of_line_code_deleted: string;
    file_work_evidences: string;
}

interface WorkDistribution {
    group_id: number;
    student_id: number | null;
    student_name: string | null;
    student_email: string | null;
    student_externalid: string | null;
    group_role: string | null;
    total_work_done: string;
    student_project_id: number | null;
    story_points_received: string | null;
    average_rating: string | null;
    total_commit: string;
    total_of_line_code_add: string | null;
    total_of_line_code_deleted: string | null;
    file_work_evidences: string;
}

interface WeeklySummary {
    group_id: number;
    student_id: number;
    student_name: string;
    student_email: string;
    student_externalid: string | null;
    total_work_done: string;
    story_points_received: string | null;
    average_rating: string | null;
    week: string;
}
interface DevelopmentWeeklySummary {
    group_id: number;
    student_id: number;
    student_name: string | null;
    student_email: string;
    student_externalid: string | null;
    total_commit: string;
    total_of_line_code_add: string | null;
    total_of_line_code_deleted: string | null;
    week: string;
}

interface WeeklyData {
    [timestamp: string]: WeeklySummary[];
}

interface DevelopmentWeeklyData {
    [timestamp: string]: DevelopmentWeeklySummary[];
}
export default function GroupStatisticsPage() {
    const { projectData } = useProjectContext();
    const [overview, setOverview] = useState<GroupWorkOverview | null>(null);
    const [distribution, setDistribution] = useState<WorkDistribution[]>([]);
    const [weeklyData, setWeeklyData] = useState<WeeklyData>({});
    const [devWeeklyData, setDevWeeklyData] = useState<DevelopmentWeeklyData>(
        {}
    );
    const [loading, setLoading] = useState(true);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isWorkItemsModalOpen, setIsWorkItemsModalOpen] = useState(false);
    const params = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                await Promise.all([
                    instance
                        .get(`/v1/group/${params.groupId}/work/overview`)
                        .then((res) => setOverview(res.data)),
                    instance
                        .get(`/v1/group/${params.groupId}/work/distribution`)
                        .then((res) => setDistribution(res.data)),
                    instance
                        .get(`/v1/group/${params.groupId}/work/weekly-summary`)
                        .then((res) => setWeeklyData(res.data)),
                    instance
                        .get(
                            `/v1/group/${params.groupId}/work/development-weekly-summary`
                        )
                        .then((res) => setDevWeeklyData(res.data)),
                ]);
            } catch (error) {
                console.error('Error fetching group data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.groupId]);

    const handleGradeClick = async () => {
        try {
            const response = await instance.get(
                `/v1/group/${params.groupId}/member-grade/${projectData?.grade?.id}`
            );
            setStudents(response.data);
            setIsGradeModalOpen(true);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleViewWorkItems = (member: any) => {
        setSelectedStudent(member);
        setIsWorkItemsModalOpen(true);
    };

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
        <Card className="bg-white hover:bg-gray-50 transition-colors">
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                </div>
                <div className="flex items-baseline gap-1">
                    <p className="text-xl font-semibold text-gray-900">
                        {value}
                    </p>
                    {description && (
                        <p className="text-xs text-gray-500">{description}</p>
                    )}
                </div>
            </div>
        </Card>
    );

    const prepareChartData = () => {
        return distribution
            .filter((d) => d.student_email !== null)
            .map((d) => ({
                name: d.student_name || d.student_email,
                commits: parseInt(d.total_commit || '0'),
                workItems: parseInt(d.total_work_done || '0'),
                evidences: parseInt(d.file_work_evidences || '0'),
                fullName: d.student_name || d.student_email || 'Unknown',
            }))
            .sort((a, b) => b.workItems - a.workItems);
    };

    const prepareWeeklyChartData = () => {
        // Get all unique members across all weeks
        const allMembers = new Set<string>();
        Object.values(weeklyData).forEach((weekData) => {
            weekData.forEach((member) => {
                allMembers.add(member.student_name);
            });
        });

        return Object.entries(weeklyData)
            .sort(([weekA], [weekB]) => parseInt(weekA) - parseInt(weekB))
            .map(([timestamp, data]) => {
                const week = new Date(parseInt(timestamp)).toLocaleDateString(
                    'en-US',
                    {
                        month: 'short',
                        day: 'numeric',
                    }
                );

                // Initialize all members with 0 for this week
                const memberWork = Object.fromEntries(
                    Array.from(allMembers).map((name) => [name, 0])
                );

                // Update with actual values
                data.forEach((member) => {
                    memberWork[member.student_name || member.student_email] =
                        parseInt(member.total_work_done || '0');
                });

                return {
                    week,
                    ...memberWork,
                };
            });
    };

    const prepareDevWeeklyChartData = () => {
        // Get all unique members across all weeks
        const allMembers = new Set<string>();
        Object.values(devWeeklyData).forEach((weekData) => {
            weekData.forEach((member) => {
                const memberName = member.student_name || member.student_email;
                if (memberName) {
                    allMembers.add(memberName);
                }
            });
        });

        return Object.entries(devWeeklyData)
            .sort(([weekA], [weekB]) => parseInt(weekA) - parseInt(weekB))
            .map(([timestamp, data]) => {
                const week = new Date(parseInt(timestamp)).toLocaleDateString(
                    'en-US',
                    {
                        month: 'short',
                        day: 'numeric',
                    }
                );

                const result: any = { week };

                // Add data for each member
                data.forEach((member) => {
                    const memberName =
                        member.student_name || member.student_email;
                    if (memberName) {
                        result[`${memberName} (Commits)`] = parseInt(
                            member.total_commit || '0'
                        );
                        result[`${memberName} (Code Changes)`] =
                            parseInt(member.total_of_line_code_add || '0') +
                            parseInt(member.total_of_line_code_deleted || '0');
                    }
                });

                // Ensure all members have values (even if 0)
                allMembers.forEach((memberName) => {
                    if (!result[`${memberName} (Commits)`]) {
                        result[`${memberName} (Commits)`] = 0;
                    }
                    if (!result[`${memberName} (Code Changes)`]) {
                        result[`${memberName} (Code Changes)`] = 0;
                    }
                });

                return result;
            });
    };

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

    return (
        <TooltipProvider>
            <div className="space-y-8 px-6 py-6 relative min-h-screen pb-20">
                {/* Overview Section */}
                <div className="space-y-6">
                    {/* Work Items Overview */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-blue-600" />
                            Work Items Overview
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            <StatCard
                                title="Epics"
                                value={overview?.total_epic_done || '0'}
                                icon={FileCheck}
                            />
                            <StatCard
                                title="Stories"
                                value={overview?.total_story_done || '0'}
                                icon={FileCheck}
                            />
                            <StatCard
                                title="Tasks"
                                value={overview?.total_task_done || '0'}
                                icon={FileCheck}
                            />
                            <StatCard
                                title="Subtasks"
                                value={overview?.total_sub_task_done || '0'}
                                icon={FileCheck}
                            />
                            <StatCard
                                title="Total Items"
                                value={
                                    parseInt(overview?.total_epic_done || '0') +
                                    parseInt(
                                        overview?.total_story_done || '0'
                                    ) +
                                    parseInt(overview?.total_task_done || '0') +
                                    parseInt(
                                        overview?.total_sub_task_done || '0'
                                    )
                                }
                                icon={FileCheck}
                            />
                            <StatCard
                                title="Evidence Files"
                                value={overview?.file_work_evidences || '0'}
                                icon={FileText}
                            />
                        </div>
                    </div>

                    {/* Development Overview */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Code className="h-5 w-5 text-blue-600" />
                            Development Overview
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Total Commits"
                                value={overview?.total_commit || '0'}
                                icon={GitCommit}
                            />
                            <StatCard
                                title="Lines Added"
                                value={overview?.total_of_line_code_add || '0'}
                                icon={Code}
                                description="lines"
                            />
                            <StatCard
                                title="Lines Deleted"
                                value={
                                    overview?.total_of_line_code_deleted || '0'
                                }
                                icon={Code}
                                description="lines"
                            />
                            <StatCard
                                title="Total Changes"
                                value={
                                    parseInt(
                                        overview?.total_of_line_code_add || '0'
                                    ) +
                                    parseInt(
                                        overview?.total_of_line_code_deleted ||
                                            '0'
                                    )
                                }
                                icon={Code}
                                description="lines"
                            />
                        </div>
                    </div>
                </div>

                {/* Work Distribution Section */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Work Distribution
                    </h2>

                    <div className="space-y-8">
                        {/* Bar Chart */}
                        <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={prepareChartData()}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 40,
                                        bottom: 60,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        angle={0}
                                        interval={0}
                                        tick={{
                                            fontSize: 12,
                                            fill: '#374151',
                                        }}
                                    />
                                    <YAxis
                                        tick={{
                                            fontSize: 12,
                                            fill: '#374151',
                                        }}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            padding: '8px',
                                        }}
                                        formatter={(
                                            value: number,
                                            name: string
                                        ) => {
                                            if (name === 'fullName')
                                                return null;
                                            return [value, name];
                                        }}
                                        labelFormatter={(
                                            label: string,
                                            payload: any[]
                                        ) => {
                                            if (payload && payload[0]) {
                                                return payload[0].payload
                                                    .fullName;
                                            }
                                            return label;
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{
                                            paddingTop: '20px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="workItems"
                                        name="Work Items"
                                        fill="#0088FE"
                                    />
                                    <Bar
                                        dataKey="commits"
                                        name="Commits"
                                        fill="#00C49F"
                                    />
                                    <Bar
                                        dataKey="evidences"
                                        name="Evidence Files"
                                        fill="#FFBB28"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Detailed Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Member
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Work Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Story Points
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lines Code Added
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lines Code Deleted
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Average Rating
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {distribution
                                        .filter((d) => d.student_email !== null)
                                        .map((member) => (
                                            <tr
                                                key={member.student_id}
                                                className={
                                                    parseInt(
                                                        member.total_work_done ||
                                                            '0'
                                                    ) === 0
                                                        ? 'bg-gray-50'
                                                        : ''
                                                }
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div
                                                                className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                                                                    parseInt(
                                                                        member.total_work_done ||
                                                                            '0'
                                                                    ) === 0
                                                                        ? 'bg-gray-400'
                                                                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                                }`}
                                                            >
                                                                {(
                                                                    member.student_name ||
                                                                    member.student_email ||
                                                                    'U'
                                                                )
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {member.student_name ||
                                                                    member.student_email ||
                                                                    'Unknown'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {member.student_externalid ||
                                                                    'No ID'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            member.group_role ===
                                                            'LEADER'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {member.group_role ||
                                                            'MEMBER'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {member.total_work_done ||
                                                        '0'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {member.story_points_received ||
                                                        '0'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {member.total_of_line_code_add ||
                                                        '0'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {member.total_of_line_code_deleted ||
                                                        '0'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Star
                                                            className={`h-4 w-4 mr-1 ${
                                                                member.average_rating
                                                                    ? 'text-yellow-400'
                                                                    : 'text-gray-300'
                                                            }`}
                                                        />
                                                        <span className="text-sm text-gray-900">
                                                            {member.average_rating
                                                                ? parseFloat(
                                                                      member.average_rating
                                                                  ).toFixed(1)
                                                                : 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    onClick={() =>
                                                                        handleViewWorkItems(
                                                                            member
                                                                        )
                                                                    }
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Eye className="h-4 w-4 text-gray-600" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>
                                                                    View all
                                                                    works
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>

                {/* Weekly Progress Section */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <FileCheck className="h-5 w-5" />
                        Weekly Progress
                    </h2>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={prepareWeeklyChartData()}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 40,
                                    bottom: 60,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="week"
                                    tick={{
                                        fontSize: 12,
                                        fill: '#374151',
                                    }}
                                />
                                <YAxis
                                    tick={{
                                        fontSize: 12,
                                        fill: '#374151',
                                    }}
                                    label={{
                                        value: 'Work Items Completed',
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: { textAnchor: 'middle' },
                                    }}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        padding: '8px',
                                    }}
                                />
                                <Legend />
                                {Array.from(
                                    new Set(
                                        Object.values(weeklyData)
                                            .flat()
                                            .map(
                                                (member) => member.student_name
                                            )
                                    )
                                ).map((memberName, index) => (
                                    <Bar
                                        key={memberName}
                                        dataKey={memberName}
                                        stackId="a"
                                        fill={`hsl(${
                                            (index * 137.508) % 360
                                        }, 70%, 50%)`}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Weekly Development Progress Section */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <GitCommit className="h-5 w-5" />
                        Weekly Development Progress
                    </h2>

                    {/* Commits Chart */}
                    <div className="mb-8">
                        <h3 className="text-lg font-medium mb-4">
                            Commits per Member
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={prepareDevWeeklyChartData()}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 40,
                                        bottom: 20,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="week"
                                        tick={{
                                            fontSize: 12,
                                            fill: '#374151',
                                        }}
                                    />
                                    <YAxis
                                        tick={{
                                            fontSize: 12,
                                            fill: '#374151',
                                        }}
                                        allowDecimals={false}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            padding: '8px',
                                        }}
                                    />
                                    <Legend />
                                    {Array.from(
                                        new Set(
                                            Object.values(devWeeklyData)
                                                .flat()
                                                .map(
                                                    (member) =>
                                                        member.student_name ||
                                                        member.student_email
                                                )
                                                .filter(
                                                    (name): name is string =>
                                                        Boolean(name)
                                                )
                                        )
                                    ).map((memberName, index) => (
                                        <Line
                                            key={`${memberName}-commits`}
                                            type="monotone"
                                            dataKey={`${memberName} (Commits)`}
                                            name={`${memberName}`}
                                            stroke={`hsl(${
                                                (index * 137.508) % 360
                                            }, 70%, 50%)`}
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Code Changes Chart */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">
                            Code Changes per Member (Lines Added + Deleted)
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={prepareDevWeeklyChartData()}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 40,
                                        bottom: 20,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="week"
                                        tick={{
                                            fontSize: 12,
                                            fill: '#374151',
                                        }}
                                    />
                                    <YAxis
                                        tick={{
                                            fontSize: 12,
                                            fill: '#374151',
                                        }}
                                        allowDecimals={false}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            padding: '8px',
                                        }}
                                    />
                                    <Legend />
                                    {Array.from(
                                        new Set(
                                            Object.values(devWeeklyData)
                                                .flat()
                                                .map(
                                                    (member) =>
                                                        member.student_name ||
                                                        member.student_email
                                                )
                                                .filter(
                                                    (name): name is string =>
                                                        Boolean(name)
                                                )
                                        )
                                    ).map((memberName, index) => (
                                        <Line
                                            key={`${memberName}-changes`}
                                            type="monotone"
                                            dataKey={`${memberName} (Code Changes)`}
                                            name={`${memberName}`}
                                            stroke={`hsl(${
                                                (index * 137.508) % 360
                                            }, 70%, 50%)`}
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>

                {/* Floating Action Button for Grading */}
                {projectData?.grade?.id && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white z-50"
                                onClick={handleGradeClick}
                            >
                                <Pencil className="h-8 w-8" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Grade Students</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Grade Modal */}
                <GradeModal
                    isOpen={isGradeModalOpen}
                    onClose={() => setIsGradeModalOpen(false)}
                    students={students}
                    grade={projectData?.grade}
                />

                {/* Student Work Items Modal */}
                {selectedStudent && (
                    <StudentWorkItemsModal
                        isOpen={isWorkItemsModalOpen}
                        onClose={() => {
                            setIsWorkItemsModalOpen(false);
                            setSelectedStudent(null);
                        }}
                        student={selectedStudent}
                        groupId={Number(params.groupId)}
                    />
                )}
            </div>
        </TooltipProvider>
    );
}
