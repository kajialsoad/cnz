import React from 'react';
import { Box } from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import StatCard from './StatCard';

const StatsCards: React.FC = () => {
  const statsData = [
    {
      title: 'Total Complaints',
      value: '1028',
      subtitle: 'All time complaints',
      trend: {
        value: 8,
        isPositive: true,
        label: 'vs last month',
      },
      color: 'info' as const,
      icon: <AssignmentIcon />,
    },
    {
      title: 'Resolved',
      value: '342',
      subtitle: '66.5% Success Rate',
      trend: {
        value: 12,
        isPositive: true,
        label: 'vs last month',
      },
      color: 'success' as const,
      icon: <CheckCircleIcon />,
    },
    {
      title: 'In Progress',
      value: '127',
      subtitle: '24.7% Currently Active',
      trend: {
        value: 5,
        isPositive: false,
        label: 'vs last week',
      },
      color: 'warning' as const,
      icon: <ScheduleIcon />,
    },
    {
      title: 'Avg Response',
      value: '45',
      subtitle: '8.6% Improvement',
      trend: {
        value: 3,
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