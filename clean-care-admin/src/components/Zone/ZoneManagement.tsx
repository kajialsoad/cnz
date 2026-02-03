import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Add as AddIcon,
} from '@mui/icons-material';
import { zoneService, type Zone, type CreateZoneDto, type UpdateZoneDto } from '../../services/zoneService';
import ZoneForm from './ZoneForm';
import ZoneList from './ZoneList';

interface ZoneManagementProps {
    cityCorporationId: number;
    cityCorporationName: string;
    cityCorporationCode: string;
    onZoneSelect?: (zone: Zone | null) => void;
}

const ZoneManagement: React.FC<ZoneManagementProps> = ({
    cityCorporationId,
    cityCorporationName,
    cityCorporationCode,
    onZoneSelect,
}) => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Fetch zones when city corporation changes
    useEffect(() => {
        console.log('🔄 ZoneManagement: cityCorporationId changed:', cityCorporationId);
        if (cityCorporationId) {
            fetchZones();
        }
    }, [cityCorporationId]);

    // Fetch zones
    const fetchZones = async () => {
        try {
            console.log('📡 Fetching zones for city corporation:', cityCorporationId);
            setLoading(true);
            setError(null);
            const data = await zoneService.getZonesByCityCorporation(cityCorporationId, 'ALL');
            console.log('✅ Zones fetched:', data.length, 'zones');
            console.log('   First zone:', data[0]);
            setZones(data);
        } catch (err: any) {
            console.error('❌ Error fetching zones:', err);
            console.error('   Error details:', err.response?.data);
            setError(err.response?.data?.message || err.message || 'Failed to load zones');
        } finally {
            setLoading(false);
        }
    };

    // Handle add zone
    const handleAddZone = () => {
        setSelectedZone(null);
        setFormMode('create');
        setIsFormOpen(true);
    };

    // Handle edit zone
    const handleEditZone = (zone: Zone) => {
        setSelectedZone(zone);
        setFormMode('edit');
        setIsFormOpen(true);
    };

    // Handle save zone
    const handleSaveZone = async (data: CreateZoneDto | UpdateZoneDto) => {
        try {
            if (formMode === 'create') {
                await zoneService.createZone(data as CreateZoneDto);
            } else if (selectedZone) {
                await zoneService.updateZone(selectedZone.id, data as UpdateZoneDto);
            }
            await fetchZones();
            setIsFormOpen(false);
        } catch (err: any) {
            console.error('Error saving zone:', err);
            throw err; // Re-throw to let the form handle it
        }
    };

    // Handle delete zone
    const handleDeleteZone = (zone: Zone) => {
        setZoneToDelete(zone);
        setDeleteDialogOpen(true);
    };

    // Confirm delete zone
    const confirmDeleteZone = async () => {
        if (!zoneToDelete) return;

        try {
            await zoneService.deleteZone(zoneToDelete.id);
            await fetchZones();
            setDeleteDialogOpen(false);
            setZoneToDelete(null);

            // If the deleted zone was selected, clear selection
            if (selectedZone?.id === zoneToDelete.id) {
                setSelectedZone(null);
                onZoneSelect?.(null);
            }
        } catch (err: any) {
            console.error('Error deleting zone:', err);
            setError(err.response?.data?.message || err.message || 'Failed to delete zone');
            setDeleteDialogOpen(false);
        }
    };

    // Handle zone selection
    const handleSelectZone = (zone: Zone) => {
        setSelectedZone(zone);
        onZoneSelect?.(zone);
    };

    return (
        <Card sx={{
            borderRadius: 2,
            border: '2px solid #4CAF50',
            mt: 3,
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)'
        }}>
            <CardContent sx={{ p: 3, backgroundColor: '#f1f8f4' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#2e7d32' }}>
                            🏢 Zone Management - {cityCorporationName}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Manage zones for {cityCorporationCode}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddZone}
                        sx={{
                            backgroundColor: '#4CAF50',
                            '&:hover': {
                                backgroundColor: '#45a049',
                            },
                            textTransform: 'none',
                            px: 3,
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 600,
                        }}
                    >
                        Add Zone
                    </Button>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Zone List */}
                <ZoneList
                    zones={zones}
                    loading={loading}
                    onEdit={handleEditZone}
                    onDelete={handleDeleteZone}
                    onSelectZone={handleSelectZone}
                    selectedZoneId={selectedZone?.id}
                />
            </CardContent>

            {/* Zone Form Modal */}
            <ZoneForm
                open={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedZone(null);
                }}
                onSave={handleSaveZone}
                zone={formMode === 'edit' ? selectedZone : null}
                cityCorporationId={cityCorporationId}
                cityCorporationName={cityCorporationName}
                mode={formMode}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Delete Zone</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete Zone {zoneToDelete?.zoneNumber}?
                    </Typography>
                    {zoneToDelete && (zoneToDelete._count?.wards || 0) > 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            This zone has {zoneToDelete._count?.wards} ward(s). You must remove all wards before deleting the zone.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDeleteZone}
                        color="error"
                        variant="contained"
                        sx={{ textTransform: 'none' }}
                        disabled={!!(zoneToDelete && (zoneToDelete._count?.wards || 0) > 0)}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default ZoneManagement;


