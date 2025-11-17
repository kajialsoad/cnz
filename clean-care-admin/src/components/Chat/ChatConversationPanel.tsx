import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    IconButton,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import type { ChatMessage } from '../../types/chat-service.types';
import type { ComplaintDetails, ComplaintStatus } from '../../types/complaint-service.types';
import { chatService } from '../../services/chatService';
import { complaintService } from '../../services/complaintService';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ComplaintDetailsModal from '../Complaints/ComplaintDetailsModal';
import ErrorDisplay from './ErrorDisplay';
import toast from 'react-hot-toast';

interface ChatConversationPanelProps {
    complaintId: number | null;
    onClose?: () => void; // For mobile view
    onMessagesRead?: () => void; // Callback when messages are marked as read
}

const ChatConversationPanel: React.FC<ChatConversationPanelProps> = ({
    complaintId,
    onClose,
    onMessagesRead,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State management
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [complaintDetails, setComplaintDetails] = useState<ComplaintDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [sending, setSending] = useState<boolean>(false);

    // Modal state
    const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);

    /**
     * Fetch messages for the selected complaint
     */
    const fetchMessages = useCallback(
        async (page: number = 1, append: boolean = false) => {
            if (!complaintId) return;

            try {
                if (page === 1) {
                    setLoading(true);
                } else {
                    setLoadingMore(true);
                }
                setError(null);

                const { messages: fetchedMessages, pagination } =
                    await chatService.getChatMessages(complaintId, page, 50);

                if (append) {
                    // Prepend older messages
                    setMessages((prev) => [...fetchedMessages, ...prev]);
                } else {
                    // Replace with new messages
                    setMessages(fetchedMessages);
                }

                setHasMoreMessages(pagination.hasNextPage);
                setCurrentPage(page);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to load messages';
                setError(errorMessage);
                console.error('Error fetching messages:', err);

                // Show toast notification for network errors
                toast.error('Failed to load messages. Please check your connection.', {
                    icon: '❌',
                    duration: 4000,
                });
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [complaintId]
    );

    /**
     * Fetch complaint details
     */
    const fetchComplaintDetails = useCallback(async () => {
        if (!complaintId) return;

        try {
            const details = await complaintService.getComplaintById(complaintId);
            setComplaintDetails(details);
        } catch (err) {
            console.error('Error fetching complaint details:', err);
        }
    }, [complaintId]);

    /**
     * Mark messages as read
     */
    const markMessagesAsRead = useCallback(async () => {
        if (!complaintId) return;

        try {
            await chatService.markAsRead(complaintId);

            // Update local messages to mark them as read
            setMessages((prev) =>
                prev.map((msg) => ({
                    ...msg,
                    read: true,
                }))
            );

            // Notify parent component
            if (onMessagesRead) {
                onMessagesRead();
            }
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    }, [complaintId, onMessagesRead]);

    /**
     * Load older messages (pagination)
     */
    const loadMoreMessages = useCallback(() => {
        if (!hasMoreMessages || loadingMore) return;
        fetchMessages(currentPage + 1, true);
    }, [hasMoreMessages, loadingMore, currentPage, fetchMessages]);

    /**
     * Handle view details button click
     */
    const handleViewDetails = () => {
        setDetailsModalOpen(true);
    };

    /**
     * Handle status change
     */
    const handleStatusChange = async (newStatus: ComplaintStatus) => {
        if (!complaintId || !complaintDetails) return;

        try {
            await complaintService.updateComplaintStatus(complaintId, {
                status: newStatus,
                note: `Status changed from chat interface`,
            });

            // Update local complaint details
            setComplaintDetails({
                ...complaintDetails,
                status: newStatus,
            });

            toast.success(`Status updated to ${newStatus}`, {
                icon: '✅',
            });
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error('Failed to update status', {
                icon: '❌',
            });
        }
    };

    /**
     * Handle status update from details modal
     */
    const handleStatusUpdateFromModal = (updatedComplaintId: number, newStatus: ComplaintStatus) => {
        if (complaintDetails && updatedComplaintId === complaintDetails.id) {
            setComplaintDetails({
                ...complaintDetails,
                status: newStatus,
            });
        }
    };

    /**
     * Handle send message
     */
    const handleSendMessage = async (message: string, imageUrl?: string) => {
        if (!complaintId) return;

        try {
            setSending(true);

            // Send message via API
            const newMessage = await chatService.sendMessage(complaintId, {
                message,
                imageUrl,
            });

            // Add new message to local state
            setMessages((prev) => [...prev, newMessage]);

            toast.success('Message sent successfully', {
                icon: '✅',
            });
        } catch (err) {
            console.error('Error sending message:', err);
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to send message';
            toast.error(errorMessage, {
                icon: '❌',
            });
            throw err; // Re-throw to let MessageInput handle it
        } finally {
            setSending(false);
        }
    };

    /**
     * Initial data fetch when complaint is selected
     */
    useEffect(() => {
        if (complaintId) {
            setMessages([]);
            setComplaintDetails(null);
            setError(null);
            setCurrentPage(1);
            setHasMoreMessages(true);

            fetchMessages(1);
            fetchComplaintDetails();
            markMessagesAsRead();
        }
    }, [complaintId, fetchMessages, fetchComplaintDetails, markMessagesAsRead]);

    /**
     * Real-time polling for new messages
     */
    useEffect(() => {
        if (!complaintId) return;

        const pollingInterval = setInterval(() => {
            // Silently fetch latest messages
            chatService
                .getChatMessages(complaintId, 1, 50)
                .then(({ messages: latestMessages }) => {
                    setMessages((prev) => {
                        // Check if there are new messages
                        const lastMessageId = prev[prev.length - 1]?.id;
                        const hasNewMessages = latestMessages.some(
                            (msg) => msg.id > (lastMessageId || 0)
                        );

                        if (hasNewMessages) {
                            return latestMessages;
                        }

                        return prev;
                    });
                })
                .catch((err) => {
                    console.error('Error polling messages:', err);
                });
        }, 5000);

        return () => {
            clearInterval(pollingInterval);
        };
    }, [complaintId]);

    // Empty state - no complaint selected
    if (!complaintId) {
        return (
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    p: 3,
                }}
            >
                <Typography variant="body1">
                    Select a chat to start messaging
                </Typography>
            </Box>
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
            {/* Chat Header */}
            {complaintDetails && complaintDetails.user ? (
                <Box sx={{ position: 'relative' }}>
                    {/* Back button for mobile */}
                    {isMobile && onClose && (
                        <IconButton
                            onClick={onClose}
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                zIndex: 1,
                                backgroundColor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': {
                                    backgroundColor: 'background.paper',
                                },
                            }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    )}

                    <ChatHeader
                        complaint={{
                            id: complaintDetails.id,
                            trackingNumber: complaintDetails.trackingNumber || `#${complaintDetails.id}`,
                            title: complaintDetails.title,
                            category: complaintDetails.category,
                            status: complaintDetails.status,
                            createdAt: new Date(complaintDetails.createdAt),
                        }}
                        citizen={{
                            id: complaintDetails.user.id,
                            firstName: complaintDetails.user.firstName,
                            lastName: complaintDetails.user.lastName,
                            phone: complaintDetails.user.phone,
                            email: complaintDetails.user.email,
                            district: complaintDetails.locationDetails?.district || 'N/A',
                            upazila: complaintDetails.locationDetails?.thana || 'N/A',
                            ward: complaintDetails.locationDetails?.ward || 'N/A',
                            address: complaintDetails.locationDetails?.address || '',
                            profilePicture: undefined,
                        }}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                    />
                </Box>
            ) : (
                <Box
                    sx={{
                        p: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'background.paper',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Back button for mobile */}
                        {isMobile && onClose && (
                            <IconButton
                                onClick={onClose}
                                size="small"
                                sx={{ mr: 1 }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        )}

                        {/* Loading state */}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Loading...
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Error Display */}
            {error && !loading ? (
                <ErrorDisplay
                    error={error}
                    onRetry={() => fetchMessages(1, false)}
                    variant="centered"
                />
            ) : (
                /* Message List */
                <MessageList
                    messages={messages}
                    loading={loading}
                    loadingMore={loadingMore}
                    hasMoreMessages={hasMoreMessages}
                    onLoadMore={loadMoreMessages}
                />
            )}

            {/* Message Input Area */}
            <MessageInput
                onSend={handleSendMessage}
                sending={sending}
                disabled={!complaintId || loading}
            />

            {/* Complaint Details Modal */}
            {complaintDetails && (
                <ComplaintDetailsModal
                    complaintId={complaintDetails.id}
                    open={detailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    onStatusUpdate={handleStatusUpdateFromModal}
                />
            )}
        </Box>
    );
};

export default ChatConversationPanel;
