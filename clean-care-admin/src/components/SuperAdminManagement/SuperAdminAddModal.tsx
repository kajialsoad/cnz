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
    Stepper,
    Step,
    StepLabel,
    Box,
    Chip,
    OutlinedInput,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import AvatarUpload from '../common/AvatarUpload/AvatarUpload';
import { superAdminService } from '../../services/superAdminService';
import type { CreateSuperAdminDto, SuperAdminPermissions } from '../../services/superAdminService';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { MultiZoneSelector } from '../common';

interface SuperAdminAddModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    cityCorporationCode: string;
    zoneIds: number[];
    permissions: SuperAdminPermissions;
}

const steps = ['প্রোফাইল তথ্য', 'এক্সেস কন্ট্রোল', 'পারমিশন'];

const SuperAdminAddModal: React.FC<SuperAdminAddModalProps> = ({ open, onClose, onSuccess }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [cityCorporations, setCityCorporations] = useState<any[]>([]);

    const { control, handleSubmit, watch, reset, setValue, getValues, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            password: '',
            cityCorporationCode: '',
            zoneIds: [],
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
        shouldUnregister: false,
    });

    const selectedCityCode = watch('cityCorporationCode');

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
        setActiveStep(0);
        reset();
        setAvatarUrl(undefined);
        onClose();
    };

    const onSubmit = async (data: FormData) => {
        console.log('🚀 Final Form Data (onSubmit arg):', data);
        console.log('🧐 getValues() result:', getValues());
        console.log('❌ Form Errors:', errors);

        if (!data.firstName) {
            console.error('CRITICAL: firstName is missing in data object!');
        }

        setLoading(true);
        try {
            // First create the user (without specific single zone)
            const createData: CreateSuperAdminDto = {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email || undefined,
                password: data.password,
                cityCorporationCode: data.cityCorporationCode || undefined,
                // Pass the first selected zone as primary for backward compatibility if needed, 
                // or undefined if the backend handles it. Passing undefined for now as we use multi-zone service.
                zoneId: undefined,
                permissions: data.permissions,
            };

            const user = await superAdminService.createSuperAdmin(createData);

            // Then assign the selected zones using the new multi-zone service
            if (data.zoneIds && data.zoneIds.length > 0) {
                await superAdminService.assignZones(user.id, data.zoneIds);
            }

            toast.success('সুপার এডমিন সফলভাবে যুক্ত হয়েছে');
            handleClose();
            onSuccess();
        } catch (error: any) {
            console.error('Error creating super admin:', error);
            toast.error(error.response?.data?.message || 'সুপার এডমিন যুক্ত করতে ব্যর্থ');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        return (
            <>
                {/* Step 0: Profile Info */}
                <Box sx={{ display: activeStep === 0 ? 'block' : 'none' }}>
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                            <AvatarUpload
                                currentAvatar={avatarUrl}
                                onUpload={async (url) => setAvatarUrl(url)}
                                size={80}
                                initials="?"
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
                                    label="ইমেইল"
                                    placeholder="email@example.com"
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                    fullWidth
                                />
                            )}
                        />

                        <Controller
                            name="password"
                            control={control}
                            rules={{
                                required: 'পাসওয়ার্ড আবশ্যক',
                                minLength: {
                                    value: 8,
                                    message: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে',
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="password"
                                    label="পাসওয়ার্ড *"
                                    placeholder="পাসওয়ার্ড লিখুন..."
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    fullWidth
                                />
                            )}
                        />
                    </Stack>
                </Box>

                {/* Step 1: Access Control */}
                <Box sx={{ display: activeStep === 1 ? 'block' : 'none' }}>
                    <Stack spacing={2}>
                        <Controller
                            name="cityCorporationCode"
                            control={control}
                            rules={{ required: 'সিটি কর্পোরেশন নির্বাচন করুন' }}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.cityCorporationCode}>
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
                </Box>

                {/* Step 2: Permissions */}
                <Box sx={{ display: activeStep === 2 ? 'block' : 'none' }}>
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
                                                sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }}
                                            />
                                        )}
                                    />
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                </Box>
            </>
        );
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700 }}>নতুন সুপার এডমিন যোগ করুন</Typography>
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
                        {loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default SuperAdminAddModal;
