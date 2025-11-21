import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import StatCard from './StatCard';
import { analyticsService } from '../../../../services/analyticsService';

interface StatsCardsProps {
  cityCorporationCode?: string;
}

const StatsCards: React.FC<StatsCardsProps> = ({ cityCorporationCode }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getAnalytics({
          cityCorporationCode
        });
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [cityCorporationCode]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) {
    return null;
  }

  const totalComplaints = analytics.totalComplaints || 0;
  const resolved = analytics.statusBreakdown?.resolved || 0;
  const inProgress = analytics.statusBreakdown?.inProgress || 0;
  const resolutionRate = analytics.resolutionRate || 0;
  const avgResolutionTime = analytics.averageResolutionTime || 0;

  const statsData = [
    {
      title: 'Total Complaints',
      value: totalComplaints.toString(),
      subtitle: cityCorporationCode ? 'For selected city corporation' : 'All time complaints',
      trend: {
        value: 0,
        isPositive: true,
        label: 'total',
      },
      color: 'info' as const,
      icon: <AssignmentIcon />,
    },
    {
      title: 'Resolved',
      value: resolved.toString(),
      subtitle: `${resolutionRate.toFixed(1)}% Success Rate`,
      trend: {
        value: resolutionRate,
        isPositive: true,
        label: 'resolution rate',
      },
      color: 'success' as const,
      icon: <CheckCircleIcon />,
    },
    {
      title: 'In Progress',
      value: inProgress.toString(),
      subtitle: `${totalComplaints > 0 ? ((inProgress / totalComplaints) * 100).toFixed(1) : 0}% Currently Active`,
      trend: {
        value: 0,
        isPositive: false,
        label: 'active',
      },
      color: 'warning' as const,
      icon: <ScheduleIcon />,
    },
    {
      title: 'Avg Response',
      value: avgResolutionTime.toFixed(0),
      subtitle: 'Hours to resolve',
      trend: {
        value: 0,
        isPositive: true,
        label: 'response time',
      },
      color: 'secondary' as const,
      icon: <SpeedIcon />,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
        gap: 3,
      }}
    >
      {statsData.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </Box>
  );
};

export default StatsCards;