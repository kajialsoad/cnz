import React from 'react';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent,
} from '@mui/lab';
import {
    Paper,
    Typography,
    Box,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Info as InfoIcon,
    Person as PersonIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Login as LoginIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { ActivityLog, getActionLabel, getActionColor } from '../../../types/activityLog.types';
import { format } from 'date-fns';

interface ActivityLogTimelineProps {
    logs: ActivityLog[];
    onLogClick: (log: ActivityLog) => void;
}

const ActivityLogTimeline: React.FC<ActivityLogTimelineProps> = ({ logs, onLogClick }) => {
    // Get icon for action
    const getActionIcon = (action: string) => {
        if (action.startsWith('CREATE')) return <AddIcon />;
        if (action.startsWith('UPDATE')) return <EditIcon />;
        if (action.startsWith('DELETE')) return <DeleteIcon />;
        if (action === 'LOGIN') return <LoginIcon />;
        if (action === 'LOGOUT') return <LogoutIcon />;
        return <PersonIcon />;
    };

    // Format timestamp
    const formatTimestamp = (timestamp: Date) => {
        return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
    };

    // Format relative time
    const formatRelativeTime = (timestamp: Date) => {
        const now = new Date();
        const date = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <Timeline position="right">
            {logs.map((log, index) => (
                <TimelineItem key={log.id}>
                    <TimelineOppositeContent
                        sx={{ m: 'auto 0', minWidth: 150 }}
                        align="right"
                        variant="body2"
                        color="text.secondary"
                    >
                        <Typography variant="caption" display="block">
                            {formatRelativeTime(log.timestamp)}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.disabled">
                            {formatTimestamp(log.timestamp)}
                        </Typography>
                    </TimelineOppositeContent>

                    <TimelineSeparator>
                        <TimelineDot color={getActionColor(log.action) as any}>
                            {getActionIcon(log.action)}
                        </TimelineDot>
                        {index < logs.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>

                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Paper
                            elevation={1}
                            sx={{
                                p: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                    elevation: 3,
                                    backgroundColor: 'action.hover',
                                },
                            }}
                            onClick={() => onLogClick(log)}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box>
                                    <Typography variant="h6" component="span">
                                        {getActionLabel(log.action)}
                                    </Typography>
                                    <Chip
                                        label={log.entityType}
                                        size="small"
                                        sx={{ ml: 1 }}
                                    />
                                </Box>
                                <Tooltip title="View Details">
                                    <IconButton size="small">
                                        <InfoIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            {log.user && (
                                <Typography variant="body2" color="text.secondary">
                                    By: {log.user.firstName} {log.user.lastName}
                                    {log.user.email && ` (${log.user.email})`}
                                </Typography>
                            )}

                            {log.entityId && (
                                <Typography variant="body2" color="text.secondary">
                                    Entity ID: {log.entityId}
                                </Typography>
                            )}

                            {log.ipAddress && (
                                <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1 }}>
                                    IP: {log.ipAddress}
                                </Typography>
                            )}
                        </Paper>
                    </TimelineContent>
                </TimelineItem>
            ))}
        </Timeline>
    );
};

export default ActivityLogTimeline;
