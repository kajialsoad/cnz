import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    Avatar,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    IconButton,
    CircularProgress,
} from '@mui/material';
import {
    Close as CloseIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import type { UserWithStats, ComplaintSummary } from '../../types/userManagement.types';
import { format } from 'date-fns';
import { scaleIn, slideInUp, animationConfig, statusBadgeTransition, fadeIn } from '../../styles/animations';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/userManagementService';

interface UserDetailsModalProps {
    user: UserWithStats | null;
    recentComplaints: ComplaintSummary[];
    open: boolean;
    onClose: () => void;
    onEdit: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
    user,
    recentComplaints,
    open,

    onClose,
    onEdit,
}) => {
    const { user: currentUser } = useAuth();
    const [reactions, setReactions] = useState<any[]>([]);
    const [noticeInteractions, setNoticeInteractions] = useState<any[]>([]);
    const [loadingReactions, setLoadingReactions] = useState(false);
    const [loadingNoticeInteractions, setLoadingNoticeInteractions] = useState(false);

    useEffect(() => {
        if (open && user) {
            fetchReactions();
            fetchNoticeInteractions();
        } else {
            setReactions([]);
            setNoticeInteractions([]);
        }
    }, [open, user]);

    const fetchReactions = async () => {
        if (!user) return;
        try {
            setLoadingReactions(true);
            const data = await userManagementService.getUserReactions(user.id);
            setReactions(data);
        } catch (error) {
            console.error('Error fetching reactions:', error);
        } finally {
            setLoadingReactions(false);
        }
    };

    const fetchNoticeInteractions = async () => {
        if (!user) return;
        try {
            setLoadingNoticeInteractions(true);
            const data = await userManagementService.getUserNoticeInteractions(user.id);
            setNoticeInteractions(data);
        } catch (error) {
            console.error('Error fetching notice interactions:', error);
        } finally {
            setLoadingNoticeInteractions(false);
        }
    };

    if (!user) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return { backgroundColor: '#e8f5e8', color: '#2e7d2e' };
            case 'INACTIVE':
                return { backgroundColor: '#f5f5f5', color: '#666666' };
            case 'SUSPENDED':
                return { backgroundColor: '#ffebee', color: '#c62828' };
            case 'PENDING':
                return { backgroundColor: '#fff3cd', color: '#856404' };
            default:
                return { backgroundColor: '#f5f5f5', color: '#666666' };
        }
    };

    const getComplaintStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return { backgroundColor: '#fff3cd', color: '#856404' };
            case 'IN_PROGRESS':
                return { backgroundColor: '#d1ecf1', color: '#0c5460' };
            case 'RESOLVED':
                return { backgroundColor: '#d4edda', color: '#155724' };
            case 'REJECTED':
                return { backgroundColor: '#ffebee', color: '#c62828' };
            default:
                return { backgroundColor: '#f5f5f5', color: '#666666' };
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
        } catch {
            return 'Invalid date';
        }
    };

    const successRate = user.statistics.totalComplaints > 0
        ? Math.round((user.statistics.resolvedComplaints / user.statistics.totalComplaints) * 100)
        : 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={window.innerWidth < 600}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: { xs: 0, sm: 2 },
                        animation: window.innerWidth < 600
                            ? `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`
                            : `${scaleIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                        animationFillMode: 'both',
                        maxHeight: { xs: '100vh', sm: '90vh' },
                    },
                },
                backdrop: {
                    sx: {
                        animation: `${fadeIn} ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                    },
                },
            }}
        >
            <DialogTitle component="div" sx={{ pb: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 600,
                            fontSize: { xs: '1.25rem', sm: '1.5rem' }
                        }}
                    >
                        User Details
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2 } }}>
                {/* Personal Information */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'center', sm: 'center' },
                        gap: { xs: 2, sm: 3 },
                        mb: 2
                    }}>
                        <Avatar
                            sx={{
                                width: { xs: 64, sm: 80 },
                                height: { xs: 64, sm: 80 },
                                bgcolor: '#4CAF50',
                                fontSize: { xs: '1.5rem', sm: '2rem' },
                                fontWeight: 600,
                            }}
                            src={user.avatar || undefined}
                        >
                            {user.firstName[0]}{user.lastName[0]}
                        </Avatar>
                        <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' }, width: { xs: '100%', sm: 'auto' } }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    mb: 0.5,
                                    fontSize: { xs: '1rem', sm: '1.25rem' }
                                }}
                            >
                                {user.firstName} {user.lastName}
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                                User ID: #{user.id.toString().padStart(6, '0')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
                                <Chip
                                    label={user.status}
                                    size="small"
                                    sx={{
                                        ...getStatusColor(user.status),
                                        ...statusBadgeTransition,
                                        fontWeight: 500,
                                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    }}
                                />
                                <Chip
                                    label={user.role}
                                    size="small"
                                    sx={{
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        ...statusBadgeTransition,
                                        fontWeight: 500,
                                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' }, minWidth: { xs: '100%', sm: '200px' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 } }}>
                                <EmailIcon sx={{ color: 'text.secondary', fontSize: { xs: 18, sm: 20 } }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            wordBreak: 'break-word',
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                        }}
                                    >
                                        {user.email || 'Not provided'}
                                    </Typography>
                                </Box>
                                {user.emailVerified && (
                                    <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: { xs: 16, sm: 18 } }} />
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' }, minWidth: { xs: '100%', sm: '200px' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 } }}>
                                <PhoneIcon sx={{ color: 'text.secondary', fontSize: { xs: 18, sm: 20 } }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Phone
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                        {user.phone}
                                    </Typography>
                                </Box>
                                {user.phoneVerified && (
                                    <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: { xs: 16, sm: 18 } }} />
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' }, minWidth: { xs: '100%', sm: '200px' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: { xs: 1.5, sm: 2 } }}>
                                <LocationIcon sx={{ color: 'text.secondary', fontSize: { xs: 18, sm: 20 }, mt: 0.5 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Location
                                    </Typography>
                                    {user.cityCorporation && (
                                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 500 }}>
                                            {user.cityCorporation.name}
                                        </Typography>
                                    )}

                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                        Ward {user.ward?.wardNumber ?? 'N/A'} • Zone {user.zone?.zoneNumber ?? 'N/A'}
                                    </Typography>
                                    {user.ward?.inspectorName && (
                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Inspector: {user.ward.inspectorName} {user.ward.inspectorPhone ? `(${user.ward.inspectorPhone})` : ''}
                                        </Typography>
                                    )}
                                    {user.zone?.officerName && (
                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Zonal Officer: {user.zone.officerName} {user.zone.officerPhone ? `(${user.zone.officerPhone})` : ''}
                                        </Typography>
                                    )}
                                    {user.address && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                                mt: 0.5,
                                                wordBreak: 'break-word'
                                            }}
                                        >
                                            {user.address}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' }, minWidth: { xs: '100%', sm: '200px' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 } }}>
                                <CalendarIcon sx={{ color: 'text.secondary', fontSize: { xs: 18, sm: 20 } }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Joined
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                        {formatDate(user.createdAt)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {currentUser?.role === 'MASTER_ADMIN' && (
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' }, minWidth: { xs: '100%', sm: '200px' } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 } }}>
                                    <CheckCircleIcon sx={{ color: 'text.secondary', fontSize: { xs: 18, sm: 20 } }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Password
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontFamily: 'monospace' }}>
                                            {user.visiblePassword ? (
                                                <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{user.visiblePassword}</span>
                                            ) : (
                                                <span style={{ color: '#666' }}>Hash: {user.passwordHash?.substring(0, 20)}... (Reset to see actual)</span>
                                            )}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Activity Statistics */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            mb: { xs: 1.5, sm: 2 },
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        Activity Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: { xs: '100px', sm: '120px' } }}>
                            <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#2196F3',
                                        fontSize: { xs: '1.5rem', sm: '2.125rem' }
                                    }}
                                >
                                    {user.statistics.totalComplaints}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                >
                                    Total Complaints
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: { xs: '100px', sm: '120px' } }}>
                            <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#4CAF50',
                                        fontSize: { xs: '1.5rem', sm: '2.125rem' }
                                    }}
                                >
                                    {user.statistics.resolvedComplaints}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                >
                                    Resolved
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: { xs: '100px', sm: '120px' } }}>
                            <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#FF9800',
                                        fontSize: { xs: '1.5rem', sm: '2.125rem' }
                                    }}
                                >
                                    {user.statistics.unresolvedComplaints}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                >
                                    Unresolved
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: { xs: '100px', sm: '120px' } }}>
                            <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#9C27B0',
                                        fontSize: { xs: '1.5rem', sm: '2.125rem' }
                                    }}
                                >
                                    {successRate}%
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                >
                                    Success Rate
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                            Last Login: {formatDate(user.lastLoginAt)}
                        </Typography>
                    </Box>
                </Box>

                {/* Recent Complaints */}
                <Box>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            mb: { xs: 1.5, sm: 2 },
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        Recent Complaints
                    </Typography>
                    {recentComplaints.length > 0 ? (
                        <List sx={{ p: 0 }}>
                            {recentComplaints.map((complaint) => (
                                <React.Fragment key={complaint.id}>
                                    <ListItem
                                        sx={{
                                            px: { xs: 1.5, sm: 2 },
                                            py: { xs: 1, sm: 1.5 },
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: 1,
                                            mb: 1,
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexDirection: { xs: 'column', sm: 'row' },
                                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                                    gap: { xs: 0.5, sm: 1 }
                                                }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 500,
                                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                                        }}
                                                    >
                                                        {complaint.title}
                                                    </Typography>
                                                    <Chip
                                                        label={complaint.status.replace('_', ' ')}
                                                        size="small"
                                                        sx={{
                                                            ...getComplaintStatusColor(complaint.status),
                                                            ...statusBadgeTransition,
                                                            height: { xs: 18, sm: 20 },
                                                            fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                                        }}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                                >
                                                    {formatDate(complaint.createdAt)}
                                                </Typography>
                                            }
                                            primaryTypographyProps={{ component: 'div' }}
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                textAlign: 'center',
                                py: { xs: 2, sm: 3 },
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                        >
                            No complaints yet
                        </Typography>
                    )}
                </Box>

                {/* Waste Management Interactions */}
                <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            mb: { xs: 1.5, sm: 2 },
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        Waste Management Interactions
                    </Typography>
                    {loadingReactions ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : reactions.length > 0 ? (
                        <List sx={{ p: 0 }}>
                            {reactions.map((reaction) => (
                                <ListItem
                                    key={reaction.id}
                                    sx={{
                                        px: { xs: 1.5, sm: 2 },
                                        py: { xs: 1, sm: 1.5 },
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: 1,
                                        mb: 1,
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {reaction.reactionType === 'LIKE' ? (
                                                    <ThumbUpIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                                                ) : (
                                                    <ThumbDownIcon sx={{ fontSize: 18, color: '#F44336' }} />
                                                )}
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {reaction.post.title}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Category: {reaction.post.category.replace('_', ' ')}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(reaction.createdAt)}
                                                </Typography>
                                            </Box>
                                        }
                                        primaryTypographyProps={{ component: 'div' }}
                                        secondaryTypographyProps={{ component: 'div' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                textAlign: 'center',
                                py: { xs: 2, sm: 3 },
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                        >
                            No interactions yet
                        </Typography>
                    )}
                </Box>

                {/* Notice Board Interactions */}
                <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            mb: { xs: 1.5, sm: 2 },
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        Notice Board Interactions
                    </Typography>
                    {loadingNoticeInteractions ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : noticeInteractions.length > 0 ? (
                        <List sx={{ p: 0 }}>
                            {noticeInteractions.map((interaction) => (
                                <ListItem
                                    key={interaction.id}
                                    sx={{
                                        px: { xs: 1.5, sm: 2 },
                                        py: { xs: 1, sm: 1.5 },
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: 1,
                                        mb: 1,
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {interaction.type === 'LIKE' && <ThumbUpIcon sx={{ fontSize: 18, color: '#2196F3' }} />}
                                                {interaction.type === 'LOVE' && <FavoriteIcon sx={{ fontSize: 18, color: '#E91E63' }} />}
                                                {interaction.type === 'VIEW' && <VisibilityIcon sx={{ fontSize: 18, color: '#9E9E9E' }} />}
                                                {interaction.type === 'READ' && <CheckCircleIcon sx={{ fontSize: 18, color: '#4CAF50' }} />}
                                                {interaction.type.startsWith('RSVP') && <CalendarIcon sx={{ fontSize: 18, color: '#FF9800' }} />}
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {interaction.notice.title}
                                                </Typography>
                                                <Chip
                                                    label={interaction.type.replace('_', ' ')}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        ml: 1,
                                                        backgroundColor: interaction.type === 'READ' ? '#e8f5e8' : '#f5f5f5',
                                                        color: interaction.type === 'READ' ? '#2e7d2e' : '#666'
                                                    }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Category: {interaction.notice.category.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(interaction.createdAt)}
                                                </Typography>
                                            </Box>
                                        }
                                        primaryTypographyProps={{ component: 'div' }}
                                        secondaryTypographyProps={{ component: 'div' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                textAlign: 'center',
                                py: { xs: 2, sm: 3 },
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                        >
                            No notice interactions yet
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 1.5, sm: 2 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 },
            }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        textTransform: 'none',
                        width: { xs: '100%', sm: 'auto' },
                        minHeight: { xs: 44, sm: 'auto' },
                    }}
                >
                    Close
                </Button>
                <Button
                    onClick={onEdit}
                    variant="contained"
                    startIcon={<EditIcon />}
                    sx={{
                        backgroundColor: '#4CAF50',
                        '&:hover': { backgroundColor: '#45a049' },
                        textTransform: 'none',
                        width: { xs: '100%', sm: 'auto' },
                        minHeight: { xs: 44, sm: 'auto' },
                    }}
                >
                    Edit User
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserDetailsModal;


