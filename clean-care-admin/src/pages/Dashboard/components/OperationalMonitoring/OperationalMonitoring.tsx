import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
} from '@mui/material';

interface OperationalMonitoringProps {
  cityCorporationCode?: string;
}

const OperationalMonitoring: React.FC<OperationalMonitoringProps> = ({ cityCorporationCode }) => {
  const monitoringItems = [
    {
      title: 'Real-time Map',
      description: 'Coming Soon',
    },
    {
      title: 'STS Overview',
      description: 'Coming Soon',
    },
    {
      title: 'Route Tracking',
      description: 'Coming Soon',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          Operational Monitoring
        </Typography>
        <Chip
          label="Under Maintenance"
          variant="filled"
          sx={{
            backgroundColor: '#e0e0e0',
            color: '#666',
            fontSize: '0.75rem',
            height: 24,
          }}
        />
      </Box>

      {/* Monitoring Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {monitoringItems.map((item, index) => (
          <Card
            key={index}
            sx={{
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#fafafa',
              border: '2px dashed #e0e0e0',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <CardContent
              sx={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: '#333',
                }}
              >
                {item.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#999',
                  fontStyle: 'italic',
                }}
              >
                {item.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default OperationalMonitoring;