
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
import { zoneService } from '../../../../services/zoneService';
import type { Zone, ZoneStats } from '../../../../services/zoneService';

interface ZoneComparisonProps {
    cityCorporationCode: string; // Required context
    assignedZones?: Zone[]; // Optional: if provided, only show these
}

export const ZoneComparison: React.FC<ZoneComparisonProps> = ({ cityCorporationCode, assignedZones }) => {
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState<Zone[]>([]);
    const [stats, setStats] = useState<Map<number, ZoneStats>>(new Map());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!cityCorporationCode) return;

            try {
                setLoading(true);
                setError(null);

                let zonesData: Zone[] = [];

                if (assignedZones && assignedZones.length > 0) {
                    zonesData = assignedZones.filter(z =>
                        z.cityCorporation?.code === cityCorporationCode ||
                        z.cityCorporation?.code === cityCorporationCode // Handle via relation
                    );
                    // If assigned zones don't have city corp context but are known to be valid, use them
                    if (zonesData.length === 0 && assignedZones.length > 0) {
                        // Fallback: Assume assigned zones are valid for the selected city corp context if not strictly mismatched
                        zonesData = assignedZones;
                    }
                } else {
                    const response = await zoneService.getZones({
                        cityCorporationCode,
                        status: 'ACTIVE'
                    });
                    zonesData = response.zones || [];
                }

                setZones(zonesData);

                // Fetch stats for each zone in parallel
                const statsMap = new Map<number, ZoneStats>();
                await Promise.all(
                    zonesData.map(async (zone) => {
                        try {
                            const zoneStats = await zoneService.getZoneStats(zone.id);
                            statsMap.set(zone.id, zoneStats);
                        } catch (error) {
                            console.error(`Error fetching stats for Zone ${zone.id}:`, error);
                        }
                    })
                );
                setStats(statsMap);

            } catch (error) {
                console.error('Error fetching zone comparison data:', error);
                setError('Failed to load zone analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [cityCorporationCode, assignedZones]);

    if (!cityCorporationCode) return null;

    if (loading) {
        return (
            <Card sx={{ mt: 3 }}>
                <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <CircularProgress />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card sx={{ mt: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography color="error" align="center">{error}</Typography>
                </CardContent>
            </Card>
        );
    }

    if (zones.length === 0) {
        return (
            <Card sx={{ mt: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography color="text.secondary" align="center">No zones found for comparison</Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Box
                        sx={{
                            width: 20,
                            height: 20,
                            bgcolor: '#3B82F6',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography sx={{ color: 'white', fontSize: '12px' }}>📊</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                        Zone Performance Comparison
                    </Typography>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Zone</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Total Users</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Wards</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Total Complaints</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {zones.map((zone) => {
                                const zStats = stats.get(zone.id);
                                return (
                                    <TableRow
                                        key={zone.id}
                                        sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                                                {zone.name || `Zone ${zone.zoneNumber}`}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" sx={{ color: '#374151' }}>
                                                {zStats?.totalUsers?.toLocaleString() || '0'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" sx={{ color: '#374151' }}>
                                                {zStats?.totalWards?.toLocaleString() || '0'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" sx={{ color: '#374151' }}>
                                                {zStats?.totalComplaints?.toLocaleString() || '0'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={zone.status}
                                                size="small"
                                                sx={{
                                                    bgcolor: zone.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2',
                                                    color: zone.status === 'ACTIVE' ? '#065F46' : '#991B1B',
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
            </CardContent>
        </Card>
    );
};

export default ZoneComparison;


