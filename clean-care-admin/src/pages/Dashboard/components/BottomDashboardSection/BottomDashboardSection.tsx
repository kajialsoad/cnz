import React from 'react';
import { Box } from '@mui/material';
// import {
//   WardZonePerformance,
//   WeeklyTrendAnalysis,
//   TotalUsersWidget
// } from '../QuickActions';
import { TotalUsersWidget } from '../QuickActions';
// import { OperationalMonitoring } from '../OperationalMonitoring';

import { UserStats } from '../../../../services/dashboardService';

interface BottomDashboardSectionProps {
  userStats: UserStats | null;
  loading: boolean;
  cityCorporationCode?: string;
  zoneId?: number;
}

const BottomDashboardSection: React.FC<BottomDashboardSectionProps> = ({ userStats, loading, cityCorporationCode, zoneId }) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Total Users Widget - Full Width */}
      <Box sx={{ mb: 3 }}>
        <TotalUsersWidget
          userStats={userStats}
          loading={loading}
          cityCorporationCode={cityCorporationCode}
          zoneId={zoneId}
        />
      </Box>

      {/* COMMENTED OUT - Will implement later */}
      {/* Top Row: Ward Performance + Total Users */}
      {/* <Box
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
        <WardZonePerformance cityCorporationCode={cityCorporationCode} />
        <TotalUsersWidget cityCorporationCode={cityCorporationCode} />
      </Box> */}

      {/* COMMENTED OUT - Will implement later */}
      {/* Middle Row: Weekly Trend Analysis (Full Width) */}
      {/* <Box sx={{ mb: 3 }}>
        <WeeklyTrendAnalysis cityCorporationCode={cityCorporationCode} />
      </Box> */}

      {/* COMMENTED OUT - Will implement later */}
      {/* Bottom Row: Operational Monitoring */}
      {/* <OperationalMonitoring cityCorporationCode={cityCorporationCode} /> */}
    </Box>
  );
};

export default BottomDashboardSection;