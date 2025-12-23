import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { SelectChangeEvent } from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Language as LanguageIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useNotifications } from '../../../../contexts/NotificationContext';
import { notificationService } from '../../../../services/notification.service';
import type { Notification } from '../../../../types/notification.types';
import ProfileButton from '../../ProfileButton/ProfileButton';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  title = 'Dashboard Overview',
}) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchValues, setSearchValues] = useState({
    complaint: '',
    adminName: '',
    username: '',
    areaName: '',
    wardNo: '',
    zoneNo: '',
  });

  const handleSearchChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValues(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleNotificationClick = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setLoading(true);
    try {
      // Fetch latest 5 notifications
      const response = await notificationService.getUserNotifications({
        page: 1,
        limit: 5
      });
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/notifications');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Refund/Refresh local list and context
      const response = await notificationService.getUserNotifications({ page: 1, limit: 5 });
      setNotifications(response.notifications);
      // Context will auto-refresh via polling or we can force it if context exposed method
      // For now, relies on polling or next interaction
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircleIcon color="success" />;
      case 'WARNING': return <WarningIcon color="warning" />;
      case 'ERROR': return <ErrorIcon color="error" />;
      case 'INFO':
      default: return <InfoIcon color="info" />;
    }
  };

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const newLang = event.target.value as 'en' | 'bn';
    setLanguage(newLang);
  };

  return (
    <AppBar position="fixed" elevation={1} sx={{ bgcolor: 'white', color: 'black' }}>
      <Toolbar sx={{ minHeight: '70px !important', px: 3 }}>
        {/* Left Section - Menu + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 4 }}>
          <IconButton
            edge="start"
            sx={{ color: 'text.primary' }}
            aria-label="menu"
            onClick={onMenuClick}
          >
            <MenuIcon />
          </IconButton>

          <Box>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Real-time analytics and system insights
            </Typography>
          </Box>
        </Box>

        {/* Center Section - Search Bars */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flex: 1,
          mr: 3,
        }}>
          {/* Complaint Search */}
          <TextField
            size="small"
            placeholder="Complaint"
            value={searchValues.complaint}
            onChange={handleSearchChange('complaint')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Admin Name Search */}
          <TextField
            size="small"
            placeholder="Admin Name"
            value={searchValues.adminName}
            onChange={handleSearchChange('adminName')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 130,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Username Search */}
          <TextField
            size="small"
            placeholder="Username"
            value={searchValues.username}
            onChange={handleSearchChange('username')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Area Name Search */}
          <TextField
            size="small"
            placeholder="Area Name"
            value={searchValues.areaName}
            onChange={handleSearchChange('areaName')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Ward No Search */}
          <TextField
            size="small"
            placeholder="Ward No."
            value={searchValues.wardNo}
            onChange={handleSearchChange('wardNo')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 100,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Zone No Search */}
          <TextField
            size="small"
            placeholder="Zone No."
            value={searchValues.zoneNo}
            onChange={handleSearchChange('zoneNo')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 100,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Language Selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={language}
              onChange={handleLanguageChange}
              displayEmpty
              IconComponent={KeyboardArrowDownIcon}
              startAdornment={
                <InputAdornment position="start">
                  <LanguageIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              }
              sx={{
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  pl: 0,
                },
              }}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="bn">বাংলা</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Right Section - Notifications + User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            sx={{ color: 'text.primary' }}
            onClick={handleNotificationClick}
            aria-describedby={Boolean(anchorEl) ? 'notification-popover' : undefined}
          >
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Popover
            id="notification-popover"
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: { width: 360, maxHeight: 500, mt: 1.5 }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                Notifications
              </Typography>
              <Button size="small" onClick={handleMarkAllRead} sx={{ textTransform: 'none' }}>
                Mark all read
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : notifications.length > 0 ? (
              <List sx={{ p: 0 }}>
                {notifications.map((notification) => (
                  <React.Fragment key={notification.id}>
                    <ListItemButton
                      alignItems="flex-start"
                      onClick={() => {
                        // Mark read and navigate if needed
                        notificationService.markAsRead(notification.id);
                        if (notification.complaintId) {
                          navigate(`/complaints/${notification.complaintId}`);
                        }
                        handleClose();
                      }}
                      sx={{
                        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'transparent' }}>
                          {getIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <Box component="span">
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: 'block', mb: 0.5, fontSize: '0.8rem' }}
                            >
                              {notification.message}
                            </Typography>
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.disabled"
                            >
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </Typography>
                          </Box>
                        }
                      />
                      {!notification.isRead && (
                        <CircleIcon sx={{ fontSize: 10, color: 'primary.main', ml: 1, mt: 1 }} />
                      )}
                    </ListItemButton>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications yet
                </Typography>
              </Box>
            )}

            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
              <Button fullWidth onClick={handleViewAll} sx={{ textTransform: 'none' }}>
                View All Notifications
              </Button>
            </Box>
          </Popover>

          <ProfileButton
            variant="header"
            showName={true}
            showRole={true}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
