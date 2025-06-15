import { LoadingStats, LoadingCardGrid } from '@/components/loading-state';

export default function TopicsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Project Topics
                    </h1>
                    <p className="text-gray-600">
                        Manage topics for this project
                    </p>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Stats */}
            <LoadingStats />

            {/* Search */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Topics Grid */}
            <LoadingCardGrid count={6} />
        </div>
    );
}
