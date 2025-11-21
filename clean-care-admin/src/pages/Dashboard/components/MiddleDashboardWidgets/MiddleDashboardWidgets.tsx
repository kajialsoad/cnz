import React from 'react';
import { Box } from '@mui/material';
import {
  ComplaintStatusOverview,
  CitizenSatisfactionScore,
  AverageServiceTime
} from '../ComplaintsChart';

interface MiddleDashboardWidgetsProps {
  cityCorporationCode?: string;
}

const MiddleDashboardWidgets: React.FC<MiddleDashboardWidgetsProps> = ({ cityCorporationCode }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(3, 1fr)',
        },
        gap: 3,
        mb: 4,
      }}
    >
      <ComplaintStatusOverview cityCorporationCode={cityCorporationCode} />
      <CitizenSatisfactionScore cityCorporationCode={cityCorporationCode} />
      <AverageServiceTime cityCorporationCode={cityCorporationCode} />
    </Box>
  );
};

export default MiddleDashboardWidgets;