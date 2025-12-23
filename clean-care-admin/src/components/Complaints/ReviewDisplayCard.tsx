import React from 'react';
import {
    Card,
    CardContent,
    Box,
    Avatar,
    Typography,
    Rating,
    Skeleton,
    useTheme,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

/**
 * Review data structure
 */
export interface ReviewData {
    id: number;
    rating: number;
    comment?: string | null;
    createdAt: string;
    user?: {
        id?: number;
        firstName: string;
        lastName: string;
        avatar?: string | null;
    };
}

/**
 * Props for ReviewDisplayCard component
 */
interface ReviewDisplayCardProps {
    review: ReviewData;
}

/**
 * Props for ReviewDisplayCardSkeleton component
 */
interface ReviewDisplayCardSkeletonProps {
    count?: number;
}

/**
 * ReviewDisplayCard Component
 * 
 * Displays a single user review with avatar, name, rating, comment, and timestamp.
 * Designed to be responsive and work on all screen sizes.
 * 
 * @example
 * ```tsx
 * <ReviewDisplayCard
 *   review={{
 *     id: 1,
 *     rating: 4,
 *     comment: "Great service, resolved quickly!",
 *     createdAt: "2024-12-20T10:30:00Z",
 *     user: {
 *       firstName: "John",
 *       lastName: "Doe",
 *       avatar: "https://example.com/avatar.jpg"
 *     }
 *   }}
 * />
 * ```
 */
const ReviewDisplayCard: React.FC<ReviewDisplayCardProps> = ({ review }) => {
    const theme = useTheme();

    // Format user name with fallback
    const userName = review.user
        ? `${review.user.firstName} ${review.user.lastName}`
        : 'Anonymous User';

    // Get initials for avatar fallback
    const getInitials = (firstName?: string, lastName?: string): string => {
        if (!firstName || !lastName) return 'AU';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    // Format timestamp
    const formatTimestamp = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (error) {
            return 'Recently';
        }
    };

    return (
        <Card
            sx={{
                mb: 2,
                boxShadow: theme.shadows[1],
                transition: 'box-shadow 0.3s ease',
                '&:hover': {
                    boxShadow: theme.shadows[3],
                },
                borderRadius: 2,
            }}
        >
            <CardContent>
                {/* User Info Row */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                    }}
                >
                    {/* Avatar */}
                    <Avatar
                        src={review.user?.avatar || undefined}
                        alt={userName}
                        sx={{
                            width: 48,
                            height: 48,
                            bgcolor: theme.palette.primary.main,
                            fontSize: '1rem',
                            fontWeight: 600,
                        }}
                    >
                        {getInitials(review.user?.firstName, review.user?.lastName)}
                    </Avatar>

                    {/* User Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* User Name */}
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                                mb: 0.5,
                            }}
                        >
                            {userName}
                        </Typography>

                        {/* Star Rating */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                            }}
                        >
                            <Rating
                                value={review.rating}
                                readOnly
                                precision={1}
                                size="small"
                                sx={{
                                    color: theme.palette.warning.main,
                                }}
                            />
                            <Typography
                                variant="body2"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    fontWeight: 500,
                                }}
                            >
                                ({review.rating} {review.rating === 1 ? 'star' : 'stars'})
                            </Typography>
                        </Box>

                        {/* Comment */}
                        {review.comment && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    mb: 1,
                                    lineHeight: 1.6,
                                    fontStyle: 'italic',
                                    wordBreak: 'break-word',
                                }}
                            >
                                "{review.comment}"
                            </Typography>
                        )}

                        {/* Timestamp */}
                        <Typography
                            variant="caption"
                            sx={{
                                color: theme.palette.text.disabled,
                                display: 'block',
                            }}
                        >
                            {formatTimestamp(review.createdAt)}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

/**
 * ReviewDisplayCardSkeleton Component
 * 
 * Loading skeleton for ReviewDisplayCard.
 * Shows placeholder content while reviews are being loaded.
 * 
 * @example
 * ```tsx
 * <ReviewDisplayCardSkeleton count={3} />
 * ```
 */
export const ReviewDisplayCardSkeleton: React.FC<ReviewDisplayCardSkeletonProps> = ({ count = 1 }) => {
    const theme = useTheme();

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <Card
                    key={index}
                    sx={{
                        mb: 2,
                        boxShadow: theme.shadows[1],
                        borderRadius: 2,
                    }}
                >
                    <CardContent>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2,
                            }}
                        >
                            {/* Avatar Skeleton */}
                            <Skeleton
                                variant="circular"
                                width={48}
                                height={48}
                            />

                            {/* Content Skeleton */}
                            <Box sx={{ flex: 1 }}>
                                {/* Name Skeleton */}
                                <Skeleton
                                    variant="text"
                                    width="40%"
                                    height={24}
                                    sx={{ mb: 0.5 }}
                                />

                                {/* Rating Skeleton */}
                                <Skeleton
                                    variant="text"
                                    width="30%"
                                    height={20}
                                    sx={{ mb: 1 }}
                                />

                                {/* Comment Skeleton */}
                                <Skeleton
                                    variant="text"
                                    width="100%"
                                    height={20}
                                    sx={{ mb: 0.5 }}
                                />
                                <Skeleton
                                    variant="text"
                                    width="80%"
                                    height={20}
                                    sx={{ mb: 1 }}
                                />

                                {/* Timestamp Skeleton */}
                                <Skeleton
                                    variant="text"
                                    width="25%"
                                    height={16}
                                />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </>
    );
};

export default ReviewDisplayCard;
