/**
 * RoleBadge Component Demo
 * 
 * This file demonstrates all the features of the RoleBadge component:
 * - Role-specific styling (colors, gradients)
 * - Size variants (small, medium, large)
 * - Tooltip with role permissions
 * - Responsive design
 * - Different variants (filled, outlined, gradient)
 * 
 * To use this demo, import it in a page component and render it.
 */

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import RoleBadge from './RoleBadge';

const RoleBadgeDemo: React.FC = () => {
    const roles = ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'];
    const sizes = ['small', 'medium', 'large'] as const;
    const variants = ['filled', 'outlined', 'gradient'] as const;

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
                RoleBadge Component Demo
            </Typography>

            {/* Size Variants */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Size Variants
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {roles.map((role) => (
                        <Box key={role}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                {role}:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                {sizes.map((size) => (
                                    <Box key={size} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                        <RoleBadge role={role} size={size} />
                                        <Typography variant="caption" color="text.secondary">
                                            {size}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Paper>

            {/* Variant Styles */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Variant Styles
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {roles.map((role) => (
                        <Box key={role}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                {role}:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                {variants.map((variant) => (
                                    <Box key={variant} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                        <RoleBadge role={role} variant={variant} />
                                        <Typography variant="caption" color="text.secondary">
                                            {variant}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Paper>

            {/* With/Without Icon */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    With/Without Icon
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {roles.map((role) => (
                        <Box key={role}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                {role}:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                    <RoleBadge role={role} showIcon={true} />
                                    <Typography variant="caption" color="text.secondary">
                                        With Icon
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                    <RoleBadge role={role} showIcon={false} />
                                    <Typography variant="caption" color="text.secondary">
                                        Without Icon
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Paper>

            {/* With/Without Tooltip */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Tooltip Feature (Hover to see permissions)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    {roles.map((role) => (
                        <RoleBadge key={role} role={role} showTooltip={true} variant="gradient" />
                    ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Hover over the badges to see role permissions in the tooltip
                </Typography>
            </Paper>

            {/* Responsive Demo */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Responsive Design
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    The badges automatically adjust their size on mobile devices. Try resizing your browser window to see the responsive behavior.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    {roles.map((role) => (
                        <RoleBadge key={role} role={role} size="large" variant="gradient" />
                    ))}
                </Box>
            </Paper>
        </Box>
    );
};

export default RoleBadgeDemo;


