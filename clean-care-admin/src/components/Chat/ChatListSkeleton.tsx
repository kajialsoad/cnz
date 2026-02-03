import React from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * ChatListSkeleton Component
 * Loading skeleton for chat list items
 */
const ChatListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
    return (
        <Box sx={{ p: 2 }}>
            {Array.from({ length: count }).map((_, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
                        {/* Avatar skeleton */}
                        <Skeleton variant="circular" width={48} height={48} />

                        {/* Content skeleton */}
                        <Box sx={{ flex: 1 }}>
                            {/* Name and timestamp */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Skeleton variant="text" width="60%" height={20} />
                                <Skeleton variant="text" width="20%" height={16} />
                            </Box>

                            {/* Location */}
                            <Skeleton variant="text" width="40%" height={16} sx={{ mb: 0.5 }} />

                            {/* Last message */}
                            <Skeleton variant="text" width="80%" height={16} />
                        </Box>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default ChatListSkeleton;


