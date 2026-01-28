import React, { useState, useEffect, useMemo } from 'react';
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
    Tabs,
    Tab,
    Paper,
    Fade,
    Zoom,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Publish as PublishIcon,
    Unpublished as UnpublishIcon,
    ThumbUp as ThumbUpIcon,
    Favorite as LoveIcon,
    Image as ImageIcon,
    Article as ArticleIcon,
    Public as PublicIcon,
    Description as DraftIcon,
    AutoGraph as StatsIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout';
import { wasteManagementService, WastePost } from '../../services/wasteManagementService';

// Styled Components for 3D and Modern Look
const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    borderRadius: '20px',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    border: '1px solid',
    borderColor: alpha(theme.palette.divider, 0.1),
    background: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(10px)',
    boxShadow: `0 10px 30px -10px ${alpha(theme.palette.common.black, 0.1)}`,
    '&:hover': {
        transform: 'translateY(-10px) scale(1.02)',
        boxShadow: `0 20px 40px -15px ${alpha(theme.palette.common.black, 0.2)}`,
        borderColor: alpha(theme.palette.primary.main, 0.3),
    },
}));

const GlassPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: '24px',
    background: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(20px)',
    border: '1px solid',
    borderColor: alpha(theme.palette.common.white, 0.2),
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
    marginBottom: theme.spacing(4),
}));

const StatCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.5),
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    transition: 'transform 0.3s ease',
    border: '1px solid',
    borderColor: alpha(theme.palette.divider, 0.05),
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
    '&:hover': {
        transform: 'scale(1.05)',
    }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(4px)',
    transition: 'all 0.2s ease',
    '&:hover': {
        transform: 'scale(1.1)',
        backgroundColor: theme.palette.background.paper,
    }
}));

const WasteManagementPage: React.FC = () => {
    const [posts, setPosts] = useState<WastePost[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPost, setEditingPost] = useState<WastePost | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        imageUrl: '',
        category: 'CURRENT_WASTE' as 'CURRENT_WASTE' | 'FUTURE_WASTE',
    });

    // Image upload state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await wasteManagementService.getAllPostsForAdmin();
            setPosts(data);
        } catch (err) {
            setError('Failed to fetch posts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        return {
            total: posts.length,
            published: posts.filter(p => p.status === 'PUBLISHED').length,
            drafts: posts.filter(p => p.status === 'DRAFT').length,
            likes: posts.reduce((acc, p) => acc + p.likeCount, 0),
            loves: posts.reduce((acc, p) => acc + (p.loveCount || 0), 0),
        };
    }, [posts]);

    const filteredPosts = useMemo(() => {
        const category = tabValue === 0 ? 'CURRENT_WASTE' : 'FUTURE_WASTE';
        return posts.filter(p => p.category === category);
    }, [posts, tabValue]);

    const handleOpenDialog = (post?: WastePost) => {
        if (post) {
            setEditingPost(post);
            setFormData({
                title: post.title,
                content: post.content,
                imageUrl: post.imageUrl || '',
                category: post.category,
            });
            setImagePreview(post.imageUrl || null);
        } else {
            setEditingPost(null);
            setFormData({
                title: '',
                content: '',
                imageUrl: '',
                category: tabValue === 0 ? 'CURRENT_WASTE' : 'FUTURE_WASTE',
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingPost(null);
        setFormData({
            title: '',
            content: '',
            imageUrl: '',
            category: 'CURRENT_WASTE',
        });
        setImageFile(null);
        if (imagePreview && !imagePreview.startsWith('http')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        try {
            setUploadingImage(true);
            setError(null);

            if (editingPost) {
                await wasteManagementService.updatePost(editingPost.id, formData);
                setSuccess('পোস্ট সফলভাবে আপডেট হয়েছে');
            } else {
                await wasteManagementService.createPost(formData);
                setSuccess('পোস্ট সফলভাবে তৈরি হয়েছে');
            }
            handleCloseDialog();
            fetchPosts();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('পোস্ট সেভ করতে ব্যর্থ হয়েছে');
            console.error(err);
        } finally {
            setUploadingImage(false);
        }
    };

    const handlePublishToggle = async (post: WastePost) => {
        try {
            setError(null);
            if (post.status === 'PUBLISHED') {
                await wasteManagementService.unpublishPost(post.id);
                setSuccess('Post unpublished successfully');
            } else {
                await wasteManagementService.publishPost(post.id);
                setSuccess('Post published successfully');
            }
            fetchPosts();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to update post status');
            console.error(err);
        }
    };

    const handleDeleteClick = (postId: number) => {
        setPostToDelete(postId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (postToDelete) {
            try {
                setError(null);
                await wasteManagementService.deletePost(postToDelete);
                setSuccess('Post deleted successfully');
                fetchPosts();
                setTimeout(() => setSuccess(null), 3000);
            } catch (err) {
                setError('Failed to delete post');
                console.error(err);
            }
        }
        setDeleteConfirmOpen(false);
        setPostToDelete(null);
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            if (imagePreview && !imagePreview.startsWith('http')) {
                URL.revokeObjectURL(imagePreview);
            }
            const preview = URL.createObjectURL(file);
            setImagePreview(preview);
        }
    };

    const handleImageUpload = async () => {
        if (!imageFile) return;
        try {
            setUploadingImage(true);
            setError(null);
            const uploadedUrl = await wasteManagementService.uploadImage(imageFile);
            setFormData(prev => ({ ...prev, imageUrl: uploadedUrl }));
            setImagePreview(uploadedUrl);
            setSuccess('ছবি সফলভাবে আপলোড হয়েছে');
            setTimeout(() => setSuccess(null), 3000);
            setImageFile(null);
        } catch (err) {
            setError('ছবি আপলোড ব্যর্থ হয়েছে');
            console.error(err);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        if (imagePreview && !imagePreview.startsWith('http')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        setFormData(prev => ({ ...prev, imageUrl: '' }));
    };

    if (loading) {
        return (
            <MainLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                    <CircularProgress thickness={5} size={60} sx={{ color: '#3FA564' }} />
                </Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1600px', mx: 'auto' }}>
                {/* Header Section */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={4} flexWrap="wrap" gap={2}>
                    <Box>
                        <Typography variant="h3" fontWeight="800" sx={{ color: '#1a3321', letterSpacing: '-0.5px' }}>
                            বর্জ্য ব্যবস্থাপনা
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            শহর পরিষ্কার রাখতে আপনার পোস্টগুলো পরিচালনা করুন
                        </Typography>
                    </Box>
                    <Zoom in={true}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                            sx={{
                                borderRadius: '16px',
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                bgcolor: '#3FA564',
                                boxShadow: '0 8px 20px -4px rgba(63, 165, 100, 0.4)',
                                '&:hover': { 
                                    bgcolor: '#2D7A4A',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 25px -5px rgba(63, 165, 100, 0.5)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            নতুন পোস্ট তৈরি করুন
                        </Button>
                    </Zoom>
                </Box>

                {/* Stats Grid */}
                <Grid container spacing={3} mb={5}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Fade in={true} style={{ transitionDelay: '100ms' }}>
                            <StatCard>
                                <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: alpha('#3FA564', 0.1), color: '#3FA564' }}>
                                    <ArticleIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="700">{stats.total}</Typography>
                                    <Typography variant="body2" color="text.secondary">মোট পোস্ট</Typography>
                                </Box>
                            </StatCard>
                        </Fade>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Fade in={true} style={{ transitionDelay: '200ms' }}>
                            <StatCard>
                                <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}>
                                    <PublicIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="700">{stats.published}</Typography>
                                    <Typography variant="body2" color="text.secondary">প্রকাশিত</Typography>
                                </Box>
                            </StatCard>
                        </Fade>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Fade in={true} style={{ transitionDelay: '300ms' }}>
                            <StatCard>
                                <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: alpha('#ff9800', 0.1), color: '#ff9800' }}>
                                    <DraftIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="700">{stats.drafts}</Typography>
                                    <Typography variant="body2" color="text.secondary">খসড়া</Typography>
                                </Box>
                            </StatCard>
                        </Fade>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Fade in={true} style={{ transitionDelay: '400ms' }}>
                            <StatCard>
                                <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: alpha('#e91e63', 0.1), color: '#e91e63' }}>
                                    <LoveIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="700">{stats.loves}</Typography>
                                    <Typography variant="body2" color="text.secondary">মোট লাভ</Typography>
                                </Box>
                            </StatCard>
                        </Fade>
                    </Grid>
                </Grid>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccess(null)}>{success}</Alert>}

                {/* Tabs Section */}
                <GlassPaper>
                    <Tabs 
                        value={tabValue} 
                        onChange={(_, v) => setTabValue(v)}
                        sx={{
                            mb: 4,
                            '& .MuiTabs-indicator': { height: 4, borderRadius: '4px', bgcolor: '#3FA564' },
                            '& .MuiTab-root': { fontSize: '1rem', fontWeight: '600', textTransform: 'none', minWidth: 160 }
                        }}
                    >
                        <Tab label="বর্তমান বর্জ্য ব্যবস্থাপনা" />
                        <Tab label="ভবিষ্যত পরিকল্পনা" />
                    </Tabs>

                    <Grid container spacing={4}>
                        {filteredPosts.map((post, index) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={post.id}>
                                <Fade in={true} style={{ transitionDelay: `${index * 50}ms` }}>
                                    <StyledCard>
                                        <Box sx={{ position: 'relative' }}>
                                            <CardMedia
                                                component="img"
                                                height="220"
                                                image={post.imageUrl || 'https://via.placeholder.com/400x220?text=No+Image'}
                                                alt={post.title}
                                                sx={{ 
                                                    objectFit: 'cover',
                                                    filter: post.status === 'DRAFT' ? 'grayscale(0.4)' : 'none'
                                                }}
                                            />
                                            <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={post.status === 'PUBLISHED' ? 'প্রকাশিত' : 'খসড়া'}
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: post.status === 'PUBLISHED' ? alpha('#4caf50', 0.9) : alpha('#000', 0.6),
                                                        color: '#fff',
                                                        fontWeight: '700',
                                                        backdropFilter: 'blur(4px)',
                                                        border: 'none'
                                                    }}
                                                />
                                            </Box>
                                            
                                            {/* Action Overlays */}
                                            <Box sx={{ 
                                                position: 'absolute', 
                                                bottom: 0, 
                                                left: 0, 
                                                right: 0, 
                                                p: 1.5, 
                                                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                gap: 1,
                                                opacity: 0,
                                                transition: 'opacity 0.3s ease',
                                                '.MuiCard-root:hover &': { opacity: 1 }
                                            }}>
                                                <ActionButton size="small" onClick={() => handleOpenDialog(post)} color="primary">
                                                    <EditIcon fontSize="small" />
                                                </ActionButton>
                                                <ActionButton 
                                                    size="small" 
                                                    onClick={() => handlePublishToggle(post)} 
                                                    sx={{ color: post.status === 'PUBLISHED' ? '#ff9800' : '#4caf50' }}
                                                >
                                                    {post.status === 'PUBLISHED' ? <UnpublishIcon fontSize="small" /> : <PublishIcon fontSize="small" />}
                                                </ActionButton>
                                                <ActionButton size="small" onClick={() => handleDeleteClick(post.id)} color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </ActionButton>
                                            </Box>
                                        </Box>

                                        <CardContent sx={{ flexGrow: 1, pt: 2.5 }}>
                                            <Typography variant="h6" gutterBottom fontWeight="800" sx={{ 
                                                lineHeight: 1.3,
                                                height: '3.9em',
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                            }}>
                                                {post.title}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 2,
                                                    height: '4.5em',
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                }}
                                            >
                                                {post.content}
                                            </Typography>

                                            <Stack direction="row" spacing={2} sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${alpha('#000', 0.05)}` }}>
                                                <Box display="flex" alignItems="center" gap={0.8}>
                                                    <ThumbUpIcon fontSize="small" sx={{ color: alpha('#2196f3', 0.8) }} />
                                                    <Typography variant="body2" fontWeight="700">{post.likeCount}</Typography>
                                                </Box>
                                                <Box display="flex" alignItems="center" gap={0.8}>
                                                    <LoveIcon fontSize="small" sx={{ color: alpha('#e91e63', 0.8) }} />
                                                    <Typography variant="body2" fontWeight="700">{post.loveCount}</Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </StyledCard>
                                </Fade>
                            </Grid>
                        ))}
                        {filteredPosts.length === 0 && (
                            <Grid item xs={12}>
                                <Box textAlign="center" py={8}>
                                    <ArticleIcon sx={{ fontSize: 80, color: alpha('#000', 0.1), mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">এই বিভাগে কোনো পোস্ট নেই</Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </GlassPaper>

                {/* Dialogs remain functional but styled better */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog} 
                    maxWidth="sm" 
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
                >
                    <DialogTitle sx={{ fontWeight: '800', fontSize: '1.5rem' }}>
                        {editingPost ? 'পোস্ট সম্পাদনা করুন' : 'নতুন পোস্ট তৈরি করুন'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <TextField
                                label="শিরোনাম"
                                fullWidth
                                variant="filled"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                InputProps={{ sx: { borderRadius: '12px' } }}
                            />

                            <TextField
                                label="বিষয়বস্তু"
                                fullWidth
                                multiline
                                rows={5}
                                variant="filled"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                                InputProps={{ sx: { borderRadius: '12px' } }}
                            />

                            <Box>
                                <Typography variant="subtitle2" fontWeight="700" gutterBottom>ছবি আপলোড</Typography>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<ImageIcon />}
                                        disabled={uploadingImage}
                                        sx={{ borderRadius: '12px', textTransform: 'none' }}
                                    >
                                        ছবি নির্বাচন
                                        <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
                                    </Button>
                                    {imageFile && (
                                        <Button
                                            variant="contained"
                                            onClick={handleImageUpload}
                                            disabled={uploadingImage}
                                            sx={{ borderRadius: '12px', bgcolor: '#3FA564', '&:hover': { bgcolor: '#2D7A4A' } }}
                                        >
                                            {uploadingImage ? <CircularProgress size={20} color="inherit" /> : 'আপলোড'}
                                        </Button>
                                    )}
                                </Stack>

                                {(imagePreview || formData.imageUrl) && (
                                    <Box sx={{ mt: 2, position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                                        <img
                                            src={imagePreview || formData.imageUrl}
                                            alt="Preview"
                                            style={{ width: '100%', maxHeight: '250px', objectFit: 'cover' }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={handleRemoveImage}
                                            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.8)' }}
                                        >
                                            <DeleteIcon color="error" />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>

                            <FormControl fullWidth variant="filled">
                                <InputLabel>বিভাগ</InputLabel>
                                <Select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                    sx={{ borderRadius: '12px' }}
                                >
                                    <MenuItem value="CURRENT_WASTE">বর্তমান বর্জ্য ব্যবস্থাপনা</MenuItem>
                                    <MenuItem value="FUTURE_WASTE">ভবিষ্যত পরিকল্পনা</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary', fontWeight: '600' }}>বাতিল</Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={!formData.title || !formData.content || uploadingImage}
                            sx={{ borderRadius: '12px', px: 4, bgcolor: '#3FA564', '&:hover': { bgcolor: '#2D7A4A' } }}
                        >
                            {editingPost ? 'আপডেট করুন' : 'তৈরি করুন'}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog 
                    open={deleteConfirmOpen} 
                    onClose={() => setDeleteConfirmOpen(false)}
                    PaperProps={{ sx: { borderRadius: '20px' } }}
                >
                    <DialogTitle sx={{ fontWeight: '800' }}>নিশ্চিত করুন</DialogTitle>
                    <DialogContent>
                        <Typography>আপনি কি নিশ্চিত যে আপনি এই পোস্টটি মুছে ফেলতে চান?</Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setDeleteConfirmOpen(false)}>বাতিল</Button>
                        <Button onClick={handleDeleteConfirm} color="error" variant="contained" sx={{ borderRadius: '10px' }}>
                            মুছে ফেলুন
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
};

export default WasteManagementPage;

