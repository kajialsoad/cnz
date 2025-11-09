import React from 'react';
import { Box } from '@mui/material';
import { 
  WardZonePerformance, 
  WeeklyTrendAnalysis, 
  TotalUsersWidget 
} from '../QuickActions';
import { OperationalMonitoring } from '../OperationalMonitoring';

const BottomDashboardSection: React.FC = () => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Top Row: Ward Performance + Total Users */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '2fr 1fr',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <WardZonePerformance />
        <TotalUsersWidget />
      </Box>

      {/* Middle Row: Weekly Trend Analysis (Full Width) */}
      <Box sx={{ mb: 3 }}>
        <WeeklyTrendAnalysis />
      </Box>

      {/* Bottom Row: Operational Monitoring */}
      <OperationalMonitoring />
    </Box>
  );
};

export default BottomDashboardSection;