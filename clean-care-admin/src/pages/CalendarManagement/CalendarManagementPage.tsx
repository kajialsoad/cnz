import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Stack,
    Tooltip,
    Paper,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CalendarToday as CalendarIcon,
    Event as EventIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout/MainLayout';
import { calendarService } from '../../services/calendarService';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import type { Calendar } from '../../types/calendar.types';
import CalendarModal from '../../components/Calendar/CalendarModal';
import { fadeIn, slideInUp, animationConfig, buttonHoverAnimation } from '../../styles/animations';

const MONTHS = [
    { value: 1, label: 'January', labelBn: 'জানুয়ারি' },
    { value: 2, label: 'February', labelBn: 'ফেব্রুয়ারি' },
    { value: 3, label: 'March', labelBn: 'মার্চ' },
    { value: 4, label: 'April', labelBn: 'এপ্রিল' },
    { value: 5, label: 'May', labelBn: 'মে' },
    { value: 6, label: 'June', labelBn: 'জুন' },
    { value: 7, label: 'July', labelBn: 'জুলাই' },
    { value: 8, label: 'August', labelBn: 'আগস্ট' },
    { value: 9, label: 'September', labelBn: 'সেপ্টেম্বর' },
    { value: 10, label: 'October', labelBn: 'অক্টোবর' },
    { value: 11, label: 'November', labelBn: 'নভেম্বর' },
    { value: 12, label: 'December', labelBn: 'ডিসেম্বর' },
];

const CalendarManagementPage: React.FC = () => {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filters
    const [filterMonth, setFilterMonth] = useState<number | ''>('');
    const [filterYear, setFilterYear] = useState<number | ''>(new Date().getFullYear());
    const [filterCityCorporation, setFilterCityCorporation] = useState<number | ''>('');
    const [filterZone, setFilterZone] = useState<number | ''>('');
    const [filterWard, setFilterWard] = useState<number | ''>('');
    const [filterActive, setFilterActive] = useState<boolean | ''>('');

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [calendarToDelete, setCalendarToDelete] = useState<Calendar | null>(null);

    // Location data
    const [cityCorporations, setCityCorporations] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    useEffect(() => {
        loadCalendars();
        loadCityCorporations();
    }, [filterMonth, filterYear, filterCityCorporation, filterZone, filterWard, filterActive]);

    const loadCalendars = async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: any = {};
            if (filterMonth) filters.month = filterMonth;
            if (filterYear) filters.year = filterYear;
            if (filterCityCorporation) filters.cityCorporationId = filterCityCorporation;
            if (filterZone) filters.zoneId = filterZone;
            if (filterWard) filters.wardId = filterWard;
            if (filterActive !== '') filters.isActive = filterActive;

            const data = await calendarService.getCalendars(filters);
            setCalendars(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load calendars');
        } finally {
            setLoading(false);
        }
    };

    const loadCityCorporations = async () => {
        try {
            console.log('🔍 [Calendar] Loading city corporations...');
            const data = await cityCorporationService.getCityCorporations();
            console.log('✅ [Calendar] City Corporations response:', data);
            console.log('✅ [Calendar] Extracted array:', data.cityCorporations);

            // Service returns { cityCorporations: [...] }, extract the array
            setCityCorporations(data.cityCorporations || []);
            console.log('✅ [Calendar] State updated with', (data.cityCorporations || []).length, 'city corporations');
        } catch (err) {
            console.error('❌ [Calendar] Failed to load city corporations:', err);
            setCityCorporations([]); // Set empty array on error
        }
    };

    const loadZones = async (cityCorporationId: number) => {
        try {
            console.log('🔍 [Calendar] Loading zones for city corporation:', cityCorporationId);
            const data = await zoneService.getZonesByCityCorporation(cityCorporationId);
            console.log('✅ [Calendar] Zones response:', data);

            setZones(Array.isArray(data) ? data : []);
            console.log('✅ [Calendar] State updated with', (Array.isArray(data) ? data : []).length, 'zones');
        } catch (err) {
            console.error('❌ [Calendar] Failed to load zones:', err);
            setZones([]); // Set empty array on error
        }
    };

    const loadWards = async (zoneId: number) => {
        try {
            const data = await wardService.getWardsByZone(zoneId);
            setWards(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load wards:', err);
            setWards([]); // Set empty array on error
        }
    };

    const handleCityCorporationChange = (cityCorporationId: number | '') => {
        setFilterCityCorporation(cityCorporationId);
        setFilterZone('');
        setFilterWard('');
        setZones([]);
        setWards([]);
        if (cityCorporationId) {
            loadZones(cityCorporationId);
        }
    };

    const handleZoneChange = (zoneId: number | '') => {
        setFilterZone(zoneId);
        setFilterWard('');
        setWards([]);
        if (zoneId) {
            loadWards(zoneId);
        }
    };

    const handleAddCalendar = () => {
        setEditingCalendar(null);
        setModalOpen(true);
    };

    const handleEditCalendar = (calendar: Calendar) => {
        setEditingCalendar(calendar);
        setModalOpen(true);
    };

    const handleDeleteClick = (calendar: Calendar) => {
        setCalendarToDelete(calendar);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!calendarToDelete) return;

        try {
            await calendarService.deleteCalendar(calendarToDelete.id);
            setSuccess('Calendar deleted successfully');
            setDeleteDialogOpen(false);
            setCalendarToDelete(null);
            loadCalendars();
        } catch (err: any) {
            setError(err.message || 'Failed to delete calendar');
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingCalendar(null);
    };

    const handleModalSuccess = () => {
        setSuccess(editingCalendar ? 'Calendar updated successfully' : 'Calendar created successfully');
        handleModalClose();
        loadCalendars();
    };

    const handleToggleActive = async (calendar: Calendar) => {
        try {
            await calendarService.updateCalendar(calendar.id, {
                isActive: !calendar.isActive,
            });
            setSuccess(`Calendar ${calendar.isActive ? 'deactivated' : 'activated'} successfully`);
            loadCalendars();
        } catch (err: any) {
            setError(err.message || 'Failed to update calendar status');
        }
    };

    const getMonthName = (month: number) => {
        const monthData = MONTHS.find(m => m.value === month);
        return monthData ? monthData.label : month.toString();
    };

    const getLocationText = (calendar: Calendar) => {
        if (calendar.ward) {
            return `Ward ${calendar.ward.number}`;
        }
        if (calendar.zone) {
            return `Zone ${calendar.zone.number}`;
        }
        if (calendar.cityCorporation) {
            return calendar.cityCorporation.name;
        }
        return 'All Areas';
    };

    return (
        <MainLayout title="Calendar Management">
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                {/* Header */}
                <Paper
                    sx={{
                        p: { xs: 2, md: 3 },
                        mb: 3,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #0f766e 0%, #22c55e 100%)',
                        color: 'white',
                        animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                        animationFillMode: 'both',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: { xs: 'flex-start', md: 'center' },
                            justifyContent: 'space-between',
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                                Calendar Management
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Create, manage, and analyze government calendars with better clarity
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddCalendar}
                            sx={{
                                bgcolor: 'white',
                                color: '#0f766e',
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': { bgcolor: '#f0fdf4' },
                                ...buttonHoverAnimation,
                            }}
                        >
                            Add Calendar
                        </Button>
                    </Box>
                </Paper>

                {/* Alerts */}
                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {/* Filters */}
                <Card
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
                        border: '1px solid',
                        borderColor: 'divider',
                        animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                        animationFillMode: 'both',
                        animationDelay: '40ms',
                    }}
                >
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Filters
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid xs={12} sm={6} md={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Month</InputLabel>
                                    <Select
                                        value={filterMonth === '' ? '' : filterMonth}
                                        label="Month"
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFilterMonth(value === '' ? '' : Number(value));
                                        }}
                                    >
                                        <MenuItem value="">All Months</MenuItem>
                                        {MONTHS.map((month) => (
                                            <MenuItem key={month.value} value={month.value}>
                                                {month.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid xs={12} sm={6} md={2}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Year"
                                    type="number"
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : '')}
                                />
                            </Grid>

                            <Grid xs={12} sm={6} md={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>City Corporation</InputLabel>
                                    <Select
                                        value={filterCityCorporation}
                                        label="City Corporation"
                                        onChange={(e) => handleCityCorporationChange(e.target.value as number | '')}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        {cityCorporations.map((cc) => (
                                            <MenuItem key={cc.id} value={cc.id}>
                                                {cc.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid xs={12} sm={6} md={2}>
                                <FormControl fullWidth size="small" disabled={!filterCityCorporation}>
                                    <InputLabel>Zone</InputLabel>
                                    <Select
                                        value={filterZone}
                                        label="Zone"
                                        onChange={(e) => handleZoneChange(e.target.value as number | '')}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        {zones.map((zone) => (
                                            <MenuItem key={zone.id} value={zone.id}>
                                                Zone {zone.number}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid xs={12} sm={6} md={2}>
                                <FormControl fullWidth size="small" disabled={!filterZone}>
                                    <InputLabel>Ward</InputLabel>
                                    <Select
                                        value={filterWard}
                                        label="Ward"
                                        onChange={(e) => setFilterWard(e.target.value as number | '')}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        {wards.map((ward) => (
                                            <MenuItem key={ward.id} value={ward.id}>
                                                Ward {ward.number}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid xs={12} sm={6} md={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={filterActive === '' ? '' : filterActive ? 'true' : 'false'}
                                        label="Status"
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '') {
                                                setFilterActive('');
                                            } else {
                                                setFilterActive(value === 'true');
                                            }
                                        }}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        <MenuItem value="true">Active</MenuItem>
                                        <MenuItem value="false">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Calendar Grid */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : calendars.length === 0 ? (
                    <Card
                        sx={{
                            borderRadius: 3,
                            boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <CardContent>
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No calendars found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Create your first calendar to get started
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ) : (
                    <Grid container spacing={3}>
                        {calendars.map((calendar, index) => (
                            <Grid key={calendar.id} xs={12} sm={6} md={4} lg={3}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        opacity: calendar.isActive ? 1 : 0.6,
                                        borderRadius: 3,
                                        boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        transition: 'all 0.3s ease',
                                        animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                                        animationFillMode: 'both',
                                        animationDelay: `${index * 40}ms`,
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                                        },
                                    }}
                                >
                                    {/* Calendar Image */}
                                    <CardMedia
                                        component="img"
                                        height="300"
                                        image={calendar.imageUrl}
                                        alt={calendar.title}
                                        sx={{ objectFit: 'cover' }}
                                    />

                                    {/* Status Badge */}
                                    <Chip
                                        label={calendar.isActive ? 'Active' : 'Inactive'}
                                        size="small"
                                        color={calendar.isActive ? 'success' : 'default'}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                        }}
                                    />

                                    <CardContent sx={{ flexGrow: 1 }}>
                                        {/* Title */}
                                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                                            {calendar.title}
                                        </Typography>
                                        {calendar.titleBn && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {calendar.titleBn}
                                            </Typography>
                                        )}

                                        {/* Month & Year */}
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {getMonthName(calendar.month)} {calendar.year}
                                            </Typography>
                                        </Stack>

                                        {/* Location */}
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            📍 {getLocationText(calendar)}
                                        </Typography>

                                        {/* Events Count */}
                                        {calendar.events && calendar.events.length > 0 && (
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {calendar.events.length} event{calendar.events.length !== 1 ? 's' : ''}
                                                </Typography>
                                            </Stack>
                                        )}
                                    </CardContent>

                                    {/* Actions */}
                                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                                        <Tooltip title={calendar.isActive ? 'Deactivate' : 'Activate'}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleToggleActive(calendar)}
                                                sx={{ color: calendar.isActive ? 'success.main' : 'text.secondary' }}
                                            >
                                                {calendar.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditCalendar(calendar)}
                                                sx={{ color: 'primary.main' }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClick(calendar)}
                                                sx={{ color: 'error.main' }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Calendar Modal */}
                <CalendarModal
                    open={modalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    calendar={editingCalendar}
                />

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>Delete Calendar</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete this calendar? This action cannot be undone.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
};

export default CalendarManagementPage;
