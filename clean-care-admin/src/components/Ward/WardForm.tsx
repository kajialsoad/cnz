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
import { type Ward, type UpdateWardDto } from '../../services/wardService';

interface WardFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: UpdateWardDto) => Promise<void>;
    ward: Ward;
}

const WardForm: React.FC<WardFormProps> = ({
    open,
    onClose,
    onSave,
    ward,
}) => {
    const [inspectorName, setInspectorName] = useState<string>('');
    const [inspectorSerialNumber, setInspectorSerialNumber] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form with ward data
    useEffect(() => {
        if (ward) {
            setInspectorName(ward.inspectorName || '');
            setInspectorSerialNumber(ward.inspectorSerialNumber || '');
        }
        setError(null);
    }, [ward, open]);

    // Handle form submission
    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            const data: UpdateWardDto = {
                inspectorName: inspectorName.trim() || undefined,
                inspectorSerialNumber: inspectorSerialNumber.trim() || undefined,
            };

            await onSave(data);
            handleClose();
        } catch (err: any) {
            console.error('Error saving ward:', err);
            setError(err.response?.data?.message || err.message || 'Failed to save ward');
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
                Edit Ward {ward.wardNumber}
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Ward Number (Read-only) */}
                    <TextField
                        fullWidth
                        label="Ward Number"
                        value={`Ward ${ward.wardNumber}`}
                        disabled
                        variant="outlined"
                    />

                    {/* Zone Information (Read-only) */}
                    {ward.zone && (
                        <TextField
                            fullWidth
                            label="Zone"
                            value={`Zone ${ward.zone.zoneNumber} - ${ward.zone.name || `Zone ${ward.zone.zoneNumber}`}`}
                            disabled
                            variant="outlined"
                        />
                    )}

                    {/* Inspector Information Section */}
                    <Box sx={{ mt: 1 }}>
                        <Box
                            sx={{
                                borderTop: '1px solid #e0e0e0',
                                pt: 2,
                                mb: 2,
                            }}
                        >
                            <Box sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
                                Ward Inspector Information
                            </Box>
                        </Box>

                        {/* Inspector Name */}
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

                        {/* Inspector Serial Number */}
                        <TextField
                            fullWidth
                            label="Inspector Serial Number"
                            value={inspectorSerialNumber}
                            onChange={(e) => setInspectorSerialNumber(e.target.value)}
                            disabled={loading}
                            variant="outlined"
                            helperText="Enter the serial number of the inspector"
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
                    ) : (
                        'Update Ward'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WardForm;
