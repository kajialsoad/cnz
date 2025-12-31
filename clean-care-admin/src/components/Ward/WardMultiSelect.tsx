import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    Box,
    Alert,
    CircularProgress,
    Chip,
    Typography,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { wardService } from '../../services/wardService';

interface WardMultiSelectProps {
    open: boolean;
    onClose: () => void;
    onSave: (wardNumbers: number[], inspectorData?: { inspectorName?: string; inspectorSerialNumber?: string; inspectorPhone?: string }) => Promise<void>;
    zoneId: number;
    zoneName: string;
}

const WardMultiSelect: React.FC<WardMultiSelectProps> = ({
    open,
    onClose,
    onSave,
    zoneId,
    zoneName,
}) => {
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [selectedWardNumbers, setSelectedWardNumbers] = useState<number[]>([]);
    const [singleWardNumber, setSingleWardNumber] = useState<number | ''>('');
    const [availableWardNumbers, setAvailableWardNumbers] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingAvailable, setFetchingAvailable] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Inspector fields for single ward
    const [inspectorName, setInspectorName] = useState('');
    const [inspectorSerialNumber, setInspectorSerialNumber] = useState('');
    const [inspectorPhone, setInspectorPhone] = useState('');

    // Fetch available ward numbers when dialog opens
    useEffect(() => {
        if (open && zoneId) {
            fetchAvailableWardNumbers();
        }
    }, [open, zoneId]);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setMode('single');
            setSelectedWardNumbers([]);
            setSingleWardNumber('');
            setInspectorName('');
            setInspectorSerialNumber('');
            setInspectorPhone('');
            setError(null);
        }
    }, [open]);

    // Fetch available ward numbers
    const fetchAvailableWardNumbers = async () => {
        try {
            setFetchingAvailable(true);
            setError(null);
            const available = await wardService.getAvailableWardNumbers(zoneId);
            setAvailableWardNumbers(available);
        } catch (err: any) {
            console.error('Error fetching available ward numbers:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load available wards');
        } finally {
            setFetchingAvailable(false);
        }
    };

    // Handle mode change
    const handleModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'single' | 'bulk' | null) => {
        if (newMode !== null) {
            setMode(newMode);
            setSelectedWardNumbers([]);
            setSingleWardNumber('');
            setError(null);
        }
    };

    // Handle ward selection change (bulk mode)
    const handleSelectionChange = (event: any) => {
        const value = event.target.value;
        setSelectedWardNumbers(typeof value === 'string' ? value.split(',').map(Number) : value);
    };

    // Handle form submission
    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            if (mode === 'single') {
                // Single ward mode
                if (!singleWardNumber) {
                    setError('Please select a ward number');
                    return;
                }

                const inspectorData = {
                    inspectorName: inspectorName.trim() || undefined,
                    inspectorSerialNumber: inspectorSerialNumber.trim() || undefined,
                    inspectorPhone: inspectorPhone.trim() || undefined,
                };

                await onSave([singleWardNumber as number], inspectorData);
            } else {
                // Bulk mode
                if (selectedWardNumbers.length === 0) {
                    setError('Please select at least one ward');
                    return;
                }

                if (selectedWardNumbers.length > 50) {
                    setError('Maximum 50 wards can be added at once');
                    return;
                }

                await onSave(selectedWardNumbers);
            }
            handleClose();
        } catch (err: any) {
            console.error('Error saving wards:', err);
            setError(err.response?.data?.message || err.message || 'Failed to save wards');
        } finally {
            setLoading(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (!loading) {
            setSelectedWardNumbers([]);
            setSingleWardNumber('');
            setInspectorName('');
            setInspectorSerialNumber('');
            setInspectorPhone('');
            setError(null);
            onClose();
        }
    };

    // Check if limit exceeded (bulk mode)
    const isLimitExceeded = mode === 'bulk' && selectedWardNumbers.length > 50;

    // Check if can submit
    const canSubmit = mode === 'single'
        ? singleWardNumber !== ''
        : selectedWardNumbers.length > 0 && !isLimitExceeded;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
                Add Wards to {zoneName}
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {fetchingAvailable ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : availableWardNumbers.length === 0 ? (
                    <Alert severity="info">
                        No available ward numbers. All wards have been added to this zone.
                    </Alert>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* Mode Toggle */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                            <ToggleButtonGroup
                                value={mode}
                                exclusive
                                onChange={handleModeChange}
                                aria-label="add mode"
                                sx={{ backgroundColor: '#f5f5f5' }}
                            >
                                <ToggleButton
                                    value="single"
                                    sx={{
                                        px: 3,
                                        '&.Mui-selected': {
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            '&:hover': { backgroundColor: '#45a049' }
                                        }
                                    }}
                                >
                                    Single Ward (with Inspector)
                                </ToggleButton>
                                <ToggleButton
                                    value="bulk"
                                    sx={{
                                        px: 3,
                                        '&.Mui-selected': {
                                            backgroundColor: '#2196F3',
                                            color: 'white',
                                            '&:hover': { backgroundColor: '#1976d2' }
                                        }
                                    }}
                                >
                                    Multiple Wards (Bulk)
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {mode === 'single' ? (
                            /* Single Ward Mode */
                            <>
                                <FormControl fullWidth>
                                    <InputLabel>Ward Number *</InputLabel>
                                    <Select
                                        value={singleWardNumber}
                                        onChange={(e) => setSingleWardNumber(e.target.value as number)}
                                        label="Ward Number *"
                                        disabled={loading}
                                    >
                                        {availableWardNumbers.map((num) => (
                                            <MenuItem key={num} value={num}>
                                                Ward {num}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Inspector Information Section */}
                                <Box sx={{ mt: 1 }}>
                                    <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 2, mb: 2 }}>
                                        <Typography sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
                                            Ward Inspector Information (Optional)
                                        </Typography>
                                    </Box>

                                    <TextField
                                        fullWidth
                                        label="Inspector Name"
                                        value={inspectorName}
                                        onChange={(e) => setInspectorName(e.target.value)}
                                        disabled={loading}
                                        variant="outlined"
                                        sx={{ mb: 2.5 }}
                                        helperText="Enter the name of the cleanliness inspector for this ward"
                                    />

                                    <TextField
                                        fullWidth
                                        label="Inspector Serial Number"
                                        value={inspectorSerialNumber}
                                        onChange={(e) => setInspectorSerialNumber(e.target.value)}
                                        disabled={loading}
                                        variant="outlined"
                                        sx={{ mb: 2.5 }}
                                        helperText="Enter the serial number of the inspector"
                                    />

                                    <TextField
                                        fullWidth
                                        label="Inspector Phone Number"
                                        value={inspectorPhone}
                                        onChange={(e) => setInspectorPhone(e.target.value)}
                                        disabled={loading}
                                        variant="outlined"
                                        helperText="Enter the contact number of the inspector"
                                    />
                                </Box>
                            </>
                        ) : (
                            /* Bulk Mode */
                            <>
                                <FormControl fullWidth>
                                    <InputLabel>Select Wards</InputLabel>
                                    <Select
                                        multiple
                                        value={selectedWardNumbers}
                                        onChange={handleSelectionChange}
                                        label="Select Wards"
                                        disabled={loading}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip
                                                        key={value}
                                                        label={`Ward ${value}`}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#e3f2fd',
                                                            color: '#1976d2',
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {availableWardNumbers.map((num) => (
                                            <MenuItem key={num} value={num}>
                                                <Checkbox checked={selectedWardNumbers.includes(num)} />
                                                <ListItemText primary={`Ward ${num}`} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Selection Summary */}
                                <Box
                                    sx={{
                                        p: 2,
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: 1,
                                        border: '1px solid #e0e0e0',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                        Selection Summary
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Selected: {selectedWardNumbers.length} ward(s)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Available: {availableWardNumbers.length} ward(s)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        No limit on wards per zone
                                    </Typography>
                                </Box>

                                {/* Warning for limit exceeded */}
                                {isLimitExceeded && (
                                    <Alert severity="warning">
                                        Maximum 50 wards can be added at once. Please deselect{' '}
                                        {selectedWardNumbers.length - 50} ward(s).
                                    </Alert>
                                )}

                                {/* Info about bulk creation */}
                                {selectedWardNumbers.length > 0 && !isLimitExceeded && (
                                    <Alert severity="info">
                                        {selectedWardNumbers.length} ward(s) will be created. You can add inspector
                                        information later by editing each ward.
                                    </Alert>
                                )}
                            </>
                        )}
                    </Box>
                )}
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
                    disabled={
                        loading ||
                        fetchingAvailable ||
                        !canSubmit ||
                        availableWardNumbers.length === 0
                    }
                    sx={{
                        textTransform: 'none',
                        px: 3,
                        backgroundColor: mode === 'single' ? '#4CAF50' : '#2196F3',
                        '&:hover': {
                            backgroundColor: mode === 'single' ? '#45a049' : '#1976d2',
                        },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : mode === 'single' ? (
                        'Add Ward'
                    ) : (
                        `Add ${selectedWardNumbers.length} Ward${selectedWardNumbers.length !== 1 ? 's' : ''}`
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WardMultiSelect;
