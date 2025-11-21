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
} from '@mui/material';
import type { CityCorporation, CreateCityCorporationDto, UpdateCityCorporationDto } from '../../services/cityCorporationService';

interface CityCorporationFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: CreateCityCorporationDto | UpdateCityCorporationDto) => Promise<void>;
    cityCorporation?: CityCorporation | null;
    mode: 'create' | 'edit';
}

const CityCorporationForm: React.FC<CityCorporationFormProps> = ({
    open,
    onClose,
    onSave,
    cityCorporation,
    mode,
}) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        minWard: '',
        maxWard: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form data when city corporation changes
    useEffect(() => {
        if (mode === 'edit' && cityCorporation) {
            setFormData({
                code: cityCorporation.code,
                name: cityCorporation.name,
                minWard: cityCorporation.minWard.toString(),
                maxWard: cityCorporation.maxWard.toString(),
            });
        } else {
            setFormData({
                code: '',
                name: '',
                minWard: '',
                maxWard: '',
            });
        }
        setErrors({});
        setError(null);
    }, [cityCorporation, mode, open]);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Code validation (only for create mode)
        if (mode === 'create') {
            if (!formData.code.trim()) {
                newErrors.code = 'Code is required';
            } else if (!/^[A-Z]{2,10}$/.test(formData.code.trim())) {
                newErrors.code = 'Code must be 2-10 uppercase letters (e.g., DSCC, DNCC)';
            }
        }

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Name must be at least 3 characters';
        }

        // Min ward validation
        if (!formData.minWard.trim()) {
            newErrors.minWard = 'Minimum ward is required';
        } else {
            const minWard = parseInt(formData.minWard);
            if (isNaN(minWard) || minWard < 1) {
                newErrors.minWard = 'Minimum ward must be a positive number';
            }
        }

        // Max ward validation
        if (!formData.maxWard.trim()) {
            newErrors.maxWard = 'Maximum ward is required';
        } else {
            const maxWard = parseInt(formData.maxWard);
            if (isNaN(maxWard) || maxWard < 1) {
                newErrors.maxWard = 'Maximum ward must be a positive number';
            }
        }

        // Ward range validation
        if (formData.minWard && formData.maxWard) {
            const minWard = parseInt(formData.minWard);
            const maxWard = parseInt(formData.maxWard);
            if (!isNaN(minWard) && !isNaN(maxWard) && minWard >= maxWard) {
                newErrors.maxWard = 'Maximum ward must be greater than minimum ward';
            }
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
                minWard: parseInt(formData.minWard),
                maxWard: parseInt(formData.maxWard),
            };

            if (mode === 'create') {
                data.code = formData.code.trim().toUpperCase();
            }

            await onSave(data);
            handleClose();
        } catch (err: any) {
            console.error('Error saving city corporation:', err);
            setError(err.message || 'Failed to save city corporation');
        } finally {
            setLoading(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (!loading) {
            setFormData({
                code: '',
                name: '',
                minWard: '',
                maxWard: '',
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
                {mode === 'create' ? 'Add New City Corporation' : 'Edit City Corporation'}
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* Code field (only for create mode) */}
                    {mode === 'create' && (
                        <TextField
                            label="City Corporation Code"
                            value={formData.code}
                            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                            error={!!errors.code}
                            helperText={errors.code || 'e.g., DSCC, DNCC, CTGCC'}
                            fullWidth
                            required
                            disabled={loading}
                            inputProps={{
                                maxLength: 10,
                                style: { textTransform: 'uppercase' },
                            }}
                        />
                    )}

                    {/* Name field */}
                    <TextField
                        label="City Corporation Name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name || 'e.g., Dhaka South City Corporation'}
                        fullWidth
                        required
                        disabled={loading}
                    />

                    {/* Ward range fields */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Minimum Ward"
                            type="number"
                            value={formData.minWard}
                            onChange={(e) => handleChange('minWard', e.target.value)}
                            error={!!errors.minWard}
                            helperText={errors.minWard}
                            fullWidth
                            required
                            disabled={loading}
                            inputProps={{ min: 1 }}
                        />

                        <TextField
                            label="Maximum Ward"
                            type="number"
                            value={formData.maxWard}
                            onChange={(e) => handleChange('maxWard', e.target.value)}
                            error={!!errors.maxWard}
                            helperText={errors.maxWard}
                            fullWidth
                            required
                            disabled={loading}
                            inputProps={{ min: 1 }}
                        />
                    </Box>
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

export default CityCorporationForm;
