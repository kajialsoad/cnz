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
} from '@mui/material';
import {
    Close as CloseIcon,
    Send as SendIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { directMessageService } from '../../services/directMessageService';
import { scaleIn, slideInUp, animationConfig, fadeIn } from '../../styles/animations';

interface DirectMessageModalProps {
    userId: number | null;
    open: boolean;
    onClose: () => void;
    userName?: string;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
    userId,
    open,
    onClose,
    userName = 'User',
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        if (open && userId) {
            fetchMessages();
        }
    }, [open, userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const fetchMessages = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await directMessageService.getConversation(userId);
            setMessages(data.messages || []);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load conversation');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!userId || !messageText.trim()) return;

        try {
            setSending(true);
            const newMessage = await directMessageService.sendMessage(userId, messageText.trim());

            // The backend returns the message object. 
            // We need to format it to match the list structure if necessary, 
            // but assuming the backend returns the created message compatible with the list.
            setMessages((prev) => [...prev, newMessage]);

            setMessageText('');
            scrollToBottom();
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleClose = () => {
        setMessages([]);
        setMessageText('');
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
            PaperProps={{
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
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#2196F3' }}>
                        <PersonIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{userName}</Typography>
                        <Typography variant="caption" color="text.secondary">Direct Message</Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
                {error && <Alert severity="error">{error}</Alert>}

                {!loading && !error && messages.length === 0 && (
                    <Box sx={{ textAlign: 'center', pt: 4, opacity: 0.7 }}>
                        <Typography>No messages yet.</Typography>
                        <Typography variant="caption">Start a conversation!</Typography>
                    </Box>
                )}

                {!loading && messages.map((msg: any) => {
                    // Check if the current user (Admin) is the sender
                    // The backend typically returns 'senderId'. We need to know our own ID.
                    // Or we can infer: if sender.role includes 'ADMIN', it is us.
                    const isMe = msg.sender?.role?.includes('ADMIN') || msg.senderType === 'ADMIN';

                    return (
                        <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <Box sx={{ maxWidth: '75%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                    {isMe && <AdminIcon sx={{ fontSize: 12, color: 'success.main' }} />}
                                    <Typography variant="caption" color="text.secondary">
                                        {isMe ? 'You' : (msg.sender?.firstName || userName)}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    p: 1.5,
                                    bgcolor: isMe ? 'primary.main' : 'white',
                                    color: isMe ? 'white' : 'text.primary',
                                    borderRadius: 2,
                                    boxShadow: 1
                                }}>
                                    <Typography variant="body2">{msg.content || msg.message}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
                <div ref={messagesEndRef} />
            </DialogContent>

            <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                            },
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sending}
                        sx={{ minWidth: 50, height: 40, borderRadius: '50%' }}
                    >
                        {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default DirectMessageModal;
