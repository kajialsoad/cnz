import React from 'react';
import { Box } from '@mui/material';
import {
  ComplaintStatusOverview,
  CitizenSatisfactionScore,
  // AverageServiceTime
} from '../ComplaintsChart';

interface MiddleDashboardWidgetsProps {
  cityCorporationCode?: string;
  zoneId?: number;
}

const MiddleDashboardWidgets: React.FC<MiddleDashboardWidgetsProps> = ({ cityCorporationCode, zoneId }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(2, 1fr)',
        },
        gap: 3,
        mb: 4,
      }}
    >
      <ComplaintStatusOverview cityCorporationCode={cityCorporationCode} zoneId={zoneId} />
      <CitizenSatisfactionScore cityCorporationCode={cityCorporationCode} zoneId={zoneId} />
      {/* AverageServiceTime - Commented out for cleaner design */}
      {/* <AverageServiceTime cityCorporationCode={cityCorporationCode} zoneId={zoneId} /> */}
    </Box>
  );
};

export default MiddleDashboardWidgets;