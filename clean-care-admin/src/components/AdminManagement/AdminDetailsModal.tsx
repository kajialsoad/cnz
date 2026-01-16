import React, { useEffect, useState } from 'react';
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
    CircularProgress,
    Alert,
} from '@mui/material';
import Close from '@mui/icons-material/Close';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import type { UserWithStats } from '../../types/userManagement.types';
import { userManagementService } from '../../services/userManagementService';
import { useAuth } from '../../contexts/AuthContext';
import LockOutlined from '@mui/icons-material/LockOutlined';

interface AdminDetailsModalProps {
    open: boolean;
    onClose: () => void;
    admin: UserWithStats | null;
}

const AdminDetailsModal: React.FC<AdminDetailsModalProps> = ({ open, onClose, admin }) => {
    const { user: currentUser } = useAuth();
    const [adminDetails, setAdminDetails] = useState<UserWithStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && admin?.id) {
            fetchAdminDetails(admin.id);
        } else {
            setAdminDetails(null);
            setError(null);
        }
    }, [open, admin]);

    const fetchAdminDetails = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            // Use the service to fetch fresh details with cache buster
            // We append a timestamp to the ID-based request to bypass browser caching
            const response = await userManagementService.getUserById(id);
            setAdminDetails(response.user);
        } catch (err: any) {
            console.error('Error fetching admin details:', err);
            setError('Failed to load latest details');
            // Fallback to the passed prop if fetch fails, but warn user
        } finally {
            setLoading(false);
        }
    };

    if (!admin) return null;

    // Use adminDetails if available, otherwise fallback to admin prop (though we usually wait for load)
    // We can show the 'admin' prop immediately while loading 'adminDetails' to avoid layout shift,
    // but showing a spinner is explicit. Let's show admin prop data initially and update it.
    const displayAdmin = adminDetails || admin;

    const formatDate = (date: Date | string) => {
        if (!date) return 'N/A';
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
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}

                {error && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {error} - Showing cached data
                    </Alert>
                )}

                <Stack spacing={3} sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
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
                            {displayAdmin.firstName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {displayAdmin.firstName} {displayAdmin.lastName}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                    label={displayAdmin.role}
                                    size="small"
                                    sx={{ bgcolor: '#eff6ff', color: '#155dfc' }}
                                />
                                <Chip
                                    label={displayAdmin.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                    size="small"
                                    sx={{
                                        bgcolor: displayAdmin.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                                        color: displayAdmin.status === 'ACTIVE' ? '#008236' : '#dc2626'
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
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <PhoneOutlined sx={{ color: '#4a5565' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            ফোন নম্বর
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {displayAdmin.phone}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            {displayAdmin.email && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <EmailOutlined sx={{ color: '#4a5565' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                ইমেইল
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {displayAdmin.email}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                            )}
                            {displayAdmin.address && (
                                <Grid size={{ xs: 12 }}>
                                    <Stack direction="row" spacing={1} alignItems="flex-start">
                                        <LocationOnOutlined sx={{ color: '#4a5565', mt: 0.5 }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                ঠিকানা
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {displayAdmin.address}
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
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <LocationOnOutlined sx={{ color: '#4a5565' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            সিটি কর্পোরেশন
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {displayAdmin.cityCorporation?.name || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        জোন
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {displayAdmin.zone?.name || 'প্রযোজ্য নয়'}
                                    </Typography>
                                </Box>
                            </Grid>
                            {/* Only show "Ward" field if there is a primary ward */}
                            {displayAdmin.ward && (
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            ওয়ার্ড
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {`ওয়ার্ড ${displayAdmin.ward.wardNumber}`}
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>

                        {/* Show extra wards list. Title changes based on whether primary ward exists */}
                        {displayAdmin.extraWards && displayAdmin.extraWards.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    {displayAdmin.ward ? 'অতিরিক্ত ওয়ার্ড' : 'নির্ধারিত ওয়ার্ড সমূহ'}
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {displayAdmin.extraWards.map((w: any) => (
                                        <Chip
                                            key={w.id}
                                            label={`ওয়ার্ড ${w.wardNumber}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ mb: 0.5 }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Box>

                    <Divider />

                    {/* Complaint Statistics */}
                    {displayAdmin.statistics && (
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                অভিযোগ পরিসংখ্যান
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#155dfc' }}>
                                            {displayAdmin.statistics.totalComplaints || 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            মোট অভিযোগ
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#00a63e' }}>
                                            {displayAdmin.statistics.resolvedComplaints || 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            সমাধান হয়েছে
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff7ed', borderRadius: 2 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#d08700' }}>
                                            {displayAdmin.statistics.pendingComplaints || 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            পেন্ডিং
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#eff6ff', borderRadius: 2 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#155dfc' }}>
                                            {displayAdmin.statistics.inProgressComplaints || 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            চলমান
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    <Divider />

                    {/* Account Information */}
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                            অ্যাকাউন্ট তথ্য
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CalendarTodayOutlined sx={{ color: '#4a5565' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            তৈরি হয়েছে
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {formatDate(displayAdmin.createdAt)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            {displayAdmin.lastLoginAt && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CalendarTodayOutlined sx={{ color: '#4a5565' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                শেষ লগইন
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {formatDate(displayAdmin.lastLoginAt)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                            )}

                            {/* Password Display - ONLY for MASTER_ADMIN */}
                            {currentUser?.role === 'MASTER_ADMIN' && (
                                <Grid size={{ xs: 12, sm: 12 }}>
                                    <Divider sx={{ my: 1 }} />
                                    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1 }}>
                                        <LockOutlined sx={{ color: '#d32f2f', mt: 0.5 }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                পাসওয়ার্ড (Visible only to MASTER ADMIN)
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                                {displayAdmin.visiblePassword ? (
                                                    <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                                        {displayAdmin.visiblePassword}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#666' }}>
                                                        Hash: {displayAdmin.passwordHash?.substring(0, 20)}... (Reset to see actual)
                                                    </span>
                                                )}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Stack>
            </DialogContent >

            <DialogActions>
                <Button variant="contained" onClick={onClose} sx={{ bgcolor: '#3fa564' }}>
                    বন্ধ করুন
                </Button>
            </DialogActions>
        </Dialog >
    );
};

export default AdminDetailsModal;
