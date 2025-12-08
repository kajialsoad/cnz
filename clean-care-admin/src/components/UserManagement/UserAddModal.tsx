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
    PersonAdd as PersonAddIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import type { CreateUserDto, UserRole } from '../../types/userManagement.types';
import { cityCorporationService } from '../../services/cityCorporationService';
import { thanaService } from '../../services/thanaService';
import type { CityCorporation } from '../../services/cityCorporationService';
import type { Thana } from '../../services/thanaService';

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
    thanaId: string;
    ward: string;
    zone: string;
    role: UserRole;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    ward?: string;
    zone?: string;
}

const UserAddModal: React.FC<UserAddModalProps> = ({
    open,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        cityCorporationCode: '',
        thanaId: '',
        ward: '',
        zone: '',
        role: 'ADMIN' as UserRole,
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // City Corporation and Thana state
    const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
    const [thanas, setThanas] = useState<Thana[]>([]);
    const [cityCorporationsLoading, setCityCorporationsLoading] = useState(false);
    const [thanasLoading, setThanasLoading] = useState(false);
    const [wardRange, setWardRange] = useState<{ min: number; max: number }>({ min: 1, max: 100 });

    // Fetch city corporations on mount
    useEffect(() => {
        fetchCityCorporations();
    }, []);

    // Fetch thanas when city corporation changes
    useEffect(() => {
        if (formData.cityCorporationCode) {
            const cityCorporation = cityCorporations.find(cc => cc.code === formData.cityCorporationCode);
            if (cityCorporation) {
                setWardRange({ min: cityCorporation.minWard, max: cityCorporation.maxWard });
                fetchThanas(cityCorporation.code);
            }
        } else {
            setWardRange({ min: 1, max: 100 });
            setThanas([]);
            setFormData(prev => ({ ...prev, thanaId: '', ward: '' }));
        }
    }, [formData.cityCorporationCode, cityCorporations]);

    const fetchCityCorporations = async () => {
        try {
            setCityCorporationsLoading(true);
            const cityCorps = await cityCorporationService.getCityCorporations('ACTIVE');
            setCityCorporations(Array.isArray(cityCorps) ? cityCorps : []);
        } catch (err: any) {
            console.error('Error fetching city corporations:', err);
            setCityCorporations([]);
            setSubmitError('Failed to load city corporations. Please try again.');
        } finally {
            setCityCorporationsLoading(false);
        }
    };

    const fetchThanas = async (cityCorporationCode: string) => {
        try {
            setThanasLoading(true);
            const thanasData = await thanaService.getThanasByCityCorporation(cityCorporationCode, 'ACTIVE');
            setThanas(Array.isArray(thanasData) ? thanasData : []);
        } catch (err: any) {
            console.error('Error fetching thanas:', err);
            setThanas([]);
            // Don't show error for thanas as it's optional
        } finally {
            setThanasLoading(false);
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

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setSubmitError(null);

        try {
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
            if (formData.thanaId) {
                createData.thanaId = parseInt(formData.thanaId);
            }
            if (formData.ward) {
                createData.ward = formData.ward;
            }
            if (formData.zone) {
                createData.zone = formData.zone;
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
                thanaId: '',
                ward: '',
                zone: '',
                role: 'ADMIN' as UserRole,
            });

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
                thanaId: '',
                ward: '',
                zone: '',
                role: 'ADMIN' as UserRole,
            });
            setErrors({});
            setSubmitError(null);
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
                                helperText="Optional"
                            >
                                <MenuItem value="">None</MenuItem>
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
                                label="Thana/Area"
                                value={formData.thanaId}
                                onChange={handleChange('thanaId')}
                                disabled={loading || thanasLoading || !formData.cityCorporationCode || !thanas || thanas.length === 0}
                                helperText={
                                    !formData.cityCorporationCode
                                        ? "Select City Corporation first"
                                        : thanasLoading
                                            ? "Loading thanas..."
                                            : thanas && thanas.length === 0
                                                ? "No thanas available"
                                                : "Optional"
                                }
                            >
                                <MenuItem value="">None</MenuItem>
                                {thanas && Array.isArray(thanas) && thanas.map((thana) => (
                                    <MenuItem key={thana.id} value={thana.id.toString()}>
                                        {thana.name}
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
                                value={formData.ward}
                                onChange={handleChange('ward')}
                                disabled={loading || !formData.cityCorporationCode}
                                helperText="Optional - Select City Corporation first"
                            >
                                <MenuItem value="">None</MenuItem>
                                {Array.from(
                                    { length: wardRange.max - wardRange.min + 1 },
                                    (_, i) => wardRange.min + i
                                ).map((ward) => (
                                    <MenuItem key={ward} value={ward.toString()}>
                                        Ward {ward}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                label="Zone"
                                value={formData.zone}
                                onChange={handleChange('zone')}
                                error={!!errors.zone}
                                helperText={errors.zone || 'Optional'}
                                disabled={loading}
                            />
                        </Box>
                    </Box>

                    {/* Account Settings */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                        Account Settings
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 100%', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                select
                                label="Role"
                                value={formData.role}
                                onChange={handleChange('role')}
                                disabled={loading}
                                helperText="Select the user's role in the system"
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
