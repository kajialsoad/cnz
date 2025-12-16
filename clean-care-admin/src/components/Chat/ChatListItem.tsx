import React from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import type { ChatConversation } from '../../types/chat-page.types';
import { formatTimeAgo } from '../../utils/dateUtils';
import { fadeIn, animationConfig } from '../../styles/animations';

interface ChatListItemProps {
    chat: ChatConversation;
    isSelected: boolean;
    onClick: () => void;
}

/**
 * ChatListItem Component
 * Displays a single chat conversation in the chat list
 * Shows citizen info, complaint details, last message preview, and status indicators
 */
const ChatListItem: React.FC<ChatListItemProps> = ({ chat, isSelected, onClick }) => {
    /**
     * Get initials from citizen name
     */
    const getInitials = () => {
        return `${chat.citizen.firstName.charAt(0)}${chat.citizen.lastName.charAt(0)}`;
    };

    /**
     * Truncate text to specified length
     */
    const truncateText = (text: string, maxLength: number = 50): string => {
        if (text.length <= maxLength) return text;
        return `${text.substring(0, maxLength)}...`;
    };

    /**
     * Get status badge color
     */
    const getStatusColor = () => {
        switch (chat.complaintStatus) {
            case 'PENDING':
                return '#FF9800';
            case 'IN_PROGRESS':
                return '#2196F3';
            case 'RESOLVED':
                return '#4CAF50';
            case 'REJECTED':
                return '#f44336';
            default:
                return '#9E9E9E';
        }
    };

    /**
     * Get status label
     */
    const getStatusLabel = () => {
        switch (chat.complaintStatus) {
            case 'PENDING':
                return 'Pending';
            case 'IN_PROGRESS':
                return 'In Progress';
            case 'RESOLVED':
                return 'Solved';
            case 'REJECTED':
                return 'Rejected';
            default:
                return chat.complaintStatus;
        }
    };

    return (
        <Box
            onClick={onClick}
            sx={{
                p: { xs: 1.5, sm: 2, md: 2 },
                borderBottom: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'action.selected' : 'transparent',
                transition: `all ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.normal.timing}`,
                '&:hover': {
                    backgroundColor: isSelected ? 'action.selected' : 'action.hover',
                    transform: 'translateX(4px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                },
            }}
        >
            <Box sx={{ display: 'flex', gap: 1.5 }}>
                {/* Citizen Avatar */}
                <Avatar
                    src={chat.citizen.profilePicture}
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: '#4CAF50',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        flexShrink: 0,
                    }}
                >
                    {getInitials()}
                </Avatar>

                {/* Chat Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Top Row: Name and Timestamp */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 0.5,
                            gap: 1,
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: chat.unreadCount > 0 ? 600 : 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                            }}
                        >
                            {chat.citizen.firstName} {chat.citizen.lastName}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                flexShrink: 0,
                                fontSize: '0.7rem',
                            }}
                        >
                            {formatTimeAgo(chat.lastMessage.timestamp.toString())}
                        </Typography>
                    </Box>

                    {/* Complaint ID and Title */}
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            display: 'block',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        #{chat.trackingNumber} • {chat.complaintTitle}
                    </Typography>

                    {/* Location with City Corporation and Thana */}
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            display: 'block',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.7rem',
                        }}
                    >
                        📍 {chat.citizen.cityCorporationName || chat.citizen.district}
                        {chat.citizen.thanaName && `, ${chat.citizen.thanaName}`}
                        {!chat.citizen.cityCorporationName && `, ${chat.citizen.upazila}`}
                    </Typography>

                    {/* Zone and Ward Info */}
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
                        {chat.citizen.zone && (
                            <Chip
                                label={`Zone ${chat.citizen.zone}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    color: 'text.secondary',
                                    borderColor: 'divider',
                                    backgroundColor: 'action.hover',
                                }}
                            />
                        )}
                        {chat.citizen.ward && (
                            <Chip
                                label={`Ward ${chat.citizen.ward}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    color: 'text.secondary',
                                    borderColor: 'divider',
                                    backgroundColor: 'action.hover',
                                }}
                            />
                        )}
                    </Box>

                    {/* Last Message Preview */}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: chat.unreadCount > 0 ? 500 : 400,
                            fontSize: '0.875rem',
                            mb: 0.5,
                        }}
                    >
                        {truncateText(chat.lastMessage.text, 50)}
                    </Typography>

                    {/* Bottom Row: Badges */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Status Badge */}
                        <Chip
                            label={getStatusLabel()}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                backgroundColor: getStatusColor(),
                                color: 'white',
                            }}
                        />

                        {/* New Badge */}
                        {chat.isNew && (
                            <Chip
                                label="New"
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    backgroundColor: '#FF5722',
                                    color: 'white',
                                }}
                            />
                        )}

                        {/* Unread Count Badge */}
                        {chat.unreadCount > 0 && (
                            <Chip
                                label={chat.unreadCount}
                                size="small"
                                sx={{
                                    height: 20,
                                    minWidth: 20,
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ChatListItem;
