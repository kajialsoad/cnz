import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    Divider,
    Card,
    CardMedia,
    Grid,
    IconButton,
} from '@mui/material';
import {
    Close as CloseIcon,
    ThumbUp as LikeIcon,
    Favorite as LoveIcon,
    Event as EventIcon,
    Category as CategoryIcon,
    Publish as PublishIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { WastePost } from '../../services/wasteManagementService';
import { slideInUp, animationConfig } from '../../styles/animations';

interface WastePostDetailModalProps {
    open: boolean;
    onClose: () => void;
    post: WastePost | null;
    onEdit?: (post: WastePost) => void;
}

const WastePostDetailModal: React.FC<WastePostDetailModalProps> = ({
    open,
    onClose,
    post,
    onEdit,
}) => {
    if (!post) return null;

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'CURRENT_WASTE':
                return 'বর্তমান বর্জ্য ব্যবস্থাপনা';
            case 'FUTURE_WASTE':
                return 'ভবিষ্যত পরিকল্পনা';
            default:
                return category;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'CURRENT_WASTE':
                return 'primary';
            case 'FUTURE_WASTE':
                return 'secondary';
            default:
                return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        return status === 'PUBLISHED' ? 'success' : 'warning';
    };

    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(post);
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh',
                    animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                    animationFillMode: 'both',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 2,
                }}
            >
                <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                    পোস্ট বিস্তারিত
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {onEdit && (
                        <IconButton onClick={handleEdit} size="small" color="primary">
                            <EditIcon />
                        </IconButton>
                    )}
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Image Section */}
                    {post.imageUrl && (
                        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <CardMedia
                                component="img"
                                image={post.imageUrl}
                                alt={post.title}
                                sx={{
                                    width: '100%',
                                    maxHeight: 400,
                                    objectFit: 'cover',
                                }}
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                                }}
                            />
                        </Card>
                    )}

                    {/* Badges */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            label={getCategoryLabel(post.category)}
                            color={getCategoryColor(post.category)}
                            size="small"
                            icon={<CategoryIcon />}
                        />
                        <Chip
                            label={post.status === 'PUBLISHED' ? 'প্রকাশিত' : 'খসড়া'}
                            color={getStatusColor(post.status)}
                            size="small"
                            icon={<PublishIcon />}
                        />
                    </Box>

                    {/* Title Section */}
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {post.title}
                        </Typography>
                    </Box>

                    <Divider />

                    {/* Content */}
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            বিষয়বস্তু
                        </Typography>
                        <Typography
                            variant="body1"
                            paragraph
                            sx={{ whiteSpace: 'pre-wrap' }}
                        >
                            {post.content}
                        </Typography>
                    </Box>

                    <Divider />

                    {/* Dates */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: 'info.50',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'info.200',
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    তৈরির তারিখ
                                </Typography>
                                <Typography variant="body1" fontWeight="600">
                                    {formatDate(post.createdAt)}
                                </Typography>
                            </Box>
                        </Grid>
                        {post.publishedAt && (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'success.50',
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'success.200',
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        প্রকাশের তারিখ
                                    </Typography>
                                    <Typography variant="body1" fontWeight="600">
                                        {formatDate(post.publishedAt)}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>

                    <Divider />

                    {/* Engagement Statistics */}
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            ব্যবহারকারীর প্রতিক্রিয়া
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 6 }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'primary.50',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                    }}
                                >
                                    <LikeIcon color="primary" sx={{ mb: 1, fontSize: 32 }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        {post.likeCount || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        লাইক
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'error.50',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                    }}
                                >
                                    <LoveIcon color="error" sx={{ mb: 1, fontSize: 32 }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        {post.loveCount || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        লাভ
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Last Updated */}
                    {post.updatedAt && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    সর্বশেষ আপডেট
                                </Typography>
                                <Typography variant="body2">
                                    {formatDate(post.updatedAt)}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                {onEdit && (
                    <Button onClick={handleEdit} variant="outlined" startIcon={<EditIcon />}>
                        সম্পাদনা করুন
                    </Button>
                )}
                <Button onClick={onClose} variant="contained">
                    বন্ধ করুন
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WastePostDetailModal;


