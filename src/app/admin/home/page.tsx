'use client';

import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useOrganization } from '@/context/organization-context';
import {
    getOrganizationOverview,
    getOrganizationOverviewThroughSemester,
} from '@/services/api/organization';
import { toast } from 'react-toastify';
import {
    Users,
    BookOpen,
    BarChart2,
    Calendar,
    AlertCircle,
} from 'lucide-react';

interface OverviewData {
    id: number;
    semesters: { name: string; status: string }[];
    activeUsersCount: number;
    accountSupplied: number;
    numOfClassrooms: number;
}

interface SemesterStat {
    organization_id: number;
    semester_id: number;
    semester_name: string;
    num_of_classroom: string;
    num_of_project: string;
}

export default function AdminHomePage() {
    const { organization } = useOrganization();
    const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
    const [semesterStats, setSemesterStats] = useState<SemesterStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!organization?.id) {
            return;
        }

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [overviewRes, semesterStatsRes] = await Promise.all([
                    getOrganizationOverview(organization.id),
                    getOrganizationOverviewThroughSemester(organization.id),
                ]);
                setOverviewData(overviewRes);
                setSemesterStats(semesterStatsRes);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                toast.error('Failed to load dashboard data.');
                setError(
                    'Could not load dashboard data. Please try again later.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [organization]);

    const userProgress =
        overviewData && overviewData.accountSupplied > 0
            ? (overviewData.activeUsersCount / overviewData.accountSupplied) *
              100
            : 0;

    const chartData = semesterStats.map((stat) => ({
        name: stat.semester_name,
        Classrooms: parseInt(stat.num_of_classroom, 10),
        Projects: parseInt(stat.num_of_project, 10),
    }));

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-[126px]" />
                    <Skeleton className="h-[126px]" />
                    <Skeleton className="h-[126px]" />
                </div>
                <Skeleton className="h-[400px]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-8">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-xl font-semibold text-red-600">
                    An Error Occurred
                </h2>
                <p className="text-gray-600 mt-2">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">
                Admin Dashboard
            </h1>

            {/* Overview Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Semester
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {overviewData?.semesters?.[0]?.name || 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Currently active semester
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            User Statistics
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {overviewData?.activeUsersCount} /{' '}
                            {overviewData?.accountSupplied}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                            Active users vs Accounts supplied
                        </p>
                        <Progress value={userProgress} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Classrooms
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {overviewData?.numOfClassrooms}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across all active semesters
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Semester Statistics Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart2 className="h-5 w-5" />
                        Semester Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Classrooms" fill="#8884d8" />
                                <Bar dataKey="Projects" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
