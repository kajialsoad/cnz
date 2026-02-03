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
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import type { CityCorporation } from '../../services/cityCorporationService';
import type { Thana, CreateThanaDto, UpdateThanaDto } from '../../services/thanaService';
import { thanaService } from '../../services/thanaService';
import ThanaForm from './ThanaForm';

interface ThanaManagementProps {
    cityCorporation: CityCorporation;
    onThanaUpdate?: () => void;
}

const ThanaManagement: React.FC<ThanaManagementProps> = ({
    cityCorporation,
    onThanaUpdate,
}) => {
    const [thanas, setThanas] = useState<Thana[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedThana, setSelectedThana] = useState<Thana | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

    // Fetch thanas when city corporation changes
    useEffect(() => {
        if (cityCorporation) {
            fetchThanas();
        }
    }, [cityCorporation]);

    // Fetch thanas
    const fetchThanas = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await thanaService.getThanasByCityCorporation(cityCorporation.code, 'ALL');
            setThanas(data);
        } catch (err: any) {
            console.error('Error fetching thanas:', err);
            setError(err.message || 'Failed to load thanas');
        } finally {
            setLoading(false);
        }
    };

    // Handle add thana
    const handleAddThana = () => {
        setSelectedThana(null);
        setFormMode('create');
        setIsFormOpen(true);
    };

    // Handle edit thana
    const handleEditThana = (thana: Thana) => {
        setSelectedThana(thana);
        setFormMode('edit');
        setIsFormOpen(true);
    };

    // Handle save thana
    const handleSaveThana = async (data: CreateThanaDto | UpdateThanaDto) => {
        if (formMode === 'create') {
            await thanaService.createThana(data as CreateThanaDto);
        } else if (selectedThana) {
            await thanaService.updateThana(selectedThana.id, data as UpdateThanaDto);
        }
        await fetchThanas();
        if (onThanaUpdate) {
            onThanaUpdate();
        }
    };

    // Handle toggle status
    const handleToggleStatus = async (thana: Thana) => {
        try {
            const newStatus = thana.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await thanaService.updateThana(thana.id, { status: newStatus });
            await fetchThanas();
            if (onThanaUpdate) {
                onThanaUpdate();
            }
        } catch (err: any) {
            console.error('Error toggling thana status:', err);
            setError(err.message || 'Failed to update thana status');
        }
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
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Thana Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage thanas/areas for {cityCorporation.name}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddThana}
                        sx={{
                            textTransform: 'none',
                            backgroundColor: '#4CAF50',
                            '&:hover': {
                                backgroundColor: '#45a049',
                            },
                        }}
                    >
                        Add Thana
                    </Button>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Thanas Table */}
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Thana Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Total Users</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Total Complaints</TableCell>
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
                                    </TableRow>
                                ))
                            ) : thanas.length === 0 ? (
                                // Empty state
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                                No thanas added yet
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                startIcon={<AddIcon />}
                                                onClick={handleAddThana}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Add First Thana
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                // Thana rows
                                thanas.map((thana) => (
                                    <TableRow
                                        key={thana.id}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: '#f8f9fa',
                                            },
                                        }}
                                    >
                                        <TableCell>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {thana.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={thana.status}
                                                size="small"
                                                sx={{
                                                    backgroundColor: thana.status === 'ACTIVE' ? '#e8f5e8' : '#ffebee',
                                                    color: thana.status === 'ACTIVE' ? '#2e7d2e' : '#c62828',
                                                    fontWeight: 500,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={thana.totalUsers || 0}
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
                                                label={thana.totalComplaints || 0}
                                                size="small"
                                                sx={{
                                                    backgroundColor: '#fff3e0',
                                                    color: '#e65100',
                                                    fontWeight: 500,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(thana.createdAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditThana(thana)}
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

                                                <Tooltip title={thana.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleStatus(thana)}
                                                        sx={{
                                                            color: thana.status === 'ACTIVE' ? '#c62828' : '#2e7d2e',
                                                            '&:hover': {
                                                                backgroundColor: thana.status === 'ACTIVE' ? '#ffebee' : '#e8f5e8',
                                                            },
                                                        }}
                                                    >
                                                        {thana.status === 'ACTIVE' ? (
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

            {/* Thana Form Modal */}
            <ThanaForm
                open={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedThana(null);
                }}
                onSave={handleSaveThana}
                thana={selectedThana}
                cityCorporationCode={cityCorporation.code}
                mode={formMode}
            />
        </Card>
    );
};

export default ThanaManagement;


