import React from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Tooltip,
    Skeleton,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { type Zone } from '../../services/zoneService';

interface ZoneListProps {
    zones: Zone[];
    loading: boolean;
    onEdit: (zone: Zone) => void;
    onDelete: (zone: Zone) => void;
    onSelectZone: (zone: Zone) => void;
    selectedZoneId?: number | null;
}

const ZoneList: React.FC<ZoneListProps> = ({
    zones,
    loading,
    onEdit,
    onDelete,
    onSelectZone,
    selectedZoneId,
}) => {
    if (loading) {
        return (
            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Zone Number</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Zone Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Officer Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Officer Designation</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Officer Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total Wards</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total Users</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={30} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    if (zones.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    No zones added yet. Click "Add Zone" to create the first zone.
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} elevation={0}>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Zone Number</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Zone Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Officer Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Officer Designation</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Officer Phone</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total Wards</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total Users</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {zones.map((zone) => (
                        <TableRow
                            key={zone.id}
                            onClick={() => onSelectZone(zone)}
                            sx={{
                                cursor: 'pointer',
                                backgroundColor:
                                    selectedZoneId === zone.id ? '#e3f2fd' : 'transparent',
                                '&:hover': {
                                    backgroundColor:
                                        selectedZoneId === zone.id ? '#e3f2fd' : '#f8f9fa',
                                },
                            }}
                        >
                            <TableCell>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    Zone {zone.zoneNumber}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body1">
                                    {zone.name || `Zone ${zone.zoneNumber}`}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                    {zone.officerName || '-'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                    {zone.officerDesignation || '-'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                    {zone.officerPhone || '-'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={zone._count?.wards || zone.totalWards || 0}
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
                                    label={zone._count?.users || zone.totalUsers || 0}
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
                                    label={zone.status}
                                    size="small"
                                    sx={{
                                        backgroundColor:
                                            zone.status === 'ACTIVE' ? '#e8f5e8' : '#ffebee',
                                        color: zone.status === 'ACTIVE' ? '#2e7d2e' : '#c62828',
                                        fontWeight: 500,
                                    }}
                                />
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Edit Zone">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(zone);
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

                                    <Tooltip title="Delete Zone">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(zone);
                                            }}
                                            sx={{
                                                color: '#c62828',
                                                '&:hover': {
                                                    backgroundColor: '#ffebee',
                                                },
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ZoneList;
