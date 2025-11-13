import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Header from '../Header';
import Sidebar from '../Sidebar';

const DRAWER_WIDTH = 320; // Updated to match sidebar
const HEADER_HEIGHT = 70; // Updated to match new header height

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <Header
        onMenuClick={handleSidebarToggle}
        title={title}
      />

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: `${HEADER_HEIGHT}px`,
          pl: isMobile ? 0 : `${DRAWER_WIDTH}px`,
          bgcolor: 'background.default',
          minHeight: '100vh',
          transition: theme.transitions.create(['margin-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Box
          sx={{
            px: 3, // Increased horizontal padding
            py: 3, // Increased vertical padding
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;