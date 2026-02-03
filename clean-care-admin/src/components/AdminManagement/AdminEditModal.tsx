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
import type { UserWithStats, UpdateUserDto, UserRole, UserStatus, Permissions } from '../../types/userManagement.types';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import { userManagementService } from '../../services/userManagementService';
import type { CityCorporation } from '../../services/cityCorporationService';
import type { Zone } from '../../services/zoneService';
import type { Ward } from '../../services/wardService';
import { useAuth } from '../../contexts/AuthContext';

interface AdminEditModalProps {
    admin: UserWithStats | null;
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
    cityCorporationCode: string;
    zoneId: string;
    wardId: string;
    role: UserRole;
    status: UserStatus;
    newPassword: string;
    confirmPassword: string;
    permissions: Permissions;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    cityCorporationCode?: string;
    wardId?: string;
    zoneId?: string;
    role?: string;
    newPassword?: string;
    confirmPassword?: string;
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

const AdminEditModal: React.FC<AdminEditModalProps> = ({
    admin,
    open,
    onClose,
    onSuccess,
}) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        designation: '',
        email: '',
        phone: '',
        whatsapp: '',
        joiningDate: '',
        address: '',
        cityCorporationCode: '',
        zoneId: '',
        wardId: '',
        role: 'ADMIN',
        status: 'ACTIVE',
        newPassword: '',
        confirmPassword: '',
        permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)),
    });

    const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [allWards, setAllWards] = useState<Ward[]>([]);
    const [cityCorporationsLoading, setCityCorporationsLoading] = useState(false);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [wardsLoading, setWardsLoading] = useState(false);

    // Avatar states
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Initialize data
    useEffect(() => {
        if (open && admin) {
            let parsedPermissions = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));

            // Try to parse permissions from admin data
            if (admin.permissions) {
                if (typeof admin.permissions === 'string') {
                    try {
                        const parsed = JSON.parse(admin.permissions);
                        // Merge with default ensuring all keys exist
                        parsedPermissions = {
                            ...DEFAULT_PERMISSIONS,
                            ...parsed,
                            features: {
                                ...DEFAULT_PERMISSIONS.features,
                                ...parsed.features
                            }
                        };
                    } catch (e) {
                        console.error("Failed to parse permissions string", e);
                    }
                } else {
                    parsedPermissions = {
                        ...DEFAULT_PERMISSIONS,
                        ...admin.permissions,
                        features: {
                            ...DEFAULT_PERMISSIONS.features,
                            ...admin.permissions.features
                        }
                    };
                }
            }

            setFormData({
                firstName: admin.firstName || '',
                lastName: admin.lastName || '',
                designation: admin.designation || '',
                email: admin.email || '',
                phone: admin.phone || '',
                whatsapp: admin.whatsapp || '',
                joiningDate: admin.joiningDate ? new Date(admin.joiningDate).toISOString().split('T')[0] : '',
                address: admin.address || '',
                cityCorporationCode: admin.cityCorporation?.code || admin.cityCorporationCode || '',
                zoneId: admin.zone?.id?.toString() || admin.zoneId?.toString() || '',
                wardId: admin.ward?.id?.toString() || admin.wardId?.toString() || '',
                role: admin.role,
                status: admin.status,
                newPassword: '',
                confirmPassword: '',
                permissions: parsedPermissions,
            });

            fetchCityCorporations();

            // Trigger cascading fetches
            const ccCode = admin.cityCorporation?.code || admin.cityCorporationCode;
            if (ccCode) {
                fetchZones(ccCode);
                fetchAllWards(ccCode);
                const zId = admin.zone?.id || admin.zoneId;
                if (zId) {
                    fetchWards(zId);
                }
            }

            setErrors({});
            setSubmitError(null);

            // Reset avatar states
            setAvatarFile(null);
            setAvatarPreview(admin.avatar || null);
        }
    }, [open, admin]);

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

    const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));

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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
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


    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        if (!formData.cityCorporationCode) newErrors.cityCorporationCode = 'City Corporation is required';
        if (!formData.zoneId) newErrors.zoneId = 'Zone is required';
        
        // Email validation if provided
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            newErrors.email = 'Invalid email format';
        }

        if (formData.newPassword && formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        }
        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !admin) return;

        setLoading(true);
        setSubmitError(null);

        try {
            let avatarUrl = admin.avatar;
            if (avatarFile) {
                try {
                    avatarUrl = await userManagementService.uploadAvatar(avatarFile);
                } catch (uploadErr) {
                    console.error('Error uploading avatar:', uploadErr);
                    // Decide whether to fail the whole update or proceed without avatar
                    // For now, let's throw to stop
                    throw new Error('Failed to upload profile picture');
                }
            }

            const updateData: UpdateUserDto = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                designation: formData.designation,
                email: formData.email,
                phone: formData.phone,
                whatsapp: formData.whatsapp,
                joiningDate: formData.joiningDate,
                address: formData.address,
                role: formData.role,
                status: formData.status,
                cityCorporationCode: formData.cityCorporationCode,
                zoneId: parseInt(formData.zoneId) as any,
                wardId: formData.wardId ? parseInt(formData.wardId) as any : undefined,
                permissions: formData.permissions,
                avatar: avatarUrl || undefined,
            };

            if (formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            await userManagementService.updateUser(admin.id, updateData);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error updating admin:', error);
            setSubmitError(error.message || 'Failed to update admin');
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
                    এডিট এডমিন
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
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <Avatar
                                src={avatarPreview || undefined}
                                sx={{ width: 120, height: 120, bgcolor: '#f0f0f0' }}
                            >
                                <CloudUploadIcon sx={{ fontSize: 50, color: '#bdbdbd' }} />
                            </Avatar>
                            <IconButton
                                onClick={handleAvatarClick}
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
                                <Typography variant="body2" fontWeight="500" mb={0.5}>নামের প্রথম অংশ</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="নামের প্রথম অংশ..."
                                    value={formData.firstName}
                                    onChange={handleChange('firstName')}
                                    error={!!errors.firstName}
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>নামের শেষ অংশ</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="নামের শেষ অংশ..."
                                    value={formData.lastName}
                                    onChange={handleChange('lastName')}
                                    error={!!errors.lastName}
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
                                    disabled={currentUser?.role !== 'MASTER_ADMIN'}
                                    size="small"
                                    SelectProps={{ displayEmpty: true }}
                                >
                                    <MenuItem value="" disabled>সিটি কর্পোরেশন সিলেক্ট করুন...</MenuItem>
                                    {/* Fallback for initial load to prevent out-of-range warning */}
                                    {formData.cityCorporationCode && !cityCorporations.find(c => c.code === formData.cityCorporationCode) && (
                                        <MenuItem value={formData.cityCorporationCode} sx={{ display: 'none' }}>
                                            {admin?.cityCorporation?.name || formData.cityCorporationCode}
                                        </MenuItem>
                                    )}
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
                                    disabled={currentUser?.role !== 'MASTER_ADMIN' || !formData.cityCorporationCode}
                                    size="small"
                                    SelectProps={{ displayEmpty: true }}
                                >
                                    <MenuItem value="" disabled>জোন সিলেক্ট করুন...</MenuItem>
                                    {/* Fallback for initial load to prevent out-of-range warning */}
                                    {formData.zoneId && !zones.find(z => z.id.toString() === formData.zoneId) && (
                                        <MenuItem value={formData.zoneId} sx={{ display: 'none' }}>
                                            {admin?.zone?.name || `Zone ${admin?.zone?.zoneNumber}` || formData.zoneId}
                                        </MenuItem>
                                    )}
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
                                    disabled={currentUser?.role !== 'MASTER_ADMIN' || !formData.cityCorporationCode}
                                    size="small"
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => {
                                            const { key, ...tagProps } = getTagProps({ index });
                                            return (
                                                <Chip
                                                    key={key}
                                                    label={`Ward ${option.wardNumber}`}
                                                    size="small"
                                                    {...tagProps}
                                                    disabled={currentUser?.role !== 'MASTER_ADMIN'} // Disable delete icon on chips
                                                />
                                            );
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

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" fontWeight="500" mb={0.5}>স্ট্যাটাস</Typography>
                                <TextField
                                    select
                                    fullWidth
                                    value={formData.status}
                                    onChange={handleChange('status')}
                                    size="small"
                                >
                                    <MenuItem value="ACTIVE">Active</MenuItem>
                                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                                    <MenuItem value="SUSPENDED">Suspended</MenuItem>
                                    <MenuItem value="PENDING">Pending</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={12}>
                                {currentUser?.role === 'MASTER_ADMIN' && (
                                    <>
                                        <Typography variant="body2" fontWeight="500" mb={0.5}>নতুন পাসওয়ার্ড (অপশনাল)</Typography>
                                        <TextField
                                            fullWidth
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.newPassword}
                                            onChange={handleChange('newPassword')}
                                            error={!!errors.newPassword}
                                            helperText={errors.newPassword}
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

                                        <Typography variant="body2" fontWeight="500" mb={0.5} mt={2}>পাসওয়ার্ড নিশ্চিত করুন</Typography>
                                        <TextField
                                            fullWidth
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={handleChange('confirmPassword')}
                                            error={!!errors.confirmPassword}
                                            helperText={errors.confirmPassword}
                                            size="small"
                                            placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                                        />
                                    </>
                                )}
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
                                    { label: 'মেসেজ টু সুপার এডমিন', key: 'canSendMessagesToAdmins' },
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

export default AdminEditModal;


