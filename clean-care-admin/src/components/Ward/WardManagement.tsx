import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
} from '@mui/icons-material';
import { wardService, type Ward, type UpdateWardDto } from '../../services/wardService';
import { type Zone } from '../../services/zoneService';
import WardList from './WardList';
import WardForm from './WardForm';
import WardMultiSelect from './WardMultiSelect';

interface WardManagementProps {
    zone: Zone | null;
}

const WardManagement: React.FC<WardManagementProps> = ({ zone }) => {
    const [wards, setWards] = useState<Ward[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);

    // Fetch wards when zone changes
    useEffect(() => {
        if (zone) {
            fetchWards();
        } else {
            setWards([]);
        }
    }, [zone]);

    // Fetch wards
    const fetchWards = async () => {
        if (!zone) return;

        try {
            setLoading(true);
            setError(null);
            const response = await wardService.getWardsByZone(zone.id, 'ALL');
            
            // Handle different response formats
            // Sometimes it returns { success: true, wards: [...] }
            // Sometimes it returns { success: true, data: [...] }
            // Sometimes it returns just [...]
            let wardsData: Ward[] = [];
            
            if (Array.isArray(response)) {
                wardsData = response;
            } else if (response && typeof response === 'object') {
                if (Array.isArray((response as any).wards)) {
                    wardsData = (response as any).wards;
                } else if (Array.isArray((response as any).data)) {
                    wardsData = (response as any).data;
                }
            }
            
            setWards(wardsData);
        } catch (err: any) {
            console.error('Error fetching wards:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load wards');
            setWards([]); // Reset wards on error to prevent map error
        } finally {
            setLoading(false);
        }
    };

    // Handle add wards
    const handleAddWards = () => {
        setIsMultiSelectOpen(true);
    };

    // Handle edit ward
    const handleEditWard = (ward: Ward) => {
        setSelectedWard(ward);
        setIsFormOpen(true);
    };

    // Handle save wards (bulk creation)
    const handleSaveWards = async (wardNumbers: number[]) => {
        if (!zone) return;

        try {
            await wardService.createWardsBulk(zone.id, wardNumbers);
            await fetchWards();
            setIsMultiSelectOpen(false);
        } catch (err: any) {
            console.error('Error creating wards:', err);
            throw err; // Re-throw to let the form handle it
        }
    };

    // Handle save ward (edit)
    const handleSaveWard = async (data: UpdateWardDto) => {
        if (!selectedWard) return;

        try {
            await wardService.updateWard(selectedWard.id, data);
            await fetchWards();
            setIsFormOpen(false);
            setSelectedWard(null);
        } catch (err: any) {
            console.error('Error updating ward:', err);
            throw err; // Re-throw to let the form handle it
        }
    };

    if (!zone) {
        return (
            <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', mt: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            Select a zone to manage its wards
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{
            borderRadius: 2,
            border: '2px solid #2196F3',
            mt: 3,
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)'
        }}>
            <CardContent sx={{ p: 3, backgroundColor: '#e3f2fd' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#1565c0' }}>
                            📍 Ward Management - {zone.name || `Zone ${zone.zoneNumber}`}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Manage wards for Zone {zone.zoneNumber}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddWards}
                        sx={{
                            backgroundColor: '#2196F3',
                            '&:hover': {
                                backgroundColor: '#1976d2',
                            },
                            textTransform: 'none',
                            px: 3,
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 600,
                        }}
                    >
                        Add Wards
                    </Button>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Ward List */}
                <WardList
                    wards={wards}
                    loading={loading}
                    onEdit={handleEditWard}
                />
            </CardContent>

            {/* Ward Multi-Select Modal */}
            <WardMultiSelect
                open={isMultiSelectOpen}
                onClose={() => setIsMultiSelectOpen(false)}
                onSave={handleSaveWards}
                zoneId={zone.id}
                zoneName={zone.name || `Zone ${zone.zoneNumber}`}
            />

            {/* Ward Form Modal */}
            {selectedWard && (
                <WardForm
                    open={isFormOpen}
                    onClose={() => {
                        setIsFormOpen(false);
                        setSelectedWard(null);
                    }}
                    onSave={handleSaveWard}
                    ward={selectedWard}
                />
            )}
        </Card>
    );
};

export default WardManagement;
