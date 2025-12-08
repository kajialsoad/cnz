import React from 'react';
import { Box, Typography } from '@mui/material';
import MainLayout from '../../components/common/Layout/MainLayout';

const SuperAdminManagement: React.FC = () => {
  return (
    <MainLayout title="Super Admin Management">
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>Super Admin Management</Typography>
        <Typography variant="body1" color="text.secondary">
          Manage super admin accounts and privileges
        </Typography>
      </Box>
    </MainLayout>
  );
};

export default SuperAdminManagement;
