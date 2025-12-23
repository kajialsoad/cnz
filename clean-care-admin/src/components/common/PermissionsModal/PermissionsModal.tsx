import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Switch,
    FormControlLabel,
    Divider,
    Alert,
    Chip,
    FormGroup,
    Paper,
    Grid,
} from '@mui/material';
import {
    Visibility,
    Edit,
    Delete,
    Add,
    Message,
    Assessment,
    Download,
    CheckCircle,
    Cancel,
    Pending,
} from '@mui/icons-material';

export interface PermissionFeatures {
    // Complaint Management
    canViewComplaints: boolean;
    canApproveComplaints: boolean;
    canRejectComplaints: boolean;
    canMarkComplaintsPending: boolean;
    canEditComplaints: boolean;
    canDeleteComplaints: boolean;

    // User Management
    canViewUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canAddUsers: boolean;

    // Admin Management
    canViewAdmins: boolean;
    canEditAdmins: boolean;
    canDeleteAdmins: boolean;
    canAddAdmins: boolean;

    // Messaging
    canViewMessages: boolean;
    canSendMessagesToUsers: boolean;
    canSendMessagesToAdmins: boolean;

    // Analytics & Reports
    canViewAnalytics: boolean;
    canExportData: boolean;
    canDownloadReports: boolean;

    // View Only Mode
    viewOnlyMode: boolean;
}

export interface Permissions {
    zones: number[];
    wards: number[];
    categories: string[];
    features: PermissionFeatures;
}

interface PermissionsModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (permissions: Permissions) => void;
    initialPermissions: Permissions;
    userRole: 'ADMIN' | 'SUPER_ADMIN' | 'MASTER_ADMIN';
    title?: string;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({
    open,
    onClose,
    onSave,
    initialPermissions,
    userRole,
    title = 'Edit Permissions',
}) => {
    const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
    const [viewOnlyMode, setViewOnlyMode] = useState(initialPermissions.features.viewOnlyMode);

    useEffect(() => {
        setPermissions(initialPermissions);
        setViewOnlyMode(initialPermissions.features.viewOnlyMode);
    }, [initialPermissions, open]);

    const handleViewOnlyToggle = (checked: boolean) => {
        setViewOnlyMode(checked);

        if (checked) {
            // View Only Mode: Disable all action permissions
            setPermissions(prev => ({
                ...prev,
                features: {
                    // Complaint Management - View only
                    canViewComplaints: true,
                    canApproveComplaints: false,
                    canRejectComplaints: false,
                    canMarkComplaintsPending: false,
                    canEditComplaints: false,
                    canDeleteComplaints: false,

                    // User Management - View only
                    canViewUsers: true,
                    canEditUsers: false,
                    canDeleteUsers: false,
                    canAddUsers: false,

                    // Admin Management - View only
                    canViewAdmins: true,
                    canEditAdmins: false,
                    canDeleteAdmins: false,
                    canAddAdmins: false,

                    // Messaging - View only
                    canViewMessages: true,
                    canSendMessagesToUsers: false,
                    canSendMessagesToAdmins: false,

                    // Analytics & Reports - Disabled
                    canViewAnalytics: false,
                    canExportData: false,
                    canDownloadReports: false,

                    // View Only Mode
                    viewOnlyMode: true,
                },
            }));
        } else {
            // Enable default permissions based on role
            setPermissions(prev => ({
                ...prev,
                features: {
                    ...prev.features,
                    viewOnlyMode: false,
                },
            }));
        }
    };

    const handleFeatureToggle = (feature: keyof PermissionFeatures) => {
        if (viewOnlyMode) return; // Don't allow changes in view-only mode

        setPermissions(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [feature]: !prev.features[feature],
            },
        }));
    };

    const handleSave = () => {
        onSave(permissions);
        onClose();
    };

    const handleCancel = () => {
        setPermissions(initialPermissions);
        setViewOnlyMode(initialPermissions.features.viewOnlyMode);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '600px' }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">{title}</Typography>
                    <Chip
                        label={userRole.replace('_', ' ')}
                        color="primary"
                        size="small"
                    />
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ mb: 3 }}>
                    {/* View Only Mode Toggle */}
                    <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: viewOnlyMode ? '#fff3e0' : '#e3f2fd' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={viewOnlyMode}
                                    onChange={(e) => handleViewOnlyToggle(e.target.checked)}
                                    color="warning"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        View Only Mode
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {viewOnlyMode
                                            ? 'শুধু দেখতে পারবে - কোনো action নিতে পারবে না'
                                            : 'Full permissions - সকল action নিতে পারবে'}
                                    </Typography>
                                </Box>
                            }
                        />

                        {viewOnlyMode && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    <strong>View Only Mode Enabled:</strong>
                                    <br />
                                    • User List দেখবে
                                    <br />
                                    • Admin List দেখবে
                                    <br />
                                    • Complaint দেখবে
                                    <br />
                                    • কোনো Edit, Add, Delete, Approve, Reject করতে পারবে না
                                    <br />
                                    • Report Download করতে পারবে না
                                </Typography>
                            </Alert>
                        )}
                    </Paper>

                    {/* Advanced Permissions - Only show when View Only Mode is disabled */}
                    {!viewOnlyMode && (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                                Advanced Permissions
                            </Typography>

                            {/* Complaint Management */}
                            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    <CheckCircle sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                                    Complaint Management
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canViewComplaints}
                                                    onChange={() => handleFeatureToggle('canViewComplaints')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Visibility sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">View Complaints</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canApproveComplaints}
                                                    onChange={() => handleFeatureToggle('canApproveComplaints')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <CheckCircle sx={{ mr: 1, fontSize: 18, color: 'success.main' }} />
                                                    <Typography variant="body2">Approve Complaints</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canRejectComplaints}
                                                    onChange={() => handleFeatureToggle('canRejectComplaints')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Cancel sx={{ mr: 1, fontSize: 18, color: 'error.main' }} />
                                                    <Typography variant="body2">Reject Complaints</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canMarkComplaintsPending}
                                                    onChange={() => handleFeatureToggle('canMarkComplaintsPending')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Pending sx={{ mr: 1, fontSize: 18, color: 'warning.main' }} />
                                                    <Typography variant="body2">Mark as Pending</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canEditComplaints}
                                                    onChange={() => handleFeatureToggle('canEditComplaints')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Edit sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">Edit Complaints</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canDeleteComplaints}
                                                    onChange={() => handleFeatureToggle('canDeleteComplaints')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Delete sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">Delete Complaints</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* User Management */}
                            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    <Visibility sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                                    User Management
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canViewUsers}
                                                    onChange={() => handleFeatureToggle('canViewUsers')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Visibility sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">View Users</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canAddUsers}
                                                    onChange={() => handleFeatureToggle('canAddUsers')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Add sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">Add Users</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canEditUsers}
                                                    onChange={() => handleFeatureToggle('canEditUsers')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Edit sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">Edit Users</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canDeleteUsers}
                                                    onChange={() => handleFeatureToggle('canDeleteUsers')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Delete sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">Delete Users</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Admin Management */}
                            {(userRole === 'SUPER_ADMIN' || userRole === 'MASTER_ADMIN') && (
                                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        <Visibility sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                                        Admin Management
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={2}>
                                        <Grid xs={12} sm={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={permissions.features.canViewAdmins}
                                                        onChange={() => handleFeatureToggle('canViewAdmins')}
                                                        size="small"
                                                    />
                                                }
                                                label={
                                                    <Box display="flex" alignItems="center">
                                                        <Visibility sx={{ mr: 1, fontSize: 18 }} />
                                                        <Typography variant="body2">View Admins</Typography>
                                                    </Box>
                                                }
                                            />
                                        </Grid>
                                        <Grid xs={12} sm={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={permissions.features.canAddAdmins}
                                                        onChange={() => handleFeatureToggle('canAddAdmins')}
                                                        size="small"
                                                    />
                                                }
                                                label={
                                                    <Box display="flex" alignItems="center">
                                                        <Add sx={{ mr: 1, fontSize: 18 }} />
                                                        <Typography variant="body2">Add Admins</Typography>
                                                    </Box>
                                                }
                                            />
                                        </Grid>
                                        <Grid xs={12} sm={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={permissions.features.canEditAdmins}
                                                        onChange={() => handleFeatureToggle('canEditAdmins')}
                                                        size="small"
                                                    />
                                                }
                                                label={
                                                    <Box display="flex" alignItems="center">
                                                        <Edit sx={{ mr: 1, fontSize: 18 }} />
                                                        <Typography variant="body2">Edit Admins</Typography>
                                                    </Box>
                                                }
                                            />
                                        </Grid>
                                        <Grid xs={12} sm={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={permissions.features.canDeleteAdmins}
                                                        onChange={() => handleFeatureToggle('canDeleteAdmins')}
                                                        size="small"
                                                    />
                                                }
                                                label={
                                                    <Box display="flex" alignItems="center">
                                                        <Delete sx={{ mr: 1, fontSize: 18 }} />
                                                        <Typography variant="body2">Delete Admins</Typography>
                                                    </Box>
                                                }
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            )}

                            {/* Messaging */}
                            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    <Message sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                                    Messaging
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canViewMessages}
                                                    onChange={() => handleFeatureToggle('canViewMessages')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Visibility sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">View Messages</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canSendMessagesToUsers}
                                                    onChange={() => handleFeatureToggle('canSendMessagesToUsers')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Message sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">Message to Users</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canSendMessagesToAdmins}
                                                    onChange={() => handleFeatureToggle('canSendMessagesToAdmins')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Message sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">Message to Admins</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Analytics & Reports */}
                            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    <Assessment sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                                    Analytics & Reports
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canViewAnalytics}
                                                    onChange={() => handleFeatureToggle('canViewAnalytics')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Assessment sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">View Analytics</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canExportData}
                                                    onChange={() => handleFeatureToggle('canExportData')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Download sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">Export Data</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={permissions.features.canDownloadReports}
                                                    onChange={() => handleFeatureToggle('canDownloadReports')}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box display="flex" alignItems="center">
                                                    <Download sx={{ mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2">Download Reports</Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleCancel} color="inherit">
                    Cancel
                </Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Save Permissions
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PermissionsModal;
