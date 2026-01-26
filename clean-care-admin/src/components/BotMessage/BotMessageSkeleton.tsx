import React from 'react';
import {
    Card,
    CardContent,
    Box,
    Skeleton,
    Stack,
} from '@mui/material';

/**
 * Bot Message Skeleton Component
 * Loading placeholder for bot message items
 */
const BotMessageSkeleton: React.FC = () => {
    return (
        <Card
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                mb: 2,
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Drag Handle Skeleton */}
                    <Skeleton variant="rectangular" width={24} height={24} />

                    {/* Content Skeleton */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Header Skeleton */}
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Skeleton variant="rounded" width={60} height={24} />
                            <Skeleton variant="rounded" width={60} height={24} />
                            <Skeleton variant="text" width={120} height={24} />
                        </Stack>

                        {/* English Content Skeleton */}
                        <Box sx={{ mb: 1 }}>
                            <Skeleton variant="text" width={80} height={16} />
                            <Skeleton variant="text" width="100%" height={20} />
                            <Skeleton variant="text" width="80%" height={20} />
                        </Box>

                        {/* Bangla Content Skeleton */}
                        <Box>
                            <Skeleton variant="text" width={80} height={16} />
                            <Skeleton variant="text" width="100%" height={20} />
                            <Skeleton variant="text" width="70%" height={20} />
                        </Box>
                    </Box>

                    {/* Actions Skeleton */}
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="rectangular" width={40} height={24} />
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="circular" width={32} height={32} />
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );
};

/**
 * Bot Messages List Skeleton
 * Shows multiple skeleton items
 */
export const BotMessagesListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
    return (
        <Box>
            {Array.from({ length: count }).map((_, index) => (
                <BotMessageSkeleton key={index} />
            ))}
        </Box>
    );
};

export default BotMessageSkeleton;
