import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../../components/common/Layout/MainLayout';
import ChatFilterPanel from '../../components/Chat/ChatFilterPanel';
import ErrorDisplay from '../../components/Chat/ErrorDisplay';
import { liveChatService } from '../../services/liveChatService';
import { browserNotifications } from '../../utils/browserNotifications';
import UserListPanel from './UserListPanel';
import LiveChatConversationPanel from './LiveChatConversationPanel';
import type {
    UserConversation,
    LiveChatFilters,
    ChatStatistics,
} from '../../types/live-chat.types';

/**
 * LiveChatPage - Dedicated page for live chat with users
 * 
 * This page displays all live chat conversations where users are asking general questions
 * (not tied to specific complaints). It's separate from Complaint Chats.
 * 
 * Features:
 * - Filter by City Corporation, Zone, Ward
 * - Search by user name, phone, or message content
 * - Real-time message updates via polling
 * - Unread message notifications
 * - Responsive design (mobile, tablet, desktop)
 */
const LiveChatPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

    // State management for conversation list
    const [conversationList, setConversationList] = useState<UserConversation[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for search and filters
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filters, setFilters] = useState<LiveChatFilters>({
        cityCorporationCode: undefined,
        zoneId: undefined,
        wardId: undefined,
        unreadOnly: false,
        page: 1,
        limit: 20,
    });

    // Infinite scroll state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [totalConversations, setTotalConversations] = useState<number>(0);

    // State for statistics
    const [statistics, setStatistics] = useState<ChatStatistics>({
        totalConversations: 0,
        unreadMessages: 0,
        todayMessages: 0,
    });

    // Mobile view state - show list or conversation
    const [showConversation, setShowConversation] = useState<boolean>(false);

    // Track previous conversation list for detecting new messages
    const previousConversationListRef = useRef<UserConversation[]>([]);
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
    const showNewMessageNotification = useCallback((conversation: UserConversation) => {
        const senderName = conversation.user.firstName + ' ' + conversation.user.lastName;
        const messagePreview = conversation.lastMessage?.content
            ? conversation.lastMessage.content.length > 50
                ? conversation.lastMessage.content.substring(0, 50) + '...'
                : conversation.lastMessage.content
            : 'New message';

        const handleNotificationClick = () => {
            navigate(`/live-chat/${conversation.user.id}`);
            setSelectedUserId(conversation.user.id);
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
                    {conversation.user.phone && (
                        <Box sx={{ fontSize: '0.75rem', color: '#999', mt: 0.5 }}>
                            {conversation.user.phone}
                        </Box>
                    )}
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
                messagePreview,
                conversation.user.id,
                conversation.user.phone || '',
                handleNotificationClick
            );
        }
    }, [navigate, isMobile]);

    /**
     * Detect new messages by comparing with previous conversation list
     */
    const detectNewMessages = useCallback((newConversations: UserConversation[]) => {
        // Skip on initial load
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            previousConversationListRef.current = newConversations;
            return;
        }

        const previousConversations = previousConversationListRef.current;

        // Check each conversation for new messages
        newConversations.forEach((newConv) => {
            const previousConv = previousConversations.find(
                (conv) => conv.user.id === newConv.user.id
            );

            if (previousConv) {
                // Check if last message is different (new message arrived)
                const hasNewMessage =
                    newConv.lastMessage &&
                    previousConv.lastMessage &&
                    newConv.lastMessage.id !== previousConv.lastMessage.id &&
                    newConv.lastMessage.senderType === 'CITIZEN' &&
                    newConv.user.id !== selectedUserId; // Don't show notification for currently open chat

                if (hasNewMessage) {
                    showNewMessageNotification(newConv);
                }
            } else {
                // New conversation started
                if (newConv.lastMessage && newConv.lastMessage.senderType === 'CITIZEN') {
                    showNewMessageNotification(newConv);
                }
            }
        });

        // Update previous conversation list
        previousConversationListRef.current = newConversations;
    }, [selectedUserId, showNewMessageNotification]);

    /**
     * Fetch conversation list with current filters
     */
    const fetchConversationList = useCallback(
        async (showErrorToast: boolean = false, pageNum?: number, append: boolean = false) => {
            try {
                if (!append) {
                    setLoading(true);
                }
                setError(null);

                const page = pageNum || 1;

                const filterParams: LiveChatFilters = {
                    ...filters,
                    search: searchTerm || undefined,
                    page,
                    limit: 20,
                };

                const response = await liveChatService.getConversations(filterParams);

                // Detect new messages and show notifications (only on first page)
                if (page === 1 && !append) {
                    detectNewMessages(response.conversations);
                }

                // Append or replace conversation list
                if (append) {
                    setConversationList((prev) => [...prev, ...response.conversations]);
                } else {
                    setConversationList(response.conversations);
                }

                // Update pagination state
                setCurrentPage(page);
                setTotalConversations(response.total);
                setHasMore(response.hasMore);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
                setError(errorMessage);
                console.error('Error fetching conversation list:', err);

                // Show toast notification for network errors
                if (showErrorToast) {
                    toast.error('Failed to load conversations. Please check your connection.', {
                        icon: '❌',
                        duration: 4000,
                    });
                }
            } finally {
                setLoading(false);
            }
        },
        [filters, searchTerm, detectNewMessages]
    );

    /**
     * Load more conversations (infinite scroll)
     */
    const handleLoadMore = useCallback(() => {
        if (hasMore && !loading) {
            const nextPage = currentPage + 1;
            fetchConversationList(false, nextPage, true); // append = true
        }
    }, [hasMore, loading, currentPage, fetchConversationList]);

    /**
     * Fetch chat statistics
     */
    const fetchStatistics = useCallback(async () => {
        try {
            const stats = await liveChatService.getStatistics();
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
        fetchConversationList(true); // Show error toast on initial load
        fetchStatistics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    /**
     * Fetch when filters or search changes
     */
    useEffect(() => {
        // Skip initial mount (already fetched above)
        if (isInitialLoadRef.current) {
            return;
        }

        // Reset to page 1 when filters change
        setCurrentPage(1);
        setConversationList([]);

        // Debounce search to avoid too many requests
        const timeoutId = setTimeout(() => {
            fetchConversationList(false);
        }, 500);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, searchTerm]); // Fetch when filters or search changes

    /**
     * Handle deep linking - select user from URL parameter
     */
    useEffect(() => {
        if (userId) {
            const userIdNum = parseInt(userId, 10);
            if (!isNaN(userIdNum)) {
                setSelectedUserId(userIdNum);
                if (isMobile) {
                    setShowConversation(true);
                }
            }
        }
    }, [userId, isMobile]);

    /**
     * Real-time polling for conversation list updates (every 10 seconds)
     */
    useEffect(() => {
        const pollingInterval = setInterval(() => {
            // Silent polling - don't show errors
            fetchConversationList(false);
            fetchStatistics();
        }, 10000); // 10 seconds to reduce load

        // Cleanup on unmount
        return () => {
            clearInterval(pollingInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only set up polling once on mount

    /**
     * Handle user selection
     */
    const handleUserSelect = (userId: number) => {
        setSelectedUserId(userId);
        if (isMobile) {
            setShowConversation(true);
        }
    };

    /**
     * Handle back to list (mobile only)
     */
    const handleBackToList = () => {
        setShowConversation(false);
        setSelectedUserId(null);
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
    const handleFilterChange = (newFilters: Partial<LiveChatFilters>) => {
        setFilters((prev) => ({
            ...prev,
            ...newFilters,
        }));
    };

    /**
     * Calculate column widths based on screen size
     */
    const getColumnWidths = () => {
        if (isMobile) {
            return { filter: '0%', list: '100%', conversation: '100%' };
        }
        if (isTablet) {
            return { filter: '0%', list: '40%', conversation: '60%' };
        }
        return { filter: '20%', list: '30%', conversation: '50%' };
    };

    const columnWidths = getColumnWidths();

    return (
        <MainLayout title="Live Chat">
            <Box
                sx={{
                    display: 'flex',
                    height: 'calc(100vh - 140px)', // Account for header and padding
                    gap: 2,
                    overflow: 'hidden',
                }}
            >
                {/* Filter Panel - Left Side */}
                {!isMobile && !isTablet && (
                    <Box
                        sx={{
                            width: columnWidths.filter,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <ChatFilterPanel
                            filters={{
                                cityCorporationCode: filters.cityCorporationCode,
                                zone: filters.zoneId?.toString() || undefined,
                                ward: filters.wardId?.toString() || undefined,
                                unreadOnly: filters.unreadOnly,
                            }}
                            onFilterChange={(newFilters) => {
                                const converted: Partial<LiveChatFilters> = {
                                    cityCorporationCode: newFilters.cityCorporationCode,
                                    unreadOnly: newFilters.unreadOnly,
                                };

                                // Convert zone string to zoneId number
                                if (newFilters.zone !== undefined) {
                                    converted.zoneId = newFilters.zone ? parseInt(newFilters.zone) : undefined;
                                }

                                // Convert ward string to wardId number
                                if (newFilters.ward !== undefined) {
                                    converted.wardId = newFilters.ward ? parseInt(newFilters.ward) : undefined;
                                }

                                handleFilterChange(converted);
                            }}
                            statistics={{
                                totalChats: statistics.totalConversations,
                                unreadCount: statistics.unreadMessages,
                                byDistrict: [],
                                byUpazila: [],
                                byWard: [],
                                byZone: [],
                                byStatus: [],
                            }}
                            showStatusFilter={false}
                        />
                    </Box>
                )}

                {/* User List Panel - Middle */}
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
                                onRetry={() => fetchConversationList(true)}
                                variant="centered"
                            />
                        ) : (
                            <UserListPanel
                                conversations={conversationList}
                                selectedUserId={selectedUserId}
                                onUserSelect={handleUserSelect}
                                searchTerm={searchTerm}
                                onSearchChange={handleSearchChange}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                statistics={statistics}
                                loading={loading}
                                hasMore={hasMore}
                                onLoadMore={handleLoadMore}
                                totalConversations={totalConversations}
                            />
                        )}
                    </Box>
                )}

                {/* Live Chat Conversation Panel - Right Side */}
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
                        <LiveChatConversationPanel
                            userId={selectedUserId}
                            userInfo={conversationList.find(conv => conv.user.id === selectedUserId)?.user}
                            onClose={isMobile ? handleBackToList : undefined}
                            onMessagesRead={() => {
                                // Refresh conversation list to update unread counts
                                fetchConversationList(false);
                                fetchStatistics();
                            }}
                        />
                    </Box>
                )}
            </Box>
        </MainLayout>
    );
};

export default LiveChatPage;


