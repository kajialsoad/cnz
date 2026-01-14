/**
 * ProfileModal Component
 * Main modal for displaying and managing user profile
 * 
 * Features:
 * - Display user avatar with RoleBadge
 * - Show personal information (name, email, phone, role)
 * - Edit mode toggle
 * - Close and logout buttons
 * - Loading state
 * - Responsive design for all screen sizes
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.3
 */

import React, { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Button,
    CircularProgress,
    Divider,
    useTheme,
    useMediaQuery,
    Avatar,
    Paper,
    Skeleton,
    Slide,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import {
    Close as CloseIcon,
    Edit as EditIcon,
    Logout as LogoutIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Business as BusinessIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../../contexts/ProfileContext';
import { useAuth } from '../../../contexts/AuthContext';
import RoleBadge from '../RoleBadge/RoleBadge';
import { fadeIn, slideInUp } from '../../../styles/animations';
import type { ProfileUpdateData } from '../../../types/profile.types';

// Lazy load ProfileEditForm for better performance
const ProfileEditForm = lazy(() => import('../ProfileEditForm/ProfileEditForm'));

interface ProfileModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when modal is closed */
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isLandscape = useMediaQuery('(orientation: landscape)');

    const { profile, isLoading, updateProfile } = useProfile();
    const { logout } = useAuth();

    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Touch gesture handling
    const touchStartY = useRef<number>(0);
    const touchEndY = useRef<number>(0);
    const contentRef = useRef<HTMLDivElement>(null);

    /**
     * Get user initials for avatar (memoized for performance)
     */
    const userInitials = useMemo(() => {
        if (!profile) return '?';
        const firstInitial = profile.firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = profile.lastName?.charAt(0)?.toUpperCase() || '';
        return `${firstInitial}${lastInitial}` || '?';
    }, [profile?.firstName, profile?.lastName]);

    /**
     * Get full name (memoized for performance)
     */
    const fullName = useMemo(() => {
        if (!profile) return 'Loading...';
        return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'No Name';
    }, [profile?.firstName, profile?.lastName]);

    /**
     * Format date
     */
    const formatDate = useCallback((dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return 'Invalid Date';
        }
    }, []);

    /**
     * Handle edit mode toggle
     */
    const handleEditToggle = useCallback(() => {
        setIsEditMode((prev) => !prev);
    }, []);

    /**
     * Handle profile save from edit form
     */
    const handleProfileSave = useCallback(async (data: ProfileUpdateData) => {
        await updateProfile(data);
        setIsEditMode(false);
    }, [updateProfile]);

    /**
     * Handle edit cancel
     */
    const handleEditCancel = useCallback(() => {
        setIsEditMode(false);
    }, []);

    /**
     * Handle logout
     */
    const handleLogout = useCallback(async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            onClose();
            // Force page reload to reset all state
            window.location.href = '/admin/login';
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoggingOut(false);
        }
    }, [logout, onClose]);

    /**
     * Handle close
     */
    const handleClose = useCallback(() => {
        if (isEditMode) {
            setIsEditMode(false);
        }
        onClose();
    }, [isEditMode, onClose]);

    /**
     * Handle touch start for swipe gesture
     */
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!isMobile) return;
        touchStartY.current = e.touches[0].clientY;
    }, [isMobile]);

    /**
     * Handle touch move for swipe gesture
     */
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isMobile) return;
        touchEndY.current = e.touches[0].clientY;
    }, [isMobile]);

    /**
     * Handle touch end for swipe gesture (swipe down to close)
     */
    const handleTouchEnd = useCallback(() => {
        if (!isMobile) return;

        const swipeDistance = touchEndY.current - touchStartY.current;
        const minSwipeDistance = 100; // Minimum swipe distance in pixels

        // Check if scrolled to top
        const isAtTop = contentRef.current?.scrollTop === 0;

        // Close modal if swiped down from top
        if (swipeDistance > minSwipeDistance && isAtTop && !isEditMode) {
            handleClose();
        }

        // Reset touch positions
        touchStartY.current = 0;
        touchEndY.current = 0;
    }, [isMobile, isEditMode, handleClose]);

    /**
     * Prevent body scroll when modal is open on mobile
     */
    useEffect(() => {
        if (isOpen && isMobile) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen, isMobile]);

    /**
     * Render loading skeleton
     */
    const renderLoadingSkeleton = () => (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Skeleton variant="circular" width={120} height={120} sx={{ mb: 2 }} />
                <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" width={120} height={28} sx={{ borderRadius: 2 }} />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={200} />
        </Box>
    );

    /**
     * Render info row
     */
    const renderInfoRow = (
        icon: React.ReactNode,
        label: string,
        value: string | undefined,
        verified?: boolean
    ) => (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                py: 1.5,
                px: isMobile ? 1 : 2,
            }}
            role="group"
            aria-label={`${label}: ${value || 'Not provided'}`}
        >
            <Box
                sx={{
                    color: theme.palette.primary.main,
                    mt: 0.5,
                    minWidth: 24,
                }}
                aria-hidden="true"
            >
                {icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="caption"
                    component="label"
                    sx={{
                        color: theme.palette.text.secondary,
                        display: 'block',
                        mb: 0.5,
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                    }}
                >
                    {label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            wordBreak: 'break-word',
                            fontSize: isMobile ? '0.85rem' : '0.875rem',
                        }}
                    >
                        {value || 'N/A'}
                    </Typography>
                    {verified !== undefined && (
                        verified ? (
                            <CheckCircleIcon
                                sx={{
                                    fontSize: 16,
                                    color: theme.palette.success.main,
                                }}
                                aria-label="Verified"
                                role="img"
                            />
                        ) : (
                            <CancelIcon
                                sx={{
                                    fontSize: 16,
                                    color: theme.palette.warning.main,
                                }}
                                aria-label="Not verified"
                                role="img"
                            />
                        )
                    )}
                </Box>
            </Box>
        </Box>
    );

    /**
     * Render profile header
     */
    const renderProfileHeader = () => {
        // Adjust sizes based on device and orientation
        const avatarSize = isMobile
            ? (isLandscape ? 80 : 100)
            : isTablet
                ? (isLandscape ? 100 : 120)
                : 120;

        const fontSize = isMobile
            ? (isLandscape ? '1.5rem' : '2rem')
            : '2.5rem';

        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: isMobile && isLandscape ? 2 : 3,
                    px: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 100%)`,
                    animation: `${fadeIn} 0.3s ease-in-out`,
                }}
            >
                {/* Swipe indicator for mobile */}
                {isMobile && !isEditMode && (
                    <Box
                        sx={{
                            width: 40,
                            height: 4,
                            backgroundColor: theme.palette.divider,
                            borderRadius: 2,
                            mb: 2,
                            opacity: 0.5,
                        }}
                        aria-hidden="true"
                    />
                )}

                {/* Avatar */}
                <Avatar
                    src={profile?.avatar}
                    alt={`${fullName}'s profile picture`}
                    sx={{
                        width: avatarSize,
                        height: avatarSize,
                        fontSize: fontSize,
                        mb: isMobile && isLandscape ? 1 : 2,
                        border: `4px solid ${theme.palette.background.paper}`,
                        boxShadow: theme.shadows[4],
                    }}
                    role="img"
                    aria-label={`Profile picture for ${fullName}`}
                >
                    {userInitials}
                </Avatar>

                {/* Name */}
                <Typography
                    variant={isMobile ? 'h6' : 'h5'}
                    sx={{
                        fontWeight: 600,
                        mb: 1,
                        textAlign: 'center',
                        fontSize: isMobile && isLandscape ? '1rem' : undefined,
                    }}
                >
                    {fullName}
                </Typography>

                {/* Role Badge */}
                <RoleBadge
                    role={profile?.role}
                    size={isMobile ? 'small' : isTablet ? 'medium' : 'medium'}
                    showTooltip={!isMobile}
                    variant="gradient"
                />
            </Box>
        );
    };

    /**
     * Render personal information section
     */
    const renderPersonalInfo = () => (
        <Paper
            elevation={0}
            sx={{
                p: isMobile ? 1 : 2,
                backgroundColor: theme.palette.background.default,
                borderRadius: 2,
                animation: `${slideInUp} 0.4s ease-in-out`,
            }}
        >
            <Typography
                variant="subtitle2"
                sx={{
                    fontWeight: 600,
                    mb: 2,
                    px: isMobile ? 1 : 2,
                    color: theme.palette.text.primary,
                }}
            >
                Personal Information
            </Typography>

            {renderInfoRow(
                <EmailIcon fontSize="small" />,
                'Email Address',
                profile?.email,
                profile?.emailVerified
            )}

            {renderInfoRow(
                <PhoneIcon fontSize="small" />,
                'Phone Number',
                profile?.phone,
                profile?.phoneVerified
            )}

            {profile?.ward && renderInfoRow(
                <LocationIcon fontSize="small" />,
                'Ward',
                typeof profile.ward === 'object' ? `Ward ${(profile.ward as any).wardNumber || (profile.ward as any).number || (profile.ward as any).id || 'N/A'}` : profile.ward
            )}

            {(profile?.assignedWards && profile.assignedWards.length > 0) && renderInfoRow(
                <LocationIcon fontSize="small" />,
                'Assigned Wards',
                profile.assignedWards.map(w => `Ward ${w.wardNumber || w.number || w.id}`).join(', ')
            )}

            {(profile?.assignedZones && profile.assignedZones.length > 0) ? (
                renderInfoRow(
                    <LocationIcon fontSize="small" />,
                    'Assigned Zones',
                    profile.assignedZones.map(az => az.zone.name).join(', ')
                )
            ) : (profile?.zone && renderInfoRow(
                <LocationIcon fontSize="small" />,
                'Zone',
                typeof profile.zone === 'object' ? (profile.zone as any).name : profile.zone
            ))}

            {profile?.address && renderInfoRow(
                <LocationIcon fontSize="small" />,
                'Address',
                profile.address
            )}

            {(profile?.cityCorporation?.name || profile?.cityCorporationCode) && renderInfoRow(
                <BusinessIcon fontSize="small" />,
                'City Corporation',
                profile?.cityCorporation?.name || profile?.cityCorporationCode || ''
            )}
        </Paper>
    );

    /**
     * Render account information section
     */
    const renderAccountInfo = () => (
        <Paper
            elevation={0}
            sx={{
                p: isMobile ? 1 : 2,
                backgroundColor: theme.palette.background.default,
                borderRadius: 2,
                mt: 2,
                animation: `${slideInUp} 0.5s ease-in-out`,
            }}
        >
            <Typography
                variant="subtitle2"
                sx={{
                    fontWeight: 600,
                    mb: 2,
                    px: isMobile ? 1 : 2,
                    color: theme.palette.text.primary,
                }}
            >
                Account Information
            </Typography>

            {renderInfoRow(
                <CalendarIcon fontSize="small" />,
                'Member Since',
                formatDate(profile?.createdAt)
            )}

            {profile?.lastLoginAt && renderInfoRow(
                <CalendarIcon fontSize="small" />,
                'Last Login',
                formatDate(profile.lastLoginAt)
            )}

            <Box sx={{ px: isMobile ? 1 : 2, py: 1.5 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: theme.palette.text.secondary,
                        display: 'block',
                        mb: 0.5,
                    }}
                >
                    Account Status
                </Typography>
                <Box>
                    {profile?.status === 'ACTIVE' ? (
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                backgroundColor: theme.palette.success.main + '20',
                                color: theme.palette.success.main,
                            }}
                        >
                            <CheckCircleIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                Active
                            </Typography>
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                backgroundColor: theme.palette.warning.main + '20',
                                color: theme.palette.warning.main,
                            }}
                        >
                            <CancelIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {profile?.status || 'Unknown'}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Paper>
    );

    /**
     * Transition component for mobile slide-up animation
     */
    const Transition = React.forwardRef(function Transition(
        props: TransitionProps & {
            children: React.ReactElement;
        },
        ref: React.Ref<unknown>,
    ) {
        return <Slide direction="up" ref={ref} {...props} />;
    });

    /**
     * Get modal max width based on screen size
     */
    const getMaxWidth = () => {
        if (isMobile) return false;
        if (isTablet) return 'md';
        return 'sm';
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth={getMaxWidth()}
            fullWidth
            fullScreen={isMobile}
            TransitionComponent={isMobile ? Transition : undefined}
            aria-labelledby="profile-modal-title"
            aria-describedby="profile-modal-description"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: isMobile ? 0 : 2,
                        maxHeight: isMobile ? '100vh' : isLandscape && isTablet ? '95vh' : '90vh',
                        width: isMobile ? '100%' : isTablet ? '90%' : 'auto',
                    },
                    role: 'dialog',
                    'aria-modal': true,
                    onTouchStart: handleTouchStart,
                    onTouchMove: handleTouchMove,
                    onTouchEnd: handleTouchEnd,
                },
            }}
        >
            {/* Dialog Title */}
            <DialogTitle
                id="profile-modal-title"
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 0,
                    pt: 2,
                    px: isMobile ? 2 : 3,
                }}
            >
                <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                    {isEditMode ? 'Edit Profile' : 'Profile'}
                </Typography>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    aria-label="Close profile modal"
                    sx={{
                        color: theme.palette.text.secondary,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Dialog Content */}
            <DialogContent
                ref={contentRef}
                id="profile-modal-description"
                sx={{
                    p: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                    '&::-webkit-scrollbar': {
                        width: isMobile ? '4px' : '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: theme.palette.background.default,
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: theme.palette.divider,
                        borderRadius: '4px',
                    },
                }}
                role="region"
                aria-label={isEditMode ? 'Profile edit form' : 'Profile information'}
            >
                {isLoading ? (
                    renderLoadingSkeleton()
                ) : profile ? (
                    <>
                        {isEditMode ? (
                            /* Edit Mode - Show ProfileEditForm with lazy loading */
                            <Suspense fallback={
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                                    <CircularProgress />
                                </Box>
                            }>
                                <ProfileEditForm
                                    initialData={profile}
                                    onSave={handleProfileSave}
                                    onCancel={handleEditCancel}
                                />
                            </Suspense>
                        ) : (
                            /* View Mode - Show Profile Information */
                            <>
                                {/* Profile Header */}
                                {renderProfileHeader()}

                                {/* Content */}
                                <Box sx={{ p: isMobile ? 2 : 3 }}>
                                    {/* Personal Information */}
                                    {renderPersonalInfo()}

                                    {/* Account Information */}
                                    {renderAccountInfo()}
                                </Box>
                            </>
                        )}
                    </>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 300,
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            Failed to load profile
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            {/* Dialog Actions - Only show in view mode */}
            {!isEditMode && (
                <DialogActions
                    sx={{
                        px: isMobile ? 2 : 3,
                        py: isMobile && isLandscape ? 1.5 : 2,
                        gap: 1,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        flexDirection: isMobile || (isTablet && !isLandscape) ? 'column' : 'row',
                        justifyContent: isTablet && isLandscape ? 'center' : 'flex-start',
                    }}
                >
                    {/* Edit Button */}
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={handleEditToggle}
                        disabled={isLoading || !profile}
                        fullWidth={isMobile || (isTablet && !isLandscape)}
                        aria-label="Edit profile information"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            minHeight: isMobile ? 44 : 36, // Touch-friendly height
                            minWidth: isTablet && isLandscape ? 140 : undefined,
                        }}
                    >
                        Edit Profile
                    </Button>

                    {/* Logout Button */}
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={isLoggingOut ? <CircularProgress size={16} color="inherit" /> : <LogoutIcon />}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        fullWidth={isMobile || (isTablet && !isLandscape)}
                        aria-label={isLoggingOut ? 'Logging out, please wait' : 'Logout from your account'}
                        aria-busy={isLoggingOut}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            minHeight: isMobile ? 44 : 36, // Touch-friendly height
                            minWidth: isTablet && isLandscape ? 140 : undefined,
                        }}
                    >
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default ProfileModal;
