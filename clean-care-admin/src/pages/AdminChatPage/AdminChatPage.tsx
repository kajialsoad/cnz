import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../../components/common/Layout/MainLayout';
import ChatListPanel from '../../components/Chat/ChatListPanel';
import ChatConversationPanel from '../../components/Chat/ChatConversationPanel';
import ErrorDisplay from '../../components/Chat/ErrorDisplay';
import { chatService } from '../../services/chatService';
import { browserNotifications } from '../../utils/browserNotifications';
import type {
    ChatConversation,
    ChatFilters,
    ChatStatistics,
} from '../../types/chat-page.types';

const AdminChatPage: React.FC = () => {
    const { complaintId } = useParams<{ complaintId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

    // State management for chat list
    const [chatList, setChatList] = useState<ChatConversation[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for search and filters
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filters, setFilters] = useState<ChatFilters>({
        district: undefined,
        upazila: undefined,
        ward: undefined,
        zone: undefined,
        cityCorporationCode: undefined,
        thanaId: undefined,
        status: undefined,
        unreadOnly: false,
        page: 1,
        limit: 20,
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalChats, setTotalChats] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(false);

    // State for statistics
    const [statistics, setStatistics] = useState<ChatStatistics>({
        totalChats: 0,
        unreadCount: 0,
        byDistrict: [],
        byUpazila: [],
        byWard: [],
        byZone: [],
        byStatus: [],
    });

    // Mobile view state - show list or conversation
    const [showConversation, setShowConversation] = useState<boolean>(false);

    // Track previous chat list for detecting new messages
    const previousChatListRef = useRef<ChatConversation[]>([]);
    const isInitialLoadRef = useRef<boolean>(true);

    /**
     * Request browser notification permission on mount
     */
    useEffect(() => {
        // Request permission if supported and not already granted/denied
        if (
            browserNotifications.isSupported() &&
            browserNotifications.getPermissionStatus() === 'default'
        ) {
            // Request permission after a short delay to avoid interrupting initial page load
            const timer = setTimeout(() => {
                browserNotifications.requestPermission().then((granted) => {
                    if (granted) {
                        console.log('Browser notification permission granted');
                    }
                });
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, []);

    /**
     * Show toast notification for new messages
     */
    const showNewMessageNotification = useCallback((chat: ChatConversation) => {
        const senderName = chat.citizen.firstName + ' ' + chat.citizen.lastName;
        const messagePreview = chat.lastMessage.text.length > 50
            ? chat.lastMessage.text.substring(0, 50) + '...'
            : chat.lastMessage.text;

        const handleNotificationClick = () => {
            navigate(`/chats/${chat.complaintId}`);
            setSelectedChatId(chat.complaintId);
            if (isMobile) {
                setShowConversation(true);
            }
        };

        // Show toast notification
        toast(
            (t) => (
                <Box
                    onClick={() => {
                        toast.dismiss(t.id);
                        handleNotificationClick();
                    }}
                    sx={{
                        cursor: 'pointer',
                        '&:hover': {
                            opacity: 0.9,
                        },
                    }}
                >
                    <Box sx={{ fontWeight: 600, mb: 0.5, color: '#3FA564' }}>
                        New message from {senderName}
                    </Box>
                    <Box sx={{ fontSize: '0.875rem', color: '#666' }}>
                        {messagePreview}
                    </Box>
                    <Box sx={{ fontSize: '0.75rem', color: '#999', mt: 0.5 }}>
                        Complaint #{chat.trackingNumber}
                    </Box>
                </Box>
            ),
            {
                duration: 6000,
                icon: '💬',
                style: {
                    background: '#fff',
                    color: '#333',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderLeft: '4px solid #3FA564',
                    padding: '16px',
                    maxWidth: '400px',
                },
            }
        );

        // Show browser notification if permission granted and window not focused
        if (browserNotifications.hasPermission() && !document.hasFocus()) {
            browserNotifications.showNewMessageNotification(
                senderName,
                `${messagePreview}\n\nComplaint #${chat.trackingNumber}`,
                chat.complaintId,
                chat.trackingNumber,
                handleNotificationClick
            );
        }
    }, [navigate, isMobile]);

    /**
     * Detect new messages by comparing with previous chat list
     */
    const detectNewMessages = useCallback((newChats: ChatConversation[]) => {
        // Skip on initial load
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            previousChatListRef.current = newChats;
            return;
        }

        const previousChats = previousChatListRef.current;

        // Check each chat for new messages
        newChats.forEach((newChat) => {
            const previousChat = previousChats.find(
                (chat) => chat.complaintId === newChat.complaintId
            );

            if (previousChat) {
                // Check if last message is different (new message arrived)
                const hasNewMessage =
                    newChat.lastMessage.id !== previousChat.lastMessage.id &&
                    newChat.lastMessage.senderType === 'CITIZEN' &&
                    newChat.complaintId !== selectedChatId; // Don't show notification for currently open chat

                if (hasNewMessage) {
                    showNewMessageNotification(newChat);
                }
            } else {
                // New chat conversation started
                if (newChat.lastMessage.senderType === 'CITIZEN') {
                    showNewMessageNotification(newChat);
                }
            }
        });

        // Update previous chat list
        previousChatListRef.current = newChats;
    }, [selectedChatId, showNewMessageNotification]);

    /**
     * Fetch chat list with current filters
     */
    const fetchChatList = useCallback(async (showErrorToast: boolean = false, pageNum?: number) => {
        try {
            setLoading(true);
            setError(null);

            const page = pageNum || currentPage;

            const filterParams: ChatFilters = {
                ...filters,
                search: searchTerm || undefined,
                page,
                limit: 20,
            };

            const response = await chatService.getChatConversationsWithPagination(filterParams);

            // Detect new messages and show notifications (only on first page)
            if (page === 1) {
                detectNewMessages(response.chats);
            }

            setChatList(response.chats);

            // Update pagination state
            if (response.pagination) {
                setCurrentPage(response.pagination.page);
                setTotalPages(response.pagination.totalPages);
                setTotalChats(response.pagination.total);
                setHasMore(response.pagination.hasNextPage);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load chats';
            setError(errorMessage);
            console.error('Error fetching chat list:', err);

            // Show toast notification for network errors
            if (showErrorToast) {
                toast.error('Failed to load chats. Please check your connection.', {
                    icon: '❌',
                    duration: 4000,
                });
            }
        } finally {
            setLoading(false);
        }
    }, [filters, searchTerm, detectNewMessages, currentPage]);

    /**
     * Fetch chat statistics
     */
    const fetchStatistics = useCallback(async () => {
        try {
            const stats = await chatService.getChatStatistics();
            setStatistics(stats);
        } catch (err) {
            console.error('Error fetching statistics:', err);
            // Don't show error for statistics - it's not critical
        }
    }, []);

    /**
     * Initial data fetch on component mount
     */
    useEffect(() => {
        fetchChatList(true); // Show error toast on initial load
        fetchStatistics();
    }, [fetchChatList, fetchStatistics]);

    /**
     * Handle deep linking - select chat from URL parameter
     */
    useEffect(() => {
        if (complaintId) {
            const chatId = parseInt(complaintId, 10);
            if (!isNaN(chatId)) {
                setSelectedChatId(chatId);
                if (isMobile) {
                    setShowConversation(true);
                }
            }
        }
    }, [complaintId, isMobile]);

    /**
     * Real-time polling for chat list updates (every 5 seconds)
     */
    useEffect(() => {
        const pollingInterval = setInterval(() => {
            // Silent polling - don't show errors
            fetchChatList(false);
            fetchStatistics();
        }, 5000);

        // Cleanup on unmount
        return () => {
            clearInterval(pollingInterval);
        };
    }, [fetchChatList, fetchStatistics]);

    /**
     * Handle chat selection
     */
    const handleChatSelect = (chatId: number) => {
        setSelectedChatId(chatId);
        if (isMobile) {
            setShowConversation(true);
        }
    };

    /**
     * Handle back to list (mobile only)
     */
    const handleBackToList = () => {
        setShowConversation(false);
        setSelectedChatId(null);
    };

    /**
     * Handle search change
     */
    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    };

    /**
     * Handle filter change
     */
    const handleFilterChange = (newFilters: Partial<ChatFilters>) => {
        setFilters((prev) => ({
            ...prev,
            ...newFilters,
        }));
        // Reset to page 1 when filters change
        setCurrentPage(1);
    };

    /**
     * Handle page change
     */
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchChatList(false, page);
        // Scroll to top of chat list
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /**
     * Handle next page
     */
    const handleNextPage = () => {
        if (hasMore) {
            handlePageChange(currentPage + 1);
        }
    };

    /**
     * Handle previous page
     */
    const handlePrevPage = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    /**
     * Calculate column widths based on screen size
     */
    const getColumnWidths = () => {
        if (isMobile) {
            return { list: '100%', conversation: '100%' };
        }
        if (isTablet) {
            return { list: '35%', conversation: '65%' };
        }
        return { list: '30%', conversation: '70%' };
    };

    const columnWidths = getColumnWidths();

    return (
        <MainLayout title="Messages">
            <Box
                sx={{
                    display: 'flex',
                    height: 'calc(100vh - 140px)', // Account for header and padding
                    gap: 2,
                    overflow: 'hidden',
                }}
            >
                {/* Chat List Panel */}
                {(!isMobile || !showConversation) && (
                    <Box
                        sx={{
                            width: columnWidths.list,
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: 1,
                            overflow: 'hidden',
                        }}
                    >
                        {error && !loading ? (
                            <ErrorDisplay
                                error={error}
                                onRetry={() => fetchChatList(true)}
                                variant="centered"
                            />
                        ) : (
                            <ChatListPanel
                                chats={chatList}
                                selectedChatId={selectedChatId}
                                onChatSelect={handleChatSelect}
                                searchTerm={searchTerm}
                                onSearchChange={handleSearchChange}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                statistics={statistics}
                                loading={loading}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalChats={totalChats}
                                onPageChange={handlePageChange}
                                onNextPage={handleNextPage}
                                onPrevPage={handlePrevPage}
                            />
                        )}
                    </Box>
                )}

                {/* Chat Conversation Panel */}
                {(!isMobile || showConversation) && (
                    <Box
                        sx={{
                            width: columnWidths.conversation,
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: 1,
                            overflow: 'hidden',
                        }}
                    >
                        <ChatConversationPanel
                            complaintId={selectedChatId}
                            onClose={isMobile ? handleBackToList : undefined}
                            onMessagesRead={() => {
                                // Refresh chat list to update unread counts
                                fetchChatList(false);
                                fetchStatistics();
                            }}
                        />
                    </Box>
                )}
            </Box>
        </MainLayout>
    );
};

export default AdminChatPage;
