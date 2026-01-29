import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    TextField,
    MenuItem,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Autocomplete,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CardMedia,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    VisibilityOff as VisibilityOffIcon,
    Category as CategoryIcon,
    LocationCity as CityIcon,
    Map as ZoneIcon,
    MeetingRoom as WardIcon,
    CloudUpload as UploadIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout/MainLayout';
import NoticeAnalyticsDashboard from './components/NoticeAnalyticsDashboard';
import noticeService from '../../services/noticeService';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import {
    Notice,
    NoticeCategory,
    NoticeType,
    NoticePriority,
    NoticeFilters,
} from '../../types/notice.types';
import { fadeIn, slideInUp, animationConfig, buttonHoverAnimation } from '../../styles/animations';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && (
                <Box
                    sx={{
                        p: { xs: 2, md: 3 },
                        animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                        animationFillMode: 'both',
                    }}
                >
                    {children}
                </Box>
            )}
        </div>
    );
}

const NoticeManagementPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [categories, setCategories] = useState<NoticeCategory[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filters
    const [filters, setFilters] = useState<NoticeFilters>({});
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [noticeModalOpen, setNoticeModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<NoticeCategory | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Category form
    const [categoryForm, setCategoryForm] = useState<{
        name: string;
        nameBn: string;
        color: string;
        icon: string;
    }>({
        name: '',
        nameBn: '',
        color: '#3FA564',
        icon: '📢',
    });

    // Form data
    const [noticeForm, setNoticeForm] = useState<{
        title: string;
        titleBn: string;
        description: string;
        descriptionBn: string;
        content: string;
        contentBn: string;
        categoryId: number | '';
        type: NoticeType;
        priority: NoticePriority;
        publishDate: string;
        expiryDate: string;
        imageUrl: string;
        targetCities: number[];
        targetZones: number[];
        targetWards: number[];
    }>({
        title: '',
        titleBn: '',
        description: '',
        descriptionBn: '',
        content: '',
        contentBn: '',
        categoryId: '',
        type: NoticeType.GENERAL,
        priority: NoticePriority.NORMAL,
        publishDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        imageUrl: '',
        targetCities: [] as number[],
        targetZones: [] as number[],
        targetWards: [] as number[],
    });

    useEffect(() => {
        loadNotices();
        loadCategories();
        loadLocationData();
    }, [filters]);

    const loadLocationData = async () => {
        try {
            const cityResponse = await cityCorporationService.getCityCorporations('ACTIVE');
            const cityList = cityResponse.cityCorporations || [];
            setCities(cityList);

            const zonesResponses = await Promise.all(
                cityList.map((city) => zoneService.getZones({ cityCorporationId: city.id, status: 'ACTIVE' }))
            );
            const allZones = zonesResponses.flatMap((response) => response.zones || []);
            setZones(allZones);

            const wardsResponses = await Promise.all(
                allZones.map((zone) => wardService.getWards({ zoneId: zone.id, status: 'ACTIVE' }))
            );
            const allWards = wardsResponses.flatMap((response) => response.wards || []);
            setWards(allWards);
        } catch (err) {
            console.error('Failed to load location data:', err);
        }
    };

    const loadNotices = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await noticeService.getAllNotices(filters);
            setNotices(response.notices);
        } catch (err: any) {
            setError(err.message || 'Failed to load notices');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await noticeService.getAllCategories();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Failed to load categories:', err);
        }
    };

    const handleCreateCategory = async () => {
        try {
            setLoading(true);
            setError(null);
            await noticeService.createCategory(categoryForm);
            setSuccess('Category created successfully!');
            setCategoryModalOpen(false);
            resetCategoryForm();
            loadCategories();
        } catch (err: any) {
            setError(err.message || 'Failed to create category');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCategory = async () => {
        if (!selectedCategory) return;
        try {
            setLoading(true);
            setError(null);
            await noticeService.updateCategory(selectedCategory.id, categoryForm);
            setSuccess('Category updated successfully!');
            setCategoryModalOpen(false);
            resetCategoryForm();
            loadCategories();
        } catch (err: any) {
            setError(err.message || 'Failed to update category');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;
        try {
            setLoading(true);
            await noticeService.deleteCategory(selectedCategory.id);
            setSuccess('Category deleted successfully!');
            setDeleteCategoryDialogOpen(false);
            setSelectedCategory(null);
            loadCategories();
        } catch (err: any) {
            setError(err.message || 'Failed to delete category');
        } finally {
            setLoading(false);
        }
    };

    const resetCategoryForm = () => {
        setCategoryForm({
            name: '',
            nameBn: '',
            color: '#3FA564',
            icon: '📢',
        });
        setSelectedCategory(null);
    };

    const openEditCategoryModal = (category: NoticeCategory) => {
        setSelectedCategory(category);
        setCategoryForm({
            name: category.name,
            nameBn: category.nameBn || '',
            color: category.color || '#3FA564',
            icon: category.icon || '📢',
        });
        setCategoryModalOpen(true);
    };

    const handleCreateNotice = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!noticeForm.categoryId) {
                setError('Please select a category');
                return;
            }
            await noticeService.createNotice({
                ...noticeForm,
                categoryId: Number(noticeForm.categoryId),
            });
            setSuccess('Notice created successfully!');
            setNoticeModalOpen(false);
            resetNoticeForm();
            loadNotices();
        } catch (err: any) {
            setError(err.message || 'Failed to create notice');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateNotice = async () => {
        if (!selectedNotice) return;
        try {
            setLoading(true);
            setError(null);
            if (!noticeForm.categoryId) {
                setError('Please select a category');
                return;
            }
            await noticeService.updateNotice(selectedNotice.id, {
                ...noticeForm,
                categoryId: Number(noticeForm.categoryId),
            });
            setSuccess('Notice updated successfully!');
            setNoticeModalOpen(false);
            resetNoticeForm();
            loadNotices();
        } catch (err: any) {
            setError(err.message || 'Failed to update notice');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (notice: Notice) => {
        try {
            await noticeService.toggleNoticeStatus(notice.id);
            setSuccess(`Notice ${notice.isActive ? 'deactivated' : 'activated'} successfully!`);
            loadNotices();
        } catch (err: any) {
            setError(err.message || 'Failed to toggle notice status');
        }
    };

    const handleDeleteNotice = async () => {
        if (!selectedNotice) return;
        try {
            setLoading(true);
            await noticeService.deleteNotice(selectedNotice.id);
            setSuccess('Notice deleted successfully!');
            setDeleteDialogOpen(false);
            setSelectedNotice(null);
            loadNotices();
        } catch (err: any) {
            setError(err.message || 'Failed to delete notice');
        } finally {
            setLoading(false);
        }
    };

    const resetNoticeForm = () => {
        setNoticeForm({
            title: '',
            titleBn: '',
            description: '',
            descriptionBn: '',
            content: '',
            contentBn: '',
            categoryId: '',
            type: NoticeType.GENERAL,
            priority: NoticePriority.NORMAL,
            publishDate: new Date().toISOString().split('T')[0],
            expiryDate: '',
            imageUrl: '',
            targetCities: [],
            targetZones: [],
            targetWards: [],
        });
        setSelectedNotice(null);
        setImagePreview(null);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        try {
            setUploadingImage(true);
            setError(null);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Cloudinary
            const imageUrl = await noticeService.uploadImage(file);
            setNoticeForm({ ...noticeForm, imageUrl });
            setSuccess('Image uploaded successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to upload image');
            setImagePreview(null);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = () => {
        setNoticeForm({ ...noticeForm, imageUrl: '' });
        setImagePreview(null);
    };

    const openEditModal = (notice: Notice) => {
        setSelectedNotice(notice);
        setNoticeForm({
            title: notice.title,
            titleBn: notice.titleBn || '',
            description: notice.description,
            descriptionBn: notice.descriptionBn || '',
            content: notice.content,
            contentBn: notice.contentBn || '',
            categoryId: notice.categoryId,
            type: notice.type,
            priority: notice.priority,
            publishDate: notice.publishDate.split('T')[0],
            expiryDate: notice.expiryDate ? notice.expiryDate.split('T')[0] : '',
            imageUrl: notice.imageUrl || '',
            targetCities: notice.targetCities || [],
            targetZones: notice.targetZones || [],
            targetWards: notice.targetWards || [],
        });
        setImagePreview(notice.imageUrl || null);
        setNoticeModalOpen(true);
    };

    const getPriorityColor = (priority: NoticePriority) => {
        switch (priority) {
            case NoticePriority.URGENT:
                return 'error';
            case NoticePriority.HIGH:
                return 'warning';
            case NoticePriority.NORMAL:
                return 'info';
            default:
                return 'default';
        }
    };

    const getTypeColor = (type: NoticeType) => {
        switch (type) {
            case NoticeType.URGENT:
                return 'error';
            case NoticeType.EVENT:
                return 'success';
            case NoticeType.SCHEDULED:
                return 'warning';
            default:
                return 'primary';
        }
    };

    return (
        <MainLayout title="Notice Board Management">
            <Box sx={{ p: { xs: 2, md: 3 } }}>
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
                                Notice Board Management
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Create, manage, and analyze public notices with better clarity
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1.5,
                                flexWrap: 'wrap',
                                width: { xs: '100%', md: 'auto' },
                            }}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<CategoryIcon />}
                                onClick={() => setCategoryModalOpen(true)}
                                sx={{
                                    borderColor: 'rgba(255,255,255,0.7)',
                                    color: 'white',
                                    width: { xs: '100%', sm: 'auto' },
                                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                                    ...buttonHoverAnimation,
                                }}
                            >
                                Manage Categories
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    resetNoticeForm();
                                    setNoticeModalOpen(true);
                                }}
                                sx={{
                                    bgcolor: 'white',
                                    color: '#0f766e',
                                    width: { xs: '100%', sm: 'auto' },
                                    '&:hover': { bgcolor: '#f0fdf4' },
                                    ...buttonHoverAnimation,
                                }}
                            >
                                Create Notice
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_e, newValue) => setTabValue(newValue)}
                        sx={{
                            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                            '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
                        }}
                    >
                        <Tab label="Notices" />
                        <Tab label="Analytics" />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
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
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        label="Search"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setFilters({ ...filters, search: e.target.value });
                                        }}
                                        placeholder="Search by title or description"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Category"
                                        value={filters.categoryId || ''}
                                        onChange={(e) =>
                                            setFilters({ ...filters, categoryId: Number(e.target.value) || undefined })
                                        }
                                    >
                                        <MenuItem value="">All Categories</MenuItem>
                                        {categories.map((cat) => (
                                            <MenuItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, md: 2 }}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Type"
                                        value={filters.type || ''}
                                        onChange={(e) =>
                                            setFilters({ ...filters, type: e.target.value as NoticeType || undefined })
                                        }
                                    >
                                        <MenuItem value="">All Types</MenuItem>
                                        {Object.values(NoticeType).map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Status"
                                        value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                isActive: e.target.value === '' ? undefined : e.target.value === 'true',
                                            })
                                        }
                                    >
                                        <MenuItem value="">All Status</MenuItem>
                                        <MenuItem value="true">Active</MenuItem>
                                        <MenuItem value="false">Inactive</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Notices List */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {notices.map((notice, index) => (
                                <Grid size={{ xs: 12 }} key={notice.id}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                                            animationFillMode: 'both',
                                            animationDelay: `${Math.min(index * 60, 300)}ms`,
                                            '&:hover': {
                                                transform: 'translateY(-3px)',
                                                boxShadow: '0 12px 26px rgba(15, 23, 42, 0.12)',
                                            },
                                        }}
                                    >
                                        <CardContent>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: { xs: 'column', md: 'row' },
                                                    justifyContent: 'space-between',
                                                    gap: 2,
                                                }}
                                            >
                                                <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
                                                    {notice.imageUrl && (
                                                        <Box sx={{ flexShrink: 0 }}>
                                                            <Card sx={{ width: 120, height: 120 }}>
                                                                <CardMedia
                                                                    component="img"
                                                                    height="120"
                                                                    image={notice.imageUrl}
                                                                    alt={notice.title}
                                                                    sx={{ objectFit: 'cover' }}
                                                                />
                                                            </Card>
                                                        </Box>
                                                    )}
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                                            <Chip
                                                                label={notice.type}
                                                                color={getTypeColor(notice.type)}
                                                                size="small"
                                                            />
                                                            <Chip
                                                                label={notice.priority}
                                                                color={getPriorityColor(notice.priority)}
                                                                size="small"
                                                            />
                                                            {notice.category && (
                                                                <Chip
                                                                    label={notice.category.name}
                                                                    size="small"
                                                                    sx={{ bgcolor: notice.category.color, color: 'white' }}
                                                                />
                                                            )}
                                                            <Chip
                                                                label={notice.isActive ? 'Active' : 'Inactive'}
                                                                color={notice.isActive ? 'success' : 'default'}
                                                                size="small"
                                                            />
                                                        </Box>
                                                        <Typography variant="h6" fontWeight="bold">
                                                            {notice.title}
                                                        </Typography>
                                                        {notice.titleBn && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {notice.titleBn}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                            {notice.description}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                                                            <Chip
                                                                label={`Views: ${notice.viewCount}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                            <Chip
                                                                label={`Reads: ${notice.readCount}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                            <Chip
                                                                label={`Published: ${new Date(notice.publishDate).toLocaleDateString()}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 1,
                                                        justifyContent: { xs: 'flex-start', md: 'flex-end' },
                                                    }}
                                                >
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => openEditModal(notice)}
                                                        title="Edit"
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        color={notice.isActive ? 'warning' : 'success'}
                                                        onClick={() => handleToggleStatus(notice)}
                                                        title={notice.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {notice.isActive ? <VisibilityOffIcon /> : <ViewIcon />}
                                                    </IconButton>
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => {
                                                            setSelectedNotice(notice);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        title="Delete"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                            {!loading && notices.length === 0 && (
                                <Grid size={{ xs: 12 }}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            border: '1px dashed',
                                            borderColor: 'divider',
                                            animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                                            animationFillMode: 'both',
                                        }}
                                    >
                                        <CardContent>
                                            <Typography color="text.secondary" align="center">
                                                No notices found. Create a new notice to get started.
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <NoticeAnalyticsDashboard categories={categories} />
                </TabPanel>

                {/* Create/Edit Notice Modal */}
                <Dialog
                    open={noticeModalOpen}
                    onClose={() => setNoticeModalOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                        },
                    }}
                >
                    <DialogTitle>
                        {selectedNotice ? 'Edit Notice' : 'Create New Notice'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Title (English)"
                                    value={noticeForm.title}
                                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Title (Bangla)"
                                    value={noticeForm.titleBn}
                                    onChange={(e) => setNoticeForm({ ...noticeForm, titleBn: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Description (English)"
                                    value={noticeForm.description}
                                    onChange={(e) => setNoticeForm({ ...noticeForm, description: e.target.value })}
                                    multiline
                                    rows={2}
                                    required
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Description (Bangla)"
                                    value={noticeForm.descriptionBn}
                                    onChange={(e) => setNoticeForm({ ...noticeForm, descriptionBn: e.target.value })}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Content (English)"
                                    value={noticeForm.content}
                                    onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                                    multiline
                                    rows={4}
                                    required
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Content (Bangla)"
                                    value={noticeForm.contentBn}
                                    onChange={(e) => setNoticeForm({ ...noticeForm, contentBn: e.target.value })}
                                    multiline
                                    rows={4}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Category"
                                    value={noticeForm.categoryId || ''}
                                    onChange={(e) =>
                                        setNoticeForm({ ...noticeForm, categoryId: Number(e.target.value) })
                                    }
                                    required
                                >
                                    <MenuItem value="">Select Category</MenuItem>
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Type"
                                    value={noticeForm.type}
                                    onChange={(e) =>
                                        setNoticeForm({ ...noticeForm, type: e.target.value as NoticeType })
                                    }
                                >
                                    {Object.values(NoticeType).map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Priority"
                                    value={noticeForm.priority}
                                    onChange={(e) =>
                                        setNoticeForm({ ...noticeForm, priority: e.target.value as NoticePriority })
                                    }
                                >
                                    {Object.values(NoticePriority).map((priority) => (
                                        <MenuItem key={priority} value={priority}>
                                            {priority}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Publish Date"
                                    value={noticeForm.publishDate}
                                    onChange={(e) => setNoticeForm({ ...noticeForm, publishDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Expiry Date (Optional)"
                                    value={noticeForm.expiryDate}
                                    onChange={(e) => setNoticeForm({ ...noticeForm, expiryDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Notice Image (Optional)
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={uploadingImage ? <CircularProgress size={20} /> : <UploadIcon />}
                                            disabled={uploadingImage}
                                            sx={{ minWidth: 150 }}
                                        >
                                            {uploadingImage ? 'Uploading...' : 'Upload Image'}
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </Button>
                                        {(imagePreview || noticeForm.imageUrl) && (
                                            <Box sx={{ position: 'relative', flex: 1 }}>
                                                <Card sx={{ maxWidth: 300 }}>
                                                    <CardMedia
                                                        component="img"
                                                        height="150"
                                                        image={imagePreview || noticeForm.imageUrl}
                                                        alt="Notice preview"
                                                        sx={{ objectFit: 'cover' }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={handleRemoveImage}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            right: 8,
                                                            bgcolor: 'rgba(0,0,0,0.6)',
                                                            color: 'white',
                                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                                                        }}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Card>
                                            </Box>
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Supported formats: JPG, PNG, GIF (Max 5MB)
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Geographical Targeting (Optional)
                                    </Typography>
                                </Divider>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Autocomplete
                                    multiple
                                    options={cities}
                                    getOptionLabel={(option) => option.name || option.code}
                                    value={cities.filter(c => noticeForm.targetCities.includes(c.id))}
                                    onChange={(_e, newValue) => setNoticeForm({
                                        ...noticeForm,
                                        targetCities: newValue.map(v => v.id)
                                    })}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Target Cities" placeholder="Select Cities" />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Autocomplete
                                    multiple
                                    options={zones}
                                    getOptionLabel={(option) =>
                                        `${option.cityCorporation?.name ? `${option.cityCorporation.name} - ` : ''}Zone ${option.zoneNumber ?? option.number ?? ''}`
                                    }
                                    value={zones.filter(z => noticeForm.targetZones.includes(z.id))}
                                    onChange={(_e, newValue) => setNoticeForm({
                                        ...noticeForm,
                                        targetZones: newValue.map(v => v.id)
                                    })}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Target Zones" placeholder="Select Zones" />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Autocomplete
                                    multiple
                                    options={wards}
                                    getOptionLabel={(option) =>
                                        `${option.zone?.cityCorporation?.name ? `${option.zone.cityCorporation.name} - ` : ''}Ward ${option.wardNumber ?? option.number ?? ''}`
                                    }
                                    value={wards.filter(w => noticeForm.targetWards.includes(w.id))}
                                    onChange={(_e, newValue) => setNoticeForm({
                                        ...noticeForm,
                                        targetWards: newValue.map(v => v.id)
                                    })}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Target Wards" placeholder="Select Wards" />
                                    )}
                                />
                            </Grid>
                        </Grid >
                    </DialogContent >
                    <DialogActions>
                        <Button onClick={() => setNoticeModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={selectedNotice ? handleUpdateNotice : handleCreateNotice}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : selectedNotice ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog >

                {/* Delete Confirmation Dialog */}
                < Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                        },
                    }}
                >
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete this notice? This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteNotice}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog >

                {/* Category Management Modal */}
                < Dialog
                    open={categoryModalOpen}
                    onClose={() => {
                        setCategoryModalOpen(false);
                        resetCategoryForm();
                    }}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                        },
                    }}
                >
                    <DialogTitle>
                        {selectedCategory && selectedCategory.id ? 'Edit Category' : 'Manage Categories'}
                    </DialogTitle>
                    <DialogContent>
                        {!selectedCategory || !selectedCategory.id ? (
                            <>
                                <Box sx={{ mb: 3, mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            resetCategoryForm();
                                            setSelectedCategory({ id: 0 } as NoticeCategory);
                                        }}
                                    >
                                        Add Category
                                    </Button>
                                </Box>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Icon</TableCell>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Name (Bangla)</TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell>Color</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {categories.map((category) => (
                                                <TableRow key={category.id}>
                                                    <TableCell>{category.icon}</TableCell>
                                                    <TableCell>{category.name}</TableCell>
                                                    <TableCell>{category.nameBn}</TableCell>
                                                    <TableCell>
                                                        <Box
                                                            sx={{
                                                                width: 30,
                                                                height: 30,
                                                                bgcolor: category.color,
                                                                borderRadius: 1,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => openEditCategoryModal(category)}
                                                            size="small"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => {
                                                                setSelectedCategory(category);
                                                                setDeleteCategoryDialogOpen(true);
                                                                setCategoryModalOpen(false);
                                                            }}
                                                            size="small"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        ) : (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Name (English)"
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Name (Bangla)"
                                        value={categoryForm.nameBn}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, nameBn: e.target.value })}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Color"
                                        type="color"
                                        value={categoryForm.color}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Icon (Emoji)"
                                        value={categoryForm.icon}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                                        placeholder="📢"
                                    />
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setCategoryModalOpen(false);
                                resetCategoryForm();
                            }}
                        >
                            {selectedCategory && selectedCategory.id ? 'Cancel' : 'Close'}
                        </Button>
                        {selectedCategory && selectedCategory.id !== undefined && selectedCategory.id > 0 && (
                            <Button
                                variant="contained"
                                onClick={handleUpdateCategory}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Update'}
                            </Button>
                        )}
                        {selectedCategory && selectedCategory.id === 0 && (
                            <Button
                                variant="contained"
                                onClick={handleCreateCategory}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Create'}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog >

                {/* Delete Category Confirmation Dialog */}
                < Dialog
                    open={deleteCategoryDialogOpen}
                    onClose={() => setDeleteCategoryDialogOpen(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                        },
                    }}
                >
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete this category? This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteCategoryDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteCategory}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog >
            </Box >
        </MainLayout >
    );
};

export default NoticeManagementPage;
