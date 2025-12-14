import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    IconButton,
    Typography,
    Box,
    Chip,
    Divider,
    Grid,
    Avatar,
} from '@mui/material';
import Close from '@mui/icons-material/Close';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import type { UserWithStats } from '../../types/userManagement.types';

interface AdminDetailsModalProps {
    open: boolean;
    onClose: () => void;
    admin: UserWithStats | null;
}

const AdminDetailsModal: React.FC<AdminDetailsModalProps> = ({ open, onClose, admin }) => {
    if (!admin) return null;

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700 }}>এডমিন বিস্তারিত</Typography>
                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>
                    {/* Admin Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: '#2b7fff',
                                fontSize: 32,
                                fontWeight: 700,
                            }}
                        >
                            {admin.firstName.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {admin.firstName} {admin.lastName}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                    label={admin.role}
                                    size="small"
                                    sx={{ bgcolor: '#eff6ff', color: '#155dfc' }}
                                />
                                <Chip
                                    label={admin.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                    size="small"
                                    sx={{
                                        bgcolor: admin.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                                        color: admin.status === 'ACTIVE' ? '#008236' : '#dc2626'
                                    }}
                                />
                            </Stack>
                        </Box>
                    </Box>

                    <Divider />

                    {/* Contact Information */}
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                            যোগাযোগের তথ্য
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <PhoneOutlined sx={{ color: '#4a5565' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            ফোন নম্বর
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {admin.phone}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            {admin.email && (
                                <Grid item xs={12} sm={6}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <EmailOutlined sx={{ color: '#4a5565' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                ইমেইল
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {admin.email}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Location Information */}
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                            এলাকার তথ্য
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <LocationOnOutlined sx={{ color: '#4a5565' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            সিটি কর্পোরেশন
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {admin.cityCorporation?.name || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        জোন
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {admin.zone?.name || 'N/A'}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        ওয়ার্ড
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {admin.ward ? `Ward ${admin.ward.wardNumber}` : 'N/A'}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Complaint Statistics */}
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                            অভিযোগ পরিসংখ্যান
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#155dfc' }}>
                                        {admin.statistics.totalComplaints}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        মোট অভিযোগ
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#00a63e' }}>
                                        {admin.statistics.resolvedComplaints}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        সমাধান হয়েছে
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff7ed', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#d08700' }}>
                                        {admin.statistics.pendingComplaints}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        পেন্ডিং
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#eff6ff', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#155dfc' }}>
                                        {admin.statistics.inProgressComplaints}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        চলমান
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Account Information */}
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                            অ্যাকাউন্ট তথ্য
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CalendarTodayOutlined sx={{ color: '#4a5565' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            তৈরি হয়েছে
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {formatDate(admin.createdAt)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            {admin.lastLoginAt && (
                                <Grid item xs={12} sm={6}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CalendarTodayOutlined sx={{ color: '#4a5565' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                শেষ লগইন
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {formatDate(admin.lastLoginAt)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button variant="contained" onClick={onClose} sx={{ bgcolor: '#3fa564' }}>
                    বন্ধ করুন
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdminDetailsModal;
