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
import { type Zone, type CreateZoneDto, type UpdateZoneDto, zoneService } from '../../services/zoneService';

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
    const [availableZoneNumbers, setAvailableZoneNumbers] = useState<number[]>([]);
    const [loadingAvailableZones, setLoadingAvailableZones] = useState(false);

    // Fetch available zone numbers when dialog opens in create mode
    useEffect(() => {
        const fetchAvailableZones = async () => {
            if (open && mode === 'create' && cityCorporationId) {
                setLoadingAvailableZones(true);
                try {
                    console.log('🔍 Fetching available zones for CC:', cityCorporationId);
                    const numbers = await zoneService.getAvailableZoneNumbers(cityCorporationId);
                    console.log('✅ Available zone numbers:', numbers);
                    setAvailableZoneNumbers(numbers);

                    // Set first available zone as default
                    if (numbers.length > 0) {
                        setZoneNumber(numbers[0]);
                    }
                } catch (err) {
                    console.error('❌ Error fetching available zones:', err);
                    setError('Failed to load available zones');
                } finally {
                    setLoadingAvailableZones(false);
                }
            }
        };

        fetchAvailableZones();
    }, [open, mode, cityCorporationId]);

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

            // Backend will validate zone number against city corporation limits
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

                    {/* Zone Number Dropdown - Shows only available zones */}
                    <FormControl fullWidth>
                        <InputLabel>Zone Number *</InputLabel>
                        <Select
                            value={zoneNumber}
                            onChange={(e) => setZoneNumber(Number(e.target.value))}
                            label="Zone Number *"
                            disabled={mode === 'edit' || loading || loadingAvailableZones}
                        >
                            {mode === 'edit' ? (
                                // In edit mode, show only the current zone number
                                <MenuItem value={zoneNumber}>
                                    Zone {zoneNumber}
                                </MenuItem>
                            ) : loadingAvailableZones ? (
                                // Show loading state
                                <MenuItem disabled>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Loading available zones...
                                </MenuItem>
                            ) : availableZoneNumbers.length === 0 ? (
                                // No available zones
                                <MenuItem disabled>
                                    No available zones (all zones are in use)
                                </MenuItem>
                            ) : (
                                // Show only available zone numbers
                                availableZoneNumbers.map((num) => (
                                    <MenuItem key={num} value={num}>
                                        Zone {num}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                        {mode === 'create' && !loadingAvailableZones && (
                            <Box sx={{ mt: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}>
                                {availableZoneNumbers.length === 0
                                    ? 'All zones are already in use for this city corporation'
                                    : `${availableZoneNumbers.length} zone(s) available`
                                }
                            </Box>
                        )}
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
                    disabled={loading || (mode === 'create' && availableZoneNumbers.length === 0)}
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
