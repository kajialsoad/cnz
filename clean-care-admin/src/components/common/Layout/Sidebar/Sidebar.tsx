import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import dashboardIcon from '../../../../assets/icons/dashboard.svg';
import complaintIcon from '../../../../assets/icons/complaint.svg';
import adminIcon from '../../../../assets/icons/admin.svg';
import userIcon from '../../../../assets/icons/user.svg';
import chatIcon from '../../../../assets/icons/chat.svg';
import reportIcon from '../../../../assets/icons/report.svg';
import notificationIcon from '../../../../assets/icons/notification.svg';
import settingsIcon from '../../../../assets/icons/Settings.svg';
import profileImage from '../../../../assets/images/profile.jpg';
import { chatService } from '../../../../services/chatService';

const DRAWER_WIDTH = 320; // Increased from 240

const baseMenuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: dashboardIcon,
    path: '/',
  },
  {
    id: 'complaints',
    label: 'All Complaints',
    icon: complaintIcon,
    path: '/complaints',
    badge: 12,
  },
  {
    id: 'chats',
    label: 'Messages',
    icon: chatIcon,
    path: '/chats',
    dynamicBadge: true, // Will be populated from API
  },
  {
    id: 'admins',
    label: 'Admin Management',
    icon: adminIcon,
    path: '/admins',
  },
  {
    id: 'users',
    label: 'User Management',
    icon: userIcon,
    path: '/users',
  },
  {
    id: 'city-corporations',
    label: 'City Corporations',
    icon: adminIcon,
    path: '/city-corporations',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: reportIcon,
    path: '/reports',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: notificationIcon,
    path: '/notifications',
    badge: 3,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: settingsIcon,
    path: '/settings',
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'temporary' | 'permanent';
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  variant = 'permanent',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const stats = await chatService.getChatStatistics();
        setUnreadCount(stats.unreadCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Poll for updates every 5 seconds for real-time updates
    const interval = setInterval(fetchUnreadCount, 5000);

    return () => clearInterval(interval);
  }, []);

  // Create menu items with dynamic badge
  const menuItems = baseMenuItems.map(item => {
    if (item.dynamicBadge) {
      return {
        ...item,
        badge: unreadCount > 0 ? unreadCount : undefined,
      };
    }
    return item;
  });

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%' }}>
      {/* User Profile Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          textAlign: 'center',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={profileImage}
            sx={{
              width: 64,
              height: 64,
              border: '3px solid #ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              bgcolor: '#3FA564',
            }}
          >
            MR
          </Avatar>
          <Box
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 14,
              height: 14,
              bgcolor: '#4CAF50',
              borderRadius: '50%',
              border: '2px solid #ffffff',
            }}
          />
        </Box>

        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              color: '#2D3748',
              mb: 0.5,
            }}
          >
            Mr. Mohammad Rahman
          </Typography>

          <Chip
            label="SUPER ADMIN"
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #3FA564 0%, #2D7A4A 100%)',
              color: 'white',
              fontSize: '0.625rem',
              height: 24,
              fontWeight: 600,
              letterSpacing: '0.5px',
              boxShadow: '0 2px 8px rgba(63, 165, 100, 0.3)',
              mb: 0.5,
            }}
          />

          <Typography
            variant="caption"
            sx={{
              color: '#718096',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'block',
              mb: 0.5,
            }}
          >
            Chief Controller
          </Typography>

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
          }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                bgcolor: '#4CAF50',
                borderRadius: '50%',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: '#4CAF50',
                fontSize: '0.7rem',
                fontWeight: 500,
              }}
            >
              Active Now
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ px: 2, py: 2 }}>
        <Typography
          variant="overline"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: '#A0AEC0',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '1px',
          }}
        >
          MAIN MENU
        </Typography>

        <List sx={{ pt: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    mb: 1,
                    px: 2,
                    py: 1.5,
                    background: isActive
                      ? 'linear-gradient(135deg, #3FA564 0%, #2D7A4A 100%)'
                      : 'transparent',
                    color: isActive ? 'white' : '#4A5568',
                    boxShadow: isActive
                      ? '0 4px 16px rgba(63, 165, 100, 0.4)'
                      : 'none',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: isActive
                        ? 'linear-gradient(135deg, #369654 0%, #25663C 100%)'
                        : 'rgba(63, 165, 100, 0.08)',
                      transform: 'translateY(-1px)',
                      boxShadow: isActive
                        ? '0 6px 20px rgba(63, 165, 100, 0.4)'
                        : '0 2px 8px rgba(63, 165, 100, 0.15)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'white' : '#718096',
                      minWidth: 36,
                      mr: 1.5,
                    }}
                  >
                    <Box
                      component="img"
                      src={item.icon}
                      sx={{
                        width: 20,
                        height: 20,
                        filter: isActive
                          ? 'brightness(0) invert(1)'
                          : 'brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(1077%) hue-rotate(168deg) brightness(94%) contrast(86%)',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: isActive ? 'rgba(255,255,255,0.9)' : '#FF6B6B',
                        color: isActive ? '#3FA564' : 'white',
                        minWidth: 20,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ my: 3, mx: 2 }} />

      {/* Bottom Section */}
      <Box sx={{ px: 3, py: 2, textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: '#A0AEC0',
            fontSize: '0.75rem',
            fontWeight: 500,
            mb: 0.5,
          }}
        >
          Smart Complaint System
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#CBD5E0',
            fontSize: '0.7rem',
          }}
        >
          © 2025 Clean Care
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
