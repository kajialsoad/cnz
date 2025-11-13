import React from 'react';
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
    Grid,
    List,
    ListItem,
    ListItemText,
    IconButton,
} from '@mui/material';
import {
    Close as CloseIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import type { UserWithStats, ComplaintSummary } from '../../types/userManagement.types';
import { format } from 'date-fns';

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
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: '90vh',
                },
            }}
        >
            <DialogTitle sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        User Details
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* Personal Information */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: '#4CAF50',
                                fontSize: '2rem',
                                fontWeight: 600,
                            }}
                            src={user.avatar || undefined}
                        >
                            {user.firstName[0]}{user.lastName[0]}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                User ID: #{user.id.toString().padStart(6, '0')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                    label={user.status}
                                    size="small"
                                    sx={{
                                        ...getStatusColor(user.status),
                                        fontWeight: 500,
                                    }}
                                />
                                <Chip
                                    label={user.role}
                                    size="small"
                                    sx={{
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        fontWeight: 500,
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body2">
                                        {user.email || 'Not provided'}
                                    </Typography>
                                </Box>
                                {user.emailVerified && (
                                    <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 18, ml: 'auto' }} />
                                )}
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Phone
                                    </Typography>
                                    <Typography variant="body2">{user.phone}</Typography>
                                </Box>
                                {user.phoneVerified && (
                                    <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 18, ml: 'auto' }} />
                                )}
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <LocationIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Location
                                    </Typography>
                                    <Typography variant="body2">
                                        {user.ward || 'N/A'} • {user.zone || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Joined
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDate(user.createdAt)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Activity Statistics */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Activity Statistics
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196F3' }}>
                                    {user.statistics.totalComplaints}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Total Complaints
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                                    {user.statistics.resolvedComplaints}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Resolved
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF9800' }}>
                                    {user.statistics.unresolvedComplaints}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Unresolved
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#9C27B0' }}>
                                    {successRate}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Success Rate
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Last Login: {formatDate(user.lastLoginAt)}
                        </Typography>
                    </Box>
                </Box>

                {/* Recent Complaints */}
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Recent Complaints
                    </Typography>
                    {recentComplaints.length > 0 ? (
                        <List sx={{ p: 0 }}>
                            {recentComplaints.map((complaint, index) => (
                                <React.Fragment key={complaint.id}>
                                    <ListItem
                                        sx={{
                                            px: 2,
                                            py: 1.5,
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: 1,
                                            mb: 1,
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {complaint.title}
                                                    </Typography>
                                                    <Chip
                                                        label={complaint.status.replace('_', ' ')}
                                                        size="small"
                                                        sx={{
                                                            ...getComplaintStatusColor(complaint.status),
                                                            height: 20,
                                                            fontSize: '0.7rem',
                                                        }}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(complaint.createdAt)}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                            No complaints yet
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>
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
                    }}
                >
                    Edit User
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserDetailsModal;
