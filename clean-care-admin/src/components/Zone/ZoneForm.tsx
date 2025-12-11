import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert,
    CircularProgress,
} from '@mui/material';
import { type Zone, type CreateZoneDto, type UpdateZoneDto } from '../../services/zoneService';

interface ZoneFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: CreateZoneDto | UpdateZoneDto) => Promise<void>;
    zone?: Zone | null;
    cityCorporationId: number;
    cityCorporationName: string;
    mode: 'create' | 'edit';
}

const ZoneForm: React.FC<ZoneFormProps> = ({
    open,
    onClose,
    onSave,
    zone,
    cityCorporationId,
    cityCorporationName,
    mode,
}) => {
    const [zoneNumber, setZoneNumber] = useState<number>(1);
    const [name, setName] = useState<string>('');
    const [officerName, setOfficerName] = useState<string>('');
    const [officerDesignation, setOfficerDesignation] = useState<string>('');
    const [officerSerialNumber, setOfficerSerialNumber] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form with zone data when editing
    useEffect(() => {
        if (mode === 'edit' && zone) {
            setZoneNumber(zone.zoneNumber);
            setName(zone.name || '');
            setOfficerName(zone.officerName || '');
            setOfficerDesignation(zone.officerDesignation || '');
            setOfficerSerialNumber(zone.officerSerialNumber || '');
        } else {
            // Reset form for create mode
            setZoneNumber(1);
            setName('');
            setOfficerName('');
            setOfficerDesignation('');
            setOfficerSerialNumber('');
        }
        setError(null);
    }, [mode, zone, open]);

    // Handle form submission
    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate zone number
            if (zoneNumber < 1 || zoneNumber > 20) {
                setError('Zone number must be between 1 and 20');
                return;
            }

            const data: CreateZoneDto | UpdateZoneDto = mode === 'create'
                ? {
                    zoneNumber,
                    name: name.trim() || undefined,
                    cityCorporationId,
                    officerName: officerName.trim() || undefined,
                    officerDesignation: officerDesignation.trim() || undefined,
                    officerSerialNumber: officerSerialNumber.trim() || undefined,
                }
                : {
                    name: name.trim() || undefined,
                    officerName: officerName.trim() || undefined,
                    officerDesignation: officerDesignation.trim() || undefined,
                    officerSerialNumber: officerSerialNumber.trim() || undefined,
                };

            await onSave(data);
            handleClose();
        } catch (err: any) {
            console.error('Error saving zone:', err);
            setError(err.response?.data?.message || err.message || 'Failed to save zone');
        } finally {
            setLoading(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (!loading) {
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
                {mode === 'create' ? 'Add New Zone' : 'Edit Zone'}
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* City Corporation (Read-only) */}
                    <TextField
                        fullWidth
                        label="City Corporation"
                        value={cityCorporationName}
                        disabled
                        variant="outlined"
                    />

                    {/* Zone Number Dropdown (1-20) */}
                    <FormControl fullWidth>
                        <InputLabel>Zone Number *</InputLabel>
                        <Select
                            value={zoneNumber}
                            onChange={(e) => setZoneNumber(Number(e.target.value))}
                            label="Zone Number *"
                            disabled={mode === 'edit' || loading}
                        >
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                                <MenuItem key={num} value={num}>
                                    Zone {num}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Zone Name (Optional) */}
                    <TextField
                        fullWidth
                        label="Zone Name (Optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={`Zone ${zoneNumber}`}
                        disabled={loading}
                        variant="outlined"
                        helperText="Leave empty to use default name (e.g., Zone 1)"
                    />

                    {/* Officer Information Section */}
                    <Box sx={{ mt: 1 }}>
                        <Box
                            sx={{
                                borderTop: '1px solid #e0e0e0',
                                pt: 2,
                                mb: 2,
                            }}
                        >
                            <Box sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
                                Zone Officer Information (Optional)
                            </Box>
                        </Box>

                        {/* Officer Name */}
                        <TextField
                            fullWidth
                            label="Officer Name"
                            value={officerName}
                            onChange={(e) => setOfficerName(e.target.value)}
                            disabled={loading}
                            variant="outlined"
                            sx={{ mb: 2.5 }}
                        />

                        {/* Officer Designation */}
                        <TextField
                            fullWidth
                            label="Officer Designation"
                            value={officerDesignation}
                            onChange={(e) => setOfficerDesignation(e.target.value)}
                            disabled={loading}
                            variant="outlined"
                            sx={{ mb: 2.5 }}
                        />

                        {/* Officer Serial Number */}
                        <TextField
                            fullWidth
                            label="Officer Serial Number"
                            value={officerSerialNumber}
                            onChange={(e) => setOfficerSerialNumber(e.target.value)}
                            disabled={loading}
                            variant="outlined"
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    sx={{ textTransform: 'none', px: 3 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        textTransform: 'none',
                        px: 3,
                        backgroundColor: '#4CAF50',
                        '&:hover': {
                            backgroundColor: '#45a049',
                        },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : mode === 'create' ? (
                        'Create Zone'
                    ) : (
                        'Update Zone'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ZoneForm;
