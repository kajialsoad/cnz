import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import dashboardIcon from '../../../../assets/icons/dashboard.svg';
import complaintIcon from '../../../../assets/icons/complaint.svg';
import adminIcon from '../../../../assets/icons/admin.svg';
import userIcon from '../../../../assets/icons/user.svg';
import chatIcon from '../../../../assets/icons/chat.svg';
import reportIcon from '../../../../assets/icons/report.svg';
import notificationIcon from '../../../../assets/icons/notification.svg';
import settingsIcon from '../../../../assets/icons/Settings.svg';
import { chatService } from '../../../../services/chatService';
import { useAuth } from '../../../../contexts/AuthContext';
import { useProfile } from '../../../../contexts/ProfileContext';
import ProfileButton from '../../ProfileButton/ProfileButton';
import { fadeIn, animationConfig } from '../../../../styles/animations';

const DRAWER_WIDTH = 320; // Increased from 240

const baseMenuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: dashboardIcon,
    path: '/',
    roles: ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'], // All roles can see dashboard
  },
  {
    id: 'complaints',
    label: 'All Complaints',
    icon: complaintIcon,
    path: '/complaints',
    badge: 12,
    roles: ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'],
  },
  {
    id: 'chats',
    label: 'Messages',
    icon: chatIcon,
    path: '/chats',
    dynamicBadge: true, // Will be populated from API
    roles: ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'],
  },
  {
    id: 'super-admins',
    label: 'Super Admin Management',
    icon: adminIcon,
    path: '/super-admins',
    roles: ['MASTER_ADMIN'], // Only Master Admin can manage Super Admins
  },
  {
    id: 'admins',
    label: 'Admin Management',
    icon: adminIcon,
    path: '/admins',
    roles: ['MASTER_ADMIN', 'SUPER_ADMIN'], // Master Admin and Super Admin can manage Admins
  },
  {
    id: 'users',
    label: 'User Management',
    icon: userIcon,
    path: '/users',
    roles: ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'], // All admin roles can manage users
  },
  {
    id: 'city-corporations',
    label: 'City Corporations',
    icon: adminIcon,
    path: '/city-corporations',
    roles: ['MASTER_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: reportIcon,
    path: '/reports',
    roles: ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: notificationIcon,
    path: '/notifications',
    badge: 3,
    roles: ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: settingsIcon,
    path: '/settings',
    roles: ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'temporary' | 'permanent';
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  variant = 'permanent',
  collapsed = false,
  onToggleCollapsed,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile } = useProfile();
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

  // Filter menu items based on user role and add dynamic badge
  const menuItems = baseMenuItems
    .filter(item => {
      // If no roles specified, show to everyone
      if (!item.roles) return true;
      // Check if user's role is in the allowed roles
      return profile?.role && item.roles.includes(profile.role);
    })
    .map(item => {
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
    <Box sx={{ width: collapsed ? 72 : DRAWER_WIDTH, height: '100%' }}>
      {/* User Profile Section */}
      <Box
        sx={{
          position: 'relative',
          transition: `all ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
          animation: profile ? `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}` : 'none',
        }}
      >
        <ProfileButton
          variant="sidebar"
          showName={true}
          showRole={true}
          collapsed={collapsed}
        />
        <IconButton
          onClick={onToggleCollapsed}
          sx={{
            position: 'absolute',
            top: 24,
            right: 12,
            width: 28,
            height: 28,
            bgcolor: '#ffffff',
            borderRadius: '53687100px',
            boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)',
            transition: `all ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
            '&:hover': {
              bgcolor: '#ffffff',
              transform: 'scale(1.05)',
            },
            zIndex: 1,
          }}
        >
          {collapsed ? (
            <ChevronRight sx={{ color: '#3FA564' }} />
          ) : (
            <ChevronLeft sx={{ color: '#3FA564' }} />
          )}
        </IconButton>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ px: 2, py: 2 }}>
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
                    px: collapsed ? 0 : 2,
                    py: 1.5,
                    background: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#3FA564' : '#ffffff',
                    boxShadow: isActive
                      ? '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)'
                      : 'none',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                    transition: 'all 0.2s ease-in-out',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    '&:hover': {
                      backgroundColor: isActive ? '#ffffff' : 'rgba(255,255,255,0.08)',
                      transform: 'translateY(-1px)',
                      boxShadow: isActive ? '0 6px 20px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? '#3FA564' : '#ffffff',
                      minWidth: collapsed ? 0 : 36,
                      mr: collapsed ? 0 : 1.5,
                    }}
                  >
                    <Box
                      component="img"
                      src={item.icon}
                      sx={{
                        width: 20,
                        height: 20,
                        filter: isActive
                          ? 'invert(46%) sepia(31%) saturate(827%) hue-rotate(86deg) brightness(95%) contrast(92%)'
                          : 'invert(1)',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                    sx={{ display: collapsed ? 'none' : 'block' }}
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
                        display: collapsed ? 'none' : 'inline-flex',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ my: 0, mx: 2, opacity: 0.2, borderColor: '#ffffff33' }} />

      {/* Logout Row */}
      <Box
        onClick={async () => { await logout(); navigate('/login'); }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 1.5,
          cursor: 'pointer',
          color: '#ffffff',
        }}
      >
        <LogoutOutlined sx={{ color: '#ffffff' }} />
        <Typography sx={{ display: collapsed ? 'none' : 'block' }}>লগ আউট</Typography>
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
          width: collapsed ? 72 : DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: '0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)',
          backgroundImage: 'linear-gradient(180deg, #3FA564 0%, #2D7A4A 100%)',
          color: '#ffffff',
          transition: `width ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
