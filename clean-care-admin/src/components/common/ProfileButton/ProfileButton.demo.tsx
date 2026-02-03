/**
 * ProfileButton Demo
 * Demonstrates different variants and configurations of ProfileButton
 */

import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import ProfileButton from './ProfileButton';

const ProfileButtonDemo: React.FC = () => {
    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
                ProfileButton Component Demo
            </Typography>

            {/* Sidebar Variant - Expanded */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Sidebar Variant - Expanded
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Full profile display with name, role, and status
                </Typography>
                <Box
                    sx={{
                        width: 320,
                        background: 'linear-gradient(180deg, #3FA564 0%, #2D7A4A 100%)',
                        borderRadius: 2,
                    }}
                >
                    <ProfileButton
                        variant="sidebar"
                        showName={true}
                        showRole={true}
                        collapsed={false}
                    />
                </Box>
            </Paper>

            {/* Sidebar Variant - Collapsed */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Sidebar Variant - Collapsed
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Compact view with avatar only (hover for tooltip)
                </Typography>
                <Box
                    sx={{
                        width: 72,
                        background: 'linear-gradient(180deg, #3FA564 0%, #2D7A4A 100%)',
                        borderRadius: 2,
                    }}
                >
                    <ProfileButton
                        variant="sidebar"
                        showName={true}
                        showRole={true}
                        collapsed={true}
                    />
                </Box>
            </Paper>

            <Divider sx={{ my: 4 }} />

            {/* Header Variant - Full */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Header Variant - Full
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Horizontal layout with name and role
                </Typography>
                <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2 }}>
                    <ProfileButton
                        variant="header"
                        showName={true}
                        showRole={true}
                    />
                </Box>
            </Paper>

            {/* Header Variant - Avatar Only */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Header Variant - Avatar Only
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Minimal view for mobile or compact layouts
                </Typography>
                <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2 }}>
                    <ProfileButton
                        variant="header"
                        showName={false}
                        showRole={false}
                    />
                </Box>
            </Paper>

            <Divider sx={{ my: 4 }} />

            {/* Comparison */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Side-by-Side Comparison
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {/* Sidebar Expanded */}
                    <Box>
                        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                            Sidebar - Expanded
                        </Typography>
                        <Box
                            sx={{
                                width: 320,
                                background: 'linear-gradient(180deg, #3FA564 0%, #2D7A4A 100%)',
                                borderRadius: 2,
                            }}
                        >
                            <ProfileButton
                                variant="sidebar"
                                showName={true}
                                showRole={true}
                                collapsed={false}
                            />
                        </Box>
                    </Box>

                    {/* Sidebar Collapsed */}
                    <Box>
                        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                            Sidebar - Collapsed
                        </Typography>
                        <Box
                            sx={{
                                width: 72,
                                background: 'linear-gradient(180deg, #3FA564 0%, #2D7A4A 100%)',
                                borderRadius: 2,
                            }}
                        >
                            <ProfileButton
                                variant="sidebar"
                                showName={true}
                                showRole={true}
                                collapsed={true}
                            />
                        </Box>
                    </Box>

                    {/* Header */}
                    <Box>
                        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                            Header
                        </Typography>
                        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <ProfileButton
                                variant="header"
                                showName={true}
                                showRole={true}
                            />
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Usage Notes */}
            <Paper elevation={2} sx={{ p: 3, mt: 4, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>
                    Usage Notes
                </Typography>
                <Typography variant="body2" component="div">
                    <ul>
                        <li>Click any profile button to open the ProfileModal</li>
                        <li>Sidebar variant is designed for vertical navigation</li>
                        <li>Header variant is designed for horizontal top bar</li>
                        <li>Collapsed state shows tooltip on hover</li>
                        <li>Online indicator appears on all variants</li>
                        <li>Role colors adapt based on user role (ADMIN, SUPER_ADMIN, MASTER_ADMIN)</li>
                    </ul>
                </Typography>
            </Paper>
        </Box>
    );
};

export default ProfileButtonDemo;


