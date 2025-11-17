import React from 'react';
import { Button, CircularProgress, Box } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { spin, animationConfig } from '../../styles/animations';

interface LoadingButtonProps extends ButtonProps {
    loading?: boolean;
    loadingText?: string;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
    loading = false,
    loadingText,
    children,
    disabled,
    startIcon,
    ...props
}) => {
    return (
        <Button
            {...props}
            disabled={disabled || loading}
            startIcon={
                loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            animation: `${spin} 1s linear infinite`,
                        }}
                    >
                        <CircularProgress size={16} color="inherit" />
                    </Box>
                ) : (
                    startIcon
                )
            }
            sx={{
                ...props.sx,
                transition: `all ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                '&:not(:disabled):hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                },
                '&:not(:disabled):active': {
                    transform: 'translateY(0)',
                },
            }}
        >
            {loading && loadingText ? loadingText : children}
        </Button>
    );
};

export default LoadingButton;
