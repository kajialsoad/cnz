import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout';

const Notifications: React.FC = () => {
  return (
    <MainLayout title="Notifications">
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
        {/* Bell Icon */}
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: '#fff3cd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
            boxShadow: '0 4px 20px rgba(255, 193, 7, 0.2)',
          }}
        >
          <NotificationIcon 
            sx={{ 
              fontSize: 60, 
              color: '#ff6f00',
              transform: 'rotate(-15deg)',
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
          Notifications
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
          Notification center coming soon
        </Typography>
      </Box>
    </MainLayout>
  );
};

export default Notifications;