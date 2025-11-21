import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { CircularProgress } from '@mui/material';
import { analyticsService } from '../../../../services/analyticsService';

interface AverageServiceTimeProps {
  cityCorporationCode?: string;
}

const AverageServiceTime: React.FC<AverageServiceTimeProps> = ({ cityCorporationCode }) => {
  const [loading, setLoading] = useState(true);
  const [averageHours, setAverageHours] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analytics = await analyticsService.getAnalytics({
          cityCorporationCode
        });
        setAverageHours(analytics.averageResolutionTime || 0);
      } catch (error) {
        console.error('Error fetching average service time:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cityCorporationCode]);

  const averageDays = (averageHours / 24).toFixed(1);
  const targetDays = 5;
  const progressPercentage = Math.min((parseFloat(averageDays) / targetDays) * 100, 100);

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: '#6366F1',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: 'white', fontSize: '12px' }}>🕐</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
            Average Service Time
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={120}
            thickness={8}
            sx={{
              color: '#E5E7EB',
              position: 'absolute',
            }}
          />
          <CircularProgress
            variant="determinate"
            value={progressPercentage}
            size={120}
            thickness={8}
            sx={{
              color: '#6366F1',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#374151' }}>
              {averageDays}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
              days
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2, px: 2 }}>
          <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem', mb: 1, display: 'block' }}>
            Target: &lt; {targetDays}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#6366F1',
                borderRadius: 4,
              },
            }}
          />
        </Box>

        <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
          Performance metric
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AverageServiceTime;