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
} from '@mui/icons-material';
import { type Ward } from '../../services/wardService';

interface WardListProps {
    wards: Ward[];
    loading: boolean;
    onEdit: (ward: Ward) => void;
}

const WardList: React.FC<WardListProps> = ({
    wards,
    loading,
    onEdit,
}) => {
    if (loading) {
        return (
            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Ward Number</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Inspector Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Inspector Serial</TableCell>
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    if (!wards || !Array.isArray(wards)) {
        console.error('Invalid wards data:', wards);
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    Error loading wards. Please try again.
                </Typography>
            </Box>
        );
    }

    if (wards.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    No wards added yet. Click "Add Wards" to create wards for this zone.
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} elevation={0}>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Ward Number</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Inspector Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Inspector Serial</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total Users</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {wards.map((ward) => (
                        <TableRow
                            key={ward.id}
                            sx={{
                                '&:hover': {
                                    backgroundColor: '#f8f9fa',
                                },
                            }}
                        >
                            <TableCell>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    Ward {ward.wardNumber}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                    {ward.inspectorName || '-'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                    {ward.inspectorSerialNumber || '-'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={ward._count?.users || ward.totalUsers || 0}
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
                                    label={ward.status}
                                    size="small"
                                    sx={{
                                        backgroundColor:
                                            ward.status === 'ACTIVE' ? '#e8f5e8' : '#ffebee',
                                        color: ward.status === 'ACTIVE' ? '#2e7d2e' : '#c62828',
                                        fontWeight: 500,
                                    }}
                                />
                            </TableCell>
                            <TableCell>
                                <Tooltip title="Edit Ward">
                                    <IconButton
                                        size="small"
                                        onClick={() => onEdit(ward)}
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
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default WardList;
