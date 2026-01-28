import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    Chip,
    Button,
    Grid,
    Divider,
    Avatar,
    IconButton,
    ImageList,
    ImageListItem,
    Dialog,
    CircularProgress,
    Alert,
    TextField,
    Paper,
    InputAdornment,
    Menu,
    MenuItem,
    Tooltip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Rating,
    Stack,
    useTheme,
    Container,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    CalendarToday as CalendarIcon,
    Close as CloseIcon,
    ZoomIn as ZoomInIcon,
    Send as SendIcon,
    CheckCircle as CheckCircleIcon,
    AccessTime as AccessTimeIcon,
    Image as ImageIcon,
    AdminPanelSettings as AdminIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    // Keep these if used directly without alias, or remove if unused
    Warning,
    ZoomOutMap,
    AttachFile,
    Mic,
    Stop,
    PlayArrow,
    Pause,
    MoreVert,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import MainLayout from '../../components/common/Layout/MainLayout';
import LoadingButton from '../../components/common/LoadingButton';
import CategoryBadge from '../../components/Complaints/CategoryBadge';
import { complaintService } from '../../services/complaintService';
import { chatService } from '../../services/chatService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils';
import { handleApiError } from '../../utils/errorHandler';
import { fadeIn, animationConfig } from '../../styles/animations';
import type { Complaint, ComplaintStatus } from '../../types/complaint-service.types';
import type { ChatMessage } from '../../types/chat-service.types';

import MarkOthersModal from '../../components/Complaints/MarkOthersModal';
import StatusUpdateModal from '../../components/Complaints/StatusUpdateModal';
import ReviewDisplayCard from '../../components/Complaints/ReviewDisplayCard';
import type { ReviewData } from '../../components/Complaints/ReviewDisplayCard';
import { EditResolutionModal } from '../../components/Complaints/EditResolutionModal';
import { useAuth } from '../../contexts/AuthContext';
import { wardService } from '../../services/wardService';

import ChatConversationPanel from '../../components/Chat/ChatConversationPanel';

const ComplaintDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Remove redundant chat state since ChatConversationPanel handles it
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [correctWardData, setCorrectWardData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [markOthersOpen, setMarkOthersOpen] = useState(false);
    // Fixed: Chat functionality refactored to use ChatConversationPanel. Removed legacy 'messages' state.
    const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
    const [statusUpdateType, setStatusUpdateType] = useState<'IN_PROGRESS' | 'RESOLVED'>('IN_PROGRESS');
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    // Removed message state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editModalType, setEditModalType] = useState<'RESOLVED' | 'OTHERS'>('RESOLVED');

    // Delete audio confirmation dialog state
    const [deleteAudioDialog, setDeleteAudioDialog] = useState<{
        open: boolean;
        audioUrl: string | null;
        index: number;
    }>({
        open: false,
        audioUrl: null,
        index: 0,
    });

    // Dynamic timeline based on complaint data
    const getTimeline = () => {
        const timeline = [];

        // Complaint submitted
        timeline.push({
            id: 1,
            action: 'Complaint Submitted',
            date: new Date(complaint?.createdAt || '').toLocaleString('en-US'),
            description: 'The complaint has been successfully submitted',
        });

        // If status changed from PENDING
        if (complaint?.status && complaint.status !== 'PENDING') {
            timeline.push({
                id: 2,
                action: complaint.status === 'IN_PROGRESS' ? 'In Progress' :
                    complaint.status === 'RESOLVED' ? 'Resolved' : 'Rejected',
                date: new Date(complaint?.updatedAt || '').toLocaleString('en-US'),
                description: complaint.status === 'IN_PROGRESS' ? 'The complaint is now in progress' :
                    complaint.status === 'RESOLVED' ? 'The complaint has been resolved' :
                        'The complaint has been rejected',
            });
        }

        return timeline;
    };



    /**
     * Fetch complaint details
     */
    useEffect(() => {
        if (id) {
            fetchComplaintDetails();
            fetchReviews();
        }
    }, [id]);

    // Fetch correct ward data if mismatch is detected
    useEffect(() => {
        const fetchCorrectWard = async () => {
            if (!complaint) return;

            console.log('🔍 Checking for ward mismatch...', {
                locationDetails: complaint.locationDetails,
                location: complaint.location,
                systemWard: complaint.wards
            });

            let targetWardNumber: number | null = null;
            let locDetails = complaint.locationDetails;

            // Parse locationDetails if it's a string
            if (typeof locDetails === 'string') {
                try {
                    locDetails = JSON.parse(locDetails);
                } catch (e) {
                    console.error('Error parsing locationDetails JSON:', e);
                }
            }

            // 1. Try to get ward number from locationDetails
            if (locDetails?.ward) {
                // Handle "Ward 6" or just "6"
                const wardStr = String(locDetails.ward);
                const match = wardStr.match(/\d+/);
                if (match) targetWardNumber = parseInt(match[0]);
            }

            // 2. If not found, try to parse from location string (e.g., "Ward 6, ...")
            if (!targetWardNumber && complaint.location) {
                const match = complaint.location.match(/Ward\s*(\d+)/i);
                if (match) targetWardNumber = parseInt(match[1]);
            }

            // 3. Last Resort: Check the user.ward field if it's an object with wardNumber
            if (!targetWardNumber && typeof complaint.user?.ward === 'object' && (complaint.user.ward as any).wardNumber) {
                targetWardNumber = (complaint.user.ward as any).wardNumber;
            }

            console.log('🔍 Debug Location Data:', {
                locDetails: locDetails,
                locationString: complaint.location,
                extractedWard: targetWardNumber
            });

            if (!targetWardNumber) {
                console.log('❌ Could not extract ward number from location');
                return;
            }

            console.log('🎯 Target Ward Number:', targetWardNumber);

            try {
                // Try to determine City Corporation Code
                let cityCode = complaint.cityCorporation?.code;

                // Fallback: Infer from location string if missing
                if (!cityCode && complaint.location) {
                    if (complaint.location.toLowerCase().includes('south') || complaint.location.includes('দক্ষিণ')) {
                        cityCode = 'DSCC';
                    } else if (complaint.location.toLowerCase().includes('north') || complaint.location.includes('উত্তর')) {
                        cityCode = 'DNCC';
                    }
                }

                if (!cityCode) {
                    // Last resort fallback based on user data if available
                    if (typeof complaint.user?.cityCorporation === 'string') {
                        if (complaint.user.cityCorporation.includes('South')) cityCode = 'DSCC';
                        else if (complaint.user.cityCorporation.includes('North')) cityCode = 'DNCC';
                    } else if (complaint.user?.cityCorporation?.code) {
                        cityCode = complaint.user.cityCorporation.code;
                    }
                }

                // Final default
                if (!cityCode) cityCode = 'DNCC';

                console.log('🌍 Fetching wards for:', cityCode);

                const response = await wardService.getWards({ cityCorporationCode: cityCode });

                if (response.wards) {
                    const found = response.wards.find((w: any) => w.wardNumber === targetWardNumber);
                    if (found) {
                        console.log('✨ Found correct ward data:', found);
                        setCorrectWardData(found);
                    } else {
                        console.warn(`⚠️ Ward ${targetWardNumber} not found in ${cityCode}`);
                        // Fallback: Try fetching without city code (just in case)
                        const allWards = await wardService.getWards({ status: 'ACTIVE' });
                        if (allWards.wards) {
                            const foundAny = allWards.wards.find((w: any) => w.wardNumber === targetWardNumber);
                            if (foundAny) {
                                console.log('✨ Found correct ward data (global search):', foundAny);
                                setCorrectWardData(foundAny);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('❌ Error fetching correct ward details:', err);
            }
        };

        if (complaint) {
            fetchCorrectWard();
        }
    }, [complaint]);

    // Keep other methods that are NOT chat related
    const handleOpenEditModal = (type: 'RESOLVED' | 'OTHERS') => {
        setEditModalType(type);
        setEditModalOpen(true);
    };

    const handleDeleteResolution = async () => {
        if (!complaint || !window.confirm('Are you sure you want to delete this resolution/report? This will revert the status to IN PROGRESS.')) {
            return;
        }

        try {
            await complaintService.updateComplaintStatus(complaint.id, {
                status: 'IN_PROGRESS',
                note: 'Resolution deleted by admin',
                resolutionNote: '', // Clear note
                resolutionImages: '' // Clear images
            });
            fetchComplaintDetails();
            showSuccessToast('Resolution deleted successfully. Status reverted to In Progress.');
        } catch (error) {
            console.error('Failed to delete resolution:', error);
            showErrorToast('Failed to delete resolution.');
        }
    };

    const handleDeleteAudio = async (audioUrl: string, index: number) => {
        if (!complaint) return;

        // Open confirmation dialog
        setDeleteAudioDialog({
            open: true,
            audioUrl,
            index,
        });
    };

    const confirmDeleteAudio = async () => {
        if (!complaint || !deleteAudioDialog.audioUrl) return;

        try {
            // Filter out the audio URL to be deleted
            const updatedAudioUrls = complaint.audioUrls.filter((url) => url !== deleteAudioDialog.audioUrl);

            // Call API to update complaint with new audio URLs
            const updatedComplaint = await complaintService.updateComplaintAudioUrls(complaint.id, updatedAudioUrls);

            // Update local state
            setComplaint(updatedComplaint);

            // Close dialog
            setDeleteAudioDialog({ open: false, audioUrl: null, index: 0 });

            showSuccessToast('Voice recording deleted successfully.');
        } catch (error) {
            console.error('Failed to delete audio recording:', error);
            showErrorToast('Failed to delete audio recording.');
        }
    };

    const cancelDeleteAudio = () => {
        setDeleteAudioDialog({ open: false, audioUrl: null, index: 0 });
    };

    const handleEditSave = async (data: { status: ComplaintStatus; note: string; existingImages: string[]; newImages: File[]; category?: string; subcategory?: string }) => {
        if (!complaint) return;
        try {
            await complaintService.updateComplaintStatus(complaint.id, {
                status: data.status,
                resolutionNote: data.note,
                resolutionImages: data.existingImages.join(','), // Existing URLs string
                resolutionImageFiles: data.newImages, // files
                category: data.category,
                subcategory: data.subcategory
            });
            setEditModalOpen(false);
            fetchComplaintDetails();
            showSuccessToast('Resolution updated successfully.');
        } catch (error: any) {
            console.error('Failed to save resolution changes:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save resolution changes.';
            showErrorToast(errorMessage);
        }
    };

    const fetchComplaintDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await complaintService.getComplaintById(Number(id));
            setComplaint(data);
            // Reviews are now included in the complaint response
            if (data.reviews) {
                setReviews(data.reviews);
            }
        } catch (err: any) {
            console.error('Error fetching complaint details:', err);
            setError('Failed to load complaint details');
            showErrorToast('Failed to load complaint details');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        if (!id) return;

        try {
            setLoadingReviews(true);
            // Call the review API endpoint
            const response = await fetch(`/api/complaints/${id}/reviews`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data.data?.reviews || []);
            }
        } catch (err: any) {
            console.error('Error fetching reviews:', err);
            // Don't show error toast for reviews - it's not critical
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleMarkOthersConfirm = async (category: string, subCategory: string, note?: string, images?: File[]) => {
        if (!complaint) return;

        try {
            setUpdatingStatus(true);
            await complaintService.markComplaintAsOthers(complaint.id, {
                othersCategory: category,
                othersSubcategory: subCategory,
                note: note,
                images: images
            });
            setMarkOthersOpen(false);
            await fetchComplaintDetails();
            showSuccessToast('Complaint marked as Others successfully');
        } catch (err: any) {
            console.error('Error marking as others:', err);
            showErrorToast('Failed to mark as others');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleStatusUpdateSuccess = async () => {
        // Refresh complaint details
        await fetchComplaintDetails();
        setStatusUpdateOpen(false);
        showSuccessToast('Status updated successfully');
    };

    // Original handleStatusUpdate for simple status changes
    const handleStatusUpdate = async (newStatus: ComplaintStatus) => {
        if (!complaint) return;

        // For RESOLVED and IN_PROGRESS with resolution docs, use the modal
        if (newStatus === 'RESOLVED' || newStatus === 'IN_PROGRESS') {
            setStatusUpdateType(newStatus);
            setStatusUpdateOpen(true);
            return;
        }

        try {
            setUpdatingStatus(true);
            const updated = await complaintService.updateComplaintStatus(complaint.id, {
                status: newStatus
            });
            setComplaint(updated);
            showSuccessToast('Status updated successfully');
        } catch (err: any) {
            console.error('Error updating status:', err);
            showErrorToast('Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
    };

















    const getStatusColor = (status: ComplaintStatus) => {
        switch (status) {
            case 'PENDING':
                return { backgroundColor: '#fff3cd', color: '#856404' };
            case 'IN_PROGRESS':
                return { backgroundColor: '#d1ecf1', color: '#0c5460' };
            case 'RESOLVED':
                return { backgroundColor: '#d4edda', color: '#155724' };
            case 'REJECTED':
                return { backgroundColor: '#f8d7da', color: '#721c24' };
            default:
                return { backgroundColor: '#f8f9fa', color: '#6c757d' };
        }
    };

    const getStatusLabel = (status: ComplaintStatus): string => {
        switch (status) {
            case 'PENDING':
                return 'Pending';
            case 'IN_PROGRESS':
                return 'In Progress';
            case 'RESOLVED':
                return 'Solved';
            case 'REJECTED':
                return 'Others';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <MainLayout title="অভিযোগের বিবরণ">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress size={60} sx={{ color: '#4CAF50' }} />
                </Box>
            </MainLayout>
        );
    }

    if (error || !complaint) {
        return (
            <MainLayout title="অভিযোগের বিবরণ">
                <Box sx={{ p: 3 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error || 'Complaint not found'}
                    </Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/complaints')}
                    >
                        Back to Complaints
                    </Button>
                </Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="অভিযোগের বিবরণ">
            <Box sx={{
                p: { xs: 2, md: 3 },
                maxWidth: 1400,
                mx: 'auto',
                backgroundColor: '#f9fafb',
                minHeight: '100vh'
            }}>
                {/* Improved Header */}
                <Card sx={{
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                }}>
                    <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                        {/* Back Button & Title Row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <IconButton
                                onClick={() => navigate('/complaints')}
                                sx={{
                                    color: '#3fa564',
                                    backgroundColor: '#f0fdf4',
                                    '&:hover': { backgroundColor: '#dcfce7' },
                                    width: 40,
                                    height: 40
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#1e2939',
                                        fontSize: { xs: '1.25rem', md: '1.5rem' },
                                        mb: 0.5
                                    }}
                                >
                                    অভিযোগ #{complaint.trackingNumber || `CC-${String(complaint.id).padStart(7, '0')}`}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CalendarIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                            {new Date(complaint.createdAt).toLocaleDateString('bn-BD')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AccessTimeIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                            {formatTimeAgo(complaint.createdAt)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Chip
                                label={getStatusLabel(complaint.status)}
                                sx={{
                                    ...getStatusColor(complaint.status),
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    height: 32,
                                    px: 2,
                                    borderRadius: 2,
                                }}
                            />
                        </Box>

                        {/* Category Badge */}
                        {complaint.category && (
                            <Box sx={{ mt: 2 }}>
                                <CategoryBadge
                                    categoryId={complaint.category}
                                    subcategoryId={complaint.subcategory}
                                />
                            </Box>
                        )}
                    </Box>
                </Card>

                <Grid container spacing={2.5}>
                    {/* Left Column - Main Content */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        {/* Complaint Info Card */}
                        <Card sx={{
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb',
                            overflow: 'hidden'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                    অভিযোগের বিস্তারিত
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e2939' }}>
                                    {complaint.title}
                                </Typography>

                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={{ xs: 12 }}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#f0fdf4', color: '#3fa564' }}>
                                                <LocationIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                    লোকেশন
                                                </Typography>
                                                <Typography variant="body1" sx={{ color: '#1e2939' }}>
                                                    {complaint.location}
                                                </Typography>
                                                {/* Added Zone and Ward Info */}
                                                <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                                                    {(correctWardData?.zone || complaint.zone || complaint.user?.zone) && (
                                                        <Chip
                                                            label={`Zone: ${correctWardData?.zone?.name || complaint.zone?.name || (complaint.user?.zone as any)?.name || 'N/A'}`}
                                                            size="small"
                                                            sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe', fontSize: '0.75rem' }}
                                                        />
                                                    )}
                                                    {(correctWardData || complaint.wards || complaint.user?.ward) && (
                                                        <Chip
                                                            label={`Ward: ${correctWardData?.wardNumber || (complaint.wards as any)?.wardNumber || (complaint.user?.ward as any)?.wardNumber || 'N/A'}`}
                                                            size="small"
                                                            sx={{ bgcolor: '#fdf2f8', color: '#be185d', border: '1px solid #fce7f3', fontSize: '0.75rem' }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Box sx={{ backgroundColor: '#f9fafb', p: 2.5, borderRadius: 2, border: '1px solid #f3f4f6' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#374151' }}>
                                        বিবরণ:
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#4b5563', lineHeight: 1.6 }}>
                                        {complaint.description || 'কোন বিবরণ প্রদান করা হয়নি'}
                                    </Typography>
                                </Box>

                                {/* ✅ Ward Inspector & Zone Officer Information */}
                                {(complaint.wardInspector || complaint.zoneOfficer) && (
                                    <Box sx={{ mt: 3 }}>
                                        <Divider sx={{ mb: 2 }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#374151' }}>
                                            দায়িত্বপ্রাপ্ত কর্মকর্তা (Responsible Officers):
                                        </Typography>

                                        <Grid container spacing={2}>
                                            {/* Zone Officer Info */}
                                            {complaint.zoneOfficer && (
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Box sx={{
                                                        p: 2,
                                                        borderRadius: 2,
                                                        border: '1px solid #dbeafe',
                                                        backgroundColor: '#eff6ff'
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                                            <AdminIcon sx={{ color: '#1d4ed8', fontSize: 20 }} />
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af' }}>
                                                                জোন অফিসার (Zone Officer)
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                            {complaint.zoneOfficer.zoneNumber && (
                                                                <Typography variant="body2" sx={{ color: '#1e3a8a' }}>
                                                                    <strong>Zone:</strong> {complaint.zoneOfficer.zoneNumber} - {complaint.zoneOfficer.zoneName || 'N/A'}
                                                                </Typography>
                                                            )}
                                                            {complaint.zoneOfficer.name && (
                                                                <Typography variant="body2" sx={{ color: '#1e3a8a' }}>
                                                                    <strong>Name:</strong> {complaint.zoneOfficer.name}
                                                                </Typography>
                                                            )}
                                                            {complaint.zoneOfficer.designation && (
                                                                <Typography variant="body2" sx={{ color: '#1e3a8a' }}>
                                                                    <strong>Designation:</strong> {complaint.zoneOfficer.designation}
                                                                </Typography>
                                                            )}
                                                            {complaint.zoneOfficer.phone && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <PhoneIcon sx={{ fontSize: 16, color: '#1d4ed8' }} />
                                                                    <Typography
                                                                        component="a"
                                                                        href={`tel:${complaint.zoneOfficer.phone}`}
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: '#1d4ed8',
                                                                            textDecoration: 'none',
                                                                            '&:hover': { textDecoration: 'underline' }
                                                                        }}
                                                                    >
                                                                        {complaint.zoneOfficer.phone}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            {complaint.zoneOfficer.supervisorName && (
                                                                <Typography variant="body2" sx={{ color: '#1e3a8a', mt: 1, pt: 1, borderTop: '1px solid #bfdbfe' }}>
                                                                    <strong>Supervisor:</strong> {complaint.zoneOfficer.supervisorName}
                                                                    {complaint.zoneOfficer.supervisorTitle && ` (${complaint.zoneOfficer.supervisorTitle})`}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            )}

                                            {/* Ward Inspector Info */}
                                            {complaint.wardInspector && (
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Box sx={{
                                                        p: 2,
                                                        borderRadius: 2,
                                                        border: '1px solid #fce7f3',
                                                        backgroundColor: '#fdf2f8'
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                                            <PersonIcon sx={{ color: '#be185d', fontSize: 20 }} />
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#9f1239' }}>
                                                                ওয়ার্ড ইন্সপেক্টর (Ward Inspector)
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                            {complaint.wardInspector.wardNumber && (
                                                                <Typography variant="body2" sx={{ color: '#831843' }}>
                                                                    <strong>Ward:</strong> {complaint.wardInspector.wardNumber}
                                                                </Typography>
                                                            )}
                                                            {complaint.wardInspector.name && (
                                                                <Typography variant="body2" sx={{ color: '#831843' }}>
                                                                    <strong>Name:</strong> {complaint.wardInspector.name}
                                                                </Typography>
                                                            )}
                                                            {complaint.wardInspector.phone && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <PhoneIcon sx={{ fontSize: 16, color: '#be185d' }} />
                                                                    <Typography
                                                                        component="a"
                                                                        href={`tel:${complaint.wardInspector.phone}`}
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: '#be185d',
                                                                            textDecoration: 'none',
                                                                            '&:hover': { textDecoration: 'underline' }
                                                                        }}
                                                                    >
                                                                        {complaint.wardInspector.phone}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            {complaint.wardInspector.serialNumber && (
                                                                <Typography variant="body2" sx={{ color: '#831843' }}>
                                                                    <strong>Serial:</strong> {complaint.wardInspector.serialNumber}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Box>
                                )}
                            </Box>
                        </Card>

                        {/* Resolution Details Card */}
                        {(complaint.status === 'RESOLVED' || complaint.resolutionNote || complaint.resolutionImages) && (
                            <Card sx={{
                                mb: 3,
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: '1px solid #e5e7eb',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f0fdf4' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#15803d' }} />
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#14532d' }}>
                                            সমাধানের বিবরণ (Resolution Details)
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ p: 3 }}>
                                    {complaint.status === 'OTHERS' && (
                                        <Box sx={{ mb: 3, p: 2, bgcolor: '#fff7ed', borderRadius: 1, border: '1px solid #ffedd5' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#c2410c', mb: 1 }}>
                                                অন্যান্য ক্যাটাগরি হিসেবে চিহ্নিত (Marked as Others):
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#9a3412', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                <span><strong>Category:</strong> {complaint.othersCategory === 'CORPORATION_INTERNAL' ? 'Corp. Internal' :
                                                    complaint.othersCategory === 'CORPORATION_EXTERNAL' ? 'Corp. External' :
                                                        complaint.othersCategory}</span>
                                                {complaint.othersSubcategory && (
                                                    <span><strong>Sub-category:</strong> {complaint.othersSubcategory}</span>
                                                )}
                                            </Typography>
                                        </Box>
                                    )}
                                    {complaint.resolutionNote && (
                                        <Box sx={{ mb: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>
                                                    {(() => {
                                                        const historyEntry = (complaint as any).statusHistory?.find(
                                                            (h: any) => h.newStatus === 'RESOLVED' || h.newStatus === 'OTHERS'
                                                        );
                                                        const role = historyEntry?.changer?.role;
                                                        if (role === 'MASTER_ADMIN') return 'মাস্টার অ্যাডমিনের মন্তব্য (Master Admin Note):';
                                                        if (role === 'SUPER_ADMIN') return 'সুপার অ্যাডমিনের মন্তব্য (Super Admin Note):';
                                                        return 'ওয়ার্ড অ্যাডমিনের মন্তব্য (Ward Admin Note):';
                                                    })()}
                                                </Typography>
                                                <Box>
                                                    <IconButton size="small" onClick={() => handleOpenEditModal('RESOLVED')} color="primary">
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={handleDeleteResolution} color="error">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                            <Typography variant="body1" sx={{ color: '#1f2937', whiteSpace: 'pre-wrap', backgroundColor: '#ffffff', p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
                                                {complaint.resolutionNote}
                                            </Typography>
                                        </Box>
                                    )}

                                    {complaint.resolutionImages && (
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#374151' }}>
                                                কাজের প্রমাণ (Proof of Work):
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                {complaint.resolutionImages.split(',').filter(url => url.trim()).map((imgUrl, i) => (
                                                    <Box
                                                        key={i}
                                                        component="img"
                                                        src={imgUrl.trim()}
                                                        alt={`Resolution Proof ${i + 1}`}
                                                        sx={{
                                                            width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 12px)' },
                                                            maxWidth: 300,
                                                            height: 200,
                                                            objectFit: 'cover',
                                                            borderRadius: 2,
                                                            border: '1px solid #e5e7eb',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            '&:hover': {
                                                                transform: 'scale(1.02)',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                                            }
                                                        }}
                                                        onClick={() => setSelectedImage(imgUrl.trim())}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            </Card>
                        )}

                        {/* Reviews Section */}
                        {(complaint.status === 'RESOLVED' || complaint.status === 'OTHERS') && (
                            <Card sx={{
                                mb: 3,
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: '1px solid #e5e7eb',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                            User Reviews ({reviews.length})
                                        </Typography>
                                        {loadingReviews && (
                                            <CircularProgress size={20} sx={{ color: '#3fa564' }} />
                                        )}
                                    </Box>
                                </Box>
                                <Box sx={{ p: 3 }}>
                                    {loadingReviews ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                            <CircularProgress size={30} sx={{ color: '#3fa564' }} />
                                        </Box>
                                    ) : reviews.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                                No reviews yet. User can submit a review after complaint is resolved or marked as others.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box>
                                            {reviews.map((review) => (
                                                <ReviewDisplayCard key={review.id} review={review} />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Card>
                        )}

                        {/* Responsible Officers Card */}
                        {(complaint.wards?.inspectorName || complaint.zone?.officerName) && (
                            <Card sx={{
                                mb: 3,
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: '1px solid #e5e7eb'
                            }}>
                                <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                        দায়িত্বপ্রাপ্ত কর্মকর্তাগণ
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 3 }}>
                                    <Grid container spacing={2}>
                                        {/* Ward Inspector */}
                                        <Grid size={{ xs: 12 }}>
                                            <Box sx={{
                                                p: 2,
                                                border: '1px solid #bfdbfe',
                                                borderRadius: 2,
                                                backgroundColor: '#eff6ff'
                                            }}>
                                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                    <Avatar sx={{
                                                        bgcolor: '#fff',
                                                        color: '#2563eb',
                                                        width: 48,
                                                        height: 48,
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                    }}>
                                                        <AdminIcon />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                            Ward Inspector / ওয়ার্ড ইন্সপেক্টর
                                                        </Typography>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                                            {correctWardData?.inspectorName || complaint.wards?.inspectorName || 'তথ্য নেই'}
                                                        </Typography>
                                                        {(correctWardData?.inspectorPhone || complaint.wards?.inspectorPhone) && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                                <PhoneIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                                                                <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 500 }}>
                                                                    {correctWardData?.inspectorPhone || complaint.wards?.inspectorPhone}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        {/* Zone Officer */}
                                        <Grid size={{ xs: 12 }}>
                                            <Box sx={{
                                                p: 2,
                                                border: '1px solid #fed7aa',
                                                borderRadius: 2,
                                                backgroundColor: '#fff7ed'
                                            }}>
                                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                    <Avatar sx={{
                                                        bgcolor: '#fff',
                                                        color: '#f97316',
                                                        width: 48,
                                                        height: 48,
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                    }}>
                                                        <PersonIcon />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                            Zone Officer / জোন অফিসার
                                                        </Typography>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                                            {correctWardData?.zone?.officerName || complaint.zone?.officerName || 'No Info'}
                                                        </Typography>
                                                        {(correctWardData?.zone?.officerPhone || complaint.zone?.officerPhone) && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                                <PhoneIcon sx={{ fontSize: 16, color: '#f97316' }} />
                                                                <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 500 }}>
                                                                    {correctWardData?.zone?.officerPhone || complaint.zone?.officerPhone}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Card>
                        )}

                        {/* Complainant Info Card */}
                        <Card sx={{
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                    অভিযোগকারীর তথ্য (Complainant Info)
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    {/* Name */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#f0fdf4', color: '#3fa564' }}>
                                                <PersonIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                    নাম
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                    {complaint.user.firstName} {complaint.user.lastName}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* Phone */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#eff6ff', color: '#2563eb' }}>
                                                <PhoneIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                    ফোন নম্বর
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                    {complaint.user.phone || 'তথ্য নেই'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* Email */}
                                    {complaint.user.email && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#fef3c7', color: '#d97706' }}>
                                                    <EmailIcon fontSize="small" />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                        ইমেইল
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                        {complaint.user.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Address */}
                                    {complaint.user.address && (
                                        <Grid size={{ xs: 12 }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#f3e8ff', color: '#7c3aed' }}>
                                                    <LocationIcon fontSize="small" />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                        ঠিকানা
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                        {complaint.user.address}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* User ID */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#fce7f3', color: '#be185d' }}>
                                                <AdminIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                    ইউজার আইডি
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                    CC-USER-{String(complaint.user.id).padStart(3, '0')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* Registration Date */}
                                    {complaint.user.createdAt && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#dbeafe', color: '#1d4ed8' }}>
                                                    <CalendarIcon fontSize="small" />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                        রেজিস্ট্রেশন তারিখ
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                        {new Date(complaint.user.createdAt).toLocaleDateString('bn-BD', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* User's City Corporation */}
                                    {(complaint.user.cityCorporation || complaint.user.cityCorporationCode) && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#d1fae5', color: '#059669' }}>
                                                    <LocationIcon fontSize="small" />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                        সিটি কর্পোরেশন (ইউজার)
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                        {typeof complaint.user.cityCorporation === 'object'
                                                            ? complaint.user.cityCorporation?.name
                                                            : complaint.user.cityCorporation ||
                                                            (complaint.user.cityCorporationCode === 'DSCC' ? 'ঢাকা দক্ষিণ সিটি কর্পোরেশন' :
                                                                complaint.user.cityCorporationCode === 'DNCC' ? 'ঢাকা উত্তর সিটি কর্পোরেশন' :
                                                                    complaint.user.cityCorporationCode)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* User's Zone */}
                                    {(complaint.user.zone || complaint.user.zoneId) && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#e0e7ff', color: '#4f46e5' }}>
                                                    <LocationIcon fontSize="small" />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                        জোন (ইউজার)
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                        {typeof complaint.user.zone === 'object'
                                                            ? `Zone ${complaint.user.zone.zoneNumber} - ${complaint.user.zone.name || ''}`
                                                            : complaint.user.zone || `Zone ${complaint.user.zoneId}`}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* User's Ward */}
                                    {(complaint.user.ward || complaint.user.wardId) && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#fef3c7', color: '#f59e0b' }}>
                                                    <LocationIcon fontSize="small" />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                        ওয়ার্ড (ইউজার)
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                        {typeof complaint.user.ward === 'object'
                                                            ? `Ward ${complaint.user.ward.wardNumber || complaint.user.ward.number || ''}`
                                                            : complaint.user.ward || `Ward ${complaint.user.wardId}`}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* User Role (if available) */}
                                    {complaint.user.role && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#fee2e2', color: '#dc2626' }}>
                                                    <PersonIcon fontSize="small" />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                        ভূমিকা
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                        {complaint.user.role === 'USER' ? 'নাগরিক' :
                                                            complaint.user.role === 'ADMIN' ? 'অ্যাডমিন' :
                                                                complaint.user.role}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </Box>
                        </Card>

                        {/* Location & Geographical Info Card */}
                        <Card sx={{
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                    অভিযোগের লোকেশন ও ক্যাটাগরি
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                {/* DEBUG INFO - VISIBLE ONLY TO DEVELOPERS - REMOVE THIS BLOCK */}


                                <Grid container spacing={3}>
                                    {/* City Corporation */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, height: '100%' }}>
                                            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                সিটি কর্পোরেশন
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#3fa564' }}>
                                                {/* Try to get from direct relation first, then user relation */}
                                                {complaint.cityCorporation?.name ||
                                                    complaint.cityCorporation?.nameBangla ||
                                                    (typeof complaint.user?.cityCorporation === 'object' ? complaint.user.cityCorporation?.name : null) ||
                                                    (typeof complaint.user?.cityCorporation === 'string' ? complaint.user.cityCorporation : 'ঢাকা উত্তর সিটি কর্পোরেশন')}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    {/* Ward */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, height: '100%' }}>
                                            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                ওয়ার্ড
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e2939' }}>

                                                {/* Prioritize correctWardData then complaint.wards over complaint.user.ward */}
                                                {correctWardData ? `Ward ${correctWardData.wardNumber}` :
                                                    (complaint.wards?.displayName ||
                                                        (complaint.wards?.wardNumber ? `Ward ${complaint.wards.wardNumber}` : null) ||
                                                        (complaint.wards?.number ? `Ward ${complaint.wards.number}` : null) ||
                                                        (typeof complaint.user?.ward === 'object' ? (complaint.user.ward as any)?.wardNumber || (complaint.user.ward as any)?.number : complaint.user?.ward) ||
                                                        'তথ্য নেই')}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    {/* Zone */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, height: '100%' }}>
                                            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                জোন
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                {/* Prioritize correctWardData then complaint.zone over complaint.user.zone */}
                                                {correctWardData?.zone?.name ||
                                                    complaint.zone?.displayName ||
                                                    complaint.zone?.name ||
                                                    (complaint.zone?.zoneNumber ? `Zone ${complaint.zone.zoneNumber}` : null) ||
                                                    (typeof complaint.user?.zone === 'object' ? (complaint.user.zone as any)?.name || (complaint.user.zone as any)?.zoneNumber : complaint.user?.zone) ||
                                                    'তথ্য নেই'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    {/* Thana */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, height: '100%' }}>
                                            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                থানা
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                {complaint.user.thana?.name || 'মিরপুর'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Card>

                        {/* Images Card */}
                        {complaint.imageUrls && complaint.imageUrls.length > 0 && (
                            <Card sx={{
                                mb: 3,
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                                border: '1px solid #e5e7eb'
                            }}>
                                <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                        📷 সংযুক্ত ছবি ({complaint.imageUrls.length})
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 2 }}>
                                    <ImageList cols={2} gap={12}>
                                        {complaint.imageUrls.map((image, index) => (
                                            <ImageListItem
                                                key={index}
                                                sx={{
                                                    cursor: 'pointer',
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                    '&:hover .zoom-icon': { opacity: 1 },
                                                    '&:hover img': { transform: 'scale(1.05)' }
                                                }}
                                                onClick={() => setSelectedImage(image)}
                                            >
                                                <img
                                                    src={image}
                                                    alt={`Complaint image ${index + 1}`}
                                                    loading="lazy"
                                                    style={{
                                                        width: '100%',
                                                        height: 160,
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.3s ease'
                                                    }}
                                                />
                                                <Box
                                                    className="zoom-icon"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: 'rgba(0,0,0,0.4)',
                                                        opacity: 0,
                                                        transition: 'opacity 0.3s',
                                                    }}
                                                >
                                                    <ZoomInIcon sx={{ color: 'white', fontSize: 32 }} />
                                                </Box>
                                            </ImageListItem>
                                        ))}
                                    </ImageList>
                                </Box>
                            </Card>
                        )}

                        {/* Audio Recordings Card */}
                        {complaint.audioUrls && complaint.audioUrls.length > 0 && (
                            <Card sx={{
                                mb: 3,
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: '1px solid #e5e7eb'
                            }}>
                                <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f0fdf4' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Mic sx={{ color: '#15803d' }} />
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#14532d' }}>
                                                🎤 ভয়েস রেকর্ডিং ({complaint.audioUrls.length})
                                            </Typography>
                                        </Box>
                                        {user?.role === 'MASTER_ADMIN' && (
                                            <Tooltip title="Master Admin can delete audio recordings">
                                                <Chip
                                                    label="Deletable"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#fef3c7',
                                                        color: '#92400e',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Box>
                                <Box sx={{ p: 3 }}>
                                    {complaint.audioUrls.map((audioUrl, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                mb: index < complaint.audioUrls.length - 1 ? 2 : 0,
                                                p: 2,
                                                backgroundColor: '#f9fafb',
                                                borderRadius: 2,
                                                border: '1px solid #e5e7eb',
                                                position: 'relative'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ bgcolor: '#dcfce7', color: '#15803d', width: 32, height: 32 }}>
                                                        <Mic fontSize="small" />
                                                    </Avatar>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                        Voice Recording {index + 1}
                                                    </Typography>
                                                </Box>
                                                {user?.role === 'MASTER_ADMIN' && (
                                                    <Tooltip title="Delete this audio recording">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteAudio(audioUrl, index)}
                                                            sx={{
                                                                color: '#dc2626',
                                                                '&:hover': {
                                                                    backgroundColor: '#fee2e2'
                                                                }
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                            <audio
                                                controls
                                                style={{
                                                    width: '100%',
                                                    height: 40,
                                                    borderRadius: 8,
                                                    outline: 'none'
                                                }}
                                                preload="metadata"
                                            >
                                                <source src={audioUrl} type="audio/mpeg" />
                                                <source src={audioUrl} type="audio/wav" />
                                                <source src={audioUrl} type="audio/ogg" />
                                                Your browser does not support the audio element.
                                            </audio>
                                        </Box>
                                    ))}
                                </Box>
                            </Card>
                        )}

                        {/* Timeline Card */}
                        <Card sx={{
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                    টাইমলাইন
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    {getTimeline().map((item, index) => (
                                        <Box key={item.id} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                                            {/* Timeline Line */}
                                            {index < getTimeline().length - 1 && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    left: 11,
                                                    top: 24,
                                                    bottom: -24,
                                                    width: 2,
                                                    backgroundColor: '#e5e7eb',
                                                    zIndex: 0
                                                }} />
                                            )}

                                            <Box sx={{ zIndex: 1, mt: 0.5 }}>
                                                <Box sx={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    backgroundColor: '#dcfce7',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '2px solid #fff',
                                                    boxShadow: '0 0 0 2px #dcfce7'
                                                }}>
                                                    <CheckCircleIcon sx={{ color: '#3fa564', fontSize: 16 }} />
                                                </Box>
                                            </Box>
                                            <Box sx={{ flex: 1, pb: 3 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e2939' }}>
                                                    {item.action}
                                                </Typography>
                                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#6b7280' }}>
                                                    {item.date}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#4b5563', fontSize: '0.875rem' }}>
                                                    {item.description}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Card>

                        {/* Citizen Info Card */}
                        <Card sx={{
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                    নাগরিকের তথ্য
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    {/* Name */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar
                                                src={complaint.user.avatar || undefined}
                                                sx={{ bgcolor: '#eff6ff', color: '#1d4ed8' }}
                                            >
                                                {!complaint.user.avatar && <PersonIcon />}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                                    নাম
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                                    {complaint.user.firstName} {complaint.user.lastName}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* Phone */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: '#f0fdf4', color: '#15803d' }}>
                                                <PhoneIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                                    ফোন
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    component="a"
                                                    href={`tel:${complaint.user.phone}`}
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: '#1f2937',
                                                        textDecoration: 'none',
                                                        '&:hover': { color: '#3fa564' }
                                                    }}
                                                >
                                                    {complaint.user.phone || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* Email */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: '#fff7ed', color: '#c2410c' }}>
                                                <EmailIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                                    ইমেইল
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    component="a"
                                                    href={`mailto:${complaint.user.email}`}
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: '#1f2937',
                                                        textDecoration: 'none',
                                                        '&:hover': { color: '#3fa564' },
                                                        wordBreak: 'break-all'
                                                    }}
                                                >
                                                    {complaint.user.email || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* User ID */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: '0.8rem', fontWeight: 700 }}>
                                                ID
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                                    ইউজার আইডি
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                                    CC-USER-{complaint.user.id}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Card>

                        {/* Ward Inspector Card */}
                        {complaint.wards?.inspectorName && (
                            <Card sx={{
                                mb: 3,
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: '1px solid #e5e7eb'
                            }}>
                                <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                        ওয়ার্ড ইন্সপেক্টর
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ width: 48, height: 48, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>
                                        {complaint.wards.inspectorName?.charAt(0) || 'WI'}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                            {complaint.wards.inspectorName || 'তথ্য নেই'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', color: '#6b7280', mt: 0.5 }}>
                                            Ward {complaint.wards.wardNumber || complaint.wards.number || complaint.wards.id}
                                        </Typography>
                                        {complaint.wards.inspectorPhone && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                <PhoneIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                                                <Typography
                                                    variant="body2"
                                                    component="a"
                                                    href={`tel:${complaint.wards.inspectorPhone}`}
                                                    sx={{
                                                        color: '#6b7280',
                                                        textDecoration: 'none',
                                                        '&:hover': { color: '#3fa564' }
                                                    }}
                                                >
                                                    {complaint.wards.inspectorPhone}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                    {complaint.wards.inspectorPhone && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            component="a"
                                            href={`tel:${complaint.wards.inspectorPhone}`}
                                            sx={{ borderColor: '#e5e7eb', color: '#374151' }}
                                        >
                                            যোগাযোগ
                                        </Button>
                                    )}
                                </Box>
                            </Card>
                        )}

                        {/* Zone Officer Card */}
                        {complaint.zone?.officerName && (
                            <Card sx={{
                                mb: 3,
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: '1px solid #e5e7eb'
                            }}>
                                <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                        Zone Officer
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ width: 48, height: 48, bgcolor: '#fff7ed', color: '#f97316', fontWeight: 600 }}>
                                        {complaint.zone.officerName?.charAt(0) || 'ZO'}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                            {complaint.zone.officerName || 'No Info'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                            Zone Officer
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        )}

                        {/* Admin Report Card */}
                        <Card sx={{
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                    Admin Report
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                                    This complaint is managed by
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#fff7ed', color: '#f97316' }}>
                                        {complaint.assignedAdmin?.firstName?.charAt(0) || <PersonIcon />}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                            {complaint.assignedAdmin ? `${complaint.assignedAdmin.firstName} ${complaint.assignedAdmin.lastName}` : 'Not Assigned Yet'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                            {complaint.assignedAdmin ? 'Ward Admin' : 'Pending'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    sx={{
                                        borderColor: '#3fa564',
                                        color: '#3fa564',
                                        textTransform: 'none',
                                        '&:hover': {
                                            backgroundColor: '#f0fdf4',
                                            borderColor: '#3fa564',
                                        },
                                    }}
                                >
                                    Assign New Admin
                                </Button>
                            </Box>
                        </Card>

                        {/* Action Buttons */}
                        <Card sx={{
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                    Action
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                                    {complaint.status === 'PENDING' && (
                                        <>
                                            <LoadingButton
                                                variant="contained"
                                                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                                                loading={updatingStatus}
                                                startIcon={<CheckCircleIcon />}
                                                sx={{
                                                    backgroundColor: '#3fa564',
                                                    '&:hover': { backgroundColor: '#15803d' },
                                                    textTransform: 'none',
                                                    px: 3,
                                                    flex: 1
                                                }}
                                            >
                                                Mark In Progress
                                            </LoadingButton>
                                            <LoadingButton
                                                variant="contained"
                                                onClick={() => handleStatusUpdate('RESOLVED')}
                                                loading={updatingStatus}
                                                startIcon={<CheckCircleIcon />}
                                                sx={{
                                                    backgroundColor: '#15803d',
                                                    '&:hover': { backgroundColor: '#166534' },
                                                    textTransform: 'none',
                                                    px: 3,
                                                    flex: 1
                                                }}
                                            >
                                                Mark Solved
                                            </LoadingButton>
                                        </>
                                    )}
                                    {complaint.status === 'IN_PROGRESS' && (
                                        <>
                                            <LoadingButton
                                                variant="contained"
                                                onClick={() => handleStatusUpdate('RESOLVED')}
                                                loading={updatingStatus}
                                                startIcon={<CheckCircleIcon />}
                                                sx={{
                                                    backgroundColor: '#3fa564',
                                                    '&:hover': { backgroundColor: '#15803d' },
                                                    textTransform: 'none',
                                                    px: 3,
                                                    flex: 1
                                                }}
                                            >
                                                Mark Solved
                                            </LoadingButton>
                                            <LoadingButton
                                                variant="outlined"
                                                onClick={() => handleStatusUpdate('PENDING')}
                                                loading={updatingStatus}
                                                sx={{
                                                    borderColor: '#f59e0b',
                                                    color: '#d97706',
                                                    textTransform: 'none',
                                                    px: 3,
                                                    '&:hover': {
                                                        backgroundColor: '#fffbeb',
                                                        borderColor: '#f59e0b',
                                                    },
                                                }}
                                            >
                                                Mark Pending
                                            </LoadingButton>
                                        </>
                                    )}
                                    {complaint.status === 'RESOLVED' && (
                                        <LoadingButton
                                            variant="outlined"
                                            onClick={() => handleStatusUpdate('IN_PROGRESS')}
                                            loading={updatingStatus}
                                            sx={{
                                                borderColor: '#3b82f6',
                                                color: '#2563eb',
                                                textTransform: 'none',
                                                px: 3,
                                                flex: 1,
                                                '&:hover': {
                                                    backgroundColor: '#eff6ff',
                                                    borderColor: '#3b82f6',
                                                },
                                            }}
                                        >
                                            Reopen (In Progress)
                                        </LoadingButton>
                                    )}
                                    {complaint.status === 'REJECTED' && (
                                        <LoadingButton
                                            variant="outlined"
                                            onClick={() => handleStatusUpdate('PENDING')}
                                            loading={updatingStatus}
                                            sx={{
                                                borderColor: '#f59e0b',
                                                color: '#d97706',
                                                textTransform: 'none',
                                                px: 3,
                                                flex: 1,
                                                '&:hover': {
                                                    backgroundColor: '#fffbeb',
                                                    borderColor: '#f59e0b',
                                                },
                                            }}
                                        >
                                            Reopen (Pending)
                                        </LoadingButton>
                                    )}
                                    {complaint.status === 'OTHERS' && (
                                        <LoadingButton
                                            variant="outlined"
                                            onClick={() => handleStatusUpdate('PENDING')}
                                            loading={updatingStatus}
                                            sx={{
                                                borderColor: '#f59e0b',
                                                color: '#d97706',
                                                textTransform: 'none',
                                                px: 3,
                                                flex: 1,
                                                '&:hover': {
                                                    backgroundColor: '#fffbeb',
                                                    borderColor: '#f59e0b',
                                                },
                                            }}
                                        >
                                            Reopen (Pending)
                                        </LoadingButton>
                                    )}
                                </Box>

                                {/* Mark as Others Action - Available for PENDING and IN_PROGRESS */}
                                {(complaint.status === 'PENDING' || complaint.status === 'IN_PROGRESS') && (
                                    <>
                                        <Divider sx={{ my: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Other Actions
                                            </Typography>
                                        </Divider>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                                            <LoadingButton
                                                variant="outlined"
                                                onClick={() => setMarkOthersOpen(true)}
                                                loading={updatingStatus}
                                                startIcon={<CloseIcon />}
                                                sx={{
                                                    borderColor: '#ef4444',
                                                    color: '#ef4444',
                                                    textTransform: 'none',
                                                    width: '100%',
                                                    '&:hover': {
                                                        backgroundColor: '#fef2f2',
                                                        borderColor: '#ef4444',
                                                    },
                                                }}
                                            >
                                                Mark as Others
                                            </LoadingButton>
                                        </Box>
                                    </>
                                )}

                                {/* Show Others category info if already marked */}
                                {(complaint.status === 'REJECTED' || complaint.status === 'OTHERS') && (
                                    <>
                                        <Divider sx={{ my: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Other Actions
                                            </Typography>
                                        </Divider>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                                            <LoadingButton
                                                variant="outlined"
                                                onClick={() => setMarkOthersOpen(true)}
                                                loading={updatingStatus}
                                                startIcon={<CloseIcon />}
                                                sx={{
                                                    borderColor: '#ef4444',
                                                    color: '#ef4444',
                                                    textTransform: 'none',
                                                    width: '100%',
                                                    '&:hover': {
                                                        backgroundColor: '#fef2f2',
                                                        borderColor: '#ef4444',
                                                    },
                                                }}
                                            >
                                                Update Others Category
                                            </LoadingButton>

                                            {(complaint.othersCategory || complaint.category) && (
                                                <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 1, border: '1px solid #fee2e2' }}>
                                                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                                                        Marked as Others
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Category:</strong> {complaint.othersCategory || complaint.category}
                                                    </Typography>
                                                    {(complaint.othersSubcategory || complaint.subcategory) && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            <strong>Sub-category:</strong> {complaint.othersSubcategory || complaint.subcategory}
                                                        </Typography>
                                                    )}

                                                    {complaint.resolutionNote && (
                                                        <Box sx={{ mt: 1.5 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#ef4444' }}>
                                                                    {(() => {
                                                                        // Find the history entry that set this status
                                                                        const historyEntry = (complaint as any).statusHistory?.find(
                                                                            (h: any) => h.newStatus === 'OTHERS'
                                                                        );
                                                                        const role = historyEntry?.changer?.role;
                                                                        return role === 'SUPER_ADMIN' || role === 'MASTER_ADMIN'
                                                                            ? 'Super Admin Note:'
                                                                            : 'Ward Admin Note:';
                                                                    })()}
                                                                </Typography>
                                                                <Box>
                                                                    <IconButton size="small" onClick={() => handleOpenEditModal('OTHERS')} sx={{ color: '#ef4444' }}>
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton size="small" onClick={handleDeleteResolution} sx={{ color: '#ef4444' }}>
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </Box>
                                                            <Typography variant="body2" sx={{ color: '#374151', bgcolor: '#fff', p: 1, borderRadius: 1, border: '1px solid #fee2e2', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                                                {complaint.resolutionNote}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    {complaint.resolutionImages && (
                                                        <Box sx={{ mt: 1.5 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#ef4444', display: 'block', mb: 0.5 }}>
                                                                Attached Images:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                {complaint.resolutionImages.split(',').filter(url => url.trim()).map((imgUrl, i) => (
                                                                    <Box
                                                                        key={i}
                                                                        component="img"
                                                                        src={imgUrl.trim()}
                                                                        alt={`Admin report ${i + 1}`}
                                                                        sx={{
                                                                            width: 60,
                                                                            height: 60,
                                                                            objectFit: 'cover',
                                                                            borderRadius: 1,
                                                                            cursor: 'pointer',
                                                                            border: '1px solid #fee2e2'
                                                                        }}
                                                                        onClick={() => setSelectedImage(imgUrl.trim())}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                    {complaint.status === 'REJECTED' && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                            Note: This complaint is marked as REJECTED but contains Others/External categorization.
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Card>
                    </Grid>

                    {/* Right Column - Chat Section - Full Height */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            border: '1px solid #e5e7eb',
                            height: '1000px', // Increased height to 1000px
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            bgcolor: '#fff'
                        }}>
                            {/* Reusable Chat Conversation Panel */}
                            {id && (
                                <ChatConversationPanel
                                    complaintId={Number(id)}
                                    hideHeader={false}
                                    onStatusUpdate={(newStatus) => {
                                        // Update local complaint state if status changes from chat
                                        if (complaint) {
                                            setComplaint({
                                                ...complaint,
                                                status: newStatus
                                            });
                                        }
                                    }}
                                />
                            )}
                        </Card>
                    </Grid>
                </Grid>
            </Box >

            {/* Mark Others Modal */}
            <MarkOthersModal
                open={markOthersOpen}
                onClose={() => setMarkOthersOpen(false)}
                onConfirm={handleMarkOthersConfirm}
                loading={updatingStatus}
            />

            {/* Status Update Modal */}
            <StatusUpdateModal
                open={statusUpdateOpen}
                complaintId={complaint?.id || 0}
                status={statusUpdateType}
                existingImages={complaint?.resolutionImages || ''}
                onClose={() => setStatusUpdateOpen(false)}
                onSuccess={handleStatusUpdateSuccess}
            />

            {/* Image Modal */}
            {selectedImage && (
                <Dialog
                    open={Boolean(selectedImage)}
                    onClose={() => setSelectedImage(null)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            bgcolor: 'transparent',
                            boxShadow: 'none',
                            overflow: 'hidden'
                        }
                    }}
                >
                    <Box sx={{ position: 'relative', bgcolor: 'transparent', display: 'flex', justifyContent: 'center' }}>
                        <IconButton
                            onClick={() => setSelectedImage(null)}
                            sx={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                color: 'white',
                                bgcolor: 'rgba(0,0,0,0.5)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                                m: 1
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <img
                            src={selectedImage}
                            alt="Full size"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: 8
                            }}
                        />
                    </Box>
                </Dialog>
            )}

            {complaint && (
                <EditResolutionModal
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    onSave={handleEditSave}
                    complaint={complaint}
                    type={editModalType}
                />
            )}

            {/* Delete Audio Confirmation Dialog */}
            <Dialog
                open={deleteAudioDialog.open}
                onClose={cancelDeleteAudio}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    }
                }}
            >
                <Box sx={{ p: 3 }}>
                    {/* Header with Icon */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor: 'error.light',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                            }}
                        >
                            <DeleteIcon sx={{ color: 'error.main', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={600} color="text.primary">
                                Delete Voice Recording {deleteAudioDialog.index + 1}?
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                This action cannot be undone
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Message */}
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Are you sure you want to permanently delete this voice recording?
                        Once deleted, it cannot be recovered.
                    </Typography>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                            onClick={cancelDeleteAudio}
                            variant="outlined"
                            color="inherit"
                            sx={{
                                minWidth: 100,
                                textTransform: 'none',
                                fontWeight: 500,
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDeleteAudio}
                            variant="contained"
                            color="error"
                            sx={{
                                minWidth: 100,
                                textTransform: 'none',
                                fontWeight: 500,
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </MainLayout >
    );
};

export default ComplaintDetails;
