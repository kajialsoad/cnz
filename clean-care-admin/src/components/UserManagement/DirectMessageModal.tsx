import React, { useMemo } from 'react';
import {
    Dialog,
    Box,
    IconButton,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { scaleIn, slideInUp, animationConfig, fadeIn } from '../../styles/animations';
import LiveChatConversationPanel from '../../pages/LiveChat/LiveChatConversationPanel';
import type { UserInfo } from '../../types/live-chat.types';
import type { UserWithStats } from '../../types/userManagement.types';

interface DirectMessageModalProps {
    userId: number | null;
    open: boolean;
    onClose: () => void;
    userName?: string;
    userDetails?: UserWithStats; // NEW: Accept complete user data from User Management
}

/**
 * DirectMessageModal - Modal for direct messaging with users from User Management
 * 
 * This modal uses LiveChatConversationPanel to provide the same chat experience
 * as the Live Chat page, but in a modal format similar to the complaint chat modal.
 * 
 * Features:
 * - Uses user data already available in User Management (no slow API fetch)
 * - Displays user information in conversation header instantly
 * - Supports all Live Chat features (text, image, voice messages)
 * 
 * Performance Optimization:
 * - Converts UserWithStats to UserInfo format using useMemo (instant, no API call)
 * - No need to fetch 100 conversations just to find one user's info
 */
const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
    userId,
    open,
    onClose,
    userName = 'User',
    userDetails, // NEW: Complete user data from User Management
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    /**
     * Convert UserWithStats to UserInfo format
     * This is instant and doesn't require any API calls
     */
    const userInfo = useMemo<UserInfo | null>(() => {
        if (!userDetails || !userId) return null;

        return {
            id: userDetails.id,
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            avatar: userDetails.avatar || null,
            phone: userDetails.phone || null,
            cityCorporationCode: userDetails.cityCorporationCode || null,
            wardId: userDetails.wardId || null,
            zoneId: userDetails.zoneId || null,
            ward: userDetails.ward ? {
                id: userDetails.ward.id,
                number: userDetails.ward.wardNumber,
                wardNumber: userDetails.ward.wardNumber,
            } : null,
            zone: userDetails.zone ? {
                id: userDetails.zone.id,
                number: userDetails.zone.zoneNumber,
                name: userDetails.zone.name || null,
            } : null,
        };
    }, [userDetails, userId]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: isMobile ? 0 : 2,
                        height: isMobile ? '100vh' : '80vh',
                        maxHeight: isMobile ? '100vh' : '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        animation: isMobile
                            ? `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`
                            : `${scaleIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                        animationFillMode: 'both',
                        overflow: 'hidden',
                    },
                },
                backdrop: {
                    sx: {
                        animation: `${fadeIn} ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                    },
                },
            }}
        >
            {/* Close Button Overlay */}
            <Box sx={{ position: 'absolute', right: 8, top: 8, zIndex: 10 }}>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                        },
                        boxShadow: 1,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Live Chat Conversation Panel */}
            <Box sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                <LiveChatConversationPanel
                    userId={userId}
                    userInfo={userInfo}
                    onMessagesRead={() => {
                        // Optional: Refresh user list or update unread count
                    }}
                />
            </Box>
        </Dialog>
    );
};

export default DirectMessageModal;


