import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    TextField,
    InputAdornment,
    Typography,
    IconButton,
    Chip,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Badge,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import ChatListSkeleton from '../../components/Chat/ChatListSkeleton';
import EmptyState from '../../components/Chat/EmptyState';
import type {
    UserConversation,
    LiveChatFilters,
    ChatStatistics,
} from '../../types/live-chat.types';

interface UserListPanelProps {
    conversations: UserConversation[];
    selectedUserId: number | null;
    onUserSelect: (userId: number) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filters: LiveChatFilters;
    onFilterChange: (filters: Partial<LiveChatFilters>) => void;
    statistics: ChatStatistics;
    loading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    totalConversations: number;
}

/**
 * UserListPanel - Displays list of user conversations for Live Chat
 * 
 * Features:
 * - Search by user name or phone
 * - Filter by unread messages
 * - Infinite scroll
 * - Unread count badges
 * - User info display (name, phone, ward/zone)
 */
const UserListPanel: React.FC<UserListPanelProps> = ({
    conversations,
    selectedUserId,
    onUserSelect,
    searchTerm,
    onSearchChange,
    filters,
    onFilterChange,
    statistics,
    loading,
    hasMore,
    onLoadMore,
    totalConversations,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const listRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

    /**
     * Setup intersection observer for infinite scroll
     */
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];
                if (firstEntry.isIntersecting && hasMore && !loading) {
                    onLoadMore();
                }
            },
            {
                root: listRef.current,
                threshold: 0.1,
            }
        );

        if (loadMoreTriggerRef.current) {
            observerRef.current.observe(loadMoreTriggerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, loading, onLoadMore]);

    /**
     * Format last message time
     */
    const formatMessageTime = (date: Date | string): string => {
        const messageDate = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - messageDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    /**
     * Get user location display
     */
    const getUserLocation = (user: UserConversation['user']): string => {
        const parts: string[] = [];

        // Add City Corporation
        if (user.cityCorporationCode) {
            parts.push(user.cityCorporationCode);
        }

        // Add Zone
        if (user.zone) {
            parts.push(`Zone ${user.zone.name || user.zone.number}`);
        }

        // Add Ward
        if (user.ward) {
            parts.push(`Ward ${user.ward.wardNumber || user.ward.number}`);
        }

        return parts.join(', ') || 'No location';
    };

    /**
     * Handle unread filter toggle
     */
    const handleUnreadFilterToggle = () => {
        onFilterChange({ unreadOnly: !filters.unreadOnly });
    };

    /**
     * Clear all filters
     */
    const handleClearFilters = () => {
        onSearchChange('');
        onFilterChange({
            cityCorporationCode: undefined,
            zoneId: undefined,
            wardId: undefined,
            unreadOnly: false,
        });
    };

    /**
     * Check if any filters are active
     */
    const hasActiveFilters = (): boolean => {
        return !!(
            searchTerm ||
            filters.cityCorporationCode ||
            filters.zoneId ||
            filters.wardId ||
            filters.unreadOnly
        );
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
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Live Chat
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {hasActiveFilters() && (
                            <IconButton size="small" onClick={handleClearFilters} title="Clear filters">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )}
                        {isMobile && (
                            <IconButton
                                size="small"
                                onClick={() => setShowFilters(!showFilters)}
                                color={showFilters ? 'primary' : 'default'}
                            >
                                <FilterIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                {/* Search */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => onSearchChange('')}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Quick Filters */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                        label={`All (${statistics.totalConversations})`}
                        size="small"
                        onClick={() => onFilterChange({ unreadOnly: false })}
                        color={!filters.unreadOnly ? 'primary' : 'default'}
                        variant={!filters.unreadOnly ? 'filled' : 'outlined'}
                    />
                    <Chip
                        label={
                            <Badge badgeContent={statistics.unreadMessages} color="error" max={99}>
                                <span style={{ marginRight: statistics.unreadMessages > 0 ? 16 : 0 }}>
                                    Unread
                                </span>
                            </Badge>
                        }
                        size="small"
                        onClick={handleUnreadFilterToggle}
                        color={filters.unreadOnly ? 'primary' : 'default'}
                        variant={filters.unreadOnly ? 'filled' : 'outlined'}
                    />
                </Box>

                {/* Results count */}
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                    {loading ? 'Loading...' : `${totalConversations} conversation${totalConversations !== 1 ? 's' : ''}`}
                </Typography>
            </Box>

            {/* User List */}
            <Box
                ref={listRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    opacity: loading ? 0.6 : 1,
                    pointerEvents: loading ? 'none' : 'auto',
                    transition: 'opacity 0.2s',
                }}
            >
                {loading && conversations.length === 0 ? (
                    <ChatListSkeleton count={5} />
                ) : conversations.length === 0 ? (
                    <EmptyState
                        type={hasActiveFilters() ? 'no-results' : 'no-chats'}
                        onAction={hasActiveFilters() ? handleClearFilters : undefined}
                        actionLabel="Clear filters"
                    />
                ) : (
                    <>
                        {conversations.map((conversation) => {
                            const isSelected = selectedUserId === conversation.user.id;
                            const hasUnread = conversation.unreadCount > 0;

                            return (
                                <Box
                                    key={conversation.user.id}
                                    onClick={() => onUserSelect(conversation.user.id)}
                                    sx={{
                                        p: 2,
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        cursor: 'pointer',
                                        bgcolor: isSelected ? 'action.selected' : 'transparent',
                                        transition: 'background-color 0.2s',
                                        '&:hover': {
                                            bgcolor: isSelected ? 'action.selected' : 'action.hover',
                                        },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        {/* User Avatar */}
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '50%',
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 600,
                                                fontSize: '1.25rem',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {conversation.user.firstName.charAt(0).toUpperCase()}
                                            {conversation.user.lastName.charAt(0).toUpperCase()}
                                        </Box>

                                        {/* User Info */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontWeight: hasUnread ? 600 : 500,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {conversation.user.firstName} {conversation.user.lastName}
                                                </Typography>
                                                {conversation.lastMessage && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: 'text.secondary',
                                                            flexShrink: 0,
                                                            ml: 1,
                                                        }}
                                                    >
                                                        {formatMessageTime(conversation.lastMessage.createdAt)}
                                                    </Typography>
                                                )}
                                            </Box>

                                            {/* Phone */}
                                            {conversation.user.phone && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: 'text.secondary',
                                                        display: 'block',
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    {conversation.user.phone}
                                                </Typography>
                                            )}

                                            {/* Location */}
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    mb: 0.5,
                                                }}
                                            >
                                                {getUserLocation(conversation.user)}
                                            </Typography>

                                            {/* Last Message */}
                                            {conversation.lastMessage && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: hasUnread ? 'text.primary' : 'text.secondary',
                                                            fontWeight: hasUnread ? 500 : 400,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            flex: 1,
                                                        }}
                                                    >
                                                        {conversation.lastMessage.senderType === 'ADMIN' && 'You: '}
                                                        {conversation.lastMessage.type === 'IMAGE'
                                                            ? '📷 Image'
                                                            : conversation.lastMessage.type === 'VOICE'
                                                                ? '🎤 Voice message'
                                                                : conversation.lastMessage.content}
                                                    </Typography>
                                                    {hasUnread && (
                                                        <Badge
                                                            badgeContent={conversation.unreadCount}
                                                            color="error"
                                                            max={99}
                                                            sx={{ flexShrink: 0 }}
                                                        />
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })}

                        {/* Load More Trigger */}
                        {hasMore && (
                            <Box
                                ref={loadMoreTriggerRef}
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <CircularProgress size={24} />
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};

export default UserListPanel;
