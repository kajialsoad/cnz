import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    FilterList as FilterIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { activityLogService } from '../../services/activityLogService';
import {
    ActivityActions,
    EntityTypes,
    getActionLabel,
    getActionColor,
} from '../../types/activityLog.types';
import type { ActivityLog, ActivityLogQuery } from '../../types/activityLog.types';
import ActivityLogTimeline from './components/ActivityLogTimeline';
import ActivityLogDetailsModal from './components/ActivityLogDetailsModal';

const ActivityLogs: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filters
    const [filters, setFilters] = useState<ActivityLogQuery>({
        page: 1,
        limit: 50,
    });
    const [showFilters, setShowFilters] = useState(false);

    // Selected log for details modal
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    // Fetch activity logs
    const fetchActivityLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await activityLogService.getActivityLogs({
                ...filters,
                page,
                limit,
            });

            setLogs(response.logs);
            setTotal(response.pagination.total);
            setTotalPages(response.pagination.totalPages);
        } catch (err: any) {
            console.error('Error fetching activity logs:', err);
            setError(err.response?.data?.message || 'Failed to fetch activity logs');
        } finally {
            setLoading(false);
        }
    };

    // Export activity logs
    const handleExport = async () => {
        try {
            setExporting(true);
            const blob = await activityLogService.exportActivityLogs(filters);
            activityLogService.downloadActivityLogs(blob);
        } catch (err: any) {
            console.error('Error exporting activity logs:', err);
            setError(err.response?.data?.message || 'Failed to export activity logs');
        } finally {
            setExporting(false);
        }
    };

    // Handle filter change
    const handleFilterChange = (field: keyof ActivityLogQuery, value: any) => {
        setFilters(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    // Apply filters
    const handleApplyFilters = () => {
        setPage(1);
        fetchActivityLogs();
    };

    // Clear filters
    const handleClearFilters = () => {
        setFilters({
            page: 1,
            limit: 50,
        });
        setPage(1);
    };

    // Handle log click
    const handleLogClick = (log: ActivityLog) => {
        setSelectedLog(log);
        setDetailsModalOpen(true);
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    // Fetch logs on mount and when page/filters change
    useEffect(() => {
        fetchActivityLogs();
    }, [page]);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    Activity Logs
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={fetchActivityLogs} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Toggle Filters">
                        <IconButton onClick={() => setShowFilters(!showFilters)}>
                            <FilterIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        disabled={exporting || loading}
                    >
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            {showFilters && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Filters
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Action</InputLabel>
                                <Select
                                    value={filters.action || ''}
                                    onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                                    label="Action"
                                >
                                    <MenuItem value="">All Actions</MenuItem>
                                    {Object.entries(ActivityActions).map(([key, value]) => (
                                        <MenuItem key={key} value={value}>
                                            {getActionLabel(value)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Entity Type</InputLabel>
                                <Select
                                    value={filters.entityType || ''}
                                    onChange={(e) => handleFilterChange('entityType', e.target.value || undefined)}
                                    label="Entity Type"
                                >
                                    <MenuItem value="">All Types</MenuItem>
                                    {Object.entries(EntityTypes).map(([key, value]) => (
                                        <MenuItem key={key} value={value}>
                                            {value}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={filters.startDate || ''}
                                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={filters.endDate || ''}
                                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button onClick={handleClearFilters}>
                                    Clear Filters
                                </Button>
                                <Button variant="contained" onClick={handleApplyFilters}>
                                    Apply Filters
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Statistics */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {logs.length} of {total} activity logs
                </Typography>
            </Paper>

            {/* Activity Log Timeline */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : logs.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        No activity logs found
                    </Typography>
                </Paper>
            ) : (
                <>
                    <ActivityLogTimeline
                        logs={logs}
                        onLogClick={handleLogClick}
                    />

                    {/* Pagination */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Button
                            disabled={page === 1}
                            onClick={() => handlePageChange(page - 1)}
                        >
                            Previous
                        </Button>
                        <Typography sx={{ px: 2, py: 1 }}>
                            Page {page} of {totalPages}
                        </Typography>
                        <Button
                            disabled={page === totalPages}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            Next
                        </Button>
                    </Box>
                </>
            )}

            {/* Details Modal */}
            <ActivityLogDetailsModal
                log={selectedLog}
                open={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedLog(null);
                }}
            />
        </Box>
    );
};

export default ActivityLogs;
