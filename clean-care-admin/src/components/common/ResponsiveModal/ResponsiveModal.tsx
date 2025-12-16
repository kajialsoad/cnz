/**
 * ResponsiveModal Component
 * Full-screen modal on mobile, centered dialog on desktop
 */

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Box,
    Typography,
    useMediaQuery,
    useTheme,
    Slide,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import { responsive } from '../../../styles/responsive';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export interface ResponsiveModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    fullWidth?: boolean;
    disableBackdropClick?: boolean;
}

const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
    open,
    onClose,
    title,
    children,
    actions,
    maxWidth = 'md',
    fullWidth = true,
    disableBackdropClick = false,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (disableBackdropClick && reason === 'backdropClick') {
                    return;
                }
                onClose();
            }}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            fullScreen={isMobile}
            TransitionComponent={isMobile ? Transition : undefined}
            sx={{
                ...responsive.responsiveDialog,
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e0e0e0',
                    py: { xs: 2, md: 2.5 },
                    px: { xs: 2, md: 3 },
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        fontSize: { xs: 18, md: 20 },
                    }}
                >
                    {title}
                </Typography>
                <IconButton
                    onClick={onClose}
                    size="large"
                    sx={{
                        minWidth: { xs: 44, md: 40 },
                        minHeight: { xs: 44, md: 40 },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent
                sx={{
                    px: { xs: 2, md: 3 },
                    py: { xs: 2, md: 3 },
                    overflowY: 'auto',
                }}
            >
                {children}
            </DialogContent>

            {/* Actions */}
            {actions && (
                <DialogActions
                    sx={{
                        borderTop: '1px solid #e0e0e0',
                        px: { xs: 2, md: 3 },
                        py: { xs: 2, md: 2.5 },
                        gap: { xs: 1.5, md: 2 },
                        flexDirection: { xs: 'column-reverse', sm: 'row' },
                        '& > button': {
                            width: { xs: '100%', sm: 'auto' },
                            minHeight: { xs: 48, md: 36 },
                        },
                    }}
                >
                    {actions}
                </DialogActions>
            )}
        </Dialog>
    );
};

export default ResponsiveModal;
