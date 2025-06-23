import { Badge } from '@/components/ui/badge';
import { AlertCircle, PlayCircle, Clock, CheckCircle2 } from 'lucide-react';
import { WorkItemStatus } from '@/services/api/work_items/interface';
export const getStatusIcon = (status: WorkItemStatus) => {
    switch (status) {
        case 'TO DO':
            return <AlertCircle className="h-4 w-4 text-gray-500" />;
        case 'IN PROGRESS':
            return <PlayCircle className="h-4 w-4 text-blue-500" />;
        case 'WAIT FOR REVIEW':
            return <Clock className="h-4 w-4 text-yellow-500" />;
        case 'DONE':
            return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        default:
            return null;
    }
};

export const getStatusBadgeColor = (status: WorkItemStatus) => {
    switch (status) {
        case 'TO DO':
            return 'bg-gray-100 text-gray-800 border-gray-300';
        case 'IN PROGRESS':
            return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'WAIT FOR REVIEW':
            return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'DONE':
            return 'bg-green-100 text-green-800 border-green-300';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

export const getStatusBadge = (status: WorkItemStatus) => {
    return (
        <Badge
            variant="outline"
            className={`${getStatusBadgeColor(status)} border-0 text-xs`}
        >
            <span className="mr-1">{getStatusIcon(status)}</span>
            {status}
        </Badge>
    );
};
