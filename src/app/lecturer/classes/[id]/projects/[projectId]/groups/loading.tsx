import { LoadingCardGrid } from '@/components/loading-state';

export default function GroupsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Project Groups
                    </h1>
                    <p className="text-gray-600">
                        Manage project groups and members
                    </p>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Groups Grid */}
            <LoadingCardGrid count={6} />
        </div>
    );
}
