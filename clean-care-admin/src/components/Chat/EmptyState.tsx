import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import {
    ChatBubbleOutline as ChatIcon,
    SearchOff as SearchOffIcon,
    MessageOutlined as MessageIcon,
} from '@mui/icons-material';

interface EmptyStateProps {
    type: 'no-chats' | 'no-messages' | 'no-results';
    onAction?: () => void;
    actionLabel?: string;
}

/**
 * EmptyState Component
 * Displays appropriate empty state messages for different scenarios
 */
const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, actionLabel }) => {
    const getContent = () => {
        switch (type) {
            case 'no-chats':
                return {
                    icon: <ChatIcon sx={{ fontSize: 64, color: 'text.disabled' }} />,
                    title: 'No users found',
                    description:
                        'No users found in your jurisdiction to chat with.',
                    showAction: false,
                };

            case 'no-messages':
                return {
                    icon: <MessageIcon sx={{ fontSize: 64, color: 'text.disabled' }} />,
                    title: 'No messages yet',
                    description: 'Start the conversation by sending a message below.',
                    showAction: false,
                };

            case 'no-results':
                return {
                    icon: <SearchOffIcon sx={{ fontSize: 64, color: 'text.disabled' }} />,
                    title: 'No results found',
                    description: 'Try adjusting your search or filters to find what you\'re looking for.',
                    showAction: true,
                };

            default:
                return {
                    icon: <ChatIcon sx={{ fontSize: 64, color: 'text.disabled' }} />,
                    title: 'Nothing here',
                    description: '',
                    showAction: false,
                };
        }
    };

    const content = getContent();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 4, sm: 6, md: 8 },
                px: 3,
                textAlign: 'center',
            }}
        >
            {/* Icon */}
            <Box sx={{ mb: 2 }}>{content.icon}</Box>

            {/* Title */}
            <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                    mb: 1,
                    fontWeight: 500,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                }}
            >
                {content.title}
            </Typography>

            {/* Description */}
            {content.description && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mb: content.showAction ? 3 : 0,
                        maxWidth: 400,
                        lineHeight: 1.6,
                    }}
                >
                    {content.description}
                </Typography>
            )}

            {/* Action Button */}
            {content.showAction && onAction && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={onAction}
                    sx={{ textTransform: 'none' }}
                >
                    {actionLabel || 'Clear Filters'}
                </Button>
            )}
        </Box>
    );
};

export default EmptyState;


