import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    IconButton,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Box,
    Stepper,
    Step,
    StepLabel,
    Chip,
    OutlinedInput,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import AvatarUpload from '../common/AvatarUpload/AvatarUpload';
import { superAdminService } from '../../services/superAdminService';
import type { SuperAdmin, UpdateSuperAdminDto, SuperAdminPermissions } from '../../services/superAdminService';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { MultiZoneSelector } from '../common';
import { UserStatus, UserRole } from '../../types/userManagement.types';

interface SuperAdminEditModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    superAdmin: SuperAdmin | null;
}

interface FormData {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password?: string;
    cityCorporationCode: string;
    zoneIds: number[];
    status: UserStatus;
    permissions: SuperAdminPermissions;
    role: UserRole;
}

const steps = ['প্রোফাইল তথ্য', 'এক্সেস কন্ট্রোল', 'পারমিশন'];

const SuperAdminEditModal: React.FC<SuperAdminEditModalProps> = ({ open, onClose, onSuccess, superAdmin }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [cityCorporations, setCityCorporations] = useState<any[]>([]);

    const [changePassword, setChangePassword] = useState(false);

    const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            password: '',
            cityCorporationCode: '',
            zoneIds: [],
            status: UserStatus.ACTIVE,
            role: 'SUPER_ADMIN' as UserRole,
            permissions: {
                zones: [],
                categories: [],
                features: {
                    viewOnlyMode: false,
                    chat: true,
                    customerProfile: true,
                    reviews: true,
                    messaging: true,
                    complaintManagement: true,
                    complaintApproval: true,
                    adminManagement: true,
                    reports: 'download',
                },
            },
        },
    });

    const selectedCityCode = watch('cityCorporationCode');

    // Load super admin data when modal opens
    useEffect(() => {
        const loadSuperAdminData = async () => {
            if (open && superAdmin) {
                setValue('firstName', superAdmin.firstName);
                setValue('lastName', superAdmin.lastName);
                setValue('phone', superAdmin.phone);
                setValue('email', superAdmin.email || '');
                setValue('cityCorporationCode', superAdmin.cityCorporationCode || '');
                setValue('status', superAdmin.status);
                setValue('role', superAdmin.role);
                setAvatarUrl(superAdmin.avatar || undefined);

                // Set permissions
                if (superAdmin.permissions) {
                    setValue('permissions', superAdmin.permissions);
                }

                // Load assigned zones
                try {
                    const assignedZones = await superAdminService.getAssignedZones(superAdmin.id);
                    if (assignedZones && assignedZones.length > 0) {
                        setValue('zoneIds', assignedZones.map((z: any) => z.zoneId));
                    } else if (superAdmin.zoneId) {
                        // Fallback to single zoneId if no multi-zone assignments found
                        setValue('zoneIds', [superAdmin.zoneId]);
                    } else {
                        setValue('zoneIds', []);
                    }
                } catch (error) {
                    console.error('Error loading assigned zones:', error);
                    // Fallback to single zoneId on error
                    if (superAdmin.zoneId) {
                        setValue('zoneIds', [superAdmin.zoneId]);
                    }
                }
            }
        };

        loadSuperAdminData();
    }, [open, superAdmin, setValue]);

    // Load city corporations
    useEffect(() => {
        const loadCityCorporations = async () => {
            try {
                const response = await cityCorporationService.getCityCorporations();
                setCityCorporations(response.cityCorporations || []);
            } catch (error) {
                console.error('Error loading city corporations:', error);
            }
        };
        if (open) {
            loadCityCorporations();
        }
    }, [open]);



    const handleNext = () => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleClose = () => {
        if (!loading) {
            setActiveStep(0);
            setChangePassword(false);
            reset();
            setAvatarUrl(undefined);
            onClose();
        }
    };

    const onSubmit = async (data: FormData) => {
        if (!superAdmin) return;

        setLoading(true);
        try {
            const updateData: UpdateSuperAdminDto = {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email || undefined,
                cityCorporationCode: data.cityCorporationCode || undefined,
                // Pass undefined for zoneId as we handle it separately, 
                // but if we need to maintain backward compatibility, we can pass the first one.
                zoneId: undefined,
                status: data.status,
                permissions: data.permissions,
            };

            // Only include password if changing
            if (changePassword && data.password) {
                updateData.password = data.password;
            }

            await superAdminService.updateSuperAdmin(superAdmin.id, updateData);

            // Update zone assignments
            if (data.zoneIds) {
                await superAdminService.updateZones(superAdmin.id, data.zoneIds);
            }

            toast.success('সুপার এডমিন সফলভাবে আপডেট হয়েছে');
            handleClose();
            onSuccess();
        } catch (error: any) {
            console.error('Error updating super admin:', error);
            toast.error(error.response?.data?.message || 'সুপার এডমিন আপডেট করতে ব্যর্থ');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                // Step 0: Profile Info
                return (
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                            <AvatarUpload
                                currentAvatar={avatarUrl}
                                onUpload={async (url) => setAvatarUrl(url)}
                                size={80}
                                initials={superAdmin ? `${superAdmin.firstName.charAt(0)}${superAdmin.lastName.charAt(0)}` : '?'}
                            />
                        </Stack>

                        <Controller
                            name="firstName"
                            control={control}
                            rules={{ required: 'নাম আবশ্যক' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="নাম *"
                                    placeholder="নাম লিখুন..."
                                    error={!!errors.firstName}
                                    helperText={errors.firstName?.message}
                                    disabled={loading}
                                    fullWidth
                                />
                            )}
                        />

                        <Controller
                            name="lastName"
                            control={control}
                            rules={{ required: 'পদবী আবশ্যক' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="পদবী *"
                                    placeholder="পদবী লিখুন..."
                                    error={!!errors.lastName}
                                    helperText={errors.lastName?.message}
                                    disabled={loading}
                                    fullWidth
                                />
                            )}
                        />

                        <Controller
                            name="phone"
                            control={control}
                            rules={{
                                required: 'ফোন নাম্বার আবশ্যক',
                                pattern: {
                                    value: /^01[0-9]{9}$/,
                                    message: 'সঠিক ফোন নাম্বার দিন (১১ ডিজিট)',
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="ফোন নাম্বার *"
                                    placeholder="01XXXXXXXXX"
                                    error={!!errors.phone}
                                    helperText={errors.phone?.message}
                                    disabled={loading}
                                    fullWidth
                                />
                            )}
                        />

                        <Controller
                            name="email"
                            control={control}
                            rules={{
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'সঠিক ইমেইল দিন',
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="ইমেইল (ঐচ্ছিক)"
                                    placeholder="email@example.com"
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                    disabled={loading}
                                    fullWidth
                                />
                            )}
                        />

                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth disabled={loading}>
                                    <InputLabel>স্ট্যাটাস *</InputLabel>
                                    <Select {...field} label="স্ট্যাটাস *">
                                        <MenuItem value={UserStatus.ACTIVE}>সক্রিয়</MenuItem>
                                        <MenuItem value={UserStatus.INACTIVE}>নিষ্ক্রিয়</MenuItem>
                                        <MenuItem value={UserStatus.SUSPENDED}>স্থগিত</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        />

                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth disabled={loading}>
                                    <InputLabel>রোল</InputLabel>
                                    <Select {...field} label="রোল">
                                        <MenuItem value="ADMIN">এডমিন (Admin)</MenuItem>
                                        <MenuItem value="SUPER_ADMIN">সুপার এডমিন</MenuItem>
                                        <MenuItem value="MASTER_ADMIN">মাস্টার এডমিন</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={changePassword}
                                    onChange={(e) => setChangePassword(e.target.checked)}
                                    disabled={loading}
                                />
                            }
                            label="পাসওয়ার্ড পরিবর্তন করুন"
                        />

                        {changePassword && (
                            <Controller
                                name="password"
                                control={control}
                                rules={{
                                    required: changePassword ? 'পাসওয়ার্ড আবশ্যক' : false,
                                    minLength: {
                                        value: 8,
                                        message: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে',
                                    },
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="password"
                                        label="নতুন পাসওয়ার্ড *"
                                        placeholder="নতুন পাসওয়ার্ড লিখুন..."
                                        error={!!errors.password}
                                        helperText={errors.password?.message}
                                        disabled={loading}
                                        fullWidth
                                    />
                                )}
                            />
                        )}
                    </Stack>
                );

            case 1:
                // Step 1: Access Control
                return (
                    <Stack spacing={2}>
                        <Controller
                            name="cityCorporationCode"
                            control={control}
                            rules={{ required: 'সিটি কর্পোরেশন নির্বাচন করুন' }}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.cityCorporationCode} disabled={loading}>
                                    <InputLabel>সিটি কর্পোরেশন *</InputLabel>
                                    <Select {...field} label="সিটি কর্পোরেশন *">
                                        {cityCorporations.map((cc) => (
                                            <MenuItem key={cc.code} value={cc.code}>
                                                {cc.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.cityCorporationCode && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                            {errors.cityCorporationCode.message}
                                        </Typography>
                                    )}
                                </FormControl>
                            )}
                        />

                        <Controller
                            name="zoneIds"
                            control={control}
                            rules={{ required: 'কমপক্ষে একটি জোন নির্বাচন করুন' }}
                            render={({ field }) => (
                                <MultiZoneSelector
                                    value={field.value}
                                    onChange={field.onChange}
                                    cityCorporationCode={selectedCityCode}
                                    label="জোন (একাধিক নির্বাচন করা যাবে) *"
                                    error={!!errors.zoneIds}
                                    helperText={errors.zoneIds?.message}
                                    disabled={!selectedCityCode || loading}
                                />
                            )}
                        />

                        <Box sx={{ bgcolor: '#fff3cd', p: 2, borderRadius: 1, border: '1px solid #ffc107' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#856404', mb: 1 }}>
                                ⚠️ গুরুত্বপূর্ণ তথ্য:
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                                • সুপার এডমিন নির্বাচিত <strong>Zone</strong> সমূহের দায়িত্বে থাকবে
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                                • নির্বাচিত Zone সমূহের সকল <strong>Ward</strong> দেখতে পারবে
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                                • নির্বাচিত Zone সমূহের <strong>Admin</strong> (Ward Inspector) দের manage করতে পারবে
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                                • নির্বাচিত Zone সমূহের সকল <strong>User</strong> এবং <strong>Complaint</strong> দেখতে পারবে
                            </Typography>
                        </Box>
                    </Stack>
                );

            case 2:
                // Step 2: Permissions
                return (
                    <Stack spacing={2.5}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e2939' }}>
                            পারমিশন সেটিংস
                        </Typography>

                        {/* View Only Mode - Main Toggle */}
                        <Box sx={{ bgcolor: '#f0f9ff', p: 2, borderRadius: 1, border: '1px solid #3b82f6' }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography sx={{ fontWeight: 600, color: '#1e40af' }}>View Only Mode</Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: 12 }}>
                                        শুধু দেখতে পারবে, কোনো action নিতে পারবে না
                                    </Typography>
                                </Box>
                                <Controller
                                    name="permissions.features.viewOnlyMode"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value}
                                            onChange={field.onChange}
                                            disabled={loading}
                                            sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3b82f6' } }}
                                        />
                                    )}
                                />
                            </Stack>
                        </Box>

                        {/* Show message when View Only is enabled */}
                        {watch('permissions.features.viewOnlyMode') && (
                            <Box sx={{ bgcolor: '#fef3c7', p: 2, borderRadius: 1, border: '1px solid #f59e0b' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e', mb: 1 }}>
                                    ℹ️ View Only Mode সক্রিয় আছে
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#78350f', fontSize: 13 }}>
                                    • User List দেখতে পারবে
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#78350f', fontSize: 13 }}>
                                    • Admin List দেখতে পারবে
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#78350f', fontSize: 13 }}>
                                    • Complaint দেখতে পারবে
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#78350f', fontSize: 13 }}>
                                    • কোনো action নিতে পারবে না (edit, delete, approve ইত্যাদি)
                                </Typography>
                            </Box>
                        )}

                        {/* Advanced Permissions - Only show if View Only is disabled */}
                        {!watch('permissions.features.viewOnlyMode') && (
                            <Stack spacing={2}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                                    Advanced Permissions
                                </Typography>

                                {/* Chat */}
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography>মেসেজ টু ইউজার</Typography>
                                    <Controller
                                        name="permissions.features.chat"
                                        control={control}
                                        render={({ field }) => (
                                            <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                                disabled={loading}
                                                sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }}
                                            />
                                        )}
                                    />
                                </Stack>

                                {/* Customer Profile */}
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography>মেসেজ টু এডমিন</Typography>
                                    <Controller
                                        name="permissions.features.customerProfile"
                                        control={control}
                                        render={({ field }) => (
                                            <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                                disabled={loading}
                                                sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }}
                                            />
                                        )}
                                    />
                                </Stack>

                                {/* Reviews */}
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography>রিভিউ দেখুন</Typography>
                                    <Controller
                                        name="permissions.features.reviews"
                                        control={control}
                                        render={({ field }) => (
                                            <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                                disabled={loading}
                                                sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }}
                                            />
                                        )}
                                    />
                                </Stack>

                                {/* Messaging */}
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography>রিপোর্ট ডাউনলোড</Typography>
                                    <Controller
                                        name="permissions.features.messaging"
                                        control={control}
                                        render={({ field }) => (
                                            <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                                disabled={loading}
                                                sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }}
                                            />
                                        )}
                                    />
                                </Stack>

                                {/* Complaint Approval */}
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography>এপ্রুভাল এক্সেস</Typography>
                                    <Controller
                                        name="permissions.features.complaintApproval"
                                        control={control}
                                        render={({ field }) => (
                                            <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                                disabled={loading}
                                                sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }}
                                            />
                                        )}
                                    />
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                );

            default:
                return null;
        }
    };

    if (!superAdmin) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700 }}>সুপার এডমিন সম্পাদনা করুন</Typography>
                <IconButton onClick={handleClose} disabled={loading}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {renderStepContent()}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    বাতিল
                </Button>
                {activeStep > 0 && (
                    <Button onClick={handleBack} disabled={loading}>
                        পূর্ববর্তী
                    </Button>
                )}
                {activeStep < steps.length - 1 ? (
                    <Button variant="contained" onClick={handleNext} sx={{ bgcolor: '#3fa564' }}>
                        পরবর্তী
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleSubmit(onSubmit)}
                        disabled={loading}
                        sx={{ bgcolor: '#3fa564' }}
                    >
                        {loading ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট করুন'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default SuperAdminEditModal;
