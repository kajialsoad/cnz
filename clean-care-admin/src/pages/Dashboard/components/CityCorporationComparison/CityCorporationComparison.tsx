import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Chip,
} from '@mui/material';
import { cityCorporationService } from '../../../../services/cityCorporationService';
import type { CityCorporation, CityCorporationStats } from '../../../../services/cityCorporationService';

const CityCorporationComparison: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [cityCorps, setCityCorps] = useState<CityCorporation[]>([]);
    const [stats, setStats] = useState<Map<string, CityCorporationStats>>(new Map());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await cityCorporationService.getCityCorporations('ACTIVE');

                // Ensure data is an array
                if (Array.isArray(data)) {
                    setCityCorps(data);

                    // Fetch stats for each city corporation
                    const statsMap = new Map<string, CityCorporationStats>();
                    await Promise.all(
                        data.map(async (cc) => {
                            try {
                                const ccStats = await cityCorporationService.getCityCorporationStats(cc.code);
                                statsMap.set(cc.code, ccStats);
                            } catch (error) {
                                console.error(`Error fetching stats for ${cc.code}:`, error);
                            }
                        })
                    );
                    setStats(statsMap);
                } else {
                    console.error('Invalid data format received:', data);
                    setCityCorps([]);
                    setError('Invalid data format received from server');
                }
            } catch (error) {
                console.error('Error fetching city corporations:', error);
                setCityCorps([]);
                setError(error instanceof Error ? error.message : 'Failed to load city corporations');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <CircularProgress />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" sx={{ color: '#EF4444', mb: 1 }}>
                            {error}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            Please try refreshing the page
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Box
                        sx={{
                            width: 20,
                            height: 20,
                            bgcolor: '#8B5CF6',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography sx={{ color: 'white', fontSize: '12px' }}>📊</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                        City Corporation Comparison
                    </Typography>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>City Corporation</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Total Users</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Total Complaints</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Resolved</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Active Thanas</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(cityCorps) && cityCorps.map((cc) => {
                                const ccStats = stats.get(cc.code);
                                const resolutionRate = ccStats?.totalComplaints
                                    ? ((ccStats.resolvedComplaints / ccStats.totalComplaints) * 100).toFixed(1)
                                    : '0';

                                return (
                                    <TableRow
                                        key={cc.code}
                                        sx={{
                                            '&:hover': {
                                                bgcolor: '#F9FAFB',
                                            },
                                        }}
                                    >
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                                                    {cc.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                                    Wards: {cc.minWard}-{cc.maxWard}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" sx={{ color: '#374151' }}>
                                                {ccStats?.totalUsers?.toLocaleString() || '0'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" sx={{ color: '#374151' }}>
                                                {ccStats?.totalComplaints?.toLocaleString() || '0'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <Typography variant="body2" sx={{ color: '#374151' }}>
                                                    {ccStats?.resolvedComplaints?.toLocaleString() || '0'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#10B981' }}>
                                                    {resolutionRate}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" sx={{ color: '#374151' }}>
                                                {ccStats?.activeThanas || '0'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={cc.status}
                                                size="small"
                                                sx={{
                                                    bgcolor: cc.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2',
                                                    color: cc.status === 'ACTIVE' ? '#065F46' : '#991B1B',
                                                    fontWeight: 500,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {cityCorps.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            No city corporations found
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default CityCorporationComparison;
