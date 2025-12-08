/**
 * ProfileButton Component
 * Reusable button component for triggering profile modal
 * 
 * Features:
 * - Display user avatar (or initials if no avatar)
 * - Show user name and role (optional)
 * - Online status indicator
 * - Opens ProfileModal on click
 * - Responsive design
 * - Multiple variants (sidebar, header)
 * 
 * Requirements: 1.4, 2.1, 8.4
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    Box,
    Avatar,
    Typography,
    ButtonBase,
    useTheme,
    useMediaQuery,
    Tooltip,
} from '@mui/material';
import { useProfile } from '../../../contexts/ProfileContext';
import { getRoleConfig } from '../../../config/roleConfig';
import ProfileModal from '../ProfileModal/ProfileModal';
import { fadeIn } from '../../../styles/animations';

interface ProfileButtonProps {
    /** Variant determines the layout and styling */
    variant?: 'sidebar' | 'header';
    /** Whether to show the user's name */
    showName?: boolean;
    /** Whether to show the user's role */
    showRole?: boolean;
    /** Whether the sidebar is collapsed (only for sidebar variant) */
    collapsed?: boolean;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({
    variant = 'sidebar',
    showName = true,
    showRole = true,
    collapsed = false,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const { profile, isLoading } = useProfile();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [touchStartTime, setTouchStartTime] = useState<number>(0);

    // Get role configuration
    const roleConfig = useMemo(() => {
        return getRoleConfig(profile?.role);
    }, [profile?.role]);

    /**
     * Get user initials for avatar
     */
    const getUserInitials = useCallback(() => {
        if (!profile) return '?';
        const firstInitial = profile.firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = profile.lastName?.charAt(0)?.toUpperCase() || '';
        return `${firstInitial}${lastInitial}` || '?';
    }, [profile]);

    /**
     * Get full name
     */
    const getFullName = useCallback(() => {
        if (!profile) return 'Loading...';
        return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Admin User';
    }, [profile]);

    /**
     * Handle button click
     */
    const handleClick = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    /**
     * Handle modal close
     */
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    /**
     * Handle touch start (for touch feedback)
     */
    const handleTouchStart = useCallback(() => {
        setTouchStartTime(Date.now());
    }, []);

    /**
     * Handle touch end (prevent accidental taps)
     */
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const touchDuration = Date.now() - touchStartTime;
        // Only trigger if touch was quick (not a scroll)
        if (touchDuration < 300) {
            handleClick();
        }
        e.preventDefault();
    }, [touchStartTime, handleClick]);

    /**
     * Render online status indicator
     */
    const renderOnlineIndicator = () => (
        <Box
            sx={{
                position: 'absolute',
                bottom: variant === 'sidebar' ? 2 : 0,
                right: variant === 'sidebar' ? 2 : 0,
                width: variant === 'sidebar' ? 14 : 10,
                height: variant === 'sidebar' ? 14 : 10,
                bgcolor: '#4CAF50',
                borderRadius: '50%',
                border: `2px solid ${variant === 'sidebar' ? '#ffffff' : theme.palette.background.paper}`,
                boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)',
                animation: `${fadeIn} 0.3s ease-in-out`,
            }}
        />
    );

    /**
     * Render sidebar variant
     */
    const renderSidebarVariant = () => (
        <Tooltip
            title={collapsed ? getFullName() : ''}
            placement="right"
            arrow
            disableTouchListener={isMobile}
        >
            <ButtonBase
                onClick={handleClick}
                onTouchStart={isMobile ? handleTouchStart : undefined}
                onTouchEnd={isMobile ? handleTouchEnd : undefined}
                disabled={isLoading}
                aria-label={`Open profile for ${getFullName()}, ${roleConfig.label}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick();
                    }
                }}
                sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: collapsed ? 0 : 2,
                    p: 3,
                    borderBottom: '1px solid',
                    borderColor: '#ffffff33',
                    textAlign: 'center',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent', // Remove tap highlight on mobile
                    touchAction: 'manipulation', // Improve touch responsiveness
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                    '&:active': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'scale(0.98)', // Touch feedback
                    },
                    '&:focus-visible': {
                        outline: '2px solid #ffffff',
                        outlineOffset: '2px',
                    },
                }}
            >
                {/* Avatar with online indicator */}
                <Box sx={{ position: 'relative' }}>
                    <Avatar
                        src={profile?.avatar}
                        alt={`${getFullName()}'s profile picture`}
                        sx={{
                            width: 64,
                            height: 64,
                            border: '3px solid #ffffff',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            bgcolor: roleConfig.color,
                            fontSize: '1.5rem',
                            fontWeight: 600,
                        }}
                        role="img"
                        aria-label={`Profile picture for ${getFullName()}`}
                    >
                        {getUserInitials()}
                    </Avatar>
                    <Box aria-label="Online status indicator" role="status">
                        {renderOnlineIndicator()}
                    </Box>
                </Box>

                {/* Name and Role - Hidden when collapsed */}
                {!collapsed && (
                    <Box sx={{ width: '100%' }}>
                        {showName && (
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    color: '#ffffff',
                                    mb: 0.5,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {getFullName()}
                            </Typography>
                        )}

                        {showRole && (
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 2,
                                    background: roleConfig.gradient,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    mb: 1,
                                }}
                            >
                                <span style={{ fontSize: '0.9rem' }}>{roleConfig.icon}</span>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: '#ffffff',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {roleConfig.label}
                                </Typography>
                            </Box>
                        )}

                        {/* Active status */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0.5,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    bgcolor: '#4CAF50',
                                    borderRadius: '50%',
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#4CAF50',
                                    fontSize: '0.7rem',
                                    fontWeight: 500,
                                }}
                            >
                                Active Now
                            </Typography>
                        </Box>
                    </Box>
                )}
            </ButtonBase>
        </Tooltip>
    );

    /**
     * Render header variant
     */
    const renderHeaderVariant = () => (
        <ButtonBase
            onClick={handleClick}
            onTouchStart={isMobile ? handleTouchStart : undefined}
            onTouchEnd={isMobile ? handleTouchEnd : undefined}
            disabled={isLoading}
            aria-label={`Open profile for ${getFullName()}, ${roleConfig.label}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1,
                minHeight: isMobile ? 44 : 36, // Touch-friendly height
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                },
                '&:active': {
                    backgroundColor: theme.palette.action.selected,
                    transform: 'scale(0.98)',
                },
                '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: '2px',
                },
            }}
        >
            {/* Avatar with online indicator */}
            <Box sx={{ position: 'relative' }}>
                <Avatar
                    src={profile?.avatar}
                    alt={`${getFullName()}'s profile picture`}
                    sx={{
                        width: 36,
                        height: 36,
                        background: roleConfig.gradient,
                        border: '2px solid',
                        borderColor: roleConfig.color,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                    }}
                    role="img"
                    aria-label={`Profile picture for ${getFullName()}`}
                >
                    {getUserInitials()}
                </Avatar>
                <Box aria-label="Online status indicator" role="status">
                    {renderOnlineIndicator()}
                </Box>
            </Box>

            {/* Name and Role - Hidden on mobile */}
            {!isMobile && (
                <Box sx={{ textAlign: 'left' }}>
                    {showName && (
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                                lineHeight: 1.2,
                            }}
                        >
                            {getFullName()}
                        </Typography>
                    )}
                    {showRole && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mt: 0.25,
                            }}
                        >
                            <span style={{ fontSize: '0.7rem' }}>{roleConfig.icon}</span>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: roleConfig.color,
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                }}
                            >
                                {roleConfig.label}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}
        </ButtonBase>
    );

    return (
        <>
            {/* Profile Button */}
            {variant === 'sidebar' ? renderSidebarVariant() : renderHeaderVariant()}

            {/* Profile Modal */}
            <ProfileModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
            />
        </>
    );
};

export default ProfileButton;
