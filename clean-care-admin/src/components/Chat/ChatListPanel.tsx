import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Button,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Search as SearchIcon,
    NavigateNext as NavigateNextIcon,
    NavigateBefore as NavigateBeforeIcon,
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
    // Simple pagination props
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    totalChats?: number;
}

const ChatListPanel: React.FC<ChatListPanelProps> = ({
    chats,
    selectedChatId,
    onChatSelect,
    searchTerm,
    onSearchChange,
    loading,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    totalChats = 0,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Local state for search input (before debounce)
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

    // Debounce search to avoid excessive filtering
    const debouncedSearchTerm = useDebounce(localSearchTerm, 500);

    // Update parent when debounced value changes
    React.useEffect(() => {
        onSearchChange(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearchChange]);

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

    /**
     * Handle pagination
     */
    const handlePreviousPage = () => {
        if (onPageChange && currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (onPageChange && currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
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
                    </Box>
                )}
            </Box>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <Box
                    sx={{
                        p: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<NavigateBeforeIcon />}
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1 || loading}
                        sx={{ minWidth: 100 }}
                    >
                        Previous
                    </Button>

                    <Typography variant="body2" color="text.secondary">
                        Page {currentPage} of {totalPages}
                        {totalChats > 0 && ` (${totalChats} total)`}
                    </Typography>

                    <Button
                        variant="outlined"
                        size="small"
                        endIcon={<NavigateNextIcon />}
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || loading}
                        sx={{ minWidth: 100 }}
                    >
                        Next
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default ChatListPanel;
