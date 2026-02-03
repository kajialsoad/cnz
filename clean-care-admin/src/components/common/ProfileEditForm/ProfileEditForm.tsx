/**
 * ProfileEditForm Component
 * Form for editing user profile information
 * 
 * Features:
 * - Form fields for first name and last name
 * - Form validation
 * - Save and cancel buttons
 * - Integration with AvatarUpload component
 * - Form submission handling
 * - Success/error message display
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.3, 7.4, 7.5
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
    Box,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Typography,
    Paper,
    Divider,
    useTheme,
    useMediaQuery,
    Snackbar,
    IconButton,
    InputAdornment,
    LinearProgress,
} from '@mui/material';
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import AvatarUpload from '../AvatarUpload/AvatarUpload';
import { useProfileUpdate } from '../../../hooks/useProfileUpdate';
import { useAuth } from '../../../contexts/AuthContext';
import { profileService } from '../../../services/profileService';
import type { UserProfile, ProfileUpdateData } from '../../../types/profile.types';
import { fadeIn, slideInUp } from '../../../styles/animations';

interface ProfileEditFormProps {
    /** Initial profile data */
    initialData: UserProfile;
    /** Callback when save is successful */
    onSave: (data: ProfileUpdateData) => Promise<void>;
    /** Callback when cancel is clicked */
    onCancel: () => void;
}

interface FormData {
    firstName: string;
    lastName: string;
    avatar?: string;
    ward?: string;
    zone?: string;
    address?: string;
    email?: string;
    phone?: string;
    newPassword?: string;
    confirmPassword?: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    ward?: string;
    zone?: string;
    address?: string;
    email?: string;
    phone?: string;
    newPassword?: string;
    confirmPassword?: string;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
    initialData,
    onSave,
    onCancel,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isLandscape = useMediaQuery('(orientation: landscape)');
    const { user } = useAuth();
    const isMasterAdmin = user?.role === 'MASTER_ADMIN';

    // Helper to normalize values (handle potential objects from backend)
    const normalizeValue = useCallback((value: any): string => {
        if (!value) return '';
        if (typeof value === 'object') {
            return value.name ||
                (value.wardNumber ? String(value.wardNumber) : '') ||
                (value.zoneNumber ? String(value.zoneNumber) : '') ||
                (value.number ? String(value.number) : '') ||
                '';
        }
        return String(value);
    }, []);

    // Form state
    const [formData, setFormData] = useState<FormData>({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        avatar: initialData.avatar,
        ward: normalizeValue(initialData.ward),
        zone: normalizeValue(initialData.zone),
        address: initialData.address || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        newPassword: '',
        confirmPassword: '',
    });

    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { isUpdating, updateError, clearUpdateError } = useProfileUpdate({
        onSuccess: () => {
            setShowSuccess(true);
        },
        onError: (error) => {
            setErrorMessage(error);
            setShowError(true);
        },
    });

    // Debounce timer ref
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Get user initials for avatar (memoized for performance)
     */
    const userInitials = useMemo(() => {
        const firstInitial = formData.firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = formData.lastName?.charAt(0)?.toUpperCase() || '';
        return `${firstInitial}${lastInitial}` || '?';
    }, [formData.firstName, formData.lastName]);

    /**
     * Calculate password strength
     */
    const passwordStrength = useMemo(() => {
        const password = formData.newPassword || '';
        if (!password) return { score: 0, label: '', color: '' };

        let score = 0;

        // Length check
        if (password.length >= 8) score += 25;
        if (password.length >= 12) score += 25;

        // Character variety checks
        if (/[a-z]/.test(password)) score += 15;
        if (/[A-Z]/.test(password)) score += 15;
        if (/[0-9]/.test(password)) score += 10;
        if (/[^a-zA-Z0-9]/.test(password)) score += 10;

        let label = '';
        let color = '';

        if (score < 40) {
            label = 'Weak';
            color = theme.palette.error.main;
        } else if (score < 70) {
            label = 'Medium';
            color = theme.palette.warning.main;
        } else {
            label = 'Strong';
            color = theme.palette.success.main;
        }

        return { score, label, color };
    }, [formData.newPassword, theme]);

    /**
     * Toggle password visibility
     */
    const handleTogglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    /**
     * Toggle confirm password visibility
     */
    const handleToggleConfirmPasswordVisibility = useCallback(() => {
        setShowConfirmPassword(prev => !prev);
    }, []);

    /**
     * Validate form field
     */
    const validateField = useCallback((name: keyof FormData, value: string): string | undefined => {
        switch (name) {
            case 'firstName':
                if (!value.trim()) {
                    return 'First name is required';
                }
                if (value.trim().length < 2) {
                    return 'First name must be at least 2 characters';
                }
                if (value.trim().length > 50) {
                    return 'First name must not exceed 50 characters';
                }
                // Regex validation removed as requested
                break;

            case 'lastName':
                if (!value.trim()) {
                    return 'Last name is required';
                }
                if (value.trim().length < 2) {
                    return 'Last name must be at least 2 characters';
                }
                if (value.trim().length > 50) {
                    return 'Last name must not exceed 50 characters';
                }
                // Regex validation removed as requested
                break;

            case 'email':
                if (!value.trim()) {
                    return 'Email is required';
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return 'Invalid email address';
                }
                break;

            case 'phone':
                if (!value.trim()) {
                    return 'Phone number is required';
                }
                if (!/^\d{11}$/.test(value.replace(/\D/g, ''))) {
                    return 'Phone number must be 11 digits';
                }
                break;

            case 'ward':
                if (value && value.trim().length > 20) {
                    return 'Ward must not exceed 20 characters';
                }
                break;

            case 'zone':
                if (value && value.trim().length > 20) {
                    return 'Zone must not exceed 20 characters';
                }
                break;

            case 'address':
                if (value && value.trim().length > 200) {
                    return 'Address must not exceed 200 characters';
                }
                break;

            case 'newPassword':
                if (value && value.length > 0) {
                    if (value.length < 8) {
                        return 'Password must be at least 8 characters';
                    }
                    if (value.length > 100) {
                        return 'Password must not exceed 100 characters';
                    }
                }
                break;

            case 'confirmPassword':
                if (formData.newPassword && value !== formData.newPassword) {
                    return 'Passwords do not match';
                }
                break;
        }
        return undefined;
    }, [formData.newPassword]);

    /**
     * Validate entire form
     */
    const validateForm = useCallback((): boolean => {
        const errors: FormErrors = {};

        // Validate required fields
        const firstNameError = validateField('firstName', formData.firstName);
        if (firstNameError) errors.firstName = firstNameError;

        const lastNameError = validateField('lastName', formData.lastName);
        if (lastNameError) errors.lastName = lastNameError;

        const emailError = validateField('email', formData.email!);
        if (emailError) errors.email = emailError;

        const phoneError = validateField('phone', formData.phone!);
        if (phoneError) errors.phone = phoneError;

        // Validate optional fields
        if (formData.ward) {
            const wardError = validateField('ward', formData.ward);
            if (wardError) errors.ward = wardError;
        }

        if (formData.zone) {
            const zoneError = validateField('zone', formData.zone);
            if (zoneError) errors.zone = zoneError;
        }

        if (formData.address) {
            const addressError = validateField('address', formData.address);
            if (addressError) errors.address = addressError;
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, validateField]);

    /**
     * Handle input change with debounced validation
     */
    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error for this field immediately
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[name as keyof FormErrors];
            return newErrors;
        });

        // Debounce validation (300ms delay)
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            const error = validateField(name as keyof FormData, value);
            if (error) {
                setFormErrors((prev) => ({ ...prev, [name]: error }));
            }
        }, 300);
    }, [validateField]);

    /**
     * Handle input blur (validate on blur)
     */
    const handleInputBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        const error = validateField(name as keyof FormData, value);
        if (error) {
            setFormErrors((prev) => ({ ...prev, [name]: error }));
        }
    }, [validateField]);

    /**
     * Handle avatar upload
     */
    const handleAvatarUpload = useCallback(async (url: string) => {
        setFormData((prev) => ({ ...prev, avatar: url }));
    }, []);

    /**
     * Check if form has changes (memoized for performance)
     */
    const hasChanges = useMemo((): boolean => {
        return (
            formData.firstName !== initialData.firstName ||
            formData.lastName !== initialData.lastName ||
            formData.avatar !== initialData.avatar ||
            formData.ward !== normalizeValue(initialData.ward) ||
            formData.zone !== normalizeValue(initialData.zone) ||
            formData.address !== (initialData.address || '') ||
            formData.email !== initialData.email ||
            formData.phone !== initialData.phone ||
            (formData.newPassword && formData.newPassword.length > 0)
        );
    }, [formData, initialData, normalizeValue]);


    /**
     * Handle form submission
     */
    const handleSubmit = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();

        // Validate form
        if (!validateForm()) {
            setErrorMessage('Please fix the validation errors');
            setShowError(true);
            return;
        }

        // Check if there are changes
        if (!hasChanges) {
            setErrorMessage('No changes to save');
            setShowError(true);
            return;
        }

        setIsSaving(true);
        clearUpdateError();

        try {
            // Check if only password is being changed
            const isOnlyPasswordChange =
                formData.newPassword &&
                formData.newPassword.trim().length > 0 &&
                formData.firstName === initialData.firstName &&
                formData.lastName === initialData.lastName &&
                formData.avatar === initialData.avatar &&
                formData.ward === normalizeValue(initialData.ward) &&
                formData.zone === normalizeValue(initialData.zone) &&
                formData.address === (initialData.address || '') &&
                formData.email === initialData.email &&
                formData.phone === initialData.phone;

            // Prepare update data (only include changed fields)
            const updateData: ProfileUpdateData = {};

            if (formData.firstName !== initialData.firstName) {
                updateData.firstName = formData.firstName.trim();
            }
            if (formData.lastName !== initialData.lastName) {
                updateData.lastName = formData.lastName.trim();
            }
            if (formData.avatar !== initialData.avatar) {
                updateData.avatar = formData.avatar;
            }
            if (formData.ward !== normalizeValue(initialData.ward)) {
                updateData.ward = formData.ward?.trim() || undefined;
            }
            if (formData.zone !== normalizeValue(initialData.zone)) {
                updateData.zone = formData.zone?.trim() || undefined;
            }
            if (formData.address !== (initialData.address || '')) {
                updateData.address = formData.address?.trim() || undefined;
            }
            if (formData.email !== initialData.email) {
                updateData.email = formData.email.trim();
            }
            if (formData.phone !== initialData.phone) {
                updateData.phone = formData.phone.trim();
            }

            // Call the onSave callback only if there are profile changes
            if (Object.keys(updateData).length > 0) {
                await onSave(updateData);
            }

            // Handle password change separately if provided
            if (formData.newPassword && formData.newPassword.trim().length > 0) {
                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                // Change password
                await profileService.changePassword(initialData.id, formData.newPassword);

                // Clear password fields after successful change
                setFormData(prev => ({
                    ...prev,
                    newPassword: '',
                    confirmPassword: '',
                }));
            }

            // Show success message
            setShowSuccess(true);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update profile';
            setErrorMessage(message);
            setShowError(true);
        } finally {
            setIsSaving(false);
        }
    }, [formData, initialData, validateForm, hasChanges, onSave, clearUpdateError, normalizeValue]);

    /**
     * Handle cancel
     */
    const handleCancel = useCallback(() => {
        // Reset form to initial data
        setFormData({
            firstName: initialData.firstName || '',
            lastName: initialData.lastName || '',
            avatar: initialData.avatar,
            ward: normalizeValue(initialData.ward),
            zone: normalizeValue(initialData.zone),
            address: initialData.address || '',
            email: initialData.email || '',
            phone: initialData.phone || '',
            newPassword: '',
            confirmPassword: '',
        });
        setFormErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        clearUpdateError();
        onCancel();
    }, [initialData, onCancel, clearUpdateError, normalizeValue]);

    /**
     * Close success snackbar
     */
    const handleCloseSuccess = useCallback(() => {
        setShowSuccess(false);
    }, []);

    /**
     * Close error snackbar
     */
    const handleCloseError = useCallback(() => {
        setShowError(false);
        setErrorMessage('');
    }, []);

    /**
     * Cleanup debounce timer on unmount
     */
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            role="form"
            aria-label="Profile edit form"
            sx={{
                animation: `${fadeIn} 0.3s ease-in-out`,
            }}
        >
            {/* Avatar Upload Section */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: isMobile && isLandscape ? 2 : 3,
                    px: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 100%)`,
                }}
            >
                <AvatarUpload
                    currentAvatar={formData.avatar}
                    onUpload={handleAvatarUpload}
                    size={isMobile ? (isLandscape ? 80 : 100) : isTablet ? 110 : 120}
                    initials={userInitials}
                    disabled={isSaving || isUpdating}
                />
                <Typography
                    variant="caption"
                    sx={{
                        mt: isMobile && isLandscape ? 1 : 2,
                        color: theme.palette.text.secondary,
                        textAlign: 'center',
                        px: 2,
                    }}
                >
                    {isMobile ? 'Tap to upload' : 'Click or drag to upload a new profile picture'}
                </Typography>
            </Box>

            <Divider />

            {/* Form Fields */}
            <Box sx={{ p: isMobile ? (isLandscape ? 1.5 : 2) : isTablet ? 2.5 : 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: isMobile ? (isLandscape ? 1.5 : 2) : isTablet ? 2.5 : 3,
                        backgroundColor: theme.palette.background.default,
                        borderRadius: 2,
                        animation: `${slideInUp} 0.4s ease-in-out`,
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 600,
                            mb: 2,
                            color: theme.palette.text.primary,
                        }}
                    >
                        Personal Information
                    </Typography>

                    {/* First Name */}
                    <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        error={!!formErrors.firstName}
                        helperText={formErrors.firstName}
                        disabled={isSaving || isUpdating}
                        required
                        sx={{
                            mb: 2,
                            '& .MuiInputBase-root': {
                                minHeight: isMobile ? 48 : 40, // Touch-friendly height
                            },
                        }}
                        slotProps={{
                            input: {
                                inputProps: {
                                    maxLength: 50,
                                    'aria-label': 'First name',
                                    'aria-required': 'true',
                                    'aria-invalid': !!formErrors.firstName,
                                    'aria-describedby': formErrors.firstName ? 'firstName-error' : undefined,
                                },
                            },
                            formHelperText: {
                                id: 'firstName-error',
                                role: 'alert',
                            },
                        }}
                    />

                    {/* Last Name */}
                    <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        error={!!formErrors.lastName}
                        helperText={formErrors.lastName}
                        disabled={isSaving || isUpdating}
                        required
                        sx={{
                            mb: 2,
                            '& .MuiInputBase-root': {
                                minHeight: isMobile ? 48 : 40,
                            },
                        }}
                        slotProps={{
                            input: {
                                inputProps: {
                                    maxLength: 50,
                                    'aria-label': 'Last name',
                                    'aria-required': 'true',
                                    'aria-invalid': !!formErrors.lastName,
                                    'aria-describedby': formErrors.lastName ? 'lastName-error' : undefined,
                                },
                            },
                            formHelperText: {
                                id: 'lastName-error',
                                role: 'alert',
                            },
                        }}
                    />

                    {/* Email */}
                    <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        error={!!formErrors.email}
                        helperText={formErrors.email}
                        disabled={isSaving || isUpdating}
                        required
                        sx={{
                            mb: 2,
                            '& .MuiInputBase-root': {
                                minHeight: isMobile ? 48 : 40,
                            },
                        }}
                        slotProps={{
                            input: {
                                inputProps: {
                                    'aria-label': 'Email address',
                                    'aria-invalid': !!formErrors.email,
                                    'aria-describedby': formErrors.email ? 'email-error' : undefined,
                                },
                            },
                            formHelperText: {
                                id: 'email-error',
                                role: 'alert',
                            },
                        }}
                    />

                    {/* Phone */}
                    <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        error={!!formErrors.phone}
                        helperText={formErrors.phone}
                        disabled={isSaving || isUpdating}
                        required
                        sx={{
                            mb: 2,
                            '& .MuiInputBase-root': {
                                minHeight: isMobile ? 48 : 40,
                            },
                        }}
                        slotProps={{
                            input: {
                                inputProps: {
                                    'aria-label': 'Phone number',
                                    'aria-invalid': !!formErrors.phone,
                                    'aria-describedby': formErrors.phone ? 'phone-error' : undefined,
                                },
                            },
                            formHelperText: {
                                id: 'phone-error',
                                role: 'alert',
                            },
                        }}
                    />

                    <Divider sx={{ my: 2 }} />

                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 600,
                            mb: 2,
                            color: theme.palette.text.primary,
                        }}
                    >
                        Location Information (Optional)
                    </Typography>

                    {/* Ward */}
                    <TextField
                        fullWidth
                        label="Ward"
                        name="ward"
                        value={formData.ward}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        error={!!formErrors.ward}
                        helperText={formErrors.ward || (!isMasterAdmin ? 'Only Master Admin can edit Ward' : undefined)}
                        disabled={isSaving || isUpdating || !isMasterAdmin}
                        sx={{
                            mb: 2,
                            '& .MuiInputBase-root': {
                                minHeight: isMobile ? 48 : 40,
                            },
                        }}
                        slotProps={{
                            input: {
                                inputProps: {
                                    maxLength: 20,
                                    'aria-label': 'Ward (optional)',
                                    'aria-invalid': !!formErrors.ward,
                                    'aria-describedby': formErrors.ward ? 'ward-error' : undefined,
                                },
                            },
                            formHelperText: {
                                id: 'ward-error',
                                role: 'alert',
                            },
                        }}
                    />

                    {/* Zone */}
                    <TextField
                        fullWidth
                        label="Zone"
                        name="zone"
                        value={formData.zone}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        error={!!formErrors.zone}
                        helperText={formErrors.zone || (!isMasterAdmin ? 'Only Master Admin can edit Zone' : undefined)}
                        disabled={isSaving || isUpdating || !isMasterAdmin}
                        sx={{
                            mb: 2,
                            '& .MuiInputBase-root': {
                                minHeight: isMobile ? 48 : 40,
                            },
                        }}
                        slotProps={{
                            input: {
                                inputProps: {
                                    maxLength: 20,
                                    'aria-label': 'Zone (optional)',
                                    'aria-invalid': !!formErrors.zone,
                                    'aria-describedby': formErrors.zone ? 'zone-error' : undefined,
                                },
                            },
                            formHelperText: {
                                id: 'zone-error',
                                role: 'alert',
                            },
                        }}
                    />

                    {/* Address */}
                    <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        error={!!formErrors.address}
                        helperText={formErrors.address}
                        disabled={isSaving || isUpdating}
                        multiline
                        rows={isMobile && isLandscape ? 2 : 3}
                        slotProps={{
                            input: {
                                inputProps: {
                                    maxLength: 200,
                                    'aria-label': 'Address (optional)',
                                    'aria-invalid': !!formErrors.address,
                                    'aria-describedby': formErrors.address ? 'address-error' : undefined,
                                },
                            },
                            formHelperText: {
                                id: 'address-error',
                                role: 'alert',
                            },
                        }}
                    />
                </Paper>

                <Divider sx={{ my: 3 }} />

                {/* Password Change Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: isMobile ? (isLandscape ? 1.5 : 2) : isTablet ? 2.5 : 3,
                        backgroundColor: theme.palette.background.default,
                        borderRadius: 2,
                        animation: `${slideInUp} 0.5s ease-in-out`,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <LockIcon sx={{ color: theme.palette.primary.main }} />
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                            }}
                        >
                            Change Password (Optional)
                        </Typography>
                    </Box>

                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            mb: 2,
                            color: theme.palette.text.secondary,
                        }}
                    >
                        Leave blank if you don't want to change your password
                    </Typography>

                    {/* New Password */}
                    <TextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.newPassword || ''}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        error={!!formErrors.newPassword}
                        helperText={formErrors.newPassword || 'Minimum 8 characters'}
                        disabled={isSaving || isUpdating}
                        sx={{
                            mb: 2,
                            '& .MuiInputBase-root': {
                                minHeight: isMobile ? 48 : 40,
                            },
                        }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleTogglePasswordVisibility}
                                            edge="end"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            disabled={isSaving || isUpdating}
                                        >
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                inputProps: {
                                    maxLength: 100,
                                    'aria-label': 'New password',
                                    'aria-invalid': !!formErrors.newPassword,
                                    'aria-describedby': formErrors.newPassword ? 'newPassword-error' : undefined,
                                },
                            },
                            formHelperText: {
                                id: 'newPassword-error',
                                role: 'alert',
                            },
                        }}
                    />

                    {/* Password Strength Indicator */}
                    {formData.newPassword && formData.newPassword.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    Password Strength:
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 600,
                                        color: passwordStrength.color,
                                    }}
                                >
                                    {passwordStrength.label}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={passwordStrength.score}
                                sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: theme.palette.grey[200],
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: passwordStrength.color,
                                        borderRadius: 3,
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Confirm Password */}
                    <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword || ''}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        error={!!formErrors.confirmPassword}
                        helperText={formErrors.confirmPassword}
                        disabled={isSaving || isUpdating || !formData.newPassword}
                        sx={{
                            '& .MuiInputBase-root': {
                                minHeight: isMobile ? 48 : 40,
                            },
                        }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleToggleConfirmPasswordVisibility}
                                            edge="end"
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            disabled={isSaving || isUpdating || !formData.newPassword}
                                        >
                                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                inputProps: {
                                    maxLength: 100,
                                    'aria-label': 'Confirm new password',
                                    'aria-invalid': !!formErrors.confirmPassword,
                                    'aria-describedby': formErrors.confirmPassword ? 'confirmPassword-error' : undefined,
                                },
                            },
                            formHelperText: {
                                id: 'confirmPassword-error',
                                role: 'alert',
                            },
                        }}
                    />
                </Paper>

                {/* Error Alert */}
                {updateError && (
                    <Alert
                        severity="error"
                        sx={{ mt: 2 }}
                        onClose={clearUpdateError}
                    >
                        {updateError}
                    </Alert>
                )}

                {/* Action Buttons */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        mt: isMobile && isLandscape ? 2 : 3,
                        flexDirection: isMobile || (isTablet && !isLandscape) ? 'column' : 'row',
                        justifyContent: 'flex-end',
                    }}
                >
                    {/* Cancel Button */}
                    <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        disabled={isSaving || isUpdating}
                        fullWidth={isMobile || (isTablet && !isLandscape)}
                        aria-label="Cancel profile editing"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            minWidth: isMobile ? 'auto' : 120,
                            minHeight: isMobile ? 44 : 36, // Touch-friendly height
                        }}
                    >
                        Cancel
                    </Button>

                    {/* Save Button */}
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={
                            isSaving || isUpdating ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                <SaveIcon />
                            )
                        }
                        disabled={isSaving || isUpdating || !hasChanges}
                        fullWidth={isMobile || (isTablet && !isLandscape)}
                        aria-label={isSaving || isUpdating ? 'Saving profile changes' : 'Save profile changes'}
                        aria-busy={isSaving || isUpdating}
                        aria-disabled={!hasChanges}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            minWidth: isMobile ? 'auto' : 120,
                            minHeight: isMobile ? 44 : 36, // Touch-friendly height
                        }}
                    >
                        {isSaving || isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
            </Box>

            {/* Success Snackbar */}
            <Snackbar
                open={showSuccess}
                autoHideDuration={4000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSuccess}
                    severity="success"
                    icon={<CheckCircleIcon />}
                    sx={{ width: '100%' }}
                >
                    Profile updated successfully!
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={showError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseError}
                    severity="error"
                    sx={{ width: '100%' }}
                >
                    {errorMessage || 'Failed to update profile'}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProfileEditForm;


