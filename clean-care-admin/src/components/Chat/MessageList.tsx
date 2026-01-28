import React, { useRef, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { List, useDynamicRowHeight } from 'react-window';
import type { ChatMessage } from '../../types/chat-service.types';
import MessageBubble from './MessageBubble';
import EmptyState from './EmptyState';

interface MessageListProps {
    messages: ChatMessage[];
    loading: boolean;
    loadingMore?: boolean;
    hasMoreMessages?: boolean;
    onLoadMore?: () => void;
    onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    loading,
    loadingMore = false,
    hasMoreMessages = false,
    onLoadMore,
    onScroll,
}) => {
    const messageListRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const previousScrollHeight = useRef<number>(0);

    // Use dynamic row height for variable-sized messages
    const dynamicRowHeight = useDynamicRowHeight({
        defaultRowHeight: 100,
    });

    /**
     * Scroll to bottom of message list
     */
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    /**
     * Handle scroll event for loading older messages
     */
    const handleScroll = useCallback(
        (event: React.UIEvent<HTMLDivElement>) => {
            if (onScroll) {
                onScroll(event);
            }

            if (!messageListRef.current || loadingMore || !hasMoreMessages || !onLoadMore) return;

            const { scrollTop } = messageListRef.current;

            // Load more when scrolled near the top (within 100px)
            if (scrollTop < 100) {
                // Store current scroll height before loading
                previousScrollHeight.current = messageListRef.current.scrollHeight;
                onLoadMore();
            }
        },
        [onScroll, loadingMore, hasMoreMessages, onLoadMore]
    );

    /**
     * Scroll to bottom when messages first load
     */
    useEffect(() => {
        if (messages.length > 0 && !loading && !loadingMore) {
            // Small delay to ensure DOM is updated
            setTimeout(scrollToBottom, 100);
        }
    }, [messages.length, loading, loadingMore, scrollToBottom]);

    /**
     * Maintain scroll position when loading older messages
     */
    useEffect(() => {
        if (loadingMore && messageListRef.current && previousScrollHeight.current > 0) {
            const newScrollHeight = messageListRef.current.scrollHeight;
            const scrollDiff = newScrollHeight - previousScrollHeight.current;
            messageListRef.current.scrollTop = scrollDiff;
            previousScrollHeight.current = 0;
        }
    }, [messages, loadingMore]);

    return (
        <Box
            ref={messageListRef}
            onScroll={handleScroll}
            sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                p: { xs: 2, md: 3 }, // More padding on sides
                backgroundColor: '#f0f2f5', // WhatsApp-like subtle gray
                backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', // Subtle pattern
                backgroundSize: '20px 20px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Loading indicator for initial load */}
            {loading && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        py: 4,
                        flex: 1,
                    }}
                >
                    <CircularProgress size={32} />
                </Box>
            )}

            {/* Content when not loading */}
            {!loading && (
                <>
                    {/* Loading indicator for loading more messages */}
                    {loadingMore && (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                py: 2,
                            }}
                        >
                            <CircularProgress size={24} />
                        </Box>
                    )}

                    {/* Start of conversation indicator */}
                    {!hasMoreMessages && messages.length > 0 && (
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: 2,
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Start of conversation
                            </Typography>
                        </Box>
                    )}

                    {/* Messages - Use virtual scrolling for large lists */}
                    {messages.length > 0 && (
                        <>
                            {messages.length > 200 ? (
                                // Virtual scrolling for large message lists (>200 messages)
                                <List
                                    rowCount={messages.length}
                                    rowHeight={dynamicRowHeight}
                                    overscanCount={10}
                                    rowComponent={({ index, style }) => {
                                        const message = messages[index];
                                        return (
                                            <div style={style}>
                                                <MessageBubble
                                                    key={message.id}
                                                    message={message}
                                                    isAdmin={message.senderType === 'ADMIN'}
                                                    showSenderName={message.senderType === 'CITIZEN'}
                                                />
                                            </div>
                                        );
                                    }}
                                    rowProps={{}}
                                    style={{ height: window.innerHeight - 300 }}
                                />
                            ) : (
                                // Regular rendering for smaller lists
                                <Box>
                                    {messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message}
                                            isAdmin={message.senderType === 'ADMIN'}
                                            showSenderName={message.senderType === 'CITIZEN'}
                                        />
                                    ))}
                                </Box>
                            )}
                        </>
                    )}

                    {/* Empty state - no messages */}
                    {messages.length === 0 && (
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <EmptyState type="no-messages" />
                        </Box>
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </>
            )}
        </Box>
    );
};

export default MessageList;
