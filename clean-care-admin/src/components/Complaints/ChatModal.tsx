import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    IconButton,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Avatar,
    useTheme,
    useMediaQuery,
    InputAdornment,
} from '@mui/material';
import {
    Close as CloseIcon,
    Send as SendIcon,
    Image as ImageIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { chatService } from '../../services/chatService';
import { handleApiError } from '../../utils/errorHandler';
import { scaleIn, slideInUp, animationConfig, fadeIn } from '../../styles/animations';
import type { ChatMessage } from '../../types/chat-service.types';

interface ChatModalProps {
    complaintId: number | null;
    open: boolean;
    onClose: () => void;
    citizenName?: string;
    complaintTitle?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({
    complaintId,
    open,
    onClose,
    citizenName = 'Citizen',
    complaintTitle = 'Complaint',
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    // State management
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    /**
     * Scroll to bottom of messages
     */
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    /**
     * Fetch chat messages when modal opens
     */
    useEffect(() => {
        if (open && complaintId) {
            fetchMessages();
            // Mark messages as read when chat is opened
            markMessagesAsRead();
        }
    }, [open, complaintId]);

    /**
     * Scroll to bottom when messages change
     */
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    /**
     * Start polling for new messages when modal is open
     */
    useEffect(() => {
        if (open && complaintId) {
            chatService.startPolling(complaintId, (newMessages) => {
                setMessages(newMessages);
            });

            return () => {
                chatService.stopPolling(complaintId);
            };
        }
    }, [open, complaintId]);

    /**
     * Fetch messages from API
     */
    const fetchMessages = async () => {
        if (!complaintId) return;

        try {
            setLoading(true);
            setError(null);
            const { messages: fetchedMessages } = await chatService.getChatMessages(complaintId);
            setMessages(fetchedMessages);
        } catch (err: any) {
            const enhancedError = handleApiError(err);
            setError(enhancedError.userMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Mark messages as read
     */
    const markMessagesAsRead = async () => {
        if (!complaintId) return;

        try {
            await chatService.markAsRead(complaintId);
        } catch (err: any) {
            console.error('Error marking messages as read:', err);
        }
    };

    /**
     * Handle sending a message
     */
    const handleSendMessage = async () => {
        if (!complaintId || (!messageText.trim() && !imagePreview)) return;

        try {
            setSending(true);

            // Send message with or without image
            const newMessage = await chatService.sendMessage(complaintId, {
                message: messageText.trim(),
                imageUrl: imagePreview || undefined,
            });

            // Add message to list optimistically
            setMessages((prev) => [...prev, newMessage]);

            // Clear input fields
            setMessageText('');
            setImagePreview(null);

            // Scroll to bottom
            scrollToBottom();
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

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // TODO: Upload image to server and get URL
            // For now, we'll use the data URL as preview
            // In production, you should upload to your server/cloud storage

        } catch (err: any) {
            const enhancedError = handleApiError(err);
            toast.error(enhancedError.userMessage, {
                icon: '❌',
            });
        } finally {
            setUploadingImage(false);
        }
    };

    /**
     * Handle removing image preview
     */
    const handleRemoveImage = () => {
        setImagePreview(null);
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
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInDays < 7) {
            return `${diffInDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            });
        }
    };

    /**
     * Handle modal close
     */
    const handleClose = () => {
        setMessages([]);
        setMessageText('');
        setImagePreview(null);
        setError(null);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: isMobile ? 0 : 2,
                        height: isMobile ? '100vh' : '80vh',
                        maxHeight: isMobile ? '100vh' : '80vh',
                        display: 'flex',
                        flexDirection: 'column',
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
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                        sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: '#4CAF50',
                        }}
                    >
                        <PersonIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {citizenName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {complaintTitle}
                        </Typography>
                    </Box>
                </Box>
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

            {/* Dialog Content - Messages */}
            <DialogContent
                ref={messageContainerRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    backgroundColor: '#f8f9fa',
                }}
            >
                {/* Loading State */}
                {loading && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 200,
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

                {/* Messages */}
                {!loading && !error && messages.length === 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 200,
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            No messages yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Start the conversation by sending a message
                        </Typography>
                    </Box>
                )}

                {!loading && !error && messages.map((message) => {
                    const isAdmin = message.senderType === 'ADMIN';

                    return (
                        <Box
                            key={message.id}
                            sx={{
                                display: 'flex',
                                justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                                animation: `${fadeIn} ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                            }}
                        >
                            <Box
                                sx={{
                                    maxWidth: '70%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.5,
                                }}
                            >
                                {/* Sender Name */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 1,
                                        justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    {isAdmin && <AdminIcon sx={{ fontSize: 14, color: '#4CAF50' }} />}
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 600,
                                            color: isAdmin ? '#4CAF50' : '#1976d2',
                                        }}
                                    >
                                        {message.senderName || (isAdmin ? 'Admin' : citizenName)}
                                    </Typography>
                                </Box>

                                {/* Message Bubble */}
                                <Box
                                    sx={{
                                        backgroundColor: isAdmin ? '#4CAF50' : 'white',
                                        color: isAdmin ? 'white' : 'text.primary',
                                        borderRadius: 2,
                                        p: 1.5,
                                        boxShadow: 1,
                                    }}
                                >
                                    {/* Image if present */}
                                    {message.imageUrl && (
                                        <Box
                                            component="img"
                                            src={message.imageUrl}
                                            alt="Message attachment"
                                            sx={{
                                                width: '100%',
                                                maxWidth: 300,
                                                borderRadius: 1,
                                                mb: message.message ? 1 : 0,
                                            }}
                                        />
                                    )}

                                    {/* Message Text */}
                                    {message.message && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {message.message}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Timestamp */}
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        px: 1,
                                        textAlign: isAdmin ? 'right' : 'left',
                                    }}
                                >
                                    {formatMessageTime(message.createdAt)}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </DialogContent>

            {/* Message Input Area */}
            <Box
                sx={{
                    p: 2,
                    borderTop: '1px solid #e0e0e0',
                    backgroundColor: 'white',
                    flexShrink: 0,
                }}
            >
                {/* Image Preview */}
                {imagePreview && (
                    <Box
                        sx={{
                            mb: 1,
                            position: 'relative',
                            display: 'inline-block',
                        }}
                    >
                        <Box
                            component="img"
                            src={imagePreview}
                            alt="Preview"
                            sx={{
                                maxWidth: 200,
                                maxHeight: 200,
                                borderRadius: 1,
                                border: '1px solid #e0e0e0',
                            }}
                        />
                        <IconButton
                            size="small"
                            onClick={handleRemoveImage}
                            sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                },
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}

                {/* Input Field */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconButton
                                            component="label"
                                            size="small"
                                            disabled={uploadingImage || sending}
                                        >
                                            <ImageIcon />
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                            },
                        }}
                    />

                    <Button
                        variant="contained"
                        onClick={handleSendMessage}
                        disabled={(!messageText.trim() && !imagePreview) || sending}
                        sx={{
                            minWidth: 56,
                            height: 56,
                            borderRadius: '50%',
                            backgroundColor: '#4CAF50',
                            '&:hover': {
                                backgroundColor: '#45a049',
                            },
                            '&:disabled': {
                                backgroundColor: '#e0e0e0',
                            },
                        }}
                    >
                        {sending ? (
                            <CircularProgress size={24} sx={{ color: 'white' }} />
                        ) : (
                            <SendIcon />
                        )}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default ChatModal;
