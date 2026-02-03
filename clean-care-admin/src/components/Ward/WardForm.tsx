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
import { type Ward, type UpdateWardDto } from '../../services/wardService';
import { zoneService, type Zone } from '../../services/zoneService';

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
    const [wardNumber, setWardNumber] = useState<string>('');
    const [selectedZoneId, setSelectedZoneId] = useState<number | string>('');
    const [availableZones, setAvailableZones] = useState<Zone[]>([]);
    const [inspectorName, setInspectorName] = useState<string>('');
    const [inspectorSerialNumber, setInspectorSerialNumber] = useState<string>('');
    const [inspectorPhone, setInspectorPhone] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [loadingZones, setLoadingZones] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form with ward data and fetch zones
    useEffect(() => {
        if (ward) {
            setWardNumber(ward.wardNumber?.toString() || '');
            setSelectedZoneId(ward.zoneId || '');
            setInspectorName(ward.inspectorName || '');
            setInspectorSerialNumber(ward.inspectorSerialNumber || '');
            setInspectorPhone(ward.inspectorPhone || '');

            // Fetch available zones for the city corporation
            if (ward.zone?.cityCorporation?.id) {
                fetchZones(ward.zone.cityCorporation.id);
            }
        }
        setError(null);
    }, [ward, open]);

    const fetchZones = async (cityCorporationId: number) => {
        try {
            setLoadingZones(true);
            const response = await zoneService.getZonesByCityCorporation(cityCorporationId, 'ACTIVE');
            setAvailableZones(response);
        } catch (error) {
            console.error('Error fetching zones:', error);
        } finally {
            setLoadingZones(false);
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            const data: UpdateWardDto = {
                wardNumber: parseInt(wardNumber),
                zoneId: selectedZoneId ? Number(selectedZoneId) : undefined,
                inspectorName: inspectorName.trim() || undefined,
                inspectorSerialNumber: inspectorSerialNumber.trim() || undefined,
                inspectorPhone: inspectorPhone.trim() || undefined,
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
                    {/* Ward Number (Editable) */}
                    <TextField
                        fullWidth
                        label="Ward Number"
                        value={wardNumber}
                        onChange={(e) => setWardNumber(e.target.value)}
                        disabled={loading}
                        variant="outlined"
                        type="number"
                        helperText="Ensure this Ward Number is unique within the City Corporation"
                    />

                    {/* Zone Selection (Editable) */}
                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="zone-select-label">Zone</InputLabel>
                        <Select
                            labelId="zone-select-label"
                            value={selectedZoneId}
                            onChange={(e) => setSelectedZoneId(e.target.value)}
                            label="Zone"
                            disabled={loading || loadingZones}
                        >
                            {availableZones.map((zone) => (
                                <MenuItem key={zone.id} value={zone.id}>
                                    {`Zone ${zone.zoneNumber}${zone.name ? ` - ${zone.name}` : ''}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

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
                            sx={{ mb: 2.5 }}
                            helperText="Enter the serial number of the inspector"
                        />

                        {/* Inspector Phone Number */}
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


