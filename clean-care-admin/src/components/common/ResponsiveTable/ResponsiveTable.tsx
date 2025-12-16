/**
 * ResponsiveTable Component
 * Displays table on desktop and card view on mobile
 */

import React from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { responsive } from '../../../styles/responsive';

export interface ResponsiveTableProps {
    children: React.ReactNode;
    mobileView?: React.ReactNode;
    hideOnMobile?: boolean;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
    children,
    mobileView,
    hideOnMobile = false,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    if (isMobile && mobileView) {
        return <Box>{mobileView}</Box>;
    }

    if (isMobile && hideOnMobile) {
        return null;
    }

    return (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                ...responsive.responsiveTable,
                ...(isMobile && !hideOnMobile && {
                    display: 'block',
                    overflowX: 'auto',
                }),
            }}
        >
            {children}
        </TableContainer>
    );
};

export default ResponsiveTable;
