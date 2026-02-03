import React, { useState } from 'react';
import { Box, Typography, Modal, IconButton } from '@mui/material';
import { Close as CloseIcon, DoneAll as DoneAllIcon, Done as DoneIcon, SmartToy as SmartToyIcon } from '@mui/icons-material';
import type { MessageBubbleProps } from '../../types/chat-page.types';
import { fadeIn, slideInUp, animationConfig } from '../../styles/animations';
import VoiceMessagePlayer from './VoiceMessagePlayer';

/**
 * Format timestamp to relative format (e.g., "2 mins ago", "1 hour ago")
 */
const formatRelativeTime = (date: Date | string): string => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) { // Less than 24 hours
        // Show time like "10:30 AM"
        return messageDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    } else {
        // Show full date/time like "Jan 20, 2026, 10:30 AM"
        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    }
};

/**
 * MessageBubble Component
 * Displays an individual message in the chat conversation with professional styling
 * Features:
 * - Different styles for admin (right, blue/green gradient) and citizen (left, white/gray) messages
 * - Rounded corners with different radius for sender side
 * - Sender name display for citizen messages
 * - Image display with lightbox
 * - Relative timestamp
 * - Read status indicators (checkmarks) for admin messages
 * - Smooth animations (fade in, slide up)
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isAdmin,
    showSenderName = false,
}) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Check if this is a bot message
    const isBot = message.senderType === 'BOT';

    // Render bot message with special styling
    if (isBot) {
        return (
            <Box
                sx={{
                    mb: 1.5,
                    display: 'flex',
                    justifyContent: 'center',
                    animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.normal.timing}, ${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                    animationFillMode: 'both',
                }}
            >
                <Box
                    sx={{
                        maxWidth: { xs: '85%', sm: '75%', md: '70%' },
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        transition: `all ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        },
                    }}
                >
                    <SmartToyIcon sx={{ color: '#757575', fontSize: 20, mt: 0.2 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#757575',
                                fontWeight: 600,
                                display: 'block',
                                mb: 0.5,
                                fontSize: '0.75rem',
                            }}
                        >
                            {isAdmin ? '[BOT] Clean Care Support System' : 'Clean Care Support System'}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#424242',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: 1.5,
                                fontSize: '0.9rem',
                            }}
                        >
                            {message.message}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#9e9e9e',
                                display: 'block',
                                mt: 0.5,
                                fontSize: '0.7rem',
                            }}
                        >
                            {formatRelativeTime(message.createdAt)}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }

    // Determine border radius based on sender (different radius on sender side)
    const borderRadius = isAdmin
        ? '20px 20px 4px 20px' // Right side has smaller radius
        : '20px 20px 20px 4px'; // Left side has smaller radius

    // Admin message styling - Solid Green (Brand Color)
    const adminBg = '#15803d'; // Green-700
    const adminColor = '#ffffff';

    // Citizen message styling - White
    const citizenBg = '#ffffff';
    const citizenColor = '#1f2937'; // Gray-800

    return (
        <>
            <Box
                sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                    animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.normal.timing}, ${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                    animationFillMode: 'both',
                    px: 1 // Add some padding for the container
                }}
            >
                <Box
                    sx={{
                        maxWidth: { xs: '92%', sm: '88%', md: '85%' }, // Increased width for better readability
                        minWidth: '120px',
                        p: '12px 16px', // More padding
                        borderRadius: borderRadius,
                        background: isAdmin ? adminBg : citizenBg,
                        color: isAdmin ? adminColor : citizenColor,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)', // Slightly stronger shadow
                        position: 'relative',
                        transition: `all ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                        '&:hover': {
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                        },
                    }}
                >
                    {/* Sender name for citizen messages */}
                    {!isAdmin && showSenderName && message.senderName && (
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 700,
                                display: 'block',
                                mb: 0.5,
                                color: '#eab308',
                                fontSize: '0.8rem', // Slightly larger
                            }}
                        >
                            {message.senderName}
                        </Typography>
                    )}

                    {/* Message text with proper line breaks */}
                    <Typography
                        variant="body1" // Changed to body1 for better readability
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            lineHeight: 1.6,
                            fontSize: '1rem', // Standard readable size (16px usually)
                            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                            letterSpacing: '0.01em',
                        }}
                    >
                        {message.message}
                    </Typography>

                    {/* Image if present (with lightbox on click) - Lazy loaded */}
                    {message.imageUrl && (
                        <Box
                            component="img"
                            src={message.imageUrl}
                            alt="Message attachment"
                            loading="lazy"
                            onLoad={() => {
                                console.log('✅ Image loaded successfully:', message.imageUrl?.substring(0, 100));
                            }}
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                console.error('❌ Image failed to load:', message.imageUrl?.substring(0, 100));
                                console.error('   Full URL:', message.imageUrl);
                                e.currentTarget.style.display = 'none';
                                // Show error message
                                const errorDiv = document.createElement('div');
                                errorDiv.textContent = `❌ Image failed to load`;
                                errorDiv.style.color = isAdmin ? '#ffcccc' : '#ff0000';
                                errorDiv.style.fontSize = '0.8rem';
                                errorDiv.style.marginTop = '8px';
                                e.currentTarget.parentElement?.appendChild(errorDiv);
                            }}
                            sx={{
                                mt: 1,
                                maxWidth: '100%',
                                maxHeight: '300px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                objectFit: 'cover',
                                transition: `all ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                                '&:hover': {
                                    opacity: 0.9,
                                    transform: 'scale(1.02)',
                                },
                            }}
                            onClick={() => setLightboxOpen(true)}
                        />
                    )}

                    {/* Voice message player if present */}
                    {message.voiceUrl && (
                        <VoiceMessagePlayer
                            voiceUrl={message.voiceUrl}
                            isAdmin={isAdmin}
                        />
                    )}

                    {/* Timestamp and read status */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                            mt: 0.5,
                            gap: 0.5,
                        }}
                    >
                        {/* Relative timestamp */}
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: isAdmin ? 0.85 : 0.6,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                            }}
                        >
                            {formatRelativeTime(message.createdAt)}
                        </Typography>

                        {/* Read status (checkmarks for admin messages) */}
                        {isAdmin && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: 0.85,
                                }}
                            >
                                {message.read ? (
                                    <DoneAllIcon sx={{ fontSize: '0.9rem', color: '#4caf50' }} />
                                ) : (
                                    <DoneIcon sx={{ fontSize: '0.9rem' }} />
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Lightbox Modal for image viewing */}
            {message.imageUrl && (
                <Modal
                    open={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            outline: 'none',
                        }}
                    >
                        {/* Close button */}
                        <IconButton
                            onClick={() => setLightboxOpen(false)}
                            sx={{
                                position: 'absolute',
                                top: -40,
                                right: 0,
                                color: 'white',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                },
                            }}
                        >
                            <CloseIcon />
                        </IconButton>

                        {/* Full-size image */}
                        <Box
                            component="img"
                            src={message.imageUrl}
                            alt="Message attachment (full size)"
                            sx={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            }}
                        />
                    </Box>
                </Modal>
            )}
        </>
    );
};

export default MessageBubble;


