import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    TextField,
    MenuItem,
    IconButton,
    CircularProgress,
    Alert,
    InputAdornment,
    Switch,
    Avatar,
    Grid,
    Autocomplete,
    Chip,
} from '@mui/material';
import {
    Close as CloseIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    CloudUpload as CloudUploadIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import type { CreateUserDto, UserRole, Permissions } from '../../types/userManagement.types';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import { userManagementService } from '../../services/userManagementService';
import type { CityCorporation } from '../../services/cityCorporationService';
import type { Zone } from '../../services/zoneService';
import type { Ward } from '../../services/wardService';

interface AdminAddModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    firstName: string;
    lastName: string;
    designation: string;
    email: string;
    phone: string;
    whatsapp: string;
    joiningDate: string;
    address: string;
    password: string;
    confirmPassword: string;
    cityCorporationCode: string;
    zoneId: string;
    wardId: string;
    role: UserRole;
    permissions: Permissions;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    cityCorporationCode?: string;
    wardId?: string;
    zoneId?: string;
    role?: string;
}

const DEFAULT_PERMISSIONS: Permissions = {
    zones: [],
    wards: [],
    categories: [],
    features: {
        canViewComplaints: true,
        canApproveComplaints: false,
        canRejectComplaints: false,
        canMarkComplaintsPending: false,
        canEditComplaints: false,
        canDeleteComplaints: false,
        canViewUsers: true,
        canEditUsers: false,
        canDeleteUsers: false,
        canAddUsers: false,
        canViewAdmins: false,
        canEditAdmins: false,
        canDeleteAdmins: false,
        canAddAdmins: false,
        canViewMessages: true,
        canSendMessagesToUsers: false,
        canSendMessagesToAdmins: false,
        canViewAnalytics: false,
        canExportData: false,
        canDownloadReports: false,
        viewOnlyMode: false,
        canViewComplainantProfile: false,
        canViewAreaStats: false,
        canViewOwnPerformance: false,
        canShowReviews: false,
    },
};

const AdminAddModal: React.FC<AdminAddModalProps> = ({ open, onClose, onSuccess }) => {
    // Form State
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '.',
        designation: '',
        email: '',
        phone: '',
        whatsapp: '',
        joiningDate: new Date().toISOString().split('T')[0], // Default to today
        address: '',
        password: '',
        confirmPassword: '',
        cityCorporationCode: '',
        zoneId: '',
        wardId: '',
        role: 'ADMIN',
        permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)),
    });

    // Data State
    const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [allWards, setAllWards] = useState<Ward[]>([]);
    const [cityCorporationsLoading, setCityCorporationsLoading] = useState(false);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [wardsLoading, setWardsLoading] = useState(false);

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Fetch initial data
    useEffect(() => {
        if (open) {
            fetchCityCorporations();
            // Reset form
            setFormData({
                firstName: '',
                lastName: '.',
                designation: '',
                email: '',
                phone: '',
                whatsapp: '',
                joiningDate: new Date().toISOString().split('T')[0],
                address: '',
                password: '',
                confirmPassword: '',
                cityCorporationCode: '',
                zoneId: '',
                wardId: '',
                role: 'ADMIN',
                permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)),
            });
            setErrors({});
            setSubmitError(null);
        }
    }, [open]);

    // Fetch handlers
    const fetchCityCorporations = async () => {
        try {
            setCityCorporationsLoading(true);
            const response = await cityCorporationService.getCityCorporations('ACTIVE');
            setCityCorporations(response.cityCorporations || []);
        } catch (err) {
            console.error('Error fetching city corporations:', err);
        } finally {
            setCityCorporationsLoading(false);
        }
    };

    const fetchZones = async (cityCorporationCode: string) => {
        try {
            setZonesLoading(true);
            const response = await zoneService.getZones({ cityCorporationCode, status: 'ACTIVE' });
            setZones(response.zones || []);
        } catch (err) {
            console.error('Error fetching zones:', err);
        } finally {
            setZonesLoading(false);
        }
    };

    const fetchWards = async (zoneId: number) => {
        try {
            setWardsLoading(true);
            const response = await wardService.getWards({ zoneId, status: 'ACTIVE' });
            setWards(response.wards || []);
        } catch (err) {
            console.error('Error fetching wards:', err);
        } finally {
            setWardsLoading(false);
        }
    };

    const fetchAllWards = async (cityCorporationCode: string) => {
        try {
            const response = await wardService.getWards({ cityCorporationCode, status: 'ACTIVE' });
            setAllWards(response.wards || []);
        } catch (err) {
            console.error('Error fetching all wards:', err);
        }
    };

    // Change handlers
    const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));

        // Cascading selects logic
        if (field === 'cityCorporationCode') {
            setFormData(prev => ({
                ...prev,
                cityCorporationCode: value,
                zoneId: '',
                wardId: '',
                permissions: {
                    ...prev.permissions,
                    wards: []
                }
            }));
            fetchZones(value);
            fetchAllWards(value);
        } else if (field === 'zoneId') {
            setFormData(prev => ({ ...prev, zoneId: value, wardId: '' }));
            fetchWards(parseInt(value));
        }

        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Multi-Ward Selection Handler
    const handleWardSelection = (_: any, selectedWards: Ward[]) => {
        const wardIds = selectedWards.map(w => w.id);
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                wards: wardIds
            }
        }));
    };

    // Permission toggle handler with logic
    const handlePermissionToggle = (feature: keyof typeof DEFAULT_PERMISSIONS.features | 'actionApproval' | 'reportDownload') => {
        setFormData(prev => {
            const currentFeatures = { ...prev.permissions.features };

            if (feature === 'viewOnlyMode') {
                const newViewOnly = !currentFeatures.viewOnlyMode;
                if (newViewOnly) {
                    Object.keys(currentFeatures).forEach(k => {
                        if (k !== 'viewOnlyMode') (currentFeatures as any)[k] = false;
                    });
                }
                currentFeatures.viewOnlyMode = newViewOnly;
            }
            else if (feature === 'actionApproval') {
                const isCurrentlyOn = currentFeatures.canApproveComplaints;
                const newState = !isCurrentlyOn;
                currentFeatures.canApproveComplaints = newState;
                currentFeatures.canRejectComplaints = newState;
                currentFeatures.canMarkComplaintsPending = newState;
                currentFeatures.canEditComplaints = newState;
                currentFeatures.canEditUsers = newState;
                currentFeatures.canDeleteUsers = newState;
                if (newState) currentFeatures.viewOnlyMode = false;
            }
            else if (feature === 'reportDownload') {
                const newState = !currentFeatures.canDownloadReports;
                currentFeatures.canDownloadReports = newState;
                currentFeatures.canExportData = newState;
                currentFeatures.canViewAnalytics = newState;
                if (newState) currentFeatures.viewOnlyMode = false;
            }
            else {
                (currentFeatures as any)[feature] = !(currentFeatures as any)[feature];
                if ((currentFeatures as any)[feature]) currentFeatures.viewOnlyMode = false;
            }

            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    features: currentFeatures
                }
            };
        });
    };

    // Validation
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'Name is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (!formData.cityCorporationCode) newErrors.cityCorporationCode = 'City Corporation is required';
        if (!formData.zoneId) newErrors.zoneId = 'Zone is required';

        // Email validation if provided
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setSubmitError(null);

        try {
            const createData: CreateUserDto = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim() || 'Admin',
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim(),
                whatsapp: formData.whatsapp.trim() || undefined,
                joiningDate: formData.joiningDate || undefined, // Send as string, backend will convert
                address: formData.address.trim() || undefined,
                password: formData.password,
                role: formData.role,
                cityCorporationCode: formData.cityCorporationCode || undefined,
                zoneId: formData.zoneId ? parseInt(formData.zoneId) : undefined,
                wardId: formData.wardId ? parseInt(formData.wardId) : undefined,
                permissions: formData.permissions,
            };

            console.log('📤 Sending create admin data:', { ...createData, password: '***' });
            console.log('📤 Data types:', {
                firstName: typeof createData.firstName,
                lastName: typeof createData.lastName,
                email: typeof createData.email,
                phone: typeof createData.phone,
                whatsapp: typeof createData.whatsapp,
                joiningDate: typeof createData.joiningDate,
                address: typeof createData.address,
                password: typeof createData.password,
                role: typeof createData.role,
                cityCorporationCode: typeof createData.cityCorporationCode,
                zoneId: typeof createData.zoneId,
                wardId: typeof createData.wardId,
                permissions: typeof createData.permissions,
            });
            console.log('📤 Permissions structure:', JSON.stringify(createData.permissions, null, 2));

            await userManagementService.createUser(createData);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('❌ Error creating admin:', error);
            console.error('❌ Error response:', error.response);
            console.error('❌ Error response data:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            console.error('❌ Error config:', error.config);
            console.error('❌ Error request:', error.request);

            // Check if it's a network error
            if (!error.response) {
                console.error('❌ NETWORK ERROR: No response received from server');
                console.error('❌ This could be: CORS, timeout, or server crash');
                setSubmitError('Network error: Could not connect to server. Please check if the server is running.');
                setLoading(false);
                return;
            }

            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error?.message ||
                error.message ||
                'Failed to create admin';

            // Log validation errors if present
            if (error.response?.data?.errors) {
                console.error('❌ Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
            }

            setSubmitError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h6" fontWeight="bold">
                    নতুন এডমিন যোগ করুন
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>
                )}

                <Grid container spacing={2}>
                    {/* Left Column - Profile Image */}
                    <Grid size={{ xs: 12, md: 3 }} display="flex" flexDirection="column" alignItems="center">
                        <Box sx={{ position: 'relative', mb: 2 }}>
                            <Avatar
                                sx={{ width: 120, height: 120, bgcolor: '#f0f0f0' }}
                            >
                                <CloudUploadIcon sx={{ fontSize: 50, color: '#bdbdbd' }} />
                            </Avatar>
                            <IconButton
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    bgcolor: '#4caf50',
                                    color: 'white',
                                    '&:hover': { bgcolor: '#45a049' },
                                    padding: '4px'
                                }}
                                size="small"
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Typography variant="caption" color="text.secondary">প্রোফাইল ছবি</Typography>
                    </Grid>

                    {/* Right Column - Form Fields */}
                    <Grid size={{ xs: 12, md: 9 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>নাম</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="নাম লিখুন..."
                                    value={formData.firstName}
                                    onChange={handleChange('firstName')}
                                    error={!!errors.firstName}
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>পদবী</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="পদবী..."
                                    value={formData.designation}
                                    onChange={handleChange('designation')}
                                    size="small"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>ফোন</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="01XXXXXXXXX"
                                    value={formData.phone}
                                    onChange={handleChange('phone')}
                                    error={!!errors.phone}
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>হোয়াটসঅ্যাপ</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="01XXXXXXXXX"
                                    value={formData.whatsapp}
                                    onChange={handleChange('whatsapp')}
                                    size="small"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>ইমেইল</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="example@email.com"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>জয়েনিং ডেট</Typography>
                                <TextField
                                    fullWidth
                                    type="date"
                                    value={formData.joiningDate}
                                    onChange={handleChange('joiningDate')}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={12}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>ঠিকানা</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="পূর্ণ ঠিকানা..."
                                    value={formData.address}
                                    onChange={handleChange('address')}
                                    size="small"
                                    multiline
                                    rows={2}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>সিটি কর্পোরেশন</Typography>
                                <TextField
                                    select
                                    fullWidth
                                    value={formData.cityCorporationCode}
                                    onChange={handleChange('cityCorporationCode')}
                                    error={!!errors.cityCorporationCode}
                                    size="small"
                                    SelectProps={{ displayEmpty: true }}
                                >
                                    <MenuItem value="" disabled>সিটি কর্পোরেশন সিলেক্ট করুন...</MenuItem>
                                    {cityCorporations.map(cc => (
                                        <MenuItem key={cc.code} value={cc.code}>{cc.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>জোন</Typography>
                                <TextField
                                    select
                                    fullWidth
                                    value={formData.zoneId}
                                    onChange={handleChange('zoneId')}
                                    error={!!errors.zoneId}
                                    disabled={!formData.cityCorporationCode}
                                    size="small"
                                    SelectProps={{ displayEmpty: true }}
                                >
                                    <MenuItem value="" disabled>জোন সিলেক্ট করুন...</MenuItem>
                                    {zones.map(zone => (
                                        <MenuItem key={zone.id} value={zone.id.toString()}>
                                            {zone.name || `Zone ${zone.zoneNumber}`}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Additional Ward Access */}
                            <Grid size={12}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>অ্যাক্সেস এরিয়া (ওয়ার্ড)</Typography>
                                <Autocomplete
                                    multiple
                                    options={allWards}
                                    getOptionLabel={(option) => `Ward ${option.wardNumber}${option.zone ? ` (Zone ${option.zone.zoneNumber})` : ''}`}
                                    value={allWards.filter(w => formData.permissions.wards.includes(w.id))}
                                    onChange={handleWardSelection}
                                    disabled={!formData.cityCorporationCode}
                                    size="small"
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => {
                                            const { key, ...chipProps } = getTagProps({ index });
                                            return <Chip key={key} label={`Ward ${option.wardNumber}`} size="small" {...chipProps} />;
                                        })
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder={formData.permissions.wards.length > 0 ? "" : "অতিরিক্ত ওয়ার্ড সিলেক্ট করুন..."}
                                        />
                                    )}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    নোট: প্রাইমারি জোনের বাইরের ওয়ার্ড বা অতিরিক্ত ওয়ার্ড সিলেক্ট করা যাবে।
                                </Typography>
                            </Grid>

                            <Grid size={12}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>পাসওয়ার্ড</Typography>
                                <TextField
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange('password')}
                                    error={!!errors.password}
                                    size="small"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Permissions Section */}
                    <Grid size={12}>
                        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mt: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" mb={2}>পারমিশন ও এক্সেস কন্ট্রোল</Typography>
                            <Grid container spacing={2}>
                                {[
                                    { label: 'মেসেজ টু ইউজার', key: 'canSendMessagesToUsers' },
                                    { label: 'মেসেজ টু সুপার এডমিন', key: 'canSendMessagesToAdmins' }, // Updated label
                                    { label: 'অভিযোগকারীর প্রোফাইল', key: 'canViewComplainantProfile' },
                                    { label: 'এরিয়া স্ট্যাটাস', key: 'canViewAreaStats' },
                                    { label: 'নিজের পারফরমেন্স', key: 'canViewOwnPerformance' },
                                    { label: 'কাস্টমার রিভিউ', key: 'canShowReviews' },
                                    { label: 'রিপোর্ট ডাউনলোড', key: 'reportDownload' },
                                    { label: 'একশন এপ্রুভাল', key: 'actionApproval' },
                                    { label: 'ভিউ অনলি', key: 'viewOnlyMode' },
                                ].map((item) => {
                                    let isChecked = false;
                                    if (item.key === 'actionApproval') {
                                        isChecked = formData.permissions.features.canApproveComplaints;
                                    } else if (item.key === 'reportDownload') {
                                        isChecked = formData.permissions.features.canDownloadReports;
                                    } else {
                                        isChecked = !!formData.permissions.features[item.key as keyof typeof DEFAULT_PERMISSIONS.features];
                                    }

                                    const isDisabled = formData.permissions.features.viewOnlyMode && item.key !== 'viewOnlyMode';

                                    return (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.key}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" p={1} bgcolor="white" borderRadius={1} border="1px solid #eee">
                                                <Typography variant="body2" color={isDisabled ? 'text.disabled' : 'text.primary'}>{item.label}</Typography>
                                                <Switch
                                                    checked={isChecked}
                                                    onChange={() => handlePermissionToggle(item.key as any)}
                                                    color="success"
                                                    size="small"
                                                    disabled={isDisabled}
                                                />
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, display: 'flex', gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    sx={{ borderColor: '#ddd', color: '#666' }}
                >
                    বাতিল
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="success"
                    fullWidth
                    disabled={loading}
                    sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'সংরক্ষণ করুন'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdminAddModal;


