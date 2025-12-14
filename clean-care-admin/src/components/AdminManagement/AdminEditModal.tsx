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
    Chip,
    Box,
    CircularProgress,
    Alert,
    Switch,
    FormControlLabel,
} from '@mui/material';
import Close from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { userManagementService } from '../../services/userManagementService';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import type { UserWithStats } from '../../types/userManagement.types';

interface AdminEditModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    admin: UserWithStats | null;
}

interface AdminFormData {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    password?: string;
    cityCorporationCode: string;
    zoneId: number;
    wardIds: number[];
    status: string;
}

interface CityCorporation {
    code: string;
    name: string;
}

interface Zone {
    id: number;
    name: string;
    zoneNumber: number | null;
}

interface Ward {
    id: number;
    wardNumber: number | null;
}

const AdminEditModal: React.FC<AdminEditModalProps> = ({ open, onClose, onSuccess, admin }) => {
    const [loading, setLoading] = useState(false);
    const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [loadingZones, setLoadingZones] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);
    const [changePassword, setChangePassword] = useState(false);

    const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<AdminFormData>({
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            password: '',
            cityCorporationCode: '',
            zoneId: 0,
            wardIds: [],
            status: 'ACTIVE',
        },
    });

    const selectedCityCorporation = watch('cityCorporationCode');
    const selectedZone = watch('zoneId');

    // Load admin data when modal opens
    useEffect(() => {
        if (open && admin) {
            setValue('firstName', admin.firstName);
            setValue('lastName', admin.lastName);
            setValue('phone', admin.phone);
            setValue('email', admin.email || '');
            setValue('cityCorporationCode', admin.cityCorporationCode || '');
            setValue('zoneId', admin.zoneId || 0);
            setValue('wardIds', admin.wardId ? [admin.wardId] : []);
            setValue('status', admin.status);
        }
    }, [open, admin, setValue]);

    // Fetch city corporations on mount
    useEffect(() => {
        const fetchCityCorporations = async () => {
            try {
                const response = await cityCorporationService.getCityCorporations();
                setCityCorporations(response.cityCorporations || []);
            } catch (error) {
                console.error('Error fetching city corporations:', error);
                toast.error('Failed to load city corporations');
            }
        };

        if (open) {
            fetchCityCorporations();
        }
    }, [open]);

    // Fetch zones when city corporation changes
    useEffect(() => {
        const fetchZones = async () => {
            if (!selectedCityCorporation) {
                setZones([]);
                return;
            }

            try {
                setLoadingZones(true);
                const response = await zoneService.getZones({ cityCorporationCode: selectedCityCorporation });
                setZones(response.zones || []);
            } catch (error) {
                console.error('Error fetching zones:', error);
                toast.error('Failed to load zones');
                setZones([]);
            } finally {
                setLoadingZones(false);
            }
        };

        fetchZones();
    }, [selectedCityCorporation]);

    // Fetch wards when zone changes
    useEffect(() => {
        const fetchWards = async () => {
            if (!selectedZone) {
                setWards([]);
                return;
            }

            try {
                setLoadingWards(true);
                const response = await wardService.getWards({ zoneId: selectedZone });
                setWards(response.wards || []);
            } catch (error) {
                console.error('Error fetching wards:', error);
                toast.error('Failed to load wards');
                setWards([]);
            } finally {
                setLoadingWards(false);
            }
        };

        fetchWards();
    }, [selectedZone]);

    const onSubmit = async (data: AdminFormData) => {
        if (!admin) return;

        try {
            setLoading(true);

            // Validate ward selection
            if (!data.wardIds || data.wardIds.length === 0) {
                toast.error('Please select at least one ward');
                return;
            }

            const updateData: any = {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email,
                cityCorporationCode: data.cityCorporationCode,
                zoneId: data.zoneId,
                wardId: data.wardIds[0], // For now, use first ward
                status: data.status,
            };

            // Only include password if changing
            if (changePassword && data.password) {
                updateData.password = data.password;
            }

            await userManagementService.updateUser(admin.id, updateData);

            toast.success('Admin updated successfully');
            reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error updating admin:', error);
            toast.error(error.message || 'Failed to update admin');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            reset();
            setChangePassword(false);
            onClose();
        }
    };

    if (!admin) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700 }}>এডমিন সম্পাদনা করুন</Typography>
                <IconButton onClick={handleClose} disabled={loading}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Controller
                            name="firstName"
                            control={control}
                            rules={{ required: 'First name is required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="প্রথম নাম *"
                                    placeholder="প্রথম নাম লিখুন..."
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
                            rules={{ required: 'Last name is required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="শেষ নাম *"
                                    placeholder="শেষ নাম লিখুন..."
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
                                required: 'Phone number is required',
                                pattern: {
                                    value: /^01[3-9]\d{8}$/,
                                    message: 'Invalid Bangladesh phone number',
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="ফোন নম্বর *"
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
                                    message: 'Invalid email address',
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
                                    required: changePassword ? 'Password is required' : false,
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters',
                                    },
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="password"
                                        label="নতুন পাসওয়ার্ড *"
                                        placeholder="********"
                                        error={!!errors.password}
                                        helperText={errors.password?.message}
                                        disabled={loading}
                                        fullWidth
                                    />
                                )}
                            />
                        )}

                        <Controller
                            name="cityCorporationCode"
                            control={control}
                            rules={{ required: 'City Corporation is required' }}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.cityCorporationCode} disabled={loading}>
                                    <InputLabel>সিটি কর্পোরেশন *</InputLabel>
                                    <Select {...field} label="সিটি কর্পোরেশন *">
                                        <MenuItem value="">
                                            <em>নির্বাচন করুন</em>
                                        </MenuItem>
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
                            name="zoneId"
                            control={control}
                            rules={{ required: 'Zone is required' }}
                            render={({ field }) => (
                                <FormControl
                                    fullWidth
                                    error={!!errors.zoneId}
                                    disabled={loading || !selectedCityCorporation || loadingZones}
                                >
                                    <InputLabel>জোন *</InputLabel>
                                    <Select {...field} label="জোন *">
                                        <MenuItem value={0}>
                                            <em>নির্বাচন করুন</em>
                                        </MenuItem>
                                        {zones.map((zone) => (
                                            <MenuItem key={zone.id} value={zone.id}>
                                                {zone.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.zoneId && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                            {errors.zoneId.message}
                                        </Typography>
                                    )}
                                    {loadingZones && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                            <CircularProgress size={20} />
                                        </Box>
                                    )}
                                </FormControl>
                            )}
                        />

                        <Controller
                            name="wardIds"
                            control={control}
                            rules={{ required: 'At least one ward is required' }}
                            render={({ field }) => (
                                <FormControl
                                    fullWidth
                                    error={!!errors.wardIds}
                                    disabled={loading || !selectedZone || loadingWards}
                                >
                                    <InputLabel>ওয়ার্ড *</InputLabel>
                                    <Select
                                        {...field}
                                        multiple
                                        label="ওয়ার্ড *"
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {(selected as number[]).map((value) => {
                                                    const ward = wards.find((w) => w.id === value);
                                                    return (
                                                        <Chip
                                                            key={value}
                                                            label={ward ? `Ward ${ward.wardNumber}` : value}
                                                            size="small"
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {wards.map((ward) => (
                                            <MenuItem key={ward.id} value={ward.id}>
                                                Ward {ward.wardNumber}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.wardIds && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                            {errors.wardIds.message}
                                        </Typography>
                                    )}
                                    {loadingWards && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                            <CircularProgress size={20} />
                                        </Box>
                                    )}
                                </FormControl>
                            )}
                        />

                        <Controller
                            name="status"
                            control={control}
                            rules={{ required: 'Status is required' }}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.status} disabled={loading}>
                                    <InputLabel>স্ট্যাটাস *</InputLabel>
                                    <Select {...field} label="স্ট্যাটাস *">
                                        <MenuItem value="ACTIVE">সক্রিয়</MenuItem>
                                        <MenuItem value="INACTIVE">নিষ্ক্রিয়</MenuItem>
                                        <MenuItem value="SUSPENDED">স্থগিত</MenuItem>
                                    </Select>
                                    {errors.status && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                            {errors.status.message}
                                        </Typography>
                                    )}
                                </FormControl>
                            )}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button variant="outlined" onClick={handleClose} disabled={loading}>
                        বাতিল
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ bgcolor: '#3fa564' }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'আপডেট করুন'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AdminEditModal;
