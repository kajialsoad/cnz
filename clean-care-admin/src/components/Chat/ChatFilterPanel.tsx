import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    FormControl,
    Select,
    MenuItem,
    Button,
    Chip,
    InputLabel,
    CircularProgress,
} from '@mui/material';
import {
    FilterList as FilterIcon,
    Clear as ClearIcon,
} from '@mui/icons-material';
import type {
    ChatFilters,
    ChatStatistics,
} from '../../types/chat-page.types';
import type { ComplaintStatus } from '../../types/complaint-service.types';
import { cityCorporationService, type CityCorporation } from '../../services/cityCorporationService';
import { wardService, type Ward } from '../../services/wardService';
import { superAdminService } from '../../services/superAdminService';
import { ZoneFilter } from '../common';
import { useAuth } from '../../contexts/AuthContext';
import type { Zone } from '../../services/zoneService';

interface ChatFilterPanelProps {
    filters: ChatFilters;
    onFilterChange: (filters: Partial<ChatFilters>) => void;
    statistics: ChatStatistics;
    showStatusFilter?: boolean;
    statusOptions?: { label: string; value: string }[];
}

const ChatFilterPanel: React.FC<ChatFilterPanelProps> = ({
    filters,
    onFilterChange,
    statistics,
    showStatusFilter = true,
    statusOptions,
}) => {
    const { user: currentUser } = useAuth();
    const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
    const [loadingCityCorporations, setLoadingCityCorporations] = useState(false);
    const [wards, setWards] = useState<Ward[]>([]);
    const [wardsLoading, setWardsLoading] = useState(false);
    const [assignedZones, setAssignedZones] = useState<Zone[]>([]);

    // Fetch city corporations and assigned zones on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingCityCorporations(true);
                
                // Fetch City Corporations
                const response = await cityCorporationService.getCityCorporations('ACTIVE');
                let availableCityCorps = response.cityCorporations || [];

                // Filter for non-Master Admin
                if (currentUser && currentUser.role !== 'MASTER_ADMIN') {
                    const assignedCityCode = (currentUser as any).cityCorporationCode || (currentUser as any).cityCorporation?.code;
                    if (assignedCityCode) {
                        availableCityCorps = availableCityCorps.filter(cc => cc.code === assignedCityCode);
                        // Auto-select if not already selected
                        if (!filters.cityCorporationCode) {
                            onFilterChange({ cityCorporationCode: assignedCityCode });
                        }
                    }
                }
                setCityCorporations(availableCityCorps);

                // Fetch Assigned Zones for Super Admin
                if (currentUser?.role === 'SUPER_ADMIN' && currentUser.id) {
                    try {
                        const zonesResponse = await superAdminService.getAssignedZones(Number(currentUser.id));
                        const formattedZones: Zone[] = (zonesResponse as any[])
                            .map(z => {
                                const zoneData = z.zone || z;
                                if (!zoneData || !zoneData.id) return null;
                                return {
                                    id: zoneData.id,
                                    zoneNumber: zoneData.zoneNumber,
                                    name: zoneData.name,
                                    cityCorporationId: zoneData.cityCorporationId || 0,
                                    status: 'ACTIVE',
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                } as Zone;
                            })
                            .filter((z): z is Zone => z !== null);
                        setAssignedZones(formattedZones);
                        
                        // Auto-select if single zone
                        if (formattedZones.length === 1 && !filters.zone) {
                            onFilterChange({ zone: formattedZones[0].id.toString() });
                        }
                    } catch (err) {
                        console.error('Error fetching assigned zones:', err);
                    }
                }

            } catch (error) {
                console.error('Error fetching city corporations:', error);
                setCityCorporations([]);
            } finally {
                setLoadingCityCorporations(false);
            }
        };

        if (currentUser) {
            fetchData();
        }
    }, [currentUser]);

    // Fetch wards when zone changes
    useEffect(() => {
        const fetchWards = async () => {
            // Skip for ADMIN role - they have pre-loaded assigned wards (handled below)
            // But we need to handle ADMIN role logic here too similar to UserManagement
            
            if (filters.zone) {
                try {
                    setWardsLoading(true);
                    const wardsData = await wardService.getWardsByZone(Number(filters.zone), 'ACTIVE');
                    setWards(wardsData);
                } catch (err) {
                    console.error('Error fetching wards:', err);
                    setWards([]);
                } finally {
                    setWardsLoading(false);
                }
            } else {
                setWards([]);
            }
        };

        fetchWards();
    }, [filters.zone]);

    // Handle Admin assigned wards logic
    useEffect(() => {
        if (currentUser?.role === 'ADMIN') {
             // Parse ward IDs from permissions
             let adminWardIds: number[] = [];
             if ((currentUser as any).permissions) {
                 try {
                     const permissionsData = JSON.parse((currentUser as any).permissions);
                     if (permissionsData.wards && Array.isArray(permissionsData.wards)) {
                         adminWardIds = permissionsData.wards;
                     }
                 } catch (error) {
                     console.error('Error parsing admin permissions:', error);
                 }
             }

             if (adminWardIds.length > 0) {
                 const fetchAdminWards = async () => {
                     try {
                        setWardsLoading(true);
                        const assignedCityCode = (currentUser as any).cityCorporationCode || (currentUser as any).cityCorporation?.code;
                        if (assignedCityCode) {
                            const wardsResponse = await wardService.getWards({
                                cityCorporationCode: assignedCityCode,
                                status: 'ACTIVE'
                            });
                            const assignedWards = wardsResponse.wards.filter((ward: Ward) =>
                                adminWardIds.includes(ward.id)
                            );
                            setWards(assignedWards);
                        }
                     } catch (err) {
                         console.error('Error fetching admin wards:', err);
                     } finally {
                        setWardsLoading(false);
                     }
                 };
                 fetchAdminWards();
             }
        }
    }, [currentUser]);

    const handleCityCorporationChange = (value: string) => {
        onFilterChange({
            cityCorporationCode: value === 'ALL' ? undefined : value,
            thanaId: undefined,
            zone: undefined,
            ward: undefined,
        });
    };

    const handleWardChange = (value: string) => {
        onFilterChange({
            ward: value === 'ALL' ? undefined : value,
        });
    };

    const handleZoneChange = (value: number | '') => {
        onFilterChange({
            zone: value === '' ? undefined : value.toString(),
            ward: undefined, // Reset ward when zone changes
        });
    };

    const handleStatusChange = (value: string) => {
        onFilterChange({
            status: value === 'ALL' ? undefined : (value as ComplaintStatus),
        });
    };

    const handleUnreadOnlyToggle = () => {
        onFilterChange({
            unreadOnly: !filters.unreadOnly,
        });
    };

    const handleClearFilters = () => {
        // Reset to defaults based on role
        let defaultCityCorp = undefined;
        let defaultZone = undefined;

        if (currentUser?.role !== 'MASTER_ADMIN') {
             defaultCityCorp = (currentUser as any).cityCorporationCode || (currentUser as any).cityCorporation?.code;
        }
        
        // Note: We don't auto-reset to default zone for Super Admin here to keep it simple, 
        // but UserManagement does. For now, clear means clear.
        
        onFilterChange({
            cityCorporationCode: defaultCityCorp,
            ward: undefined,
            zone: undefined,
            status: undefined,
            unreadOnly: false,
        });
    };

    const hasActiveFilters = () => {
        return (
            (filters.cityCorporationCode !== undefined && currentUser?.role === 'MASTER_ADMIN') || // Only count city filter if Master Admin
            filters.ward !== undefined ||
            filters.zone !== undefined ||
            filters.status !== undefined ||
            filters.unreadOnly === true
        );
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 1,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        mb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <FilterIcon />
                    Filters
                </Typography>

                {/* Statistics */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip
                        label={`${statistics.totalChats} Total`}
                        size="small"
                        sx={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            fontWeight: 500,
                        }}
                    />
                    <Chip
                        label={`${statistics.unreadCount} Unread`}
                        size="small"
                        sx={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            fontWeight: 500,
                        }}
                    />
                </Box>
            </Box>

            {/* Filter Controls */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {/* City Corporation Filter */}
                <FormControl fullWidth size="small">
                    <InputLabel id="city-filter-label">City Corporation</InputLabel>
                    <Select
                        labelId="city-filter-label"
                        label="City Corporation"
                        value={filters.cityCorporationCode || 'ALL'}
                        onChange={(e) => handleCityCorporationChange(e.target.value)}
                        disabled={loadingCityCorporations || (currentUser?.role !== 'MASTER_ADMIN' && cityCorporations.length <= 1)}
                        sx={{
                            backgroundColor: 'background.default',
                            fontSize: '0.875rem',
                        }}
                    >
                        {currentUser?.role === 'MASTER_ADMIN' && (
                             <MenuItem value="ALL">All City Corporations</MenuItem>
                        )}
                        {cityCorporations.map((cc) => (
                            <MenuItem key={cc.code} value={cc.code}>
                                {typeof cc.name === 'object' ? JSON.stringify(cc.name) : cc.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Zone Filter */}
                {currentUser?.role !== 'ADMIN' && (
                    <Box>
                        <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, display: 'block' }}>
                            Zone
                        </Typography>
                        <ZoneFilter
                            value={filters.zone ? Number(filters.zone) : ''}
                            onChange={handleZoneChange}
                            cityCorporationCode={filters.cityCorporationCode || ''}
                            disabled={false}
                            zones={assignedZones.length > 0 ? assignedZones : undefined}
                        />
                    </Box>
                )}

                {/* Ward Filter */}
                <FormControl fullWidth size="small">
                    <InputLabel id="ward-filter-label">Ward</InputLabel>
                    <Select
                        labelId="ward-filter-label"
                        label="Ward"
                        value={filters.ward || 'ALL'}
                        onChange={(e) => handleWardChange(e.target.value)}
                        disabled={wardsLoading || wards.length === 0}
                        sx={{
                            backgroundColor: 'background.default',
                            fontSize: '0.875rem',
                        }}
                    >
                        <MenuItem value="ALL">All Wards</MenuItem>
                        {wards.map((ward) => (
                            <MenuItem key={ward.id} value={ward.id.toString()}>
                                Ward {typeof ward.wardNumber === 'object' ? JSON.stringify(ward.wardNumber) : ward.wardNumber}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Status Filter - Optional */}
                {showStatusFilter && (
                    <FormControl fullWidth size="small">
                        <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select
                            labelId="status-filter-label"
                            label="Status"
                            value={filters.status || 'ALL'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            sx={{
                                backgroundColor: 'background.default',
                                fontSize: '0.875rem',
                            }}
                        >
                            <MenuItem value="ALL">All Status</MenuItem>
                            <MenuItem value="PENDING">Pending</MenuItem>
                            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                            <MenuItem value="RESOLVED">Solved</MenuItem>
                            <MenuItem value="REJECTED">Rejected</MenuItem>
                        </Select>
                    </FormControl>
                )}

                {/* Unread Only Toggle */}
                <Button
                    fullWidth
                    variant={filters.unreadOnly ? 'contained' : 'outlined'}
                    size="small"
                    onClick={handleUnreadOnlyToggle}
                    sx={{
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        backgroundColor: filters.unreadOnly ? '#4CAF50' : 'transparent',
                        borderColor: filters.unreadOnly ? '#4CAF50' : 'divider',
                        color: filters.unreadOnly ? 'white' : 'text.primary',
                        '&:hover': {
                            backgroundColor: filters.unreadOnly ? '#45a049' : 'action.hover',
                            borderColor: filters.unreadOnly ? '#45a049' : '#4CAF50',
                        },
                    }}
                >
                    {filters.unreadOnly ? '✓ Unread Only' : 'Show Unread Only'}
                </Button>

                {/* Clear Filters Button */}
                <Button
                    fullWidth
                    variant="text"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                    sx={{
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        '&:hover': {
                            color: 'error.main',
                        },
                    }}
                >
                    Clear All Filters
                </Button>
            </Box>
        </Box>
    );
};

export default ChatFilterPanel;
