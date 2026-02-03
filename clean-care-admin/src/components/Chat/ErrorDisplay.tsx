import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon, Error as ErrorIcon } from '@mui/icons-material';

interface ErrorDisplayProps {
    error: string;
    onRetry?: () => void;
    variant?: 'inline' | 'centered' | 'alert';
}

/**
 * ErrorDisplay Component
 * Displays error messages with optional retry functionality
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    error,
    onRetry,
    variant = 'centered',
}) => {
    if (variant === 'alert') {
        return (
            <Alert
                severity="error"
                sx={{ m: 2 }}
                action={
                    onRetry && (
                        <Button
                            color="inherit"
                            size="small"
                            onClick={onRetry}
                            startIcon={<RefreshIcon />}
                        >
                            Retry
                        </Button>
                    )
                }
            >
                {error}
            </Alert>
        );
    }

    if (variant === 'inline') {
        return (
            <Box
                sx={{
                    p: 2,
                    backgroundColor: '#ffebee',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <ErrorIcon sx={{ color: 'error.main' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="error">
                        {error}
                    </Typography>
                </Box>
                {onRetry && (
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={onRetry}
                        startIcon={<RefreshIcon />}
                    >
                        Retry
                    </Button>
                )}
            </Box>
        );
    }

    // Centered variant (default)
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                px: 3,
            }}
        >
            <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" color="error" sx={{ mb: 1, textAlign: 'center' }}>
                Something went wrong
            </Typography>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, textAlign: 'center', maxWidth: 400 }}
            >
                {error}
            </Typography>
            {onRetry && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onRetry}
                    startIcon={<RefreshIcon />}
                >
                    Try Again
                </Button>
            )}
        </Box>
    );
};

export default ErrorDisplay;


