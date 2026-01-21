import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    CircularProgress,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Search as SearchIcon,
} from '@mui/icons-material';
import type {
    ChatConversation,
    ChatFilters,
    ChatStatistics,
} from '../../types/chat-page.types';
import { useDebounce } from '../../hooks/useDebounce';
import ChatListItem from './ChatListItem';
import ChatListSkeleton from './ChatListSkeleton';
import EmptyState from './EmptyState';

interface ChatListPanelProps {
    chats: ChatConversation[];
    selectedChatId: number | null;
    onChatSelect: (chatId: number) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filters: ChatFilters;
    onFilterChange: (filters: Partial<ChatFilters>) => void;
    statistics: ChatStatistics;
    loading: boolean;
    // Infinite scroll props
    hasMore?: boolean;
    onLoadMore?: () => void;
    totalChats?: number;
}

const ChatListPanel: React.FC<ChatListPanelProps> = ({
    chats,
    selectedChatId,
    onChatSelect,
    searchTerm,
    onSearchChange,
    loading,
    hasMore = false,
    onLoadMore,
    totalChats = 0,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Local state for search input (before debounce)
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Refs for infinite scroll
    const listContainerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

    // Debounce search to avoid excessive filtering
    const debouncedSearchTerm = useDebounce(localSearchTerm, 500);

    // Update parent when debounced value changes
    React.useEffect(() => {
        onSearchChange(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearchChange]);

    /**
     * Infinite scroll - Load more when scrolling to bottom
     */
    const handleLoadMore = useCallback(() => {
        if (!loading && !isLoadingMore && hasMore && onLoadMore) {
            setIsLoadingMore(true);
            onLoadMore();
            // Reset loading state after a delay
            setTimeout(() => setIsLoadingMore(false), 1000);
        }
    }, [loading, isLoadingMore, hasMore, onLoadMore]);

    /**
     * Set up Intersection Observer for infinite scroll
     */
    useEffect(() => {
        if (!loadMoreTriggerRef.current) return;

        // Cleanup previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        // Create new observer
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];
                if (firstEntry.isIntersecting) {
                    handleLoadMore();
                }
            },
            {
                root: listContainerRef.current,
                rootMargin: '100px', // Load more 100px before reaching bottom
                threshold: 0.1,
            }
        );

        // Observe the trigger element
        observerRef.current.observe(loadMoreTriggerRef.current);

        // Cleanup on unmount
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleLoadMore]);

    /**
     * Handle local search input change
     */
    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearchTerm(event.target.value);
    };

    const handleClearSearch = () => {
        setLocalSearchTerm('');
        onSearchChange('');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Header with Statistics */}
            <Box
                sx={{
                    p: { xs: 1.5, sm: 2, md: 2 },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        mb: 1.5,
                        fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.25rem' }
                    }}
                >
                    Inbox
                </Typography>

                {/* Search Input */}
                <TextField
                    fullWidth
                    placeholder={isMobile ? 'Search...' : 'Search conversations...'}
                    value={localSearchTerm}
                    onChange={handleSearchInputChange}
                    size="small"
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.default',
                        },
                    }}
                />
            </Box>

            {/* Chat List Area */}
            <Box
                ref={listContainerRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                {/* Loading State - Initial Load */}
                {loading && chats.length === 0 && <ChatListSkeleton count={5} />}

                {/* Empty State - No Results */}
                {!loading && chats.length === 0 && localSearchTerm !== '' && (
                    <EmptyState
                        type="no-results"
                        onAction={handleClearSearch}
                        actionLabel="Clear Search"
                    />
                )}

                {/* Empty State - No Chats */}
                {!loading && chats.length === 0 && localSearchTerm === '' && (
                    <EmptyState type="no-chats" />
                )}

                {/* Chat List Items */}
                {chats.length > 0 && (
                    <Box>
                        {chats.map((chat) => (
                            <ChatListItem
                                key={chat.complaintId || `citizen-${chat.citizen.id}`}
                                chat={chat}
                                isSelected={selectedChatId === chat.complaintId}
                                onClick={() => onChatSelect(chat.complaintId)}
                            />
                        ))}

                        {/* Infinite Scroll Trigger */}
                        {hasMore && (
                            <Box
                                ref={loadMoreTriggerRef}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    p: 2,
                                    minHeight: 60,
                                }}
                            >
                                {(loading || isLoadingMore) && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={20} />
                                        <Typography variant="body2" color="text.secondary">
                                            Loading more...
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* End of List Indicator */}
                        {!hasMore && chats.length > 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    p: 2,
                                    color: 'text.secondary',
                                }}
                            >
                                <Typography variant="body2">
                                    {totalChats > 0
                                        ? `All ${totalChats} conversations loaded`
                                        : 'No more conversations'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ChatListPanel;
