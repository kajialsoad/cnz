import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Avatar,
    Chip,
    useTheme,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import MessageList from '../../components/Chat/MessageList';
import MessageInput from '../../components/Chat/MessageInput';
import VoiceMessagePlayer from '../../components/Chat/VoiceMessagePlayer';
import EmptyState from '../../components/Chat/EmptyState';
import ErrorDisplay from '../../components/Chat/ErrorDisplay';
import { liveChatService } from '../../services/liveChatService';
import toast from 'react-hot-toast';
import type { LiveChatMessage, UserInfo } from '../../types/live-chat.types';

interface LiveChatConversationPanelProps {
    userId: number | null;
    userInfo?: UserInfo | null;
    onClose?: () => void;
    onMessagesRead?: () => void;
}

/**
 * LiveChatConversationPanel - Displays conversation with a specific user
 * 
 * Features:
 * - Display user info (name, phone, ward/zone)
 * - Message list with auto-scroll
 * - Send text and image messages
 * - Real-time updates via polling
 * - Mark messages as read
 */
const LiveChatConversationPanel: React.FC<LiveChatConversationPanelProps> = ({
    userId,
    userInfo: userInfoProp,
    onClose,
    onMessagesRead,
}) => {
    const theme = useTheme();
    const [messages, setMessages] = useState<LiveChatMessage[]>([]);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(userInfoProp || null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const previousUserIdRef = useRef<number | null>(null);
    const hasMarkedAsReadRef = useRef<boolean>(false);

    /**
     * Scroll to bottom of messages
     */
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    /**
     * Fetch messages for the selected user
     */
    const fetchMessages = useCallback(
        async (showErrorToast: boolean = false, pageNum: number = 1) => {
            if (!userId) return;

            try {
                setLoading(true);
                setError(null);

                const response = await liveChatService.getUserMessages(userId, pageNum);

                // If it's a new user, replace messages; otherwise append for pagination
                if (pageNum === 1) {
                    setMessages(response.messages);
                    setCurrentPage(1);

                    // Extract user info from first message
                    if (response.messages.length > 0) {
                        const firstMessage = response.messages[0];
                        const user = firstMessage.senderId === userId
                            ? firstMessage.sender
                            : firstMessage.receiver;

                        if (user) {
                            // Fetch complete user info from conversations list
                            try {
                                const conversationsResponse = await liveChatService.getConversations({ search: user.phone || '' });
                                const userConversation = conversationsResponse.conversations.find(
                                    (conv) => conv.user.id === userId
                                );

                                if (userConversation) {
                                    setUserInfo(userConversation.user);
                                } else {
                                    // Fallback to basic info from message
                                    setUserInfo({
                                        id: user.id,
                                        firstName: user.firstName,
                                        lastName: user.lastName,
                                        avatar: user.avatar,
                                        phone: null,
                                        ward: null,
                                        zone: null,
                                    });
                                }
                            } catch (err) {
                                // Fallback to basic info from message
                                setUserInfo({
                                    id: user.id,
                                    firstName: user.firstName,
                                    lastName: user.lastName,
                                    avatar: user.avatar,
                                    phone: null,
                                    ward: null,
                                    zone: null,
                                });
                            }
                        }
                    }
                } else {
                    // Append older messages for pagination
                    setMessages((prev) => [...response.messages, ...prev]);
                    setCurrentPage(pageNum);
                }

                setHasMore(response.hasMore);

                // Extract user info from first message ONLY if not provided as prop
                // This prevents slow fetching when userInfo is already available
                if (pageNum === 1 && response.messages.length > 0 && !userInfoProp) {
                    const firstMessage = response.messages[0];
                    const user = firstMessage.senderId === userId
                        ? firstMessage.sender
                        : firstMessage.receiver;

                    if (user) {
                        // Use basic info from message - no slow fetch needed
                        setUserInfo({
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            avatar: user.avatar,
                            phone: null,
                            ward: null,
                            zone: null,
                            cityCorporationCode: null,
                        });
                    }
                }

                // Mark messages as read (only once per user)
                if (pageNum === 1 && !hasMarkedAsReadRef.current) {
                    await liveChatService.markAsRead(userId);
                    hasMarkedAsReadRef.current = true;
                    if (onMessagesRead) {
                        onMessagesRead();
                    }
                }

                // Scroll to bottom on initial load
                if (pageNum === 1) {
                    setTimeout(scrollToBottom, 100);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
                setError(errorMessage);
                console.error('Error fetching messages:', err);

                if (showErrorToast) {
                    toast.error('Failed to load messages. Please try again.', {
                        icon: '❌',
                        duration: 4000,
                    });
                }
            } finally {
                setLoading(false);
            }
        },
        [userId, onMessagesRead, scrollToBottom]
    );

    /**
     * Load more messages (pagination)
     */
    const handleLoadMore = useCallback(() => {
        if (hasMore && !loading && userId) {
            const nextPage = currentPage + 1;
            fetchMessages(false, nextPage);
        }
    }, [hasMore, loading, userId, currentPage, fetchMessages]);

    /**
     * Send a message
     */
    const handleSendMessage = useCallback(
        async (content: string, imageFile?: File) => {
            if (!userId) return;

            // Validate: must have either text content or image file
            const trimmedContent = content.trim();
            if (!trimmedContent && !imageFile) {
                toast.error('Please enter a message or attach an image', {
                    icon: '⚠️',
                    duration: 3000,
                });
                return;
            }

            try {
                setSending(true);

                // If there's an image but no text, use a default message
                const messageContent = trimmedContent || (imageFile ? 'Image' : '');

                // Validate that we have content to send
                if (!messageContent && !imageFile) {
                    toast.error('Please enter a message', {
                        icon: '⚠️',
                        duration: 3000,
                    });
                    setSending(false);
                    return;
                }

                const newMessage = await liveChatService.sendMessage(userId, messageContent, imageFile);

                // Add new message to the list
                setMessages((prev) => [...prev, newMessage]);

                // Scroll to bottom
                setTimeout(scrollToBottom, 100);

                toast.success('Message sent', {
                    icon: '✅',
                    duration: 2000,
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
                console.error('Error sending message:', err);

                toast.error(errorMessage, {
                    icon: '❌',
                    duration: 4000,
                });
            } finally {
                setSending(false);
            }
        },
        [userId, scrollToBottom]
    );

    /**
     * Update userInfo when prop changes
     */
    useEffect(() => {
        if (userInfoProp) {
            setUserInfo(userInfoProp);
        }
    }, [userInfoProp]);

    /**
     * Initial fetch when userId changes
     */
    useEffect(() => {
        if (userId && userId !== previousUserIdRef.current) {
            previousUserIdRef.current = userId;
            hasMarkedAsReadRef.current = false;
            setMessages([]);
            if (!userInfoProp) {
                setUserInfo(null);
            }
            setCurrentPage(1);
            fetchMessages(true);
        }
    }, [userId, fetchMessages]);

    /**
     * Real-time polling for new messages (every 5 seconds)
     */
    useEffect(() => {
        if (!userId) return;

        const pollingInterval = setInterval(() => {
            // Silent polling - don't show errors
            fetchMessages(false, 1);
        }, 5000);

        return () => {
            clearInterval(pollingInterval);
        };
    }, [userId, fetchMessages]);

    /**
     * Render empty state when no user is selected
     */
    if (!userId) {
        return (
            <EmptyState
                type="no-messages"
            />
        );
    }

    /**
     * Render error state
     */
    if (error && !loading) {
        return (
            <ErrorDisplay
                error={error}
                onRetry={() => fetchMessages(true)}
                variant="centered"
            />
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                {onClose && (
                    <IconButton onClick={onClose} size="small">
                        <ArrowBackIcon />
                    </IconButton>
                )}

                {userInfo && (
                    <>
                        <Avatar
                            sx={{
                                width: 40,
                                height: 40,
                                bgcolor: 'primary.main',
                            }}
                        >
                            {userInfo.firstName.charAt(0).toUpperCase()}
                            {userInfo.lastName.charAt(0).toUpperCase()}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {userInfo.firstName} {userInfo.lastName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                                {/* User ID */}
                                <Chip
                                    label={`ID: ${userInfo.id}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem' }}
                                />
                                {/* Phone Number */}
                                {userInfo.phone && (
                                    <Chip
                                        icon={<PhoneIcon />}
                                        label={userInfo.phone}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                                {/* Location (Ward/Zone) */}
                                {(userInfo.ward || userInfo.zone || userInfo.cityCorporationCode) && (
                                    <Chip
                                        icon={<LocationIcon />}
                                        label={
                                            [
                                                userInfo.cityCorporationCode,
                                                userInfo.zone ? `Zone ${userInfo.zone.name || userInfo.zone.number}` : null,
                                                userInfo.ward ? `Ward ${userInfo.ward.wardNumber || userInfo.ward.number}` : null,
                                            ]
                                                .filter(Boolean)
                                                .join(', ')
                                        }
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        </Box>
                    </>
                )}
            </Box>

            {/* Messages */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    bgcolor: '#f5f5f5',
                    p: 2,
                }}
            >
                {loading && messages.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Typography>Loading messages...</Typography>
                    </Box>
                ) : messages.length === 0 ? (
                    <EmptyState type="no-messages" />
                ) : (
                    <>
                        {messages.map((message) => (
                            <Box
                                key={message.id}
                                sx={{
                                    display: 'flex',
                                    justifyContent: message.senderType === 'ADMIN' ? 'flex-end' : 'flex-start',
                                    mb: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        maxWidth: '70%',
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: message.senderType === 'ADMIN' ? 'primary.main' : 'white',
                                        color: message.senderType === 'ADMIN' ? 'white' : 'text.primary',
                                        boxShadow: 1,
                                    }}
                                >
                                    {/* Image Display */}
                                    {message.type === 'IMAGE' && message.fileUrl && (
                                        <Box
                                            component="img"
                                            src={message.fileUrl}
                                            alt="Message attachment"
                                            sx={{
                                                maxWidth: '100%',
                                                borderRadius: 1,
                                                mb: message.content ? 1 : 0,
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => window.open(message.fileUrl, '_blank')}
                                        />
                                    )}

                                    {/* Voice Message Display */}
                                    {message.type === 'VOICE' && message.voiceUrl && (
                                        <Box
                                            sx={{
                                                mt: message.content ? 1 : 0,
                                                mb: message.content ? 1 : 0,
                                            }}
                                        >
                                            <VoiceMessagePlayer
                                                voiceUrl={message.voiceUrl}
                                                isAdmin={message.senderType === 'ADMIN'}
                                            />
                                        </Box>
                                    )}

                                    {/* Text Content */}
                                    {message.content && (
                                        <Typography variant="body2">{message.content}</Typography>
                                    )}
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            mt: 0.5,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {new Date(message.createdAt).toLocaleTimeString()}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </Box>

            {/* Message Input */}
            <Box
                sx={{
                    borderTop: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                }}
            >
                <MessageInput
                    onSend={async (content: string, imageUrl?: string) => {
                        await handleSendMessage(content);
                    }}
                    onSendWithFile={async (content: string, imageFile: File) => {
                        await handleSendMessage(content, imageFile);
                    }}
                    sending={sending}
                    disabled={loading}
                />
            </Box>
        </Box>
    );
};

export default LiveChatConversationPanel;
