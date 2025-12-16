/**
 * Responsive Design System
 * Mobile-first responsive utilities and breakpoints
 */

import type { Theme } from '@mui/material/styles';

// Breakpoints
export const breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
};

// Responsive utilities
export const responsive = {
    // Hide on mobile
    hideOnMobile: {
        display: { xs: 'none', md: 'block' },
    },

    // Hide on desktop
    hideOnDesktop: {
        display: { xs: 'block', md: 'none' },
    },

    // Stack on mobile, row on desktop
    stackOnMobile: {
        flexDirection: { xs: 'column', md: 'row' },
    },

    // Full width on mobile
    fullWidthOnMobile: {
        width: { xs: '100%', md: 'auto' },
    },

    // Responsive padding
    responsivePadding: {
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
    },

    // Responsive margin
    responsiveMargin: {
        mx: { xs: 1, md: 2 },
        my: { xs: 1, md: 2 },
    },

    // Responsive grid
    responsiveGrid: {
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
        },
        gap: { xs: 1.5, md: 2 },
    },

    // Responsive table
    responsiveTable: {
        display: { xs: 'none', md: 'table' },
    },

    // Card view (mobile alternative to table)
    cardView: {
        display: { xs: 'block', md: 'none' },
    },

    // Touch-friendly button
    touchButton: {
        minHeight: { xs: 44, md: 36 },
        px: { xs: 3, md: 2 },
    },

    // Responsive modal
    responsiveModal: {
        width: { xs: '100%', sm: '90%', md: '600px' },
        maxHeight: { xs: '100vh', md: '90vh' },
        margin: { xs: 0, md: 'auto' },
        borderRadius: { xs: 0, md: 2 },
    },

    // Responsive dialog
    responsiveDialog: {
        '& .MuiDialog-paper': {
            width: { xs: '100%', sm: '90%', md: '600px' },
            maxWidth: { xs: '100%', md: '90vw' },
            margin: { xs: 0, md: 2 },
            borderRadius: { xs: 0, md: 2 },
            maxHeight: { xs: '100vh', md: '90vh' },
        },
    },

    // Responsive form
    responsiveForm: {
        '& .MuiTextField-root': {
            width: '100%',
            mb: { xs: 2, md: 2.5 },
        },
        '& .MuiFormControl-root': {
            width: '100%',
            mb: { xs: 2, md: 2.5 },
        },
    },

    // Responsive search bar
    responsiveSearch: {
        width: { xs: '100%', md: 'auto' },
        minWidth: { md: 300 },
        mb: { xs: 2, md: 0 },
    },

    // Responsive filter bar
    responsiveFilters: {
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 1.5, md: 2 },
        flexWrap: 'wrap',
        '& > *': {
            flex: { xs: '1 1 100%', md: '0 1 auto' },
            minWidth: { xs: '100%', md: 180 },
        },
    },

    // Responsive stats cards
    responsiveStatsGrid: {
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
        },
        gap: { xs: 1.5, md: 2 },
    },

    // Responsive action buttons
    responsiveActions: {
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, md: 1.5 },
        '& > button': {
            width: { xs: '100%', sm: 'auto' },
        },
    },

    // Responsive header
    responsiveHeader: {
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'center' },
        gap: { xs: 2, md: 3 },
        mb: { xs: 2, md: 3 },
    },

    // Responsive sidebar
    responsiveSidebar: {
        width: { xs: '100%', md: 280 },
        position: { xs: 'fixed', md: 'sticky' },
        top: { xs: 0, md: 80 },
        left: { xs: 0, md: 'auto' },
        height: { xs: '100vh', md: 'auto' },
        zIndex: { xs: 1200, md: 'auto' },
    },
};

// Touch-friendly sizes
export const touchSizes = {
    minTouchTarget: 44, // Minimum touch target size (iOS/Android guidelines)
    iconButton: { xs: 44, md: 40 },
    button: { xs: 44, md: 36 },
    input: { xs: 44, md: 40 },
    chip: { xs: 32, md: 28 },
};

// Mobile-specific styles
export const mobileStyles = {
    // Bottom sheet modal (mobile)
    bottomSheet: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '90vh',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
    },

    // Mobile header
    mobileHeader: {
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        px: 2,
        py: 1.5,
    },

    // Mobile card
    mobileCard: {
        borderRadius: 2,
        mb: 1.5,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        '&:active': {
            backgroundColor: '#f5f5f5',
        },
    },

    // Mobile list item
    mobileListItem: {
        py: 2,
        px: 2,
        borderBottom: '1px solid #f0f0f0',
        '&:active': {
            backgroundColor: '#f5f5f5',
        },
    },

    // Mobile fab button
    mobileFab: {
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
    },

    // Mobile drawer
    mobileDrawer: {
        '& .MuiDrawer-paper': {
            width: '85%',
            maxWidth: 320,
        },
    },

    // Mobile table alternative (card list)
    mobileTableCard: {
        mb: 2,
        p: 2,
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        '&:active': {
            backgroundColor: '#f5f5f5',
        },
    },

    // Mobile pagination
    mobilePagination: {
        '& .MuiPagination-ul': {
            flexWrap: 'nowrap',
            justifyContent: 'center',
        },
        '& .MuiPaginationItem-root': {
            minWidth: { xs: 32, md: 36 },
            height: { xs: 32, md: 36 },
        },
    },

    // Mobile filter chip
    mobileFilterChip: {
        height: 36,
        fontSize: 14,
        '& .MuiChip-label': {
            px: 2,
        },
    },

    // Mobile action sheet
    mobileActionSheet: {
        '& .MuiList-root': {
            py: 0,
        },
        '& .MuiListItem-root': {
            minHeight: 56,
            px: 3,
        },
    },
};

// Tablet-specific styles
export const tabletStyles = {
    // Tablet grid
    tabletGrid: {
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
        },
        gap: 2,
    },

    // Tablet sidebar
    tabletSidebar: {
        width: { xs: '100%', sm: 240, md: 280 },
    },
};

// Utility functions
export const isMobile = (theme: Theme) => theme.breakpoints.down('md');
export const isTablet = (theme: Theme) => theme.breakpoints.between('sm', 'md');
export const isDesktop = (theme: Theme) => theme.breakpoints.up('md');

// Media query helpers
export const mediaQueries = {
    mobile: '@media (max-width: 767px)',
    tablet: '@media (min-width: 768px) and (max-width: 1023px)',
    desktop: '@media (min-width: 1024px)',
    touch: '@media (hover: none) and (pointer: coarse)',
};

// Responsive font sizes
export const responsiveFontSizes = {
    h1: { xs: 24, md: 32, lg: 40 },
    h2: { xs: 20, md: 28, lg: 32 },
    h3: { xs: 18, md: 24, lg: 28 },
    h4: { xs: 16, md: 20, lg: 24 },
    h5: { xs: 14, md: 18, lg: 20 },
    h6: { xs: 14, md: 16, lg: 18 },
    body1: { xs: 14, md: 16 },
    body2: { xs: 12, md: 14 },
    caption: { xs: 11, md: 12 },
};

// Responsive spacing
export const responsiveSpacing = {
    xs: { xs: 1, md: 1.5 },
    sm: { xs: 1.5, md: 2 },
    md: { xs: 2, md: 3 },
    lg: { xs: 3, md: 4 },
    xl: { xs: 4, md: 6 },
};

export default responsive;
