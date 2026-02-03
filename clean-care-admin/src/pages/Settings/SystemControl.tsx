import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Card, CardContent } from '@mui/material';
import { SaveOutlined, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/common/Layout/MainLayout';
import { systemConfigService } from '../../services/systemConfigService';
import { toast } from 'react-hot-toast';

const SystemControl = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Config states
    const [dailyLimit, setDailyLimit] = useState('20');
    const [wardImageLimit, setWardImageLimit] = useState('10'); // Default 10

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            // Fetch daily limit
            const dailyResponse = await systemConfigService.getConfig('daily_complaint_limit');
            if (dailyResponse.success && dailyResponse.data) {
                setDailyLimit(dailyResponse.data.value);
            }

            // Fetch ward image limit
            const wardResponse = await systemConfigService.getConfig('ward_image_limit');
            if (wardResponse.success && wardResponse.data) {
                setWardImageLimit(wardResponse.data.value);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        let hasError = false;

        // Validation
        if (!dailyLimit || isNaN(Number(dailyLimit)) || Number(dailyLimit) < 1) {
            toast.error('Daily Limit: Please enter a valid positive number');
            hasError = true;
        }
        if (!wardImageLimit || isNaN(Number(wardImageLimit)) || Number(wardImageLimit) < 1) {
            toast.error('Image Limit: Please enter a valid positive number');
            hasError = true;
        }

        if (hasError) return;

        try {
            setUpdating(true);

            // Update daily limit
            await systemConfigService.updateConfig(
                'daily_complaint_limit',
                dailyLimit,
                'Maximum number of complaints allowed per user per day'
            );

            // Update ward image limit
            await systemConfigService.updateConfig(
                'ward_image_limit',
                wardImageLimit,
                'Maximum number of images allowed per complaint for a ward'
            );

            toast.success('Configurations updated successfully');
        } catch (error) {
            console.error('Error updating config:', error);
            toast.error('Failed to update configurations');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <MainLayout title="System Control">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress />
                </Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="System Control">
            <Box sx={{ px: 3, py: 4, background: '#f8faf9', minHeight: '100vh' }}>
                <Box sx={{ mb: 3 }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/settings')}
                        sx={{ mb: 2, color: '#4a5565' }}
                    >
                        Back to Settings
                    </Button>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e2939' }}>
                        সিস্টেম কন্ট্রোল (System Control)
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#4a5565', mt: 1 }}>
                        সিস্টেমের গুরুত্বপূর্ণ সেটিংস কনফিগার করুন
                    </Typography>
                </Box>

                <Card sx={{ maxWidth: 600, borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                            অভিযোগের সীমা (Complaint Limits)
                        </Typography>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#4a5565' }}>
                                দৈনিক অভিযোগের সীমা (Daily Complaint Limit)
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                value={dailyLimit}
                                onChange={(e) => setDailyLimit(e.target.value)}
                                helperText="একজন ব্যবহারকারী প্রতিদিন কতগুলো অভিযোগ করতে পারবেন"
                                InputProps={{ inputProps: { min: 1 } }}
                            />
                        </Box>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#4a5565' }}>
                                ওয়ার্ডের ছবির সীমা (Ward Image Limit)
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                value={wardImageLimit}
                                onChange={(e) => setWardImageLimit(e.target.value)}
                                helperText="প্রতি অভিযোগের জন্য ওয়ার্ডে সর্বোচ্চ কতগুলো ছবি আপলোড করা যাবে"
                                InputProps={{ inputProps: { min: 1 } }}
                            />
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={updating ? <CircularProgress size={20} color="inherit" /> : <SaveOutlined />}
                            onClick={handleSave}
                            disabled={updating}
                            sx={{
                                background: '#3fa564',
                                '&:hover': { background: '#2e804b' },
                                py: 1.5,
                                px: 4
                            }}
                        >
                            {updating ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        </MainLayout>
    );
};

export default SystemControl;


