/**
 * MobileFilterDrawer Component
 * Bottom sheet drawer for filters on mobile devices
 */

import React from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Button,
    Stack,
    Divider,
} from '@mui/material';
import {
    Close as CloseIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import { mobileStyles } from '../../../styles/responsive';

export interface MobileFilterDrawerProps {
    open: boolean;
    onClose: () => void;
    onApply: () => void;
    onClear: () => void;
    title?: string;
    children: React.ReactNode;
    hasActiveFilters?: boolean;
}

const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
    open,
    onClose,
    onApply,
    onClear,
    title = 'Filters',
    children,
    hasActiveFilters = false,
}) => {
    return (
        <Drawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            sx={{
                '& .MuiDrawer-paper': {
                    ...mobileStyles.bottomSheet,
                    pb: 2,
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {title}
                    </Typography>
                    {hasActiveFilters && (
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                            }}
                        />
                    )}
                </Box>
                <IconButton
                    onClick={onClose}
                    size="large"
                    sx={{ minWidth: 44, minHeight: 44 }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Filter Content */}
            <Box
                sx={{
                    p: 2,
                    maxHeight: 'calc(90vh - 140px)',
                    overflowY: 'auto',
                }}
            >
                <Stack spacing={2.5}>{children}</Stack>
            </Box>

            {/* Footer Actions */}
            <Box
                sx={{
                    px: 2,
                    pt: 2,
                    borderTop: '1px solid #e0e0e0',
                }}
            >
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={onClear}
                        sx={{
                            minHeight: 48,
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Clear All
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => {
                            onApply();
                            onClose();
                        }}
                        sx={{
                            minHeight: 48,
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Apply Filters
                    </Button>
                </Stack>
            </Box>
        </Drawer>
    );
};

export default MobileFilterDrawer;


