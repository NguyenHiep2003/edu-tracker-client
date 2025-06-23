import { User } from 'lucide-react';
export const generateInitials = (name: string): string => {
    if (!name) return '?';
    const firstChars = name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase());
    return firstChars.length < 2
        ? firstChars[0]
        : firstChars[0] + firstChars[firstChars.length - 1];
};

export const getAvatarColor = (name: string): string => {
    const colors = [
        'bg-gradient-to-br from-blue-400 to-blue-600',
        'bg-gradient-to-br from-green-400 to-green-600',
        'bg-gradient-to-br from-purple-400 to-purple-600',
        'bg-gradient-to-br from-yellow-400 to-yellow-600',
        'bg-gradient-to-br from-pink-400 to-pink-600',
        'bg-gradient-to-br from-indigo-400 to-indigo-600',
        'bg-gradient-to-br from-red-400 to-red-600',
        'bg-gradient-to-br from-teal-400 to-teal-600',
    ];
    if (!name) return colors[0];
    const index = name
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
};
export function Avatar({ name, size = 8 }: { name?: string | null; size?: number }) {
    return name ? (
        <div
            className={`w-${size} h-${size} ${getAvatarColor(
                name
            )} rounded-full flex items-center justify-center`}
            title={name}
        >
            <span className="text-white text-xs font-medium">
                {generateInitials(name)}
            </span>
        </div>
    ) : (
        <div
            className={`w-${size} h-${size} bg-gray-200 rounded-full flex items-center justify-center`}
            // title="Unassigned"
        >
            <User className="h-4 w-4 text-gray-400" />
        </div>
    );
}
