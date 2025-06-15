import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
    title?: string;
    description?: string;
}

export function LoadingState({
    title = 'Loading...',
    description,
}: LoadingStateProps) {
    return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
                <p className="mt-4 text-lg font-medium text-gray-900">
                    {title}
                </p>
                {description && (
                    <p className="mt-2 text-sm text-gray-600">{description}</p>
                )}
            </div>
        </div>
    );
}

export function LoadingCard() {
    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4" />
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
        </div>
    );
}

export function LoadingCardGrid({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(count)
                .fill(0)
                .map((_, i) => (
                    <LoadingCard key={i} />
                ))}
        </div>
    );
}

export function LoadingStats() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3)
                .fill(0)
                .map((_, i) => (
                    <div
                        key={i}
                        className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 bg-gray-200 rounded-full" />
                            <div>
                                <div className="h-6 w-16 bg-gray-200 rounded mb-2" />
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    );
}
