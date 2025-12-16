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

const ComplaintDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [imageFile, setImageFile] = useState<{ file: File; preview: string } | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Mock timeline data (apni pore dynamic korben)
    const mockTimeline = [
        {
            id: 1,
            action: 'অভিযোগ',
            date: '2024-12-15 10:30 AM',
            description: 'অভিযোগটি জমা দেওয়া হয়েছে',
        },
        {
            id: 2,
            action: 'প্রক্রিয়াধীন',
            date: '2024-12-15 11:45 AM',
            description: 'অভিযোগটি প্রক্রিয়াধীন করা হয়েছে',
        },
        {
            id: 3,
            action: 'পরিদর্শন',
            date: '2024-12-15 02:30 PM',
            description: 'ওয়ার্ড ইন্সপেক্টর পরিদর্শন করেছেন',
        },
    ];

    /**
     * Scroll to bottom of messages
     */
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    /**
     * Fetch complaint details and chat messages
     */
    useEffect(() => {
        if (id) {
            fetchComplaintDetails();
            fetchChatMessages();
        }
    }, [id]);

    const fetchComplaintDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await complaintService.getComplaintById(Number(id));
            setComplaint(data);
        } catch (err: any) {
            console.error('Error fetching complaint details:', err);
            setError('Failed to load complaint details');
            showErrorToast('Failed to load complaint details');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: ComplaintStatus) => {
        if (!complaint) return;

        try {
            setUpdatingStatus(true);
            const updated = await complaintService.updateComplaintStatus(complaint.id, {
                status: newStatus,
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

    /**
     * Fetch chat messages
     */
    const fetchChatMessages = async () => {
        if (!id) return;

        try {
            setLoadingMessages(true);
            const { messages: fetchedMessages } = await chatService.getChatMessages(Number(id));
            setMessages(fetchedMessages);
            // Mark messages as read
            await chatService.markAsRead(Number(id));
        } catch (err: any) {
            console.error('Error fetching chat messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    /**
     * Scroll to bottom when messages change
     */
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    /**
     * Start polling for new messages
     */
    useEffect(() => {
        if (id) {
            chatService.startPolling(Number(id), (newMessages) => {
                setMessages(newMessages);
            });

            return () => {
                chatService.stopPolling(Number(id));
            };
        }
    }, [id]);

    /**
     * Handle sending a message
     */
    const handleSendMessage = async () => {
        if (!id || (!messageText.trim() && !imageFile)) return;

        try {
            setSending(true);

            let newMessage: ChatMessage;

            // If there's an image file, send with file upload
            if (imageFile) {
                newMessage = await chatService.sendMessageWithFile(
                    Number(id),
                    messageText.trim() || 'Image',
                    imageFile.file
                );
            } else {
                // Send text only
                newMessage = await chatService.sendMessage(Number(id), {
                    message: messageText.trim(),
                });
            }

            // Add message to list optimistically
            setMessages((prev) => [...prev, newMessage]);

            // Clear input fields
            setMessageText('');
            setImageFile(null);

            // Scroll to bottom
            scrollToBottom();

            toast.success('Message sent successfully', {
                icon: '✅',
            });
        } catch (err: any) {
            const enhancedError = handleApiError(err);
            toast.error(enhancedError.userMessage, {
                duration: 5000,
                icon: '❌',
            });
        } finally {
            setSending(false);
        }
    };

    /**
     * Handle image upload
     */
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file', {
                icon: '❌',
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB', {
                icon: '❌',
            });
            return;
        }

        try {
            setUploadingImage(true);

            // Create preview for display
            const reader = new FileReader();
            reader.onloadend = () => {
                // Store both file and preview
                setImageFile({
                    file: file,
                    preview: reader.result as string,
                });
            };
            reader.readAsDataURL(file);

            toast.success('Image ready to send', {
                icon: '✅',
            });
        } catch (err: any) {
            const enhancedError = handleApiError(err);
            toast.error(enhancedError.userMessage, {
                icon: '❌',
            });
            // Clear preview on error
            setImageFile(null);
        } finally {
            setUploadingImage(false);
        }
    };

    /**
     * Handle removing image preview
     */
    const handleRemoveImage = () => {
        setImageFile(null);
    };

    /**
     * Handle key press in message input
     */
    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    /**
     * Format message timestamp
     */
    const formatMessageTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) {
            return 'এইমাত্র';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} মিনিট আগে`;
        } else if (diffInHours < 24) {
            return `${diffInHours} ঘন্টা আগে`;
        } else if (diffInDays < 7) {
            return `${diffInDays} দিন আগে`;
        } else {
            return date.toLocaleDateString('bn-BD', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            });
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
                return 'অপেক্ষমাণ';
            case 'IN_PROGRESS':
                return 'প্রক্রিয়াধীন';
            case 'RESOLVED':
                return 'সমাধান';
            case 'REJECTED':
                return 'প্রত্যাখ্যাত';
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
                                    লোকেশো ও ক্যাটাগরি
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    {/* City Corporation */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, height: '100%' }}>
                                            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                                                সিটি কর্পোরেশন
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#3fa564' }}>
                                                {typeof complaint.user.cityCorporation === 'object' && complaint.user.cityCorporation
                                                    ? complaint.user.cityCorporation.name
                                                    : (typeof complaint.user.cityCorporation === 'string' ? complaint.user.cityCorporation : 'ঢাকা উত্তর সিটি কর্পোরেশন')}
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
                                                {complaint.locationDetails?.ward || complaint.user.ward || 'তথ্য নেই'}
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
                                                {complaint.user.zone || 'তথ্য নেই'}
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
                                    {mockTimeline.map((item, index) => (
                                        <Box key={item.id} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                                            {/* Timeline Line */}
                                            {index < mockTimeline.length - 1 && (
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
                                            <Avatar sx={{ bgcolor: '#eff6ff', color: '#1d4ed8' }}>
                                                <PersonIcon />
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
                                    WI
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                        মোঃ রহিম উদ্দিন
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                        <PhoneIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                            ০১৭১২৩৪৫৬৭৮
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button variant="outlined" size="small" sx={{ borderColor: '#e5e7eb', color: '#374151' }}>
                                    যোগাযোগ
                                </Button>
                            </Box>
                        </Card>

                        {/* Admin Report Card */}
                        <Card sx={{
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e2939' }}>
                                    অ্যাডমিন রিপোর্ট
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                                    এই অভিযোগটি পরিচালনা করছেন
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#fff7ed', color: '#f97316' }}>
                                        A
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                            অ্যাডমিন নাম (Mock)
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                            ওয়ার্ড অ্যাডমিন
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
                                    নতুন অ্যাডমিন নিয়োগ করুন
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
                                    অ্যাকশন
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    {complaint.status === 'PENDING' && (
                                        <>
                                            <LoadingButton
                                                variant="contained"
                                                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                                                loading={updatingStatus}
                                                sx={{
                                                    backgroundColor: '#3fa564',
                                                    '&:hover': { backgroundColor: '#15803d' },
                                                    textTransform: 'none',
                                                    px: 3
                                                }}
                                            >
                                                প্রক্রিয়াধীন করুন
                                            </LoadingButton>
                                            <LoadingButton
                                                variant="outlined"
                                                onClick={() => handleStatusUpdate('REJECTED')}
                                                loading={updatingStatus}
                                                sx={{
                                                    borderColor: '#ef4444',
                                                    color: '#ef4444',
                                                    textTransform: 'none',
                                                    px: 3,
                                                    '&:hover': {
                                                        backgroundColor: '#fef2f2',
                                                        borderColor: '#ef4444',
                                                    },
                                                }}
                                            >
                                                প্রত্যাখ্যান করুন
                                            </LoadingButton>
                                        </>
                                    )}
                                    {complaint.status === 'IN_PROGRESS' && (
                                        <>
                                            <LoadingButton
                                                variant="contained"
                                                onClick={() => handleStatusUpdate('RESOLVED')}
                                                loading={updatingStatus}
                                                sx={{
                                                    backgroundColor: '#3fa564',
                                                    '&:hover': { backgroundColor: '#15803d' },
                                                    textTransform: 'none',
                                                    px: 3
                                                }}
                                            >
                                                সমাধান করুন
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
                                                অপেক্ষমাণ করুন
                                            </LoadingButton>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        </Card>
                    </Grid>

                    {/* Right Column - Chat Section - Full Height */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card sx={{ borderRadius: 1.5, position: 'sticky', top: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', height: 'calc(100vh - 48px)', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#fff' }}>
                            <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#f0fdf4', color: '#3fa564' }}>
                                        <AdminIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e2939', lineHeight: 1.2 }}>
                                            বার্তা এবং আলোচনা
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                            নাগরিকের সাথে সরাসরি যোগাযোগ
                                        </Typography>
                                    </Box>
                                </Box>
                                <Chip label={loadingMessages ? 'Connecting...' : 'Active Now'} size="small" color={loadingMessages ? 'default' : 'success'} variant="outlined" sx={{ height: 24, borderRadius: 1, fontSize: '0.7rem' }} />
                            </Box>

                            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {loadingMessages ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <CircularProgress size={30} sx={{ color: '#3fa564' }} />
                                    </Box>
                                ) : messages.length === 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6 }}>
                                        <SendIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                                        <Typography variant="body2" sx={{ color: '#6b7280' }}>কোন বার্তা নেই</Typography>
                                    </Box>
                                ) : (
                                    messages.map((msg) => (
                                        <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.senderId === 0 ? 'flex-end' : 'flex-start', maxWidth: '85%', alignSelf: msg.senderId === 0 ? 'flex-end' : 'flex-start' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, flexDirection: msg.senderId === 0 ? 'row-reverse' : 'row' }}>
                                                {msg.senderId !== 0 && (
                                                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#eff6ff', color: '#3b82f6', fontSize: '0.7rem' }}>N</Avatar>
                                                )}
                                                <Box sx={{ p: 1.5, bgcolor: msg.senderId === 0 ? '#3fa564' : '#fff', color: msg.senderId === 0 ? '#fff' : '#1f2937', borderRadius: 2, borderTopLeftRadius: msg.senderId === 0 ? 8 : 0, borderTopRightRadius: msg.senderId === 0 ? 0 : 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative' }}>
                                                    {msg.imageUrl && (
                                                        <Box sx={{ mb: 1, borderRadius: 1, overflow: 'hidden' }}>
                                                            <img src={msg.imageUrl} alt="Attachment" style={{ maxWidth: '100%', maxHeight: 150, objectFit: 'cover', cursor: 'pointer' }} onClick={() => setSelectedImage(msg.imageUrl)} />
                                                        </Box>
                                                    )}
                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem' }}>{msg.message}</Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem', opacity: 0.8, textAlign: 'right' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </Box>

                            <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #e0e0e0' }}>
                                {imageFile && (
                                    <Box sx={{ mb: 1, p: 1, bgcolor: '#f0fdf4', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" sx={{ color: '#166534' }}>Image attached</Typography>
                                        <IconButton size="small" onClick={() => setImageFile(null)}><CloseIcon fontSize="small" /></IconButton>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <input accept="image/*" style={{ display: 'none' }} id="icon-button-file" type="file" onChange={handleImageUpload} disabled={sending} />
                                    <label htmlFor="icon-button-file">
                                        <IconButton color="primary" aria-label="upload picture" component="span" disabled={sending} sx={{ color: '#6b7280', '&:hover': { color: '#3fa564', bgcolor: '#f0fdf4' } }}>
                                            <ImageIcon />
                                        </IconButton>
                                    </label>
                                    <TextField fullWidth multiline maxRows={4} placeholder="আপনার বার্তা লিখুন..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyPress={handleKeyPress} disabled={sending} variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f9fafb', '& fieldset': { borderColor: '#e5e7eb' }, '&:hover fieldset': { borderColor: '#d1d5db' }, '&.Mui-focused fieldset': { borderColor: '#3fa564', borderWidth: 1 } } }} />
                                    <IconButton onClick={handleSendMessage} disabled={sending || (!messageText.trim() && !imageFile)} sx={{ bgcolor: '#3fa564', color: 'white', width: 40, height: 40, '&:hover': { bgcolor: '#15803d' }, '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' } }}>
                                        {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                    </IconButton>
                                </Box>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Image Preview Dialog */}
            <Dialog
                open={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                maxWidth="lg"
                fullWidth
            >
                <Box sx={{ position: 'relative', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <IconButton
                        onClick={() => setSelectedImage(null)}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                            zIndex: 1,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {selectedImage && (
                        <img
                            src={selectedImage}
                            alt="Full size"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                            }}
                        />
                    )}
                </Box>
            </Dialog>
        </MainLayout>
    );
};

export default ComplaintDetails;
