import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import type { Thana, CreateThanaDto, UpdateThanaDto } from '../../services/thanaService';

interface ThanaFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: CreateThanaDto | UpdateThanaDto) => Promise<void>;
    thana?: Thana | null;
    cityCorporationCode: string;
    mode: 'create' | 'edit';
}

const ThanaForm: React.FC<ThanaFormProps> = ({
    open,
    onClose,
    onSave,
    thana,
    cityCorporationCode,
    mode,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form data when thana changes
    useEffect(() => {
        if (mode === 'edit' && thana) {
            setFormData({
                name: thana.name,
                status: thana.status,
            });
        } else {
            setFormData({
                name: '',
                status: 'ACTIVE',
            });
        }
        setErrors({});
        setError(null);
    }, [thana, mode, open]);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Thana name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Thana name must be at least 2 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data: any = {
                name: formData.name.trim(),
            };

            if (mode === 'create') {
                data.cityCorporationCode = cityCorporationCode;
            } else {
                data.status = formData.status;
            }

            await onSave(data);
            handleClose();
        } catch (err: any) {
            console.error('Error saving thana:', err);
            setError(err.message || 'Failed to save thana');
        } finally {
            setLoading(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (!loading) {
            setFormData({
                name: '',
                status: 'ACTIVE',
            });
            setErrors({});
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
                {mode === 'create' ? 'Add New Thana' : 'Edit Thana'}
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* Name field */}
                    <TextField
                        label="Thana Name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name || 'e.g., Dhanmondi, Gulshan, Mirpur'}
                        fullWidth
                        required
                        disabled={loading}
                    />

                    {/* Status field (only for edit mode) */}
                    {mode === 'edit' && (
                        <FormControl fullWidth>
                            <InputLabel id="status-label">Status</InputLabel>
                            <Select
                                labelId="status-label"
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                label="Status"
                                disabled={loading}
                            >
                                <MenuItem value="ACTIVE">Active</MenuItem>
                                <MenuItem value="INACTIVE">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    sx={{ textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        textTransform: 'none',
                        minWidth: 100,
                        backgroundColor: '#4CAF50',
                        '&:hover': {
                            backgroundColor: '#45a049',
                        },
                    }}
                >
                    {loading ? <CircularProgress size={24} /> : mode === 'create' ? 'Create' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ThanaForm;


