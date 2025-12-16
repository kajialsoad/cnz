import React, { useState } from 'react';
import {
    Box,
    Typography,
    Avatar,
    IconButton,
    Chip,
    Button,
    Menu,
    MenuItem,
    Collapse,
    useTheme,
    useMediaQuery,
    Divider,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Visibility as VisibilityIcon,
    History as HistoryIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import type { ComplaintStatus } from '../../types/complaint-service.types';
import type { ChatCitizen } from '../../types/chat-page.types';

interface ChatHeaderProps {
    complaint: {
        id: number;
        trackingNumber: string;
        title: string;
        category: string;
        status: ComplaintStatus;
        createdAt: Date;
    };
    citizen: ChatCitizen;
    onViewDetails: () => void;
    onStatusChange: (newStatus: ComplaintStatus) => void;
    onViewHistory?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
    complaint,
    citizen,
    onViewDetails,
    onStatusChange,
    onViewHistory,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // State for expandable details
    const [expanded, setExpanded] = useState(!isMobile);

    // State for status change menu
    const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
    const statusMenuOpen = Boolean(statusMenuAnchor);

    /**
     * Get status color
     */
    const getStatusColor = (status: ComplaintStatus): string => {
        switch (status) {
            case 'PENDING':
                return '#ff9800';
            case 'IN_PROGRESS':
                return '#2196f3';
            case 'RESOLVED':
                return '#4caf50';
            case 'REJECTED':
                return '#f44336';
            default:
                return '#9e9e9e';
        }
    };

    /**
     * Get status label
     */
    const getStatusLabel = (status: ComplaintStatus): string => {
        switch (status) {
            case 'PENDING':
                return 'Pending';
            case 'IN_PROGRESS':
                return 'In Progress';
            case 'RESOLVED':
                return 'Resolved';
            case 'REJECTED':
                return 'Rejected';
            default:
                return status;
        }
    };

    /**
     * Handle status menu open
     */
    const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setStatusMenuAnchor(event.currentTarget);
    };

    /**
     * Handle status menu close
     */
    const handleStatusMenuClose = () => {
        setStatusMenuAnchor(null);
    };

    /**
     * Handle status change
     */
    const handleStatusChange = (newStatus: ComplaintStatus) => {
        onStatusChange(newStatus);
        handleStatusMenuClose();
    };

    /**
     * Toggle expanded state
     */
    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    /**
     * Get citizen initials for avatar
     */
    const getCitizenInitials = (): string => {
        const firstInitial = citizen.firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = citizen.lastName?.charAt(0)?.toUpperCase() || '';
        return `${firstInitial}${lastInitial}`;
    };

    /**
     * Format date
     */
    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const statusOptions: ComplaintStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

    return (
        <Box
            sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
            }}
        >
            {/* Main Header Content */}
            <Box
                sx={{
                    p: { xs: 1.5, sm: 2, md: 2 },
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: { xs: 1.5, sm: 2, md: 2 },
                }}
            >
                {/* Citizen Avatar */}
                <Avatar
                    src={citizen.profilePicture}
                    alt={`${citizen.firstName} ${citizen.lastName}`}
                    sx={{
                        width: isSmallMobile ? 40 : 48,
                        height: isSmallMobile ? 40 : 48,
                        backgroundColor: '#4CAF50',
                        fontSize: isSmallMobile ? '1rem' : '1.25rem',
                        fontWeight: 600,
                    }}
                >
                    {!citizen.profilePicture && getCitizenInitials()}
                </Avatar>

                {/* Header Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Citizen Name */}
                    <Typography
                        variant={isSmallMobile ? 'subtitle2' : 'subtitle1'}
                        sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {citizen.firstName} {citizen.lastName}
                    </Typography>

                    {/* Complaint Info */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                            mb: 0.5,
                        }}
                    >
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {complaint.trackingNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            •
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {complaint.category}
                        </Typography>
                    </Box>

                    {/* Complaint Title */}
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {complaint.title}
                    </Typography>

                    {/* Status Badge */}
                    <Chip
                        label={getStatusLabel(complaint.status)}
                        size="small"
                        sx={{
                            backgroundColor: getStatusColor(complaint.status),
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                        }}
                    />
                </Box>

                {/* Expand/Collapse Button (Mobile) */}
                {isMobile && (
                    <IconButton
                        onClick={toggleExpanded}
                        size="small"
                        sx={{
                            alignSelf: 'flex-start',
                        }}
                    >
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                )}
            </Box>

            {/* Expandable Details Section */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ px: { xs: 1.5, sm: 2, md: 2 }, pb: { xs: 1.5, sm: 2, md: 2 } }}>
                    <Divider sx={{ mb: 2 }} />

                    {/* Location Information */}
                    <Box sx={{ mb: 2 }}>
                        <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Location
                        </Typography>
                    </Box>
                    <Box sx={{ ml: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            {citizen.cityCorporationName || citizen.district}
                            {citizen.thanaName ? `, ${citizen.thanaName}` : `, ${citizen.upazila}`}
                        </Typography>
                        {/* Zone and Ward info */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {citizen.zone && (
                                <Chip
                                    label={`Zone ${citizen.zone}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            )}
                            {citizen.ward && (
                                <Chip
                                    label={`Ward ${citizen.ward}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            )}
                        </Box>
                    </Box>
                    {citizen.address && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                ml: 3,
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                            }}
                        >
                            {citizen.address}
                        </Typography>
                    )}
                </Box>

                {/* Contact Information */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Contact Information
                    </Typography>

                    {/* Phone */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                            {citizen.phone}
                        </Typography>
                    </Box>

                    {/* Email */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {citizen.email}
                        </Typography>
                    </Box>
                </Box>

                {/* Complaint Date */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Submitted on {formatDate(complaint.createdAt)}
                    </Typography>
                </Box>

                {/* Quick Action Buttons */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap',
                    }}
                >
                    {/* View Full Details Button */}
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={onViewDetails}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            flex: isSmallMobile ? '1 1 100%' : '0 1 auto',
                        }}
                    >
                        View Full Details
                    </Button>

                    {/* Change Status Button */}
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleStatusMenuOpen}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            flex: isSmallMobile ? '1 1 100%' : '0 1 auto',
                        }}
                    >
                        Change Status
                    </Button>

                    {/* View History Button */}
                    {onViewHistory && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<HistoryIcon />}
                            onClick={onViewHistory}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                flex: isSmallMobile ? '1 1 100%' : '0 1 auto',
                            }}
                        >
                            View History
                        </Button>
                    )}
                </Box>
            </Collapse >

            {/* Status Change Menu */}
            < Menu
                anchorEl={statusMenuAnchor}
                open={statusMenuOpen}
                onClose={handleStatusMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                {
                    statusOptions.map((status) => (
                        <MenuItem
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            disabled={status === complaint.status}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: getStatusColor(status),
                                }}
                            />
                            <Typography variant="body2">{getStatusLabel(status)}</Typography>
                            {status === complaint.status && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    (Current)
                                </Typography>
                            )}
                        </MenuItem>
                    ))
                }
            </Menu >
        </Box >
    );
};

export default ChatHeader;
