import React, { useState, useRef } from 'react';
import { Box, Typography, Modal, IconButton } from '@mui/material';
import { Close as CloseIcon, DoneAll as DoneAllIcon, Done as DoneIcon, PlayArrow as PlayArrowIcon, Pause as PauseIcon } from '@mui/icons-material';
import type { MessageBubbleProps } from '../../types/chat-page.types';
import { fadeIn, slideInUp, animationConfig } from '../../styles/animations';

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
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Determine border radius based on sender (different radius on sender side)
    const borderRadius = isAdmin
        ? '16px 16px 4px 16px' // Right side has smaller radius
        : '16px 16px 16px 4px'; // Left side has smaller radius

    // Admin message gradient (blue to green)
    const adminGradient = 'linear-gradient(135deg, #1976d2 0%, #2e7d32 100%)';

    // Handle voice message play/pause
    const handleVoicePlayPause = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    // Handle audio ended
    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    return (
        <>
            <Box
                sx={{
                    mb: 1.5,
                    display: 'flex',
                    justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                    animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.normal.timing}, ${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                    animationFillMode: 'both',
                }}
            >
                <Box
                    sx={{
                        maxWidth: { xs: '85%', sm: '75%', md: '70%' },
                        minWidth: '100px',
                        p: 1.5,
                        borderRadius: borderRadius,
                        background: isAdmin ? adminGradient : '#ffffff',
                        color: isAdmin ? '#ffffff' : '#1a1a1a',
                        boxShadow: isAdmin
                            ? '0 2px 8px rgba(25, 118, 210, 0.25)'
                            : '0 2px 8px rgba(0, 0, 0, 0.08)',
                        border: isAdmin ? 'none' : '1px solid #e0e0e0',
                        transition: `all ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                        '&:hover': {
                            boxShadow: isAdmin
                                ? '0 4px 12px rgba(25, 118, 210, 0.35)'
                                : '0 4px 12px rgba(0, 0, 0, 0.12)',
                            transform: 'translateY(-1px)',
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
                                color: '#1976d2',
                                fontSize: '0.75rem',
                                letterSpacing: '0.02em',
                            }}
                        >
                            {message.senderName}
                        </Typography>
                    )}

                    {/* Message text with proper line breaks */}
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            lineHeight: 1.5,
                            fontSize: '0.9rem',
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
                        <Box
                            sx={{
                                mt: 1,
                                p: 1,
                                borderRadius: '20px',
                                backgroundColor: isAdmin ? 'rgba(255, 255, 255, 0.2)' : 'rgba(25, 118, 210, 0.08)',
                                border: isAdmin ? 'none' : '1px solid rgba(25, 118, 210, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                maxWidth: '280px',
                            }}
                        >
                            {/* Hidden audio element */}
                            <audio
                                ref={audioRef}
                                src={message.voiceUrl}
                                onEnded={handleAudioEnded}
                                onError={(e) => {
                                    console.error('❌ Voice message failed to load:', message.voiceUrl);
                                }}
                            />

                            {/* Play/Pause button */}
                            <IconButton
                                onClick={handleVoicePlayPause}
                                size="small"
                                sx={{
                                    backgroundColor: isAdmin ? '#ffffff' : '#1976d2',
                                    color: isAdmin ? '#1976d2' : '#ffffff',
                                    width: 32,
                                    height: 32,
                                    '&:hover': {
                                        backgroundColor: isAdmin ? '#f5f5f5' : '#1565c0',
                                    },
                                }}
                            >
                                {isPlaying ? (
                                    <PauseIcon sx={{ fontSize: '1rem' }} />
                                ) : (
                                    <PlayArrowIcon sx={{ fontSize: '1rem' }} />
                                )}
                            </IconButton>

                            {/* Waveform visualization (simplified) */}
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-evenly',
                                    height: '30px',
                                    gap: '2px',
                                }}
                            >
                                {[...Array(20)].map((_, index) => {
                                    const heights = [8, 12, 18, 12, 8, 15, 10, 18, 12, 8, 15, 12, 18, 10, 8, 12, 18, 12, 8, 15];
                                    return (
                                        <Box
                                            key={index}
                                            sx={{
                                                width: '2px',
                                                height: `${heights[index]}px`,
                                                backgroundColor: isAdmin ? 'rgba(255, 255, 255, 0.7)' : 'rgba(25, 118, 210, 0.6)',
                                                borderRadius: '1px',
                                                transition: 'all 0.3s ease',
                                                ...(isPlaying && {
                                                    animation: `pulse ${0.5 + (index % 3) * 0.2}s ease-in-out infinite`,
                                                    '@keyframes pulse': {
                                                        '0%, 100%': { transform: 'scaleY(1)' },
                                                        '50%': { transform: 'scaleY(1.5)' },
                                                    },
                                                }),
                                            }}
                                        />
                                    );
                                })}
                            </Box>

                            {/* Duration or status */}
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '0.7rem',
                                    color: isAdmin ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.6)',
                                    minWidth: '35px',
                                    textAlign: 'right',
                                }}
                            >
                                {isPlaying ? '...' : 'Voice'}
                            </Typography>
                        </Box>
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
