import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Pagination,
  Paper,
  CircularProgress,
  Container,
  Chip,
  Stack,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  CheckCircle as CheckCircleIcon,
  FiberManualRecord as UnreadIcon,
  DoneAll as DoneAllIcon,
  Assignment as ComplaintIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/common/Layout/MainLayout';
import { notificationService } from '../../services/notification.service';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification } from '../../types/notification.types';
import { formatTimeAgo } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const Notifications: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { refreshUnreadCount } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getUserNotifications(page, 20, unreadOnly);
      setNotifications(data.notifications);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, unreadOnly]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      refreshUnreadCount();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshUnreadCount();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        refreshUnreadCount();
      } catch (error) {
        console.error('Failed to mark as read on click', error);
      }
    }

    // Navigate to complaint if exists
    if (notification.complaintId) {
      navigate(`/complaints/${notification.complaintId}`);
    }
  };

  return (
    <MainLayout title="Notifications">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stay updated with recent activities and status changes
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Chip
                label={unreadOnly ? "Showing Unread" : "Showing All"}
                onClick={() => setUnreadOnly(!unreadOnly)}
                color={unreadOnly ? "primary" : "default"}
                variant={unreadOnly ? "filled" : "outlined"}
                sx={{ cursor: 'pointer' }}
              />
              <Button
                variant="outlined"
                startIcon={<DoneAllIcon />}
                onClick={handleMarkAllAsRead}
                size="small"
              >
                Mark all read
              </Button>
            </Stack>
          </Stack>

          {/* List */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <NotificationIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">No notifications found</Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  alignItems="flex-start"
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                  secondaryAction={
                    !notification.isRead && (
                      <Tooltip title="Mark as read">
                        <IconButton
                          edge="end"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          size="small"
                        >
                          <CheckCircleIcon color="primary" fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: notification.isRead ? 'grey.300' : 'primary.main' }}>
                      <ComplaintIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight={notification.isRead ? 400 : 600}>
                          {notification.title}
                        </Typography>
                        {!notification.isRead && (
                          <UnreadIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                        )}
                      </Box>
                    }
                    primaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          display="block"
                          sx={{ my: 0.5 }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(notification.createdAt)}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default Notifications;