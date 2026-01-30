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
    Visibility as ViewIcon,
    CheckCircle as ReadIcon,
    ThumbUp as LikeIcon,
    Favorite as LoveIcon,
    Event as EventIcon,
    LocationCity as CityIcon,
    Map as ZoneIcon,
    MeetingRoom as WardIcon,
} from '@mui/icons-material';
import { Notice, NoticePriority, NoticeType } from '../../types/notice.types';
import { slideInUp, animationConfig } from '../../styles/animations';

interface NoticeDetailModalProps {
    open: boolean;
    onClose: () => void;
    notice: Notice | null;
}

const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
    open,
    onClose,
    notice,
}) => {
    if (!notice) return null;

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
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
                    Notice Details
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Image Section */}
                    {notice.imageUrl && (
                        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <CardMedia
                                component="img"
                                image={notice.imageUrl}
                                alt={notice.title}
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
                                sx={{
                                    bgcolor: notice.category.color,
                                    color: 'white',
                                }}
                            />
                        )}
                        <Chip
                            label={notice.isActive ? 'Active' : 'Inactive'}
                            color={notice.isActive ? 'success' : 'default'}
                            size="small"
                        />
                    </Box>

                    {/* Title Section */}
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {notice.title}
                        </Typography>
                        {notice.titleBn && (
                            <Typography variant="h6" color="text.secondary">
                                {notice.titleBn}
                            </Typography>
                        )}
                    </Box>

                    <Divider />

                    {/* Description */}
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Description
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {notice.description}
                        </Typography>
                        {notice.descriptionBn && (
                            <Typography variant="body1" color="text.secondary">
                                {notice.descriptionBn}
                            </Typography>
                        )}
                    </Box>

                    <Divider />

                    {/* Content */}
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Full Content
                        </Typography>
                        <Typography
                            variant="body1"
                            paragraph
                            sx={{ whiteSpace: 'pre-wrap' }}
                        >
                            {notice.content}
                        </Typography>
                        {notice.contentBn && (
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ whiteSpace: 'pre-wrap' }}
                            >
                                {notice.contentBn}
                            </Typography>
                        )}
                    </Box>

                    <Divider />

                    {/* Dates */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
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
                                    Published Date
                                </Typography>
                                <Typography variant="body1" fontWeight="600">
                                    {formatDate(notice.publishDate)}
                                </Typography>
                            </Box>
                        </Grid>
                        {notice.expiryDate && (
                            <Grid item xs={12} md={6}>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'warning.50',
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'warning.200',
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Expiry Date
                                    </Typography>
                                    <Typography variant="body1" fontWeight="600">
                                        {formatDate(notice.expiryDate)}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>

                    <Divider />

                    {/* Statistics */}
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Engagement Statistics
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6} md={3}>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'info.50',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                    }}
                                >
                                    <ViewIcon color="info" sx={{ mb: 1 }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        {notice.viewCount}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Views
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'success.50',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                    }}
                                >
                                    <ReadIcon color="success" sx={{ mb: 1 }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        {notice.readCount}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Reads
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'primary.50',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                    }}
                                >
                                    <LikeIcon color="primary" sx={{ mb: 1 }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        {notice.interactions?.counts?.LIKE || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Likes
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'error.50',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                    }}
                                >
                                    <LoveIcon color="error" sx={{ mb: 1 }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        {notice.interactions?.counts?.LOVE || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Loves
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Geographical Targeting */}
                    {(notice.targetCities?.length > 0 ||
                        notice.targetZones?.length > 0 ||
                        notice.targetWards?.length > 0) && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Geographical Targeting
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                        {notice.targetCities && notice.targetCities.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CityIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    <strong>Cities:</strong> {notice.targetCities.length} selected
                                                </Typography>
                                            </Box>
                                        )}
                                        {notice.targetZones && notice.targetZones.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ZoneIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    <strong>Zones:</strong> {notice.targetZones.length} selected
                                                </Typography>
                                            </Box>
                                        )}
                                        {notice.targetWards && notice.targetWards.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <WardIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    <strong>Wards:</strong> {notice.targetWards.length} selected
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </>
                        )}

                    {/* Creator Info */}
                    {notice.creator && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Created By
                                </Typography>
                                <Typography variant="body1">
                                    {notice.creator.firstName} {notice.creator.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {notice.creator.email}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Created: {formatDate(notice.createdAt)}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NoticeDetailModal;
