import React from 'react';
import { Box } from '@mui/material';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import MainLayout from '../../components/common/Layout/MainLayout';
import StatsCards from './components/StatsCards';
import MiddleDashboardWidgets from './components/MiddleDashboardWidgets';
import BottomDashboardSection from './components/BottomDashboardSection';

const Dashboard: React.FC = () => {
  return (
    <MainLayout title="Dashboard Overview">
      <Box>
        {/* Stats Cards */}
        <ErrorBoundary>
          <StatsCards />
        </ErrorBoundary>

        {/* Middle Dashboard Widgets */}
        <Box sx={{ mt: 4 }}>
          <ErrorBoundary>
            <MiddleDashboardWidgets />
          </ErrorBoundary>
        </Box>

        {/* Bottom Dashboard Section - Charts and Users */}
        <Box sx={{ mt: 4 }}>
          <ErrorBoundary>
            <BottomDashboardSection />
          </ErrorBoundary>
        </Box>

        {/* Operational Monitoring - Coming Soon */}
        <Box sx={{ mt: 4 }}>
          {/* Operational monitoring components will go here */}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default Dashboard;