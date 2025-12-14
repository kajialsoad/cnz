import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Divider,
    useTheme,
    useMediaQuery,
    ImageList,
    ImageListItem,
    Backdrop,
} from '@mui/material';
import {
    Close as CloseIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    AccessTime as TimeIcon,
    Update as UpdateIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    Download as DownloadIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    Image as ImageIcon,
    BrokenImage as BrokenImageIcon,
    PlayArrow as PlayArrowIcon,
    Pause as PauseIcon,
    VolumeUp as VolumeUpIcon,
    VolumeOff as VolumeOffIcon,
    Speed as SpeedIcon,
    Audiotrack as AudiotrackIcon,
    Edit as EditIcon,
    Chat as ChatIcon,
    HelpOutline,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { complaintService } from '../../services/complaintService';
import { handleApiError } from '../../utils/errorHandler';
import { scaleIn, slideInUp, animationConfig, statusBadgeTransition, fadeIn } from '../../styles/animations';
import { usePermissions } from '../../hooks/usePermissions';
import CategoryInfo from './CategoryInfo';
import type { ComplaintDetails, ComplaintStatus } from '../../types/complaint-service.types';

interface ComplaintDetailsModalProps {
    complaintId: number | null;
    open: boolean;
    onClose: () => void;
    onStatusUpdate: (complaintId: number, newStatus: ComplaintStatus) => void;
    onChatOpen?: (complaintId: number) => void;
}

const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
    complaintId,
    open,
    onClose,
    onStatusUpdate,
    onChatOpen,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { canEditComplaints, canViewComplaints } = usePermissions();

    const [complaint, setComplaint] = useState<ComplaintDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Image lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageZoom, setImageZoom] = useState(1);
    const [imageError, setImageError] = useState<Set<number>>(new Set());

    // Audio player state
    const [audioPlaying, setAudioPlaying] = useState<{ [key: number]: boolean }>({});
    const [audioProgress, setAudioProgress] = useState<{ [key: number]: number }>({});
    const [audioVolume, setAudioVolume] = useState<{ [key: number]: number }>({});
    const [audioSpeed, setAudioSpeed] = useState<{ [key: number]: number }>({});
    const audioRefs = React.useRef<{ [key: number]: HTMLAudioElement | null }>({});

    // Status update state
    const [updatingStatus, setUpdatingStatus] = useState(false);

    /**
     * Fetch complaint details when modal opens
     */
    useEffect(() => {
        if (open && complaintId) {
            fetchComplaintDetails();
        }
    }, [open, complaintId]);

    /**
     * Fetch complaint details from API
     */
    const fetchComplaintDetails = async () => {
        if (!complaintId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await complaintService.getComplaintById(complaintId);
            setComplaint(data);
        } catch (err: any) {
            const enhancedError = handleApiError(err);
            setError(enhancedError.userMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle modal close
     */
    const handleClose = () => {
        setComplaint(null);
        setError(null);
        onClose();
    };

    /**
     * Get status color based on complaint status
     */
    const getStatusColor = (status: ComplaintStatus) => {
        switch (status) {
            case 'PENDING':
                return {
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    borderColor: '#ffeeba',
                };
            case 'IN_PROGRESS':
                return {
                    backgroundColor: '#d1ecf1',
                    color: '#0c5460',
                    borderColor: '#bee5eb',
                };
            case 'RESOLVED':
                return {
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    borderColor: '#c3e6cb',
                };
            case 'REJECTED':
                return {
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderColor: '#f5c6cb',
                };
            default:
                return { backgroundColor: '#f8f9fa', color: '#6c757d' };
        }
    };

    /**
     * Get display label for status
     */
    const getStatusLabel = (status: ComplaintStatus): string => {
        switch (status) {
            case 'PENDING':
                return 'Pending';
            case 'IN_PROGRESS':
                return 'In Progress';
            case 'RESOLVED':
                return 'Solved';
            case 'REJECTED':
                return 'Rejected';
            default:
                return status;
        }
    };

    /**
     * Format date to readable string
     */
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    /**
     * Handle image click to open lightbox
     */
    const handleImageClick = (index: number) => {
        setCurrentImageIndex(index);
        setImageZoom(1);
        setLightboxOpen(true);
    };

    /**
     * Handle lightbox close
     */
    const handleLightboxClose = () => {
        setLightboxOpen(false);
        setImageZoom(1);
    };

    /**
     * Navigate to previous image
     */
    const handlePreviousImage = () => {
        if (complaint && complaint.imageUrls.length > 0) {
            setCurrentImageIndex((prev) =>
                prev === 0 ? complaint.imageUrls.length - 1 : prev - 1
            );
            setImageZoom(1);
        }
    };

    /**
     * Navigate to next image
     */
    const handleNextImage = () => {
        if (complaint && complaint.imageUrls.length > 0) {
            setCurrentImageIndex((prev) =>
                prev === complaint.imageUrls.length - 1 ? 0 : prev + 1
            );
            setImageZoom(1);
        }
    };

    /**
     * Handle zoom in
     */
    const handleZoomIn = () => {
        setImageZoom((prev) => Math.min(prev + 0.25, 3));
    };

    /**
     * Handle zoom out
     */
    const handleZoomOut = () => {
        setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
    };

    /**
     * Handle image download
     */
    const handleImageDownload = () => {
        if (complaint && complaint.imageUrls[currentImageIndex]) {
            const link = document.createElement('a');
            link.href = complaint.imageUrls[currentImageIndex];
            link.download = `complaint-${complaint.id}-image-${currentImageIndex + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    /**
     * Handle image load error
     */
    const handleImageError = (index: number) => {
        setImageError((prev) => new Set(prev).add(index));
    };

    /**
     * Handle audio play/pause
     */
    const handleAudioPlayPause = (index: number) => {
        const audio = audioRefs.current[index];
        if (!audio) return;

        if (audioPlaying[index]) {
            audio.pause();
            setAudioPlaying((prev) => ({ ...prev, [index]: false }));
        } else {
            audio.play();
            setAudioPlaying((prev) => ({ ...prev, [index]: true }));
        }
    };

    /**
     * Handle audio time update
     */
    const handleAudioTimeUpdate = (index: number) => {
        const audio = audioRefs.current[index];
        if (!audio) return;

        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress((prev) => ({ ...prev, [index]: progress }));
    };

    /**
     * Handle audio ended
     */
    const handleAudioEnded = (index: number) => {
        setAudioPlaying((prev) => ({ ...prev, [index]: false }));
        setAudioProgress((prev) => ({ ...prev, [index]: 0 }));
    };

    /**
     * Handle audio volume change
     */
    const handleAudioVolumeChange = (index: number, volume: number) => {
        const audio = audioRefs.current[index];
        if (!audio) return;

        audio.volume = volume;
        setAudioVolume((prev) => ({ ...prev, [index]: volume }));
    };

    /**
     * Handle audio speed change
     */
    const handleAudioSpeedChange = (index: number) => {
        const audio = audioRefs.current[index];
        if (!audio) return;

        const speeds = [0.5, 1, 1.5, 2];
        const currentSpeed = audioSpeed[index] || 1;
        const currentIndex = speeds.indexOf(currentSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];

        audio.playbackRate = nextSpeed;
        setAudioSpeed((prev) => ({ ...prev, [index]: nextSpeed }));
    };

    /**
     * Handle audio progress bar click
     */
    const handleAudioProgressClick = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRefs.current[index];
        if (!audio) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        audio.currentTime = percentage * audio.duration;
    };

    /**
     * Handle audio download
     */
    const handleAudioDownload = (audioUrl: string, index: number) => {
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = `complaint-${complaint?.id}-audio-${index + 1}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * Format audio time
     */
    const formatAudioTime = (seconds: number): string => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Handle status change
     */
    const handleStatusChange = async (newStatus: ComplaintStatus) => {
        if (!complaint || !complaintId) return;

        try {
            setUpdatingStatus(true);

            // Call the parent's onStatusUpdate callback
            onStatusUpdate(complaintId, newStatus);

            // Update local state
            setComplaint((prev) => (prev ? { ...prev, status: newStatus } : null));

            toast.success('Status updated successfully', {
                icon: '✅',
                duration: 3000,
            });
        } catch (err: any) {
            const enhancedError = handleApiError(err);
            toast.error(enhancedError.userMessage, {
                duration: 5000,
                icon: '❌',
            });
        } finally {
            setUpdatingStatus(false);
        }
    };

    /**
     * Get available status transitions based on current status
     */
    const getAvailableStatusTransitions = (currentStatus: ComplaintStatus): { status: ComplaintStatus; label: string; color: string }[] => {
        const transitions: Record<ComplaintStatus, { status: ComplaintStatus; label: string; color: string }[]> = {
            PENDING: [
                { status: 'IN_PROGRESS', label: 'Mark In Progress', color: '#0c5460' },
                { status: 'RESOLVED', label: 'Mark Solved', color: '#155724' },
                { status: 'REJECTED', label: 'Mark Rejected', color: '#721c24' },
            ],
            IN_PROGRESS: [
                { status: 'PENDING', label: 'Mark Pending', color: '#856404' },
                { status: 'RESOLVED', label: 'Mark Solved', color: '#155724' },
                { status: 'REJECTED', label: 'Mark Rejected', color: '#721c24' },
            ],
            RESOLVED: [
                { status: 'PENDING', label: 'Mark Pending', color: '#856404' },
                { status: 'IN_PROGRESS', label: 'Mark In Progress', color: '#0c5460' },
                { status: 'REJECTED', label: 'Mark Rejected', color: '#721c24' },
            ],
            REJECTED: [
                { status: 'PENDING', label: 'Mark Pending', color: '#856404' },
                { status: 'IN_PROGRESS', label: 'Mark In Progress', color: '#0c5460' },
                { status: 'RESOLVED', label: 'Mark Solved', color: '#155724' },
            ],
        };

        return transitions[currentStatus] || [];
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: isMobile ? 0 : 2,
                            maxHeight: isMobile ? '100vh' : '90vh',
                            animation: isMobile
                                ? `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`
                                : `${scaleIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                        },
                    },
                    backdrop: {
                        sx: {
                            animation: `${fadeIn} ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                        },
                    },
                }}
            >
                {/* Dialog Title */}
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pb: 2,
                        borderBottom: '1px solid #e0e0e0',
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Complaint Details
                    </Typography>
                    <IconButton
                        onClick={handleClose}
                        size="small"
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                {/* Dialog Content */}
                <DialogContent sx={{ pt: { xs: 2, sm: 3 }, pb: { xs: 1.5, sm: 2 } }}>
                    {/* Loading State */}
                    {loading && (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: { xs: 200, sm: 300 },
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Complaint Details */}
                    {complaint && !loading && !error && (
                        <Box>
                            {/* Complaint ID and Status */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    justifyContent: 'space-between',
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    mb: { xs: 2, sm: 3 },
                                    gap: { xs: 1, sm: 2 },
                                }}
                            >
                                <Typography
                                    variant={isMobile ? 'h6' : 'h5'}
                                    sx={{ fontWeight: 600, color: '#4CAF50' }}
                                >
                                    {complaint.trackingNumber || `C${String(complaint.id).padStart(6, '0')}`}
                                </Typography>
                                <Chip
                                    label={getStatusLabel(complaint.status)}
                                    sx={{
                                        ...getStatusColor(complaint.status),
                                        ...statusBadgeTransition,
                                        fontWeight: 500,
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        height: { xs: 28, sm: 32 },
                                    }}
                                />
                            </Box>

                            {/* Complaint Title */}
                            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                                <Typography
                                    variant={isMobile ? 'caption' : 'subtitle2'}
                                    color="text.secondary"
                                    sx={{ mb: 0.5 }}
                                >
                                    Complaint Title
                                </Typography>
                                <Typography
                                    variant={isMobile ? 'body2' : 'body1'}
                                    sx={{ fontWeight: 500 }}
                                >
                                    {complaint.title}
                                </Typography>
                            </Box>

                            {/* Category Information */}
                            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                                <Typography
                                    variant={isMobile ? 'caption' : 'subtitle2'}
                                    color="text.secondary"
                                    sx={{ mb: 1 }}
                                >
                                    Category
                                </Typography>
                                {complaint.category && complaint.subcategory ? (
                                    <CategoryInfo
                                        categoryId={complaint.category}
                                        subcategoryId={complaint.subcategory}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            p: 1.5,
                                            backgroundColor: '#f5f5f5',
                                            border: '1px dashed #bdbdbd',
                                            borderRadius: 1,
                                        }}
                                    >
                                        <HelpOutline sx={{ color: '#757575', fontSize: 20 }} />
                                        <Typography
                                            variant="body2"
                                            sx={{ color: '#757575', fontStyle: 'italic' }}
                                        >
                                            This complaint has not been categorized yet. It was created before the category system was implemented.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Description */}
                            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                                <Typography
                                    variant={isMobile ? 'caption' : 'subtitle2'}
                                    color="text.secondary"
                                    sx={{ mb: 0.5 }}
                                >
                                    Description
                                </Typography>
                                <Typography
                                    variant={isMobile ? 'body2' : 'body1'}
                                    sx={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {complaint.description}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: { xs: 2, sm: 3 } }} />

                            {/* Location Information */}
                            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 1.5 } }}>
                                    <LocationIcon sx={{ mr: 1, color: 'text.secondary', fontSize: { xs: 18, sm: 20 } }} />
                                    <Typography
                                        variant={isMobile ? 'body1' : 'subtitle1'}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        Location Information
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, sm: 2 } }}>
                                    <Box>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            District
                                        </Typography>
                                        <Typography variant={isMobile ? 'body2' : 'body1'}>
                                            {complaint.locationDetails?.district || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            Thana
                                        </Typography>
                                        <Typography variant={isMobile ? 'body2' : 'body1'}>
                                            {complaint.locationDetails?.thana || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            Ward
                                        </Typography>
                                        <Typography variant={isMobile ? 'body2' : 'body1'}>
                                            {complaint.locationDetails?.ward || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            Full Address
                                        </Typography>
                                        <Typography variant={isMobile ? 'body2' : 'body1'}>
                                            {complaint.locationDetails?.address || complaint.location}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Divider sx={{ my: { xs: 2, sm: 3 } }} />

                            {/* Citizen Information */}
                            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 1.5 } }}>
                                    <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: { xs: 18, sm: 20 } }} />
                                    <Typography
                                        variant={isMobile ? 'body1' : 'subtitle1'}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        Citizen Information
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, sm: 2 } }}>
                                    <Box>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            Citizen ID
                                        </Typography>
                                        <Typography variant={isMobile ? 'body2' : 'body1'}>
                                            U{String(complaint.user.id).padStart(6, '0')}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            Name
                                        </Typography>
                                        <Typography variant={isMobile ? 'body2' : 'body1'}>
                                            {complaint.user.firstName} {complaint.user.lastName}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PhoneIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                                Phone
                                            </Typography>
                                            <Typography variant={isMobile ? 'body2' : 'body1'}>{complaint.user.phone}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EmailIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                                Email
                                            </Typography>
                                            <Typography
                                                variant={isMobile ? 'body2' : 'body1'}
                                                sx={{
                                                    wordBreak: 'break-word',
                                                    fontSize: { xs: '0.75rem', sm: '1rem' }
                                                }}
                                            >
                                                {complaint.user.email || 'Not provided'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            City Corporation
                                        </Typography>
                                        <Typography variant={isMobile ? 'body2' : 'body1'}>
                                            {complaint.user.cityCorporation?.name || complaint.user.zone || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            Ward Number
                                        </Typography>
                                        <Typography variant={isMobile ? 'body2' : 'body1'}>
                                            {complaint.user.ward ? `Ward ${complaint.user.ward}` : 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            Thana/Area
                                        </Typography>
                                        <Typography variant={isMobile ? 'body2' : 'body1'}>
                                            {complaint.user.thana?.name || 'N/A'}
                                        </Typography>
                                    </Box>
                                    {complaint.user.address && (
                                        <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                                            <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                                Citizen Address
                                            </Typography>
                                            <Typography
                                                variant={isMobile ? 'body2' : 'body1'}
                                                sx={{ wordBreak: 'break-word' }}
                                            >
                                                {complaint.user.address}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            <Divider sx={{ my: { xs: 2, sm: 3 } }} />

                            {/* Timestamps */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, sm: 2 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TimeIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'text.secondary' }} />
                                    <Box>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            Submitted
                                        </Typography>
                                        <Typography
                                            variant={isMobile ? 'body2' : 'body1'}
                                            sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
                                        >
                                            {formatDate(complaint.createdAt)}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <UpdateIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'text.secondary' }} />
                                    <Box>
                                        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                            Last Updated
                                        </Typography>
                                        <Typography
                                            variant={isMobile ? 'body2' : 'body1'}
                                            sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
                                        >
                                            {formatDate(complaint.updatedAt)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Image Gallery */}
                            {complaint.imageUrls && complaint.imageUrls.length > 0 && (
                                <>
                                    <Divider sx={{ my: { xs: 2, sm: 3 } }} />
                                    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 1.5 } }}>
                                            <ImageIcon sx={{ mr: 1, color: 'text.secondary', fontSize: { xs: 18, sm: 20 } }} />
                                            <Typography
                                                variant={isMobile ? 'body1' : 'subtitle1'}
                                                sx={{ fontWeight: 600 }}
                                            >
                                                Attached Images ({complaint.imageUrls.length})
                                            </Typography>
                                        </Box>
                                        <ImageList
                                            cols={isMobile ? 2 : isTablet ? 3 : 4}
                                            gap={isMobile ? 8 : 12}
                                            sx={{ mt: { xs: 1, sm: 2 } }}
                                        >
                                            {complaint.imageUrls.map((imageUrl, index) => (
                                                <ImageListItem
                                                    key={index}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        borderRadius: 1,
                                                        overflow: 'hidden',
                                                        border: '1px solid #e0e0e0',
                                                        '&:hover': {
                                                            opacity: 0.8,
                                                            boxShadow: 2,
                                                        },
                                                    }}
                                                    onClick={() => handleImageClick(index)}
                                                >
                                                    {imageError.has(index) ? (
                                                        <Box
                                                            sx={{
                                                                width: '100%',
                                                                height: 150,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: '#f5f5f5',
                                                            }}
                                                        >
                                                            <BrokenImageIcon
                                                                sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }}
                                                            />
                                                            <Typography variant="caption" color="text.secondary">
                                                                Failed to load
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <img
                                                            src={imageUrl}
                                                            alt={`Complaint image ${index + 1}`}
                                                            loading="lazy"
                                                            style={{
                                                                width: '100%',
                                                                height: 150,
                                                                objectFit: 'cover',
                                                            }}
                                                            onError={() => handleImageError(index)}
                                                        />
                                                    )}
                                                </ImageListItem>
                                            ))}
                                        </ImageList>
                                    </Box>
                                </>
                            )}

                            {/* Audio Player */}
                            {complaint.audioUrls && complaint.audioUrls.length > 0 && (
                                <>
                                    <Divider sx={{ my: 3 }} />
                                    <Box sx={{ mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                            <AudiotrackIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                Voice Recordings ({complaint.audioUrls.length})
                                            </Typography>
                                        </Box>
                                        {complaint.audioUrls.map((audioUrl, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: 2,
                                                    p: 2,
                                                    mb: 2,
                                                    backgroundColor: '#f8f9fa',
                                                }}
                                            >
                                                <audio
                                                    ref={(el) => {
                                                        audioRefs.current[index] = el;
                                                    }}
                                                    src={audioUrl}
                                                    onTimeUpdate={() => handleAudioTimeUpdate(index)}
                                                    onEnded={() => handleAudioEnded(index)}
                                                    onLoadedMetadata={(e) => {
                                                        const audio = e.currentTarget;
                                                        audio.volume = audioVolume[index] || 1;
                                                        audio.playbackRate = audioSpeed[index] || 1;
                                                    }}
                                                    style={{ display: 'none' }}
                                                />

                                                {/* Audio Controls */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                    {/* Play/Pause Button */}
                                                    <IconButton
                                                        onClick={() => handleAudioPlayPause(index)}
                                                        sx={{
                                                            backgroundColor: '#4CAF50',
                                                            color: 'white',
                                                            '&:hover': {
                                                                backgroundColor: '#45a049',
                                                            },
                                                        }}
                                                    >
                                                        {audioPlaying[index] ? <PauseIcon /> : <PlayArrowIcon />}
                                                    </IconButton>

                                                    {/* Progress Bar */}
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box
                                                            onClick={(e) => handleAudioProgressClick(index, e)}
                                                            sx={{
                                                                height: 6,
                                                                backgroundColor: '#e0e0e0',
                                                                borderRadius: 3,
                                                                cursor: 'pointer',
                                                                position: 'relative',
                                                                '&:hover': {
                                                                    backgroundColor: '#d0d0d0',
                                                                },
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    height: '100%',
                                                                    width: `${audioProgress[index] || 0}%`,
                                                                    backgroundColor: '#4CAF50',
                                                                    borderRadius: 3,
                                                                    transition: 'width 0.1s linear',
                                                                }}
                                                            />
                                                        </Box>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                mt: 0.5,
                                                            }}
                                                        >
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatAudioTime(
                                                                    audioRefs.current[index]?.currentTime || 0
                                                                )}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatAudioTime(
                                                                    audioRefs.current[index]?.duration || 0
                                                                )}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    {/* Volume Control */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() =>
                                                                handleAudioVolumeChange(
                                                                    index,
                                                                    audioVolume[index] > 0 ? 0 : 1
                                                                )
                                                            }
                                                        >
                                                            {(audioVolume[index] || 1) > 0 ? (
                                                                <VolumeUpIcon />
                                                            ) : (
                                                                <VolumeOffIcon />
                                                            )}
                                                        </IconButton>
                                                        <Box sx={{ width: 60 }}>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="1"
                                                                step="0.1"
                                                                value={audioVolume[index] || 1}
                                                                onChange={(e) =>
                                                                    handleAudioVolumeChange(
                                                                        index,
                                                                        parseFloat(e.target.value)
                                                                    )
                                                                }
                                                                style={{ width: '100%' }}
                                                            />
                                                        </Box>
                                                    </Box>

                                                    {/* Speed Control */}
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<SpeedIcon />}
                                                        onClick={() => handleAudioSpeedChange(index)}
                                                        sx={{
                                                            minWidth: 80,
                                                            textTransform: 'none',
                                                        }}
                                                    >
                                                        {audioSpeed[index] || 1}x
                                                    </Button>

                                                    {/* Download Button */}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleAudioDownload(audioUrl, index)}
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                </Box>

                                                <Typography variant="caption" color="text.secondary">
                                                    Recording {index + 1}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>

                {/* Dialog Actions */}
                <DialogActions
                    sx={{
                        px: { xs: 2, sm: 3 },
                        py: { xs: 1.5, sm: 2 },
                        borderTop: '1px solid #e0e0e0',
                        gap: { xs: 1, sm: 1.5 },
                        justifyContent: 'space-between',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                    }}
                >
                    {/* Left side - Status Update Buttons */}
                    {complaint && getAvailableStatusTransitions(complaint.status).length > 0 && canEditComplaints() && (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1,
                            alignItems: { xs: 'stretch', sm: 'center' },
                            width: { xs: '100%', sm: 'auto' },
                            flexWrap: 'wrap',
                        }}>
                            {getAvailableStatusTransitions(complaint.status).map((transition) => (
                                <Button
                                    key={transition.status}
                                    variant="contained"
                                    onClick={() => handleStatusChange(transition.status)}
                                    disabled={updatingStatus}
                                    startIcon={updatingStatus ? <CircularProgress size={16} /> : <EditIcon />}
                                    sx={{
                                        backgroundColor: transition.color,
                                        '&:hover': {
                                            backgroundColor: transition.color,
                                            opacity: 0.9,
                                        },
                                        textTransform: 'none',
                                        minHeight: { xs: 44, sm: 'auto' },
                                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                        px: { xs: 2, sm: 2 },
                                    }}
                                >
                                    {updatingStatus ? 'Updating...' : transition.label}
                                </Button>
                            ))}
                        </Box>
                    )}

                    {/* View Only Mode Alert */}
                    {complaint && !canEditComplaints() && canViewComplaints() && (
                        <Alert severity="info" sx={{ flex: 1 }}>
                            <Typography variant="body2">
                                ভিউ অনলি মোড - আপনি শুধুমাত্র কমপ্লেইন দেখতে পারবেন, পরিবর্তন করতে পারবেন না।
                            </Typography>
                        </Alert>
                    )}

                    {/* Right side - Action Buttons */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1,
                        width: { xs: '100%', sm: 'auto' },
                    }}>
                        {onChatOpen && complaint && (
                            <Button
                                variant="outlined"
                                startIcon={!isMobile && <ChatIcon />}
                                onClick={() => onChatOpen(complaint.id)}
                                sx={{
                                    textTransform: 'none',
                                    minHeight: { xs: 44, sm: 'auto' },
                                }}
                            >
                                Open Chat
                            </Button>
                        )}
                        <Button
                            onClick={handleClose}
                            variant="outlined"
                            sx={{
                                textTransform: 'none',
                                minHeight: { xs: 44, sm: 'auto' },
                            }}
                        >
                            Close
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* Image Lightbox */}
            {
                complaint && complaint.imageUrls && complaint.imageUrls.length > 0 && (
                    <Backdrop
                        open={lightboxOpen}
                        onClick={handleLightboxClose}
                        sx={{
                            zIndex: theme.zIndex.modal + 1,
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        }}
                    >
                        <Box
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                                position: 'relative',
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            {/* Lightbox Controls */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -60,
                                    right: 0,
                                    display: 'flex',
                                    gap: 1,
                                    zIndex: 1,
                                }}
                            >
                                <IconButton
                                    onClick={handleZoomOut}
                                    disabled={imageZoom <= 0.5}
                                    sx={{
                                        color: 'white',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        },
                                    }}
                                >
                                    <ZoomOutIcon />
                                </IconButton>
                                <IconButton
                                    onClick={handleZoomIn}
                                    disabled={imageZoom >= 3}
                                    sx={{
                                        color: 'white',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        },
                                    }}
                                >
                                    <ZoomInIcon />
                                </IconButton>
                                <IconButton
                                    onClick={handleImageDownload}
                                    sx={{
                                        color: 'white',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        },
                                    }}
                                >
                                    <DownloadIcon />
                                </IconButton>
                                <IconButton
                                    onClick={handleLightboxClose}
                                    sx={{
                                        color: 'white',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        },
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            {/* Image Container */}
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'auto',
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                }}
                            >
                                {/* Previous Button */}
                                {complaint.imageUrls.length > 1 && (
                                    <IconButton
                                        onClick={handlePreviousImage}
                                        sx={{
                                            position: 'absolute',
                                            left: -60,
                                            color: 'white',
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            },
                                        }}
                                    >
                                        <NavigateBeforeIcon sx={{ fontSize: 40 }} />
                                    </IconButton>
                                )}

                                {/* Image */}
                                <img
                                    src={complaint.imageUrls[currentImageIndex]}
                                    alt={`Complaint image ${currentImageIndex + 1}`}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '90vh',
                                        transform: `scale(${imageZoom})`,
                                        transition: 'transform 0.2s ease-in-out',
                                    }}
                                />

                                {/* Next Button */}
                                {complaint.imageUrls.length > 1 && (
                                    <IconButton
                                        onClick={handleNextImage}
                                        sx={{
                                            position: 'absolute',
                                            right: -60,
                                            color: 'white',
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            },
                                        }}
                                    >
                                        <NavigateNextIcon sx={{ fontSize: 40 }} />
                                    </IconButton>
                                )}
                            </Box>

                            {/* Image Counter */}
                            {complaint.imageUrls.length > 1 && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: -50,
                                        color: 'white',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 1,
                                    }}
                                >
                                    <Typography variant="body2">
                                        {currentImageIndex + 1} / {complaint.imageUrls.length}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Backdrop>
                )
            }
        </>
    );
};

export default ComplaintDetailsModal;
