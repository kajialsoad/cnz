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
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import ConfirmDialog from '../common/ConfirmDialog';
import type { UserWithStats, UpdateUserDto, UserRole, UserStatus } from '../../types/userManagement.types';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import type { CityCorporation } from '../../services/cityCorporationService';
import type { Zone } from '../../services/zoneService';
import type { Ward } from '../../services/wardService';
import { useAuth } from '../../contexts/AuthContext';
import { superAdminService } from '../../services/superAdminService';

interface UserEditModalProps {
    user: UserWithStats | null;
    open: boolean;
    onClose: () => void;
    onSave: (data: UpdateUserDto) => Promise<void>;
}

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cityCorporationCode: string;
    zoneId: string;
    wardId: string;
    status: UserStatus;
    newPassword: string;
    confirmPassword: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    cityCorporationCode?: string;
    wardId?: string;
    zoneId?: string;
    newPassword?: string;
    confirmPassword?: string;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
    user,
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
        cityCorporationCode: '',
        zoneId: '',
        wardId: '',
        status: 'ACTIVE' as UserStatus,
        newPassword: '',
        confirmPassword: '',
    });

    // City Corporation, Zone, and Ward state
    const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [cityCorporationsLoading, setCityCorporationsLoading] = useState(false);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [wardsLoading, setWardsLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

    // Initialize form data when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email || '',
                phone: user.phone,
                cityCorporationCode: user.cityCorporation?.code || '',
                zoneId: user.zone?.id?.toString() || '',
                wardId: user.ward?.id?.toString() || '',
                status: user.status,
                newPassword: '',
                confirmPassword: '',
            });
            setErrors({});
            setSubmitError(null);

            // Trigger fetches if data exists
            if (user.cityCorporation?.code) {
                fetchZones(user.cityCorporation.code);
            }
            if (user.zone?.id) {
                fetchWards(user.zone.id);
            }
        }
    }, [user]);

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

        // Optional email validation
        if (formData.email && !validateEmail(formData.email)) {
            newErrors.email = 'Invalid email format';
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

        // Password validation (optional - only if user wants to change password)
        if (formData.newPassword || formData.confirmPassword) {
            if (formData.newPassword.length < 8) {
                newErrors.newPassword = 'Password must be at least 8 characters';
            }
            if (formData.newPassword !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
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

    const handleSubmit = async (skipConfirmation = false) => {
        if (!validateForm()) {
            return;
        }

        // Check if status is being changed to a destructive state
        const isStatusChanging = formData.status !== user?.status;
        const isDestructiveStatus = formData.status === 'SUSPENDED' || formData.status === 'INACTIVE';

        if (isStatusChanging && isDestructiveStatus && !skipConfirmation) {
            setShowConfirmDialog(true);
            return;
        }

        setLoading(true);
        setSubmitError(null);

        try {
            // Prepare update data (only include changed fields)
            const updateData: UpdateUserDto = {};

            if (formData.firstName !== user?.firstName) {
                updateData.firstName = formData.firstName;
            }
            if (formData.lastName !== user?.lastName) {
                updateData.lastName = formData.lastName;
            }
            if (formData.email !== (user?.email || '')) {
                updateData.email = formData.email || undefined;
            }
            if (formData.phone !== user?.phone) {
                updateData.phone = formData.phone;
            }
            if (formData.cityCorporationCode !== user?.cityCorporation?.code) {
                updateData.cityCorporationCode = formData.cityCorporationCode;
            }
            // Use zoneId and wardId for updates logic
            if (formData.zoneId !== user?.zone?.id?.toString()) {
                (updateData as any).zoneId = parseInt(formData.zoneId);
            }
            if (formData.wardId !== user?.ward?.id?.toString()) {
                (updateData as any).wardId = parseInt(formData.wardId);
            }

            if (formData.status !== user?.status) {
                updateData.status = formData.status;
            }
            // Add password if provided
            if (formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            await onSave(updateData);
            onClose();
        } catch (error: any) {
            console.error('Error updating user:', error);
            setSubmitError(
                error.response?.data?.error?.message ||
                error.message ||
                'Failed to update user. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmStatusChange = () => {
        setShowConfirmDialog(false);
        handleSubmit(true);
    };

    const handleCancelStatusChange = () => {
        setShowConfirmDialog(false);
    };

    const handleCancel = () => {
        if (!loading) {
            onClose();
        }
    };

    if (!user) return null;

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
                        Edit User
                    </Typography>
                    <IconButton onClick={handleCancel} size="small" disabled={loading}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Update user information and account settings
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {submitError && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
                        {submitError}
                    </Alert>
                )}

                <Box>
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
                                helperText={errors.email}
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
                                helperText={errors.cityCorporationCode}
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

                    {/* Change Password (Optional) - Only visible to MASTER_ADMIN */}
                    {currentUser?.role === 'MASTER_ADMIN' && (
                        <>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                                Change Password (Optional)
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                                    <TextField
                                        fullWidth
                                        label="New Password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.newPassword}
                                        onChange={handleChange('newPassword')}
                                        error={!!errors.newPassword}
                                        helperText={errors.newPassword || 'Leave blank to keep current password'}
                                        disabled={loading}
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
                                        label="Confirm New Password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={handleChange('confirmPassword')}
                                        error={!!errors.confirmPassword}
                                        helperText={errors.confirmPassword}
                                        disabled={loading}
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
                        </>
                    )}

                    {/* Account Settings */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                        Account Settings
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                select
                                label="Status"
                                value={formData.status}
                                onChange={handleChange('status')}
                                disabled={loading}
                            >
                                <MenuItem value="ACTIVE">Active</MenuItem>
                                <MenuItem value="INACTIVE">Inactive</MenuItem>
                                <MenuItem value="SUSPENDED">Suspended</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
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
                    onClick={() => handleSubmit()}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    sx={{
                        backgroundColor: '#4CAF50',
                        '&:hover': { backgroundColor: '#45a049' },
                        textTransform: 'none',
                    }}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>

            {/* Confirmation Dialog for Destructive Status Changes */}
            <ConfirmDialog
                open={showConfirmDialog}
                title={formData.status === 'SUSPENDED' ? 'Suspend User' : 'Deactivate User'}
                message={
                    formData.status === 'SUSPENDED'
                        ? `Are you sure you want to suspend ${user?.firstName} ${user?.lastName}? This will immediately block their access to the system.`
                        : `Are you sure you want to deactivate ${user?.firstName} ${user?.lastName}? They will not be able to access the system.`
                }
                confirmText="Confirm"
                cancelText="Cancel"
                severity="warning"
                onConfirm={handleConfirmStatusChange}
                onCancel={handleCancelStatusChange}
            />
        </Dialog>
    );
};

export default UserEditModal;
