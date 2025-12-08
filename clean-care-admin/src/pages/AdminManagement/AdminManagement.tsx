import React from 'react';
import { Box, Typography } from '@mui/material';
import MainLayout from '../../components/common/Layout/MainLayout';

const AdminManagement: React.FC = () => {
  return (
    <MainLayout title="Admin Management">
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>Admin Management</Typography>
        <Typography variant="body1" color="text.secondary">
          Manage admin accounts and roles
        </Typography>
      </Box>
    </MainLayout>
  );
};

export default AdminManagement;

