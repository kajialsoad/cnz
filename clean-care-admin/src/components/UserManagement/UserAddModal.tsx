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
    Avatar,
} from '@mui/material';
import {
    Close as CloseIcon,
    PersonAdd as PersonAddIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import type { CreateUserDto, UserRole } from '../../types/userManagement.types';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import type { CityCorporation } from '../../services/cityCorporationService';
import type { Zone } from '../../services/zoneService';
import type { Ward } from '../../services/wardService';
import { useAuth } from '../../contexts/AuthContext';
import { superAdminService } from '../../services/superAdminService';

interface UserAddModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: CreateUserDto) => Promise<void>;
}

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    cityCorporationCode: string;
    zoneId: string;
    wardId: string;
    role: UserRole;
    avatar: string;
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
    avatar?: string;
}

const UserAddModal: React.FC<UserAddModalProps> = ({
    open,
    onClose,
    onSave,
}) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        cityCorporationCode: '',
        zoneId: '',
        wardId: '',
        role: 'CUSTOMER' as UserRole,
        avatar: '',
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // City Corporation, Zone, and Ward state
    const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [cityCorporationsLoading, setCityCorporationsLoading] = useState(false);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [wardsLoading, setWardsLoading] = useState(false);

    // Avatar upload state
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Fetch city corporations on mount
    useEffect(() => {
        fetchCityCorporations();
    }, []);

    // Fetch zones when city corporation changes
    useEffect(() => {
        if (formData.cityCorporationCode) {
            fetchZones(formData.cityCorporationCode);
        } else {
            setZones([]);
            setWards([]);
            setFormData(prev => ({ ...prev, zoneId: '', wardId: '' }));
        }
    }, [formData.cityCorporationCode]);

    // Fetch wards when zone changes
    useEffect(() => {
        if (formData.zoneId) {
            fetchWards(parseInt(formData.zoneId));
        } else {
            setWards([]);
            setFormData(prev => ({ ...prev, wardId: '' }));
        }
    }, [formData.zoneId]);

    const fetchCityCorporations = async () => {
        try {
            setCityCorporationsLoading(true);
            const response = await cityCorporationService.getCityCorporations('ACTIVE');
            setCityCorporations(response.cityCorporations || []);
        } catch (err: any) {
            console.error('Error fetching city corporations:', err);
            setCityCorporations([]);
            setSubmitError('Failed to load city corporations. Please try again.');
        } finally {
            setCityCorporationsLoading(false);
        }
    };

    const fetchZones = async (cityCorporationCode: string) => {
        try {
            setZonesLoading(true);

            // If SUPER_ADMIN, fetch only assigned zones
            if (currentUser?.role === 'SUPER_ADMIN') {
                try {
                    // Fetch assigned zones
                    const assignedZones = await superAdminService.getAssignedZones(Number(currentUser.id));
                    const cc = cityCorporations.find(c => c.code === cityCorporationCode);

                    // Filter and map to Zone interface
                    const validZones = assignedZones
                        .filter(az => az.zone.cityCorporationCode === cityCorporationCode)
                        .map(az => ({
                            id: az.zone.id,
                            zoneNumber: az.zone.zoneNumber,
                            name: az.zone.name,
                            cityCorporationId: cc?.id || 0,
                            status: 'ACTIVE' as const,
                            createdAt: az.assignedAt,
                            updatedAt: az.assignedAt
                        } as Zone));

                    setZones(validZones);
                    return; // Exit early
                } catch (err) {
                    console.error('Error fetching assigned zones:', err);
                    setZones([]);
                    return;
                }
            }

            const response = await zoneService.getZones({ cityCorporationCode, status: 'ACTIVE' });
            setZones(response.zones || []);
        } catch (err: any) {
            console.error('Error fetching zones:', err);
            setZones([]);
        } finally {
            setZonesLoading(false);
        }
    };

    const fetchWards = async (zoneId: number) => {
        try {
            setWardsLoading(true);
            const response = await wardService.getWards({ zoneId, status: 'ACTIVE' });
            setWards(response.wards || []);
        } catch (err: any) {
            console.error('Error fetching wards:', err);
            setWards([]);
        } finally {
            setWardsLoading(false);
        }
    };

    const validateEmail = (email: string): boolean => {
        if (!email) return true; // Email is optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        // Bangladesh phone format: 11 digits starting with 01
        const phoneRegex = /^01[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    };

    const validatePassword = (password: string): boolean => {
        // Password must be at least 8 characters
        return password.length >= 8;
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Required fields
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = 'Invalid phone format (must be 11 digits starting with 01)';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (!validatePassword(formData.password)) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // City Corporation is required
        if (!formData.cityCorporationCode) {
            newErrors.cityCorporationCode = 'City Corporation is required';
        }

        // Zone is required
        if (!formData.zoneId) {
            newErrors.zoneId = 'Zone is required';
        }

        // Ward is required
        if (!formData.wardId) {
            newErrors.wardId = 'Ward is required';
        }

        // Optional email validation
        if (formData.email && !validateEmail(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: keyof FormData) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error for this field when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({
                ...prev,
                [field]: undefined,
            }));
        }

        // Clear submit error
        if (submitError) {
            setSubmitError(null);
        }
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, avatar: 'Please select an image file' }));
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, avatar: 'Image size must be less than 5MB' }));
            return;
        }

        setAvatarFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Clear error
        setErrors(prev => ({ ...prev, avatar: undefined }));
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setFormData(prev => ({ ...prev, avatar: '' }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setSubmitError(null);

        try {
            // Upload avatar if file is selected
            let avatarUrl = '';
            if (avatarFile) {
                setUploadingAvatar(true);
                try {
                    const { userManagementService } = await import('../../services/userManagementService');
                    avatarUrl = await userManagementService.uploadAvatar(avatarFile);
                } catch (uploadError: any) {
                    console.error('Error uploading avatar:', uploadError);
                    setSubmitError('Failed to upload avatar. Please try again.');
                    setLoading(false);
                    setUploadingAvatar(false);
                    return;
                } finally {
                    setUploadingAvatar(false);
                }
            }

            // Prepare create data
            const createData: CreateUserDto = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                password: formData.password,
                role: formData.role,
            };

            // Add optional fields
            if (formData.email) {
                createData.email = formData.email;
            }
            if (formData.cityCorporationCode) {
                createData.cityCorporationCode = formData.cityCorporationCode;
            }
            if (avatarUrl) {
                createData.avatar = avatarUrl;
            }
            if (formData.zoneId) {
                createData.zoneId = parseInt(formData.zoneId);
            }
            if (formData.wardId) {
                createData.wardId = parseInt(formData.wardId);
            }

            await onSave(createData);

            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                cityCorporationCode: '',
                zoneId: '',
                wardId: '',
                role: 'CUSTOMER' as UserRole,
                avatar: '',
            });
            setAvatarFile(null);
            setAvatarPreview(null);

            onClose();
        } catch (error: any) {
            console.error('Error creating user:', error);
            setSubmitError(
                error.response?.data?.error?.message ||
                error.message ||
                'Failed to create user. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (!loading) {
            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                cityCorporationCode: '',
                zoneId: '',
                wardId: '',
                role: 'CUSTOMER' as UserRole,
                avatar: '',
            });
            setErrors({});
            setSubmitError(null);
            setAvatarFile(null);
            setAvatarPreview(null);
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 2,
                    },
                },
            }}
        >
            <DialogTitle sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Add New User
                    </Typography>
                    <IconButton onClick={handleCancel} size="small" disabled={loading}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Create a new user account
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {submitError && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
                        {submitError}
                    </Alert>
                )}

                <Box>
                    {/* Profile Picture Section */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Profile Picture (Optional)
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                        {/* Avatar Preview */}
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={avatarPreview || undefined}
                                sx={{
                                    width: 100,
                                    height: 100,
                                    bgcolor: '#4CAF50',
                                    fontSize: 36,
                                    fontWeight: 'bold',
                                }}
                            >
                                {!avatarPreview && formData.firstName?.[0]}{!avatarPreview && formData.lastName?.[0]}
                            </Avatar>
                            {uploadingAvatar && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'rgba(0,0,0,0.5)',
                                        borderRadius: '50%',
                                    }}
                                >
                                    <CircularProgress size={40} sx={{ color: 'white' }} />
                                </Box>
                            )}
                        </Box>

                        {/* Upload Controls */}
                        <Box sx={{ flex: 1 }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="avatar-upload-add"
                                type="file"
                                onChange={handleAvatarChange}
                                disabled={loading || uploadingAvatar}
                            />
                            <label htmlFor="avatar-upload-add">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    disabled={loading || uploadingAvatar}
                                    sx={{ mr: 1 }}
                                >
                                    Upload Photo
                                </Button>
                            </label>
                            {avatarPreview && (
                                <Button
                                    variant="text"
                                    color="error"
                                    onClick={handleRemoveAvatar}
                                    disabled={loading || uploadingAvatar}
                                >
                                    Remove
                                </Button>
                            )}
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                Recommended: Square image, max 5MB
                            </Typography>
                            {errors.avatar && (
                                <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                                    {errors.avatar}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Personal Information */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Personal Information
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={formData.firstName}
                                onChange={handleChange('firstName')}
                                error={!!errors.firstName}
                                helperText={errors.firstName}
                                disabled={loading}
                                required
                            />
                        </Box>

                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={formData.lastName}
                                onChange={handleChange('lastName')}
                                error={!!errors.lastName}
                                helperText={errors.lastName}
                                disabled={loading}
                                required
                            />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange('email')}
                                error={!!errors.email}
                                helperText={errors.email || 'Optional'}
                                disabled={loading}
                            />
                        </Box>

                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={formData.phone}
                                onChange={handleChange('phone')}
                                error={!!errors.phone}
                                helperText={errors.phone}
                                disabled={loading}
                                required
                            />
                        </Box>
                    </Box>

                    {/* Account Credentials */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                        Account Credentials
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange('password')}
                                error={!!errors.password}
                                helperText={errors.password || 'Minimum 8 characters'}
                                disabled={loading}
                                required
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange('confirmPassword')}
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword}
                                disabled={loading}
                                required
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Location Information */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                        Location Information
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                select
                                label="City Corporation"
                                value={formData.cityCorporationCode}
                                onChange={handleChange('cityCorporationCode')}
                                disabled={loading || cityCorporationsLoading}
                                error={!!errors.cityCorporationCode}
                                helperText={errors.cityCorporationCode || 'Required'}
                                required
                            >
                                <MenuItem value="">
                                    <em>Select City Corporation</em>
                                </MenuItem>
                                {cityCorporations.map((cc) => (
                                    <MenuItem key={cc.code} value={cc.code}>
                                        {cc.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                select
                                label="Zone"
                                value={formData.zoneId}
                                onChange={handleChange('zoneId')}
                                disabled={loading || zonesLoading || !formData.cityCorporationCode}
                                error={!!errors.zoneId}
                                helperText={
                                    errors.zoneId ||
                                    (!formData.cityCorporationCode
                                        ? "Select City Corporation first"
                                        : zonesLoading
                                            ? "Loading zones..."
                                            : zones.length === 0
                                                ? "No zones available"
                                                : "Required")
                                }
                                required
                            >
                                <MenuItem value="">
                                    <em>Select Zone</em>
                                </MenuItem>
                                {zones.map((zone) => (
                                    <MenuItem key={zone.id} value={zone.id.toString()}>
                                        {zone.name || `Zone ${zone.zoneNumber}`}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                select
                                label="Ward"
                                value={formData.wardId}
                                onChange={handleChange('wardId')}
                                disabled={loading || wardsLoading || !formData.zoneId}
                                error={!!errors.wardId}
                                helperText={
                                    errors.wardId ||
                                    (!formData.zoneId
                                        ? "Select Zone first"
                                        : wardsLoading
                                            ? "Loading wards..."
                                            : wards.length === 0
                                                ? "No wards available"
                                                : "Required")
                                }
                                required
                            >
                                <MenuItem value="">
                                    <em>Select Ward</em>
                                </MenuItem>
                                {wards.map((ward) => (
                                    <MenuItem key={ward.id} value={ward.id.toString()}>
                                        Ward {typeof ward.wardNumber === 'object' ? JSON.stringify(ward.wardNumber) : ward.wardNumber}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Box>


                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={handleCancel}
                    variant="outlined"
                    disabled={loading}
                    sx={{ textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                    sx={{
                        backgroundColor: '#4CAF50',
                        '&:hover': { backgroundColor: '#45a049' },
                        textTransform: 'none',
                    }}
                >
                    {loading ? 'Creating...' : 'Create User'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserAddModal;
