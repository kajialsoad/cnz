import { formatDistanceToNow } from 'date-fns';

/**
 * Format a date string to a relative time string (e.g., "2 hours ago")
 */
export const formatTimeAgo = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown';
    }
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown';
    }
};
