
export default function ProjectDetailsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex space-x-3">
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>

            {/* Project Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array(3)
                    .fill(0)
                    .map((_, i) => (
                        <div
                            key={i}
                            className="bg-white p-6 rounded-lg border border-gray-200"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                                <div>
                                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
