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
    ward: string;
    zone: string;
    role: UserRole;
    status: UserStatus;
    newPassword: string;
    confirmPassword: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    ward?: string;
    zone?: string;
    newPassword?: string;
    confirmPassword?: string;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
    user,
    open,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        ward: '',
        zone: '',
        role: 'ADMIN' as UserRole,
        status: 'ACTIVE' as UserStatus,
        newPassword: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Initialize form data when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email || '',
                phone: user.phone,
                ward: user.ward || '',
                zone: user.zone || '',
                role: user.role,
                status: user.status,
                newPassword: '',
                confirmPassword: '',
            });
            setErrors({});
            setSubmitError(null);
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
            if (formData.ward !== (user?.ward || '')) {
                updateData.ward = formData.ward || undefined;
            }
            if (formData.zone !== (user?.zone || '')) {
                updateData.zone = formData.zone || undefined;
            }
            if (formData.role !== user?.role) {
                updateData.role = formData.role;
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

                    {/* City Corporation and Thana - Read Only */}
                    {(user?.cityCorporation || user?.thana) && (
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            {user?.cityCorporation && (
                                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                                    <TextField
                                        fullWidth
                                        label="City Corporation"
                                        value={user.cityCorporation.name}
                                        disabled
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                        helperText="Cannot be changed"
                                    />
                                </Box>
                            )}

                            {user?.thana && (
                                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                                    <TextField
                                        fullWidth
                                        label="Thana"
                                        value={user.thana.name}
                                        disabled
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                        helperText="Cannot be changed"
                                    />
                                </Box>
                            )}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                label="Ward"
                                value={formData.ward}
                                onChange={handleChange('ward')}
                                error={!!errors.ward}
                                helperText={errors.ward}
                                disabled={loading}
                            />
                        </Box>

                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                label="Zone"
                                value={formData.zone}
                                onChange={handleChange('zone')}
                                error={!!errors.zone}
                                helperText={errors.zone}
                                disabled={loading}
                            />
                        </Box>
                    </Box>

                    {/* Change Password (Optional) */}
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

                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                select
                                label="Role"
                                value={formData.role}
                                onChange={handleChange('role')}
                                disabled={loading}
                            >
                                <MenuItem value="ADMIN">Admin</MenuItem>
                                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                                <MenuItem value="MASTER_ADMIN">Master Admin</MenuItem>
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
