import { format, differenceInDays } from 'date-fns';

export const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'MMM d, yyyy');
};

export const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    return differenceInDays(end, now);
};

export const getDateStatus = (endDate: string) => {
    const daysRemaining = getDaysRemaining(endDate);
    return {
        daysRemaining,
        isOverdue: daysRemaining <= 0,
        isUrgent: daysRemaining > 0 && daysRemaining <= 7,
    };
};
