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
} from '@mui/material';
import { wardService } from '../../services/wardService';

interface WardMultiSelectProps {
    open: boolean;
    onClose: () => void;
    onSave: (wardNumbers: number[]) => Promise<void>;
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
    const [selectedWardNumbers, setSelectedWardNumbers] = useState<number[]>([]);
    const [availableWardNumbers, setAvailableWardNumbers] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingAvailable, setFetchingAvailable] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch available ward numbers when dialog opens
    useEffect(() => {
        if (open && zoneId) {
            fetchAvailableWardNumbers();
        }
    }, [open, zoneId]);

    // Fetch available ward numbers
    const fetchAvailableWardNumbers = async () => {
        try {
            setFetchingAvailable(true);
            setError(null);
            const available = await wardService.getAvailableWardNumbers(zoneId, 100);
            setAvailableWardNumbers(available);
        } catch (err: any) {
            console.error('Error fetching available ward numbers:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load available wards');
        } finally {
            setFetchingAvailable(false);
        }
    };

    // Handle ward selection change
    const handleSelectionChange = (event: any) => {
        const value = event.target.value;
        setSelectedWardNumbers(typeof value === 'string' ? value.split(',').map(Number) : value);
    };

    // Handle form submission
    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate selection
            if (selectedWardNumbers.length === 0) {
                setError('Please select at least one ward');
                return;
            }

            if (selectedWardNumbers.length > 12) {
                setError('Maximum 12 wards can be added to a zone');
                return;
            }

            await onSave(selectedWardNumbers);
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
            setError(null);
            onClose();
        }
    };

    // Check if limit exceeded
    const isLimitExceeded = selectedWardNumbers.length > 12;

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
                        {/* Ward Multi-Select */}
                        <FormControl fullWidth>
                            <InputLabel>Select Wards (up to 12)</InputLabel>
                            <Select
                                multiple
                                value={selectedWardNumbers}
                                onChange={handleSelectionChange}
                                label="Select Wards (up to 12)"
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
                                Maximum allowed: 12 wards per zone
                            </Typography>
                        </Box>

                        {/* Warning for limit exceeded */}
                        {isLimitExceeded && (
                            <Alert severity="warning">
                                Maximum 12 wards can be added to a zone. Please deselect{' '}
                                {selectedWardNumbers.length - 12} ward(s).
                            </Alert>
                        )}

                        {/* Info about bulk creation */}
                        {selectedWardNumbers.length > 0 && !isLimitExceeded && (
                            <Alert severity="info">
                                {selectedWardNumbers.length} ward(s) will be created. You can add inspector
                                information later by editing each ward.
                            </Alert>
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
                        selectedWardNumbers.length === 0 ||
                        isLimitExceeded ||
                        availableWardNumbers.length === 0
                    }
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
                    ) : (
                        `Add ${selectedWardNumbers.length} Ward${selectedWardNumbers.length !== 1 ? 's' : ''}`
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WardMultiSelect;
