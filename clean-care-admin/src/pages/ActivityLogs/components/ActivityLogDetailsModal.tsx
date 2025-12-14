import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Divider,
    Grid,
    Paper,
} from '@mui/material';
import { getActionLabel } from '../../../types/activityLog.types';
import type { ActivityLog } from '../../../types/activityLog.types';
import { format } from 'date-fns';

interface ActivityLogDetailsModalProps {
    log: ActivityLog | null;
    open: boolean;
    onClose: () => void;
}

const ActivityLogDetailsModal: React.FC<ActivityLogDetailsModalProps> = ({ log, open, onClose }) => {
    if (!log) return null;

    // Format timestamp
    const formatTimestamp = (timestamp: Date) => {
        return format(new Date(timestamp), 'MMMM dd, yyyy HH:mm:ss');
    };

    // Render JSON value
    const renderValue = (value: any) => {
        if (value === null || value === undefined) {
            return <Typography color="text.disabled">N/A</Typography>;
        }

        if (typeof value === 'object') {
            return (
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto' }}>
                        {JSON.stringify(value, null, 2)}
                    </pre>
                </Paper>
            );
        }

        return <Typography>{String(value)}</Typography>;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">Activity Log Details</Typography>
                    <Chip label={log.action} size="small" />
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Basic Information
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Action:
                                </Typography>
                                <Typography variant="body1">
                                    {getActionLabel(log.action)}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Entity Type:
                                </Typography>
                                <Typography variant="body1">
                                    {log.entityType}
                                </Typography>
                            </Box>

                            {log.entityId && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Entity ID:
                                    </Typography>
                                    <Typography variant="body1">
                                        {log.entityId}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Timestamp:
                                </Typography>
                                <Typography variant="body1">
                                    {formatTimestamp(log.timestamp)}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    {/* User Information */}
                    {log.user && (
                        <>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Performed By
                                </Typography>
                                <Box sx={{ pl: 2 }}>
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Name:
                                        </Typography>
                                        <Typography variant="body1">
                                            {log.user.firstName} {log.user.lastName}
                                        </Typography>
                                    </Box>

                                    {log.user.email && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Email:
                                            </Typography>
                                            <Typography variant="body1">
                                                {log.user.email}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Role:
                                        </Typography>
                                        <Chip label={log.user.role} size="small" />
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider />
                            </Grid>
                        </>
                    )}

                    {/* Technical Information */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Technical Information
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                            {log.ipAddress && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        IP Address:
                                    </Typography>
                                    <Typography variant="body1">
                                        {log.ipAddress}
                                    </Typography>
                                </Box>
                            )}

                            {log.userAgent && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        User Agent:
                                    </Typography>
                                    <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                                        {log.userAgent}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    {/* Old Value */}
                    {log.oldValue && (
                        <>
                            <Grid item xs={12}>
                                <Divider />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Old Value
                                </Typography>
                                <Box sx={{ pl: 2 }}>
                                    {renderValue(log.oldValue)}
                                </Box>
                            </Grid>
                        </>
                    )}

                    {/* New Value */}
                    {log.newValue && (
                        <>
                            <Grid item xs={12}>
                                <Divider />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    New Value
                                </Typography>
                                <Box sx={{ pl: 2 }}>
                                    {renderValue(log.newValue)}
                                </Box>
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ActivityLogDetailsModal;
