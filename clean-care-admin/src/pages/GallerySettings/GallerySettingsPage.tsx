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
    DialogTitle,
    Grid,
    IconButton,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Fade,
    Zoom,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Image as ImageIcon,
    DragIndicator as DragIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout';
import { galleryService, GalleryImage } from '../../services/galleryService';

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    borderRadius: '20px',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    border: '1px solid',
    borderColor: alpha(theme.palette.divider, 0.1),
    boxShadow: `0 10px 30px -10px ${alpha(theme.palette.common.black, 0.1)}`,
    '&:hover': {
        transform: 'translateY(-10px) scale(1.02)',
        boxShadow: `0 20px 40px -15px ${alpha(theme.palette.common.black, 0.2)}`,
    },
}));

const GallerySettingsPage: React.FC = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const data = await galleryService.getAllImagesForAdmin();
            setImages(data);
        } catch (err) {
            setError('Failed to fetch images');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (image?: GalleryImage) => {
        if (image) {
            setEditingImage(image);
            setFormData({
                title: image.title,
                description: image.description || '',
                imageUrl: image.imageUrl,
            });
            setImagePreview(image.imageUrl);
        } else {
            setEditingImage(null);
            setFormData({
                title: '',
                description: '',
                imageUrl: '',
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingImage(null);
        setFormData({
            title: '',
            description: '',
            imageUrl: '',
        });
        setImageFile(null);
        if (imagePreview && !imagePreview.startsWith('http')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        try {
            setError(null);

            if (editingImage) {
                await galleryService.updateImage(editingImage.id, formData);
                setSuccess('ছবি সফলভাবে আপডেট হয়েছে');
            } else {
                await galleryService.createImage(formData);
                setSuccess('ছবি সফলভাবে যোগ করা হয়েছে');
            }
            handleCloseDialog();
            fetchImages();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('ছবি সেভ করতে ব্যর্থ হয়েছে');
            console.error(err);
        }
    };

    const handleToggleStatus = async (image: GalleryImage) => {
        try {
            setError(null);
            await galleryService.toggleStatus(image.id);
            setSuccess('Status updated successfully');
            fetchImages();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to update status');
            console.error(err);
        }
    };

    const handleDeleteClick = (imageId: number) => {
        setImageToDelete(imageId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (imageToDelete) {
            try {
                setError(null);
                await galleryService.deleteImage(imageToDelete);
                setSuccess('Image deleted successfully');
                fetchImages();
                setTimeout(() => setSuccess(null), 3000);
            } catch (err) {
                setError('Failed to delete image');
                console.error(err);
            }
        }
        setDeleteConfirmOpen(false);
        setImageToDelete(null);
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
            const uploadedUrl = await galleryService.uploadImage(imageFile);
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
                <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={4} flexWrap="wrap" gap={2}>
                    <Box>
                        <Typography variant="h3" fontWeight="800" sx={{ color: '#1a3321', letterSpacing: '-0.5px' }}>
                            গ্যালারি সেটিংস
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            ইউজার অ্যাপে দেখানোর জন্য ছবি আপলোড করুন
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
                            নতুন ছবি যোগ করুন
                        </Button>
                    </Zoom>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccess(null)}>{success}</Alert>}

                <Grid container spacing={4}>
                    {images.map((image, index) => (
                        <Grid size={{ xs: 12, sm: 6 }} size={{ md: 4, lg: 3 }} key={image.id}>
                            <Fade in={true} style={{ transitionDelay: `${index * 50}ms` }}>
                                <StyledCard>
                                    <Box sx={{ position: 'relative' }}>
                                        <CardMedia
                                            component="img"
                                            height="220"
                                            image={image.imageUrl}
                                            alt={image.title}
                                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                e.currentTarget.src = 'https://via.placeholder.com/400x220?text=Image+Not+Found';
                                            }}
                                            sx={{
                                                objectFit: 'cover',
                                                filter: image.status === 'INACTIVE' ? 'grayscale(0.8)' : 'none'
                                            }}
                                        />
                                        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                                            <Chip
                                                label={image.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                                size="small"
                                                sx={{
                                                    bgcolor: image.status === 'ACTIVE' ? alpha('#4caf50', 0.9) : alpha('#000', 0.6),
                                                    color: '#fff',
                                                    fontWeight: '700',
                                                }}
                                            />
                                        </Box>

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
                                            <IconButton size="small" onClick={() => handleOpenDialog(image)} sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
                                                <EditIcon fontSize="small" color="primary" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleToggleStatus(image)}
                                                sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                                            >
                                                {image.status === 'ACTIVE' ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteClick(image.id)} sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
                                                <DeleteIcon fontSize="small" color="error" />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <CardContent sx={{ flexGrow: 1, pt: 2.5 }}>
                                        <Typography variant="h6" gutterBottom fontWeight="800" sx={{ lineHeight: 1.3 }}>
                                            {image.title}
                                        </Typography>
                                        {image.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {image.description}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </StyledCard>
                            </Fade>
                        </Grid>
                    ))}
                    {images.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Box textAlign="center" py={8}>
                                <ImageIcon sx={{ fontSize: 80, color: alpha('#000', 0.1), mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">কোনো ছবি নেই</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    নতুন ছবি যোগ করতে উপরের বাটনে ক্লিক করুন
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>

                {/* Add/Edit Dialog */}
                <Dialog
                    open={openDialog}
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
                >
                    <DialogTitle sx={{ fontWeight: '800', fontSize: '1.5rem' }}>
                        {editingImage ? 'ছবি সম্পাদনা করুন' : 'নতুন ছবি যোগ করুন'}
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
                                label="বিবরণ (ঐচ্ছিক)"
                                fullWidth
                                multiline
                                rows={3}
                                variant="filled"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                InputProps={{ sx: { borderRadius: '12px' } }}
                            />

                            <Box>
                                <Typography variant="subtitle2" fontWeight="700" gutterBottom>ছবি আপলোড</Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                                </Box>

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
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseDialog} sx={{ borderRadius: '12px' }}>বাতিল</Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={!formData.title || !formData.imageUrl}
                            sx={{ borderRadius: '12px', bgcolor: '#3FA564', '&:hover': { bgcolor: '#2D7A4A' } }}
                        >
                            {editingImage ? 'আপডেট করুন' : 'যোগ করুন'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                    <DialogTitle>ছবি মুছে ফেলবেন?</DialogTitle>
                    <DialogContent>
                        <Typography>আপনি কি নিশ্চিত যে এই ছবিটি মুছে ফেলতে চান?</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteConfirmOpen(false)}>বাতিল</Button>
                        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                            মুছে ফেলুন
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
};

export default GallerySettingsPage;


