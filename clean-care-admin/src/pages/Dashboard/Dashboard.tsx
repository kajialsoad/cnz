import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '../../components/common/Layout/MainLayout';
import StatsCards from './components/StatsCards';
import MiddleDashboardWidgets from './components/MiddleDashboardWidgets';
import BottomDashboardSection from './components/BottomDashboardSection';

const Dashboard: React.FC = () => {
  return (
    <MainLayout title="Dashboard Overview">
      <Box>
        {/* Stats Cards */}
        <StatsCards />

        {/* Middle Dashboard Widgets */}
        <Box sx={{ mt: 4 }}>
          <MiddleDashboardWidgets />
        </Box>

        {/* Bottom Dashboard Section - Charts and Users */}
        <Box sx={{ mt: 4 }}>
          <BottomDashboardSection />
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