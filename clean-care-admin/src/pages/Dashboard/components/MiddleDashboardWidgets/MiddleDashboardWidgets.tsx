import React from 'react';
import { Box } from '@mui/material';
import { 
  ComplaintStatusOverview, 
  CitizenSatisfactionScore, 
  AverageServiceTime 
} from '../ComplaintsChart';

const MiddleDashboardWidgets: React.FC = () => {
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
      <ComplaintStatusOverview />
      <CitizenSatisfactionScore />
      <AverageServiceTime />
    </Box>
  );
};

export default MiddleDashboardWidgets;