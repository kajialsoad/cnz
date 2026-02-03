import React from 'react';
import {
    Dialog,
    DialogContent,
    Box,
    useTheme,
    useMediaQuery,
    IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { scaleIn, slideInUp, animationConfig, fadeIn } from '../../styles/animations';
import ChatConversationPanel from '../Chat/ChatConversationPanel';

interface ChatModalProps {
    complaintId: number | null;
    open: boolean;
    onClose: () => void;
    citizenName?: string;
    complaintTitle?: string;
    onStatusUpdate?: (newStatus: any) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({
    complaintId,
    open,
    onClose,
    onStatusUpdate,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

            {/* Chat Conversation Panel */}
            <Box sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                <ChatConversationPanel 
                    complaintId={complaintId} 
                    hideHeader={false}
                    onStatusUpdate={onStatusUpdate}
                />
            </Box>
        </Dialog>
    );
};

export default ChatModal;


