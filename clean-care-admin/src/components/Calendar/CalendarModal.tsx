import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Grid,
    IconButton,
    Card,
    CardContent,
    Stack,
    Chip,
} from '@mui/material';
import {
    Close as CloseIcon,
    CloudUpload as UploadIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { calendarService } from '../../services/calendarService';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import type { Calendar, CreateCalendarEventDto } from '../../types/calendar.types';

interface CalendarModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    calendar?: Calendar | null;
}

const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

const EVENT_CATEGORIES = [
    { value: 'wasteCollection', label: 'Waste Collection' },
    { value: 'publicHoliday', label: 'Public Holiday' },
    { value: 'communityEvent', label: 'Community Event' },
];

const CalendarModal: React.FC<CalendarModalProps> = ({ open, onClose, onSuccess, calendar }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [title, setTitle] = useState('');
    const [titleBn, setTitleBn] = useState('');
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [cityCorporationId, setCityCorporationId] = useState<number | ''>('');
    const [zoneId, setZoneId] = useState<number | ''>('');
    const [wardId, setWardId] = useState<number | ''>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [events, setEvents] = useState<CreateCalendarEventDto[]>([]);

    // Location data
    const [cityCorporations, setCityCorporations] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            loadCityCorporations();
            if (calendar) {
                // Edit mode
                setTitle(calendar.title);
                setTitleBn(calendar.titleBn || '');
                setMonth(calendar.month);
                setYear(calendar.year);
                setCityCorporationId(calendar.cityCorporationId || '');
                setZoneId(calendar.zoneId || '');
                setWardId(calendar.wardId || '');
                setImagePreview(calendar.imageUrl);
                setEvents(calendar.events || []);

                if (calendar.cityCorporationId) {
                    loadZones(calendar.cityCorporationId);
                }
                if (calendar.zoneId) {
                    loadWards(calendar.zoneId);
                }
            } else {
                // Add mode
                resetForm();
            }
        }
    }, [open, calendar]);

    const resetForm = () => {
        setTitle('');
        setTitleBn('');
        setMonth(new Date().getMonth() + 1);
        setYear(new Date().getFullYear());
        setCityCorporationId('');
        setZoneId('');
        setWardId('');
        setImageFile(null);
        setImagePreview(null);
        setEvents([]);
        setError(null);
    };

    const loadCityCorporations = async () => {
        try {
            const data = await cityCorporationService.getCityCorporations();
            // Service returns { cityCorporations: [...] }, extract the array
            setCityCorporations(data.cityCorporations || []);
        } catch (err) {
            console.error('Failed to load city corporations:', err);
            setCityCorporations([]); // Set empty array on error
        }
    };

    const loadZones = async (ccId: number) => {
        try {
            const data = await zoneService.getZonesByCityCorporation(ccId);
            setZones(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load zones:', err);
            setZones([]); // Set empty array on error
        }
    };

    const loadWards = async (zId: number) => {
        try {
            const data = await wardService.getWardsByZone(zId);
            setWards(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load wards:', err);
            setWards([]); // Set empty array on error
        }
    };

    const handleCityCorporationChange = (ccId: number | '') => {
        setCityCorporationId(ccId);
        setZoneId('');
        setWardId('');
        setZones([]);
        setWards([]);
        if (ccId) {
            loadZones(ccId);
        }
    };

    const handleZoneChange = (zId: number | '') => {
        setZoneId(zId);
        setWardId('');
        setWards([]);
        if (zId) {
            loadWards(zId);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddEvent = () => {
        setEvents([
            ...events,
            {
                title: '',
                titleBn: '',
                description: '',
                descriptionBn: '',
                eventDate: new Date().toISOString().split('T')[0],
                eventType: 'Event',
                category: 'communityEvent',
            },
        ]);
    };

    const handleEventChange = (index: number, field: string, value: any) => {
        const newEvents = [...events];
        (newEvents[index] as any)[field] = value;
        setEvents(newEvents);
    };

    const handleRemoveEvent = (index: number) => {
        setEvents(events.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validation
            if (!title.trim()) {
                setError('Title is required');
                return;
            }

            if (!calendar && !imageFile) {
                setError('Calendar image is required');
                return;
            }

            const calendarData: any = {
                title: title.trim(),
                titleBn: titleBn.trim() || undefined,
                month,
                year,
                cityCorporationId: cityCorporationId || undefined,
                zoneId: zoneId || undefined,
                wardId: wardId || undefined,
                events: events.filter(e => e.title.trim()),
            };

            if (calendar) {
                // Update
                await calendarService.updateCalendar(calendar.id, calendarData, imageFile || undefined);
            } else {
                // Create
                if (!imageFile) {
                    setError('Image is required');
                    return;
                }
                await calendarService.createCalendar(calendarData, imageFile);
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to save calendar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        {calendar ? 'Edit Calendar' : 'Add New Calendar'}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={2}>
                    {/* Title */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Title (English)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Title (Bangla)"
                            value={titleBn}
                            onChange={(e) => setTitleBn(e.target.value)}
                        />
                    </Grid>

                    {/* Month & Year */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Month</InputLabel>
                            <Select value={month} label="Month" onChange={(e) => setMonth(e.target.value as number)}>
                                {MONTHS.map((m) => (
                                    <MenuItem key={m.value} value={m.value}>
                                        {m.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Year"
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            required
                        />
                    </Grid>

                    {/* Geographical Targeting */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                            Geographical Targeting (Optional)
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                            <InputLabel>City Corporation</InputLabel>
                            <Select
                                value={cityCorporationId}
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

                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth disabled={!cityCorporationId}>
                            <InputLabel>Zone</InputLabel>
                            <Select
                                value={zoneId}
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

                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth disabled={!zoneId}>
                            <InputLabel>Ward</InputLabel>
                            <Select value={wardId} label="Ward" onChange={(e) => setWardId(e.target.value as number | '')}>
                                <MenuItem value="">All</MenuItem>
                                {wards.map((ward) => (
                                    <MenuItem key={ward.id} value={ward.id}>
                                        Ward {ward.number}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Image Upload */}
                    <Grid item xs={12}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Calendar Image {!calendar && <span style={{ color: 'red' }}>*</span>}
                            </Typography>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<UploadIcon />}
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                {imageFile ? 'Change Image' : calendar ? 'Upload New Image' : 'Upload Image'}
                                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                            </Button>
                            {imagePreview && (
                                <Box
                                    component="img"
                                    src={imagePreview}
                                    alt="Preview"
                                    sx={{
                                        width: '100%',
                                        maxHeight: 300,
                                        objectFit: 'contain',
                                        border: '1px solid #ddd',
                                        borderRadius: 1,
                                    }}
                                />
                            )}
                        </Box>
                    </Grid>

                    {/* Events Section */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2">Events (Optional)</Typography>
                            <Button startIcon={<AddIcon />} onClick={handleAddEvent} size="small">
                                Add Event
                            </Button>
                        </Box>

                        {events.map((event, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="subtitle2">Event {index + 1}</Typography>
                                        <IconButton size="small" onClick={() => handleRemoveEvent(index)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Title (English)"
                                                value={event.title}
                                                onChange={(e) => handleEventChange(index, 'title', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Title (Bangla)"
                                                value={event.titleBn}
                                                onChange={(e) => handleEventChange(index, 'titleBn', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Event Date"
                                                type="date"
                                                value={event.eventDate}
                                                onChange={(e) => handleEventChange(index, 'eventDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Category</InputLabel>
                                                <Select
                                                    value={event.category}
                                                    label="Category"
                                                    onChange={(e) => handleEventChange(index, 'category', e.target.value)}
                                                >
                                                    {EVENT_CATEGORIES.map((cat) => (
                                                        <MenuItem key={cat.value} value={cat.value}>
                                                            {cat.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Description (English)"
                                                multiline
                                                rows={2}
                                                value={event.description}
                                                onChange={(e) => handleEventChange(index, 'description', e.target.value)}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#45a049' } }}
                >
                    {loading ? <CircularProgress size={24} /> : calendar ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CalendarModal;
