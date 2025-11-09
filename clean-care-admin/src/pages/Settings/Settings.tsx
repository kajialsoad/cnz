import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import {
  Settings as SettingsIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout';

const Settings: React.FC = () => {
  return (
    <MainLayout title="Settings">
      <Box 
        sx={{ 
          width: '100%', 
          height: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 2,
        }}
      >
        {/* Settings Icon */}
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: '#e8f5e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
            boxShadow: '0 4px 20px rgba(76, 175, 80, 0.2)',
          }}
        >
          <SettingsIcon 
            sx={{ 
              fontSize: 60, 
              color: '#4CAF50',
              animation: 'rotate 4s linear infinite',
              '@keyframes rotate': {
                '0%': {
                  transform: 'rotate(0deg)',
                },
                '100%': {
                  transform: 'rotate(360deg)',
                },
              },
            }} 
          />
        </Box>

        {/* Title */}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            color: 'text.primary',
            mb: 2,
          }}
        >
          Settings
        </Typography>

        {/* Subtitle */}
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{
            fontSize: '1.1rem',
            maxWidth: 400,
          }}
        >
          Settings center coming soon
        </Typography>
      </Box>
    </MainLayout>
  );
};

export default Settings;