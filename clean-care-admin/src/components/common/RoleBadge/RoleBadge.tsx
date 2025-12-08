import React from 'react';
import { Box, Chip, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { getRoleConfig } from '../../../config/roleConfig';

interface RoleBadgeProps {
    role?: string;
    size?: 'small' | 'medium' | 'large';
    showTooltip?: boolean;
    showIcon?: boolean;
    variant?: 'filled' | 'outlined' | 'gradient';
}

const RoleBadge: React.FC<RoleBadgeProps> = ({
    role,
    size = 'medium',
    showTooltip = true,
    showIcon = true,
    variant = 'filled',
}) => {
    const config = getRoleConfig(role);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Adjust size based on screen size for better responsiveness
    const responsiveSize = isMobile && size === 'large' ? 'medium' : size;

    const sizeStyles = {
        small: {
            fontSize: '0.7rem',
            height: 20,
            px: 1,
            iconSize: '0.8rem',
        },
        medium: {
            fontSize: '0.8rem',
            height: 24,
            px: 1.5,
            iconSize: '1rem',
        },
        large: {
            fontSize: '0.9rem',
            height: 28,
            px: 2,
            iconSize: '1.2rem',
        },
    };

    const currentSize = sizeStyles[responsiveSize];

    const getBadgeStyles = () => {
        switch (variant) {
            case 'gradient':
                return {
                    background: config.gradient,
                    color: '#ffffff',
                    border: 'none',
                };
            case 'outlined':
                return {
                    background: 'transparent',
                    color: config.color,
                    border: `1.5px solid ${config.color}`,
                };
            case 'filled':
            default:
                return {
                    background: config.color,
                    color: '#ffffff',
                    border: 'none',
                };
        }
    };

    const badgeContent = (
        <Chip
            label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {showIcon && (
                        <span style={{ fontSize: currentSize.iconSize }} aria-hidden="true">{config.icon}</span>
                    )}
                    <span>{config.label}</span>
                </Box>
            }
            size={responsiveSize === 'large' ? 'medium' : responsiveSize}
            role="status"
            aria-label={`User role: ${config.label}`}
            sx={{
                ...getBadgeStyles(),
                fontSize: currentSize.fontSize,
                height: currentSize.height,
                px: currentSize.px,
                fontWeight: 600,
                boxShadow: variant === 'gradient' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s ease-in-out',
                '& .MuiChip-label': {
                    px: 0,
                },
                // Responsive adjustments
                [theme.breakpoints.down('sm')]: {
                    fontSize: currentSize.fontSize === '0.9rem' ? '0.8rem' : currentSize.fontSize,
                    height: currentSize.height > 24 ? 24 : currentSize.height,
                },
            }}
        />
    );

    if (showTooltip) {
        return (
            <Tooltip
                title={
                    <Box sx={{ p: 0.5 }} role="tooltip">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {config.label}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                            {config.designation}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Permissions:
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2, listStyle: 'disc' }} role="list">
                            {config.permissions.map((permission, index) => (
                                <Typography
                                    key={index}
                                    component="li"
                                    variant="caption"
                                    sx={{ display: 'list-item' }}
                                    role="listitem"
                                >
                                    {permission}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                }
                arrow
                placement={isMobile ? 'bottom' : 'top'}
                enterTouchDelay={0}
                leaveTouchDelay={3000}
                aria-label={`Role information for ${config.label}`}
            >
                {badgeContent}
            </Tooltip>
        );
    }

    return badgeContent;
};

export default RoleBadge;
