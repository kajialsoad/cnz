import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { PlayArrow as PlayArrowIcon, Pause as PauseIcon } from '@mui/icons-material';
import { API_CONFIG } from '../../config/apiConfig';

interface VoiceMessagePlayerProps {
    voiceUrl: string;
    isAdmin: boolean;
}

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ voiceUrl, isAdmin }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const mediaRef = useRef<HTMLMediaElement | null>(null);

    // Get absolute URL for voice file
    const getAbsoluteUrl = (url: string) => {
        if (!url) return '';
        // If it's a Cloudinary URL, use it directly but ensure https
        if (url.includes('res.cloudinary.com')) {
            return url.replace('http://', 'https://');
        }
        if (url.startsWith('http')) return url;
        // Remove leading slash if present to avoid double slashes if BASE_URL ends with slash
        const cleanPath = url.startsWith('/') ? url.substring(1) : url;
        return `${API_CONFIG.BASE_URL}/${cleanPath}`;
    };

    const absoluteVoiceUrl = getAbsoluteUrl(voiceUrl);

    // Handle voice message play/pause
    const handleVoicePlayPause = () => {
        if (!mediaRef.current) return;

        if (isPlaying) {
            mediaRef.current.pause();
            setIsPlaying(false);
        } else {
            setAudioLoading(true);
            setAudioError(false);
            
            // Log for debugging
            console.log('▶️ Playing voice message:', absoluteVoiceUrl);
            
            mediaRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setAudioLoading(false);
                })
                .catch((error) => {
                    console.error('❌ Failed to play voice message:', error);
                    setAudioError(true);
                    setAudioLoading(false);
                    setIsPlaying(false);
                });
        }
    };

    // Handle audio ended
    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    // Handle audio error
    const handleAudioError = (e: React.SyntheticEvent<HTMLMediaElement>) => {
        console.error('❌ Voice message failed to load:', absoluteVoiceUrl);
        console.error('   Error details:', e);
        // Try to recover if it's a format issue by logging it
        // If it's NotSupportedError, it might be the container format
        const error = (e.target as HTMLMediaElement).error;
        if (error) {
             console.error('   Media Error Code:', error.code, error.message);
        }
        
        setAudioError(true);
        setIsPlaying(false);
        setAudioLoading(false);
    };

    // Handle audio loaded successfully
    const handleAudioLoaded = () => {
        console.log('✅ Voice message loaded successfully');
        setAudioError(false);
    };

    // Retry loading audio
    const handleRetryAudio = () => {
        if (!mediaRef.current) return;

        console.log('🔄 Retrying voice message load:', absoluteVoiceUrl);
        setAudioError(false);
        setAudioLoading(true);

        // Force reload by setting src again
        const currentSrc = mediaRef.current.src;
        mediaRef.current.src = '';
        mediaRef.current.src = currentSrc;
        mediaRef.current.load();

        // Try to play after reload
        setTimeout(() => {
            handleVoicePlayPause();
        }, 500);
    };

    return (
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
            {/* Hidden audio element used for playback */}
            <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={absoluteVoiceUrl}
                onEnded={handleAudioEnded}
                onError={handleAudioError}
                onLoadedData={handleAudioLoaded}
                preload="none"
                style={{ display: 'none' }}
            />

            {/* Play/Pause button or Error indicator */}
            {audioError ? (
                <IconButton
                    onClick={handleRetryAudio}
                    size="small"
                    title="Retry loading voice message"
                    sx={{
                        backgroundColor: '#f44336',
                        color: '#ffffff',
                        width: 32,
                        height: 32,
                        '&:hover': {
                            backgroundColor: '#d32f2f',
                        },
                    }}
                >
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>!</Typography>
                </IconButton>
            ) : (
                <IconButton
                    onClick={handleVoicePlayPause}
                    size="small"
                    disabled={audioLoading}
                    sx={{
                        backgroundColor: isAdmin ? '#ffffff' : '#1976d2',
                        color: isAdmin ? '#1976d2' : '#ffffff',
                        width: 32,
                        height: 32,
                        '&:hover': {
                            backgroundColor: isAdmin ? '#f5f5f5' : '#1565c0',
                        },
                        '&:disabled': {
                            backgroundColor: isAdmin ? 'rgba(255, 255, 255, 0.5)' : 'rgba(25, 118, 210, 0.5)',
                            color: isAdmin ? 'rgba(25, 118, 210, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                        },
                    }}
                >
                    {audioLoading ? (
                        <Typography sx={{ fontSize: '0.6rem' }}>...</Typography>
                    ) : isPlaying ? (
                        <PauseIcon sx={{ fontSize: '1rem' }} />
                    ) : (
                        <PlayArrowIcon sx={{ fontSize: '1rem' }} />
                    )}
                </IconButton>
            )}

            {/* Waveform visualization or error message */}
            {audioError ? (
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontSize: '0.7rem',
                            color: '#f44336',
                            fontWeight: 500,
                        }}
                    >
                        Failed to load
                    </Typography>
                </Box>
            ) : (
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
            )}

            {/* Duration or status */}
            <Typography
                variant="caption"
                sx={{
                    fontSize: '0.7rem',
                    color: audioError
                        ? '#f44336'
                        : isAdmin
                            ? 'rgba(255, 255, 255, 0.85)'
                            : 'rgba(0, 0, 0, 0.6)',
                    minWidth: '35px',
                    textAlign: 'right',
                }}
            >
                {audioError ? 'Error' : audioLoading ? '...' : isPlaying ? '...' : 'Voice'}
            </Typography>
        </Box>
    );
};

export default VoiceMessagePlayer;