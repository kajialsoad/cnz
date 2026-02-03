import React from 'react';
import { Box, Card, CardContent, Skeleton } from '@mui/material';
import { pulse } from '../../styles/animations';

const ComplaintCardSkeleton: React.FC = () => {
    return (
        <Card
            sx={{
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                width: '100%',
                animation: `${pulse} 1.5s ease-in-out infinite`,
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                    width: '100%',
                }}>
                    {/* Left Section - Complaint Info */}
                    <Box sx={{ flex: 1, mr: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Skeleton variant="text" width={100} height={32} />
                            <Skeleton variant="text" width={150} height={28} />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Skeleton variant="text" width={200} height={24} />
                            <Skeleton variant="text" width={100} height={24} />
                        </Box>

                        {/* Citizen Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Skeleton variant="text" width={120} height={24} />
                            <Skeleton variant="text" width={80} height={20} />
                        </Box>
                    </Box>

                    {/* Right Section - Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Skeleton variant="rounded" width={100} height={32} />
                    </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2, width: '100%' }}>
                    <Skeleton variant="rounded" width={140} height={36} />
                    <Skeleton variant="rounded" width={100} height={36} />
                    <Skeleton variant="rounded" width={130} height={36} />
                </Box>
            </CardContent>
        </Card>
    );
};

export default ComplaintCardSkeleton;


