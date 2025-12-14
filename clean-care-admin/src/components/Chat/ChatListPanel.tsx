import React, { useState, useCallback, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    FormControl,
    Select,
    MenuItem,
    Button,
    Chip,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
} from '@mui/icons-material';
import { List } from 'react-window';
import type {
    ChatConversation,
    ChatFilters,
    ChatStatistics,
} from '../../types/chat-page.types';
import type { ComplaintStatus } from '../../types/complaint-service.types';
import { useDebounce } from '../../hooks/useDebounce';
import ChatListItem from './ChatListItem';
import ChatListSkeleton from './ChatListSkeleton';
import EmptyState from './EmptyState';
import { cityCorporationService, type CityCorporation } from '../../services/cityCorporationService';
import { zoneService, type Zone } from '../../services/zoneService';
import { wardService, type Ward } from '../../services/wardService';

interface ChatListPanelProps {
    chats: ChatConversation[];
    selectedChatId: number | null;
    onChatSelect: (chatId: number) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filters: ChatFilters;
    onFilterChange: (filters: Partial<ChatFilters>) => void;
    statistics: ChatStatistics;
    loading: boolean;
    // Pagination props
    currentPage?: number;
    totalPages?: number;
    totalChats?: number;
    onPageChange?: (page: number) => void;
    onNextPage?: () => void;
    onPrevPage?: () => void;
}

const ChatListPanel: React.FC<ChatListPanelProps> = ({
    chats,
    selectedChatId,
    onChatSelect,
    searchTerm,
    onSearchChange,
    filters,
    onFilterChange,
    statistics,
    loading,
    currentPage = 1,
    totalPages = 1,
    totalChats = 0,
    onPageChange,
    onNextPage,
    onPrevPage,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Local state for search input (before debounce)
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

    // State for city corporations, zones, and wards
    const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [thanas, setThanas] = useState<any[]>([]);
    const [loadingCityCorporations, setLoadingCityCorporations] = useState(false);
    const [loadingZones, setLoadingZones] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);
    const [loadingThanas, setLoadingThanas] = useState(false);

    // Debounce search to avoid excessive filtering
    const debouncedSearchTerm = useDebounce(localSearchTerm, 500);

    // Update parent when debounced value changes
    React.useEffect(() => {
        onSearchChange(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearchChange]);

    // Fetch city corporations on mount
    useEffect(() => {
        const fetchCityCorporations = async () => {
            try {
                setLoadingCityCorporations(true);
                const response = await cityCorporationService.getCityCorporations('ACTIVE');
                setCityCorporations(response.cityCorporations || []);
            } catch (error) {
                console.error('Error fetching city corporations:', error);
                setCityCorporations([]);
            } finally {
                setLoadingCityCorporations(false);
            }
        };

        fetchCityCorporations();
    }, []);

    // Fetch zones when city corporation changes
    useEffect(() => {
        const fetchZones = async () => {
            if (!filters.cityCorporationCode) {
                setZones([]);
                setWards([]);
                return;
            }

            try {
                setLoadingZones(true);
                const cityCorp = cityCorporations.find(cc => cc.code === filters.cityCorporationCode);
                if (cityCorp) {
                    const zonesData = await zoneService.getZonesByCityCorporation(cityCorp.id, 'ACTIVE');
                    setZones(zonesData);
                }
            } catch (error) {
                console.error('Error fetching zones:', error);
                setZones([]);
            } finally {
                setLoadingZones(false);
            }
        };

        fetchZones();
    }, [filters.cityCorporationCode, cityCorporations]);

    // Fetch thanas when city corporation changes (for backward compatibility)
    useEffect(() => {
        const fetchThanas = async () => {
            if (!filters.cityCorporationCode) {
                setThanas([]);
                return;
            }

            try {
                setLoadingThanas(true);
                // Thanas are now replaced by zones, so we'll use zones as thanas
                const cityCorp = cityCorporations.find(cc => cc.code === filters.cityCorporationCode);
                if (cityCorp) {
                    const zonesData = await zoneService.getZonesByCityCorporation(cityCorp.id, 'ACTIVE');
                    // Map zones to thana format for backward compatibility
                    const thanasData = zonesData.map(zone => ({
                        id: zone.id,
                        name: zone.name,
                    }));
                    setThanas(thanasData);
                }
            } catch (error) {
                console.error('Error fetching thanas:', error);
                setThanas([]);
            } finally {
                setLoadingThanas(false);
            }
        };

        fetchThanas();
    }, [filters.cityCorporationCode, cityCorporations]);

    // Fetch wards when zone changes
    useEffect(() => {
        const fetchWards = async () => {
            if (!filters.zoneId) {
                setWards([]);
                return;
            }

            try {
                setLoadingWards(true);
                const wardsData = await wardService.getWardsByZone(filters.zoneId, 'ACTIVE');
                setWards(wardsData);
            } catch (error) {
                console.error('Error fetching wards:', error);
                setWards([]);
            } finally {
                setLoadingWards(false);
            }
        };

        fetchWards();
    }, [filters.zoneId]);

    /**
     * Handle local search input change
     */
    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearchTerm(event.target.value);
    };

    /**
     * Handle district filter change
     */
    const handleDistrictChange = (value: string) => {
        onFilterChange({
            district: value === 'ALL' ? undefined : value,
            upazila: undefined, // Reset upazila when district changes
        });
    };

    /**
     * Handle upazila filter change
     */
    const handleUpazilaChange = (value: string) => {
        onFilterChange({
            upazila: value === 'ALL' ? undefined : value,
        });
    };

    /**
     * Handle ward filter change
     */
    const handleWardChange = (value: string) => {
        onFilterChange({
            ward: value === 'ALL' ? undefined : value,
        });
    };

    /**
     * Handle zone filter change
     */
    const handleZoneChange = (value: string) => {
        onFilterChange({
            zone: value === 'ALL' ? undefined : value,
        });
    };

    /**
     * Handle city corporation filter change
     */
    const handleCityCorporationChange = (value: string) => {
        onFilterChange({
            cityCorporationCode: value === 'ALL' ? undefined : value,
            thanaId: undefined, // Reset thana when city corporation changes
        });
    };

    /**
     * Handle thana filter change
     */
    const handleThanaChange = (value: string) => {
        onFilterChange({
            thanaId: value === 'ALL' ? undefined : parseInt(value, 10),
        });
    };

    /**
     * Handle status filter change
     */
    const handleStatusChange = (value: string) => {
        onFilterChange({
            status: value === 'ALL' ? undefined : (value as ComplaintStatus),
        });
    };

    /**
     * Handle unread only toggle
     */
    const handleUnreadOnlyToggle = () => {
        onFilterChange({
            unreadOnly: !filters.unreadOnly,
        });
    };

    /**
     * Clear all filters
     */
    const handleClearFilters = () => {
        setLocalSearchTerm('');
        onSearchChange('');
        onFilterChange({
            district: undefined,
            upazila: undefined,
            ward: undefined,
            zone: undefined,
            cityCorporationCode: undefined,
            thanaId: undefined,
            status: undefined,
            unreadOnly: false,
        });
    };

    /**
     * Check if any filters are active
     */
    const hasActiveFilters = () => {
        return (
            localSearchTerm !== '' ||
            filters.district !== undefined ||
            filters.upazila !== undefined ||
            filters.ward !== undefined ||
            filters.zone !== undefined ||
            filters.cityCorporationCode !== undefined ||
            filters.thanaId !== undefined ||
            filters.status !== undefined ||
            filters.unreadOnly === true
        );
    };

    /**
     * Get unique districts from statistics
     */
    const getDistricts = useCallback(() => {
        return statistics.byDistrict.map((item) => item.category);
    }, [statistics.byDistrict]);

    /**
     * Get unique upazilas from statistics
     */
    const getUpazilas = useCallback(() => {
        return statistics.byUpazila.map((item) => item.category);
    }, [statistics.byUpazila]);

    /**
     * Get unique wards from statistics
     */
    const getWards = useCallback(() => {
        return statistics.byWard?.map((item) => item.category) || [];
    }, [statistics.byWard]);

    /**
     * Get unique zones from statistics
     */
    const getZones = useCallback(() => {
        return statistics.byZone?.map((item) => item.category) || [];
    }, [statistics.byZone]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Header with Statistics */}
            <Box
                sx={{
                    p: { xs: 1.5, sm: 2, md: 2 },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        mb: 1.5,
                        fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.25rem' }
                    }}
                >
                    Messages
                </Typography>

                {/* Statistics Badges */}
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
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

                {/* Search Input */}
                <TextField
                    fullWidth
                    placeholder={isMobile ? 'Search...' : 'Search conversations...'}
                    value={localSearchTerm}
                    onChange={handleSearchInputChange}
                    size="small"
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        mb: 1.5,
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.default',
                        },
                    }}
                />

                {/* Filter Dropdowns */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* City Corporation Filter */}
                    <FormControl fullWidth size="small">
                        <Select
                            value={filters.cityCorporationCode || 'ALL'}
                            onChange={(e) => handleCityCorporationChange(e.target.value)}
                            displayEmpty
                            disabled={loadingCityCorporations}
                            startAdornment={
                                <InputAdornment position="start">
                                    <FilterIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                </InputAdornment>
                            }
                            sx={{
                                backgroundColor: 'background.default',
                                '& .MuiSelect-select': {
                                    display: 'flex',
                                    alignItems: 'center',
                                    pl: 0,
                                    fontSize: '0.875rem',
                                },
                            }}
                        >
                            <MenuItem value="ALL">All City Corporations</MenuItem>
                            {cityCorporations && cityCorporations.map((cc) => (
                                <MenuItem key={cc.code} value={cc.code}>
                                    {cc.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Thana Filter */}
                    <FormControl fullWidth size="small">
                        <Select
                            value={filters.thanaId?.toString() || 'ALL'}
                            onChange={(e) => handleThanaChange(e.target.value)}
                            displayEmpty
                            disabled={!filters.cityCorporationCode || loadingThanas}
                            sx={{
                                backgroundColor: 'background.default',
                                fontSize: '0.875rem',
                            }}
                        >
                            <MenuItem value="ALL">All Thanas</MenuItem>
                            {thanas && thanas.map((thana) => (
                                <MenuItem key={thana.id} value={thana.id.toString()}>
                                    {thana.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* District and Upazila filters hidden - not needed for DSCC/DNCC filtering */}

                    {/* Ward Filter */}
                    <FormControl fullWidth size="small">
                        <Select
                            value={filters.ward || 'ALL'}
                            onChange={(e) => handleWardChange(e.target.value)}
                            displayEmpty
                            sx={{
                                backgroundColor: 'background.default',
                                fontSize: '0.875rem',
                            }}
                        >
                            <MenuItem value="ALL">All Wards</MenuItem>
                            {getWards().map((ward) => (
                                <MenuItem key={ward} value={ward}>
                                    Ward {ward}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Zone Filter */}
                    <FormControl fullWidth size="small">
                        <Select
                            value={filters.zone || 'ALL'}
                            onChange={(e) => handleZoneChange(e.target.value)}
                            displayEmpty
                            sx={{
                                backgroundColor: 'background.default',
                                fontSize: '0.875rem',
                            }}
                        >
                            <MenuItem value="ALL">All Zones</MenuItem>
                            {getZones().map((zone) => (
                                <MenuItem key={zone} value={zone}>
                                    Zone {zone}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Status Filter */}
                    <FormControl fullWidth size="small">
                        <Select
                            value={filters.status || 'ALL'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            displayEmpty
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
                    {hasActiveFilters() && (
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
                            Clear Filters
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Chat List Area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                {/* Loading State */}
                {loading && <ChatListSkeleton count={5} />}

                {/* Empty State - No Results */}
                {!loading && chats.length === 0 && hasActiveFilters() && (
                    <EmptyState
                        type="no-results"
                        onAction={handleClearFilters}
                        actionLabel="Clear Filters"
                    />
                )}

                {/* Empty State - No Chats */}
                {!loading && chats.length === 0 && !hasActiveFilters() && (
                    <EmptyState type="no-chats" />
                )}

                {/* Chat List Items - Use virtual scrolling for large lists */}
                {!loading && chats.length > 0 && (
                    <>
                        {chats.length > 100 ? (
                            // Virtual scrolling for large lists (>100 items)
                            <List
                                rowCount={chats.length}
                                rowHeight={isMobile ? 90 : 100}
                                overscanCount={5}
                                rowComponent={({ index, style }) => {
                                    const chat = chats[index];
                                    return (
                                        <div style={style}>
                                            <ChatListItem
                                                key={chat.complaintId}
                                                chat={chat}
                                                isSelected={selectedChatId === chat.complaintId}
                                                onClick={() => onChatSelect(chat.complaintId)}
                                            />
                                        </div>
                                    );
                                }}
                                rowProps={{}}
                                style={{ height: window.innerHeight - 400 }}
                            />
                        ) : (
                            // Regular rendering for smaller lists
                            <Box>
                                {chats.map((chat) => (
                                    <ChatListItem
                                        key={chat.complaintId}
                                        chat={chat}
                                        isSelected={selectedChatId === chat.complaintId}
                                        onClick={() => onChatSelect(chat.complaintId)}
                                    />
                                ))}
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {/* Pagination Controls */}
            {!loading && chats.length > 0 && totalPages > 1 && (
                <Box
                    sx={{
                        p: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        backgroundColor: 'background.paper',
                    }}
                >
                    {/* Page Info */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            color: 'text.secondary',
                        }}
                    >
                        <Typography variant="body2">
                            Page {currentPage} of {totalPages}
                        </Typography>
                        <Typography variant="body2">
                            Total: {totalChats} chats
                        </Typography>
                    </Box>

                    {/* Navigation Buttons */}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            justifyContent: 'space-between',
                        }}
                    >
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={onPrevPage}
                            disabled={currentPage === 1}
                            sx={{
                                flex: 1,
                                textTransform: 'none',
                                fontSize: '0.875rem',
                            }}
                        >
                            ← Previous
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={onNextPage}
                            disabled={currentPage === totalPages}
                            sx={{
                                flex: 1,
                                textTransform: 'none',
                                fontSize: '0.875rem',
                            }}
                        >
                            Next →
                        </Button>
                    </Box>

                    {/* Quick Page Jump (for desktop) */}
                    {!isMobile && totalPages > 3 && (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 0.5,
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            {/* First page */}
                            {currentPage > 2 && (
                                <>
                                    <Button
                                        size="small"
                                        variant={currentPage === 1 ? 'contained' : 'outlined'}
                                        onClick={() => onPageChange?.(1)}
                                        sx={{
                                            minWidth: 36,
                                            height: 36,
                                            p: 0,
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        1
                                    </Button>
                                    {currentPage > 3 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5 }}>
                                            ...
                                        </Box>
                                    )}
                                </>
                            )}

                            {/* Current page and neighbors */}
                            {[currentPage - 1, currentPage, currentPage + 1]
                                .filter((page) => page > 0 && page <= totalPages)
                                .map((page) => (
                                    <Button
                                        key={page}
                                        size="small"
                                        variant={currentPage === page ? 'contained' : 'outlined'}
                                        onClick={() => onPageChange?.(page)}
                                        sx={{
                                            minWidth: 36,
                                            height: 36,
                                            p: 0,
                                            fontSize: '0.75rem',
                                            backgroundColor:
                                                currentPage === page ? '#4CAF50' : 'transparent',
                                            color: currentPage === page ? 'white' : 'text.primary',
                                            '&:hover': {
                                                backgroundColor:
                                                    currentPage === page ? '#45a049' : 'action.hover',
                                            },
                                        }}
                                    >
                                        {page}
                                    </Button>
                                ))}

                            {/* Last page */}
                            {currentPage < totalPages - 1 && (
                                <>
                                    {currentPage < totalPages - 2 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5 }}>
                                            ...
                                        </Box>
                                    )}
                                    <Button
                                        size="small"
                                        variant={currentPage === totalPages ? 'contained' : 'outlined'}
                                        onClick={() => onPageChange?.(totalPages)}
                                        sx={{
                                            minWidth: 36,
                                            height: 36,
                                            p: 0,
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {totalPages}
                                    </Button>
                                </>
                            )}
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default ChatListPanel;
