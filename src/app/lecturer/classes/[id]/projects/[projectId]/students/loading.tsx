export default function StudentsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Project Students
                    </h1>
                    <p className="text-gray-600">
                        Manage student assignments and groups
                    </p>
                </div>
                <div className="flex space-x-3">
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Students Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="min-w-full divide-y divide-gray-200">
                    {/* Table Header */}
                    <div className="bg-gray-50 px-6 py-3">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="bg-white divide-y divide-gray-200">
                        {Array(5)
                            .fill(0)
                            .map((_, i) => (
                                <div key={i} className="px-6 py-4">
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
