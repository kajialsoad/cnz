import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Skeleton,
    Alert,
    Snackbar,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import {
    cityCorporationService,
    type CityCorporation,
    type CreateCityCorporationDto,
    type UpdateCityCorporationDto,
} from '../../services/cityCorporationService';
import CityCorporationForm from '../../components/CityCorporation/CityCorporationForm';
import ThanaManagement from '../../components/CityCorporation/ThanaManagement';
import ZoneManagement from '../../components/Zone/ZoneManagement';
import WardManagement from '../../components/Ward/WardManagement';
import { type Zone } from '../../services/zoneService';

interface ToastState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
}

const CityCorporationManagement: React.FC = () => {
    const [cityCorps, setCityCorps] = useState<CityCorporation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCityCorporation, setSelectedCityCorporation] = useState<CityCorporation | null>(null);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [toast, setToast] = useState<ToastState>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Fetch city corporations on mount
    useEffect(() => {
        fetchCityCorporations();
    }, []);

    // Fetch city corporations
    const fetchCityCorporations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await cityCorporationService.getCityCorporations('ALL');
            setCityCorps(data);
        } catch (err: any) {
            console.error('Error fetching city corporations:', err);
            setError(err.message || 'Failed to load city corporations');
            showToast('Failed to load city corporations', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle add city corporation
    const handleAddCityCorporation = () => {
        setSelectedCityCorporation(null);
        setFormMode('create');
        setIsFormOpen(true);
    };

    // Handle edit city corporation
    const handleEditCityCorporation = (cityCorporation: CityCorporation) => {
        setSelectedCityCorporation(cityCorporation);
        setFormMode('edit');
        setIsFormOpen(true);
    };

    // Handle save city corporation
    const handleSaveCityCorporation = async (data: CreateCityCorporationDto | UpdateCityCorporationDto) => {
        try {
            if (formMode === 'create') {
                await cityCorporationService.createCityCorporation(data as CreateCityCorporationDto);
                showToast('City corporation created successfully', 'success');
            } else if (selectedCityCorporation) {
                await cityCorporationService.updateCityCorporation(
                    selectedCityCorporation.code,
                    data as UpdateCityCorporationDto
                );
                showToast('City corporation updated successfully', 'success');
            }
            await fetchCityCorporations();
        } catch (err: any) {
            console.error('Error saving city corporation:', err);
            throw err; // Re-throw to let the form handle it
        }
    };

    // Handle toggle status
    const handleToggleStatus = async (cityCorporation: CityCorporation) => {
        try {
            const newStatus = cityCorporation.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await cityCorporationService.updateCityCorporation(cityCorporation.code, {
                status: newStatus,
            });
            showToast(
                `City corporation ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
                'success'
            );
            await fetchCityCorporations();

            // If the selected city corporation was toggled, update it
            if (selectedCityCorporation?.code === cityCorporation.code) {
                setSelectedCityCorporation(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (err: any) {
            console.error('Error toggling city corporation status:', err);
            showToast('Failed to update city corporation status', 'error');
        }
    };

    // Handle select city corporation
    const handleSelectCityCorporation = (cityCorporation: CityCorporation) => {
        console.log('🏢 Selected City Corporation:', cityCorporation);
        setSelectedCityCorporation(cityCorporation);
        setSelectedZone(null); // Reset zone selection
    };

    // Show toast notification
    const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
        setToast({
            open: true,
            message,
            severity,
        });
    };

    // Close toast
    const handleCloseToast = () => {
        setToast(prev => ({ ...prev, open: false }));
    };

    // Format date
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <ErrorBoundary>
            <MainLayout title="City Corporation Management">
                <Box sx={{ width: '100%', maxWidth: '100%', px: 1.5, mx: 0 }}>
                    {/* Header Section */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 3,
                    }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                                City Corporation Management
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Manage city corporations and their thanas/areas
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddCityCorporation}
                            sx={{
                                backgroundColor: '#4CAF50',
                                '&:hover': {
                                    backgroundColor: '#45a049',
                                },
                                textTransform: 'none',
                                px: 3,
                                py: 1.5,
                                borderRadius: 2,
                            }}
                        >
                            Add City Corporation
                        </Button>
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* City Corporations List */}
                    <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', mb: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                City Corporations
                            </Typography>

                            <TableContainer component={Paper} elevation={0}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Ward Range</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Total Users</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Total Complaints</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Total Zones</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Total Wards</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            // Loading skeleton
                                            Array.from({ length: 3 }).map((_, index) => (
                                                <TableRow key={index}>
                                                    <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                                    <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                                    <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                                    <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                                    <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                                    <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                                    <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                                    <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                                    <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : cityCorps.length === 0 ? (
                                            // Empty state
                                            <TableRow>
                                                <TableCell colSpan={9}>
                                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                                        <BusinessIcon sx={{ fontSize: 48, color: '#9e9e9e', mb: 2 }} />
                                                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                                            No city corporations added yet
                                                        </Typography>
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<AddIcon />}
                                                            onClick={handleAddCityCorporation}
                                                            sx={{ textTransform: 'none' }}
                                                        >
                                                            Add First City Corporation
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            // City corporation rows
                                            cityCorps.map((cityCorporation) => (
                                                <TableRow
                                                    key={cityCorporation.id}
                                                    onClick={() => handleSelectCityCorporation(cityCorporation)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        backgroundColor:
                                                            selectedCityCorporation?.id === cityCorporation.id
                                                                ? '#e3f2fd'
                                                                : 'transparent',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                selectedCityCorporation?.id === cityCorporation.id
                                                                    ? '#e3f2fd'
                                                                    : '#f8f9fa',
                                                        },
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                            {cityCorporation.code}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {cityCorporation.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {cityCorporation.minWard} - {cityCorporation.maxWard}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={cityCorporation.status}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor:
                                                                    cityCorporation.status === 'ACTIVE' ? '#e8f5e8' : '#ffebee',
                                                                color: cityCorporation.status === 'ACTIVE' ? '#2e7d2e' : '#c62828',
                                                                fontWeight: 500,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={cityCorporation.totalUsers || 0}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#e3f2fd',
                                                                color: '#1976d2',
                                                                fontWeight: 500,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={cityCorporation.totalComplaints || 0}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#fff3e0',
                                                                color: '#e65100',
                                                                fontWeight: 500,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={cityCorporation.totalZones || 0}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#f3e5f5',
                                                                color: '#7b1fa2',
                                                                fontWeight: 500,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={cityCorporation.totalWards || 0}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#e1f5fe',
                                                                color: '#0277bd',
                                                                fontWeight: 500,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {formatDate(cityCorporation.createdAt)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <Tooltip title="Edit">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditCityCorporation(cityCorporation);
                                                                    }}
                                                                    sx={{
                                                                        color: '#1976d2',
                                                                        '&:hover': {
                                                                            backgroundColor: '#e3f2fd',
                                                                        },
                                                                    }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip
                                                                title={
                                                                    cityCorporation.status === 'ACTIVE' ? 'Deactivate' : 'Activate'
                                                                }
                                                            >
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggleStatus(cityCorporation);
                                                                    }}
                                                                    sx={{
                                                                        color:
                                                                            cityCorporation.status === 'ACTIVE' ? '#c62828' : '#2e7d2e',
                                                                        '&:hover': {
                                                                            backgroundColor:
                                                                                cityCorporation.status === 'ACTIVE' ? '#ffebee' : '#e8f5e8',
                                                                        },
                                                                    }}
                                                                >
                                                                    {cityCorporation.status === 'ACTIVE' ? (
                                                                        <CancelIcon fontSize="small" />
                                                                    ) : (
                                                                        <CheckCircleIcon fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Zone Management Section */}
                    {selectedCityCorporation ? (
                        <Box sx={{ mt: 3 }}>
                            <ZoneManagement
                                cityCorporationId={selectedCityCorporation.id}
                                cityCorporationName={selectedCityCorporation.name}
                                cityCorporationCode={selectedCityCorporation.code}
                                onZoneSelect={setSelectedZone}
                            />
                        </Box>
                    ) : (
                        <Card sx={{
                            borderRadius: 2,
                            border: '2px dashed #9e9e9e',
                            mt: 3,
                            backgroundColor: '#fafafa'
                        }}>
                            <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                <BusinessIcon sx={{ fontSize: 64, color: '#9e9e9e', mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#616161' }}>
                                    Select a City Corporation
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Click on any City Corporation from the table above to manage its zones and wards
                                </Typography>
                            </CardContent>
                        </Card>
                    )}

                    {/* Ward Management Section */}
                    {selectedZone && (
                        <Box sx={{ mt: 3 }}>
                            <WardManagement zone={selectedZone} />
                        </Box>
                    )}

                    {/* Thana Management Section (Legacy - can be removed later) */}
                    {selectedCityCorporation && false && (
                        <ThanaManagement
                            cityCorporation={selectedCityCorporation}
                            onThanaUpdate={fetchCityCorporations}
                        />
                    )}
                </Box>

                {/* City Corporation Form Modal */}
                <CityCorporationForm
                    open={isFormOpen}
                    onClose={() => {
                        setIsFormOpen(false);
                        setSelectedCityCorporation(null);
                    }}
                    onSave={handleSaveCityCorporation}
                    cityCorporation={formMode === 'edit' ? selectedCityCorporation : null}
                    mode={formMode}
                />

                {/* Toast Notification */}
                <Snackbar
                    open={toast.open}
                    autoHideDuration={6000}
                    onClose={handleCloseToast}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={handleCloseToast}
                        severity={toast.severity}
                        sx={{ width: '100%' }}
                    >
                        {toast.message}
                    </Alert>
                </Snackbar>
            </MainLayout>
        </ErrorBoundary>
    );
};

export default CityCorporationManagement;
