import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import StatCard from './StatCard';
import { dashboardService } from '../../../../services/dashboardService';
import type { DashboardStats } from '../../../../services/dashboardService';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
  cityCorporationCode?: string;
  zoneId?: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading, cityCorporationCode, zoneId }) => {
  const navigate = useNavigate();


  const navigateToComplaints = (status?: string) => {
    const params = new URLSearchParams();

    if (cityCorporationCode && cityCorporationCode !== 'ALL') {
      params.append('cityCorporation', cityCorporationCode);
    }

    if (zoneId) {
      params.append('zone', zoneId.toString());
    }

    if (status) {
      params.append('status', status);
    }

    const queryString = params.toString();
    navigate(`/complaints${queryString ? `?${queryString}` : ''}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  const { complaints, messages, users } = stats;
  const totalComplaints = complaints.total;
  const resolved = complaints.resolved;
  const inProgress = complaints.inProgress;
  const pending = complaints.pending;
  const successRate = complaints.successRate;
  const avgResolutionTime = complaints.averageResolutionTime;

  const statsData = [
    {
      title: 'মোট নিবন্ধিত',
      value: totalComplaints.toString(),
      subtitle: `আজকে: +${complaints.todayCount}`,
      trend: {
        value: complaints.todayCount,
        isPositive: true,
        label: 'আজকে',
      },
      color: 'info' as const,
      icon: <AssignmentIcon />,
      onClick: () => navigateToComplaints(),
    },
    {
      title: 'সমাধানকৃত',
      value: resolved.toString(),
      subtitle: `আজকে: +${Math.floor(resolved * 0.1)}`,
      trend: {
        value: Math.floor(successRate),
        isPositive: true,
        label: 'সফলতার হার',
      },
      color: 'success' as const,
      icon: <CheckCircleIcon />,
      onClick: () => navigateToComplaints('RESOLVED'),
    },
    {
      title: 'পেন্ডিং',
      value: pending.toString(),
      subtitle: `আজকে: +${Math.floor(pending * 0.05)}`,
      trend: {
        value: Math.floor(pending * 0.05),
        isPositive: false,
        label: 'বৃদ্ধি',
      },
      color: 'warning' as const,
      icon: <ScheduleIcon />,
      onClick: () => navigateToComplaints('PENDING'),
    },
    {
      title: 'অস্বীকৃত',
      value: complaints.rejected.toString(),
      subtitle: `আজকে: +${Math.floor(complaints.rejected * 0.02)}`,
      trend: {
        value: Math.floor(complaints.rejected * 0.02),
        isPositive: false,
        label: 'বৃদ্ধি',
      },
      color: 'error' as const,
      icon: <SpeedIcon />,
      onClick: () => navigateToComplaints('REJECTED'),
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

