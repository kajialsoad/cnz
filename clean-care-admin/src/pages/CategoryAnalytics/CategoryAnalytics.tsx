import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    FileDownload as FileDownloadIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import MainLayout from '../../components/common/Layout/MainLayout';
import CategoryChart from '../../components/Analytics/CategoryChart';
import CategoryStatsTable from '../../components/Analytics/CategoryStatsTable';
import ErrorBoundary from '../../components/common/ErrorBoundary';

/**
 * CategoryAnalytics Page
 * 
 * Displays comprehensive category analytics including:
 * - Pie chart showing category distribution
 * - Detailed statistics table with subcategory breakdown
 * - Date range filtering
 * - Export functionality
 * 
 * Requirements: 8.1, 8.2, 8.3, 15.1, 15.2, 15.3, 15.4
 */
const CategoryAnalytics: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    /**
     * Handle date range reset
     */
    const handleResetDates = () => {
        setStartDate(null);
        setEndDate(null);
        setRefreshKey((prev) => prev + 1);
    };

    /**
     * Handle refresh
     */
    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    /**
     * Handle export (placeholder for now)
     */
    const handleExport = () => {
        // TODO: Implement export functionality
        alert('Export functionality coming soon!');
    };

    // Format dates for API
    const formattedStartDate = startDate ? startDate.toISOString() : undefined;
    const formattedEndDate = endDate ? endDate.toISOString() : undefined;

    return (
        <MainLayout title="Category Analytics">
            <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 1.5, md: 2 } }}>
                {/* Header Section */}
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant={isMobile ? 'h5' : 'h4'}
                        sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}
                    >
                        Category Analytics
                    </Typography>
                    <Typography variant={isMobile ? 'body2' : 'body1'} color="text.secondary">
                        Analyze complaint distribution across categories and subcategories
                    </Typography>
                </Box>

                {/* Filters Section */}
                <Paper
                    sx={{
                        p: { xs: 2, sm: 2.5 },
                        mb: 3,
                        borderRadius: 2,
                        boxShadow: 1,
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Filters
                    </Typography>

                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 2,
                                alignItems: { xs: 'stretch', md: 'flex-start' },
                            }}
                        >
                            {/* Date Pickers */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                    flex: 1,
                                }}
                            >
                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(newValue) => setStartDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: isMobile ? 'small' : 'medium',
                                        },
                                    }}
                                />

                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={(newValue) => setEndDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: isMobile ? 'small' : 'medium',
                                        },
                                    }}
                                    minDate={startDate || undefined}
                                />
                            </Box>

                            {/* Action Buttons */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    flexDirection: { xs: 'column', sm: 'row' },
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleResetDates}
                                    fullWidth={isMobile}
                                    sx={{
                                        textTransform: 'none',
                                        borderColor: '#e0e0e0',
                                        color: 'text.primary',
                                        '&:hover': {
                                            borderColor: '#4CAF50',
                                            color: '#4CAF50',
                                        },
                                    }}
                                >
                                    Reset Dates
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleRefresh}
                                    fullWidth={isMobile}
                                    sx={{
                                        textTransform: 'none',
                                        borderColor: '#4CAF50',
                                        color: '#4CAF50',
                                        '&:hover': {
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                        },
                                    }}
                                >
                                    Refresh
                                </Button>

                                <Button
                                    variant="contained"
                                    startIcon={<FileDownloadIcon />}
                                    onClick={handleExport}
                                    fullWidth={isMobile}
                                    sx={{
                                        textTransform: 'none',
                                        backgroundColor: '#4CAF50',
                                        '&:hover': {
                                            backgroundColor: '#45a049',
                                        },
                                    }}
                                >
                                    Export Report
                                </Button>
                            </Box>
                        </Box>
                    </LocalizationProvider>
                </Paper>

                {/* Analytics Content */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: 3,
                    }}
                >
                    {/* Category Chart */}
                    <Box sx={{ flex: 1 }}>
                        <Paper
                            sx={{
                                p: { xs: 2, sm: 2.5 },
                                borderRadius: 2,
                                boxShadow: 1,
                                height: '100%',
                            }}
                        >
                            <ErrorBoundary>
                                <CategoryChart
                                    key={`chart-${refreshKey}`}
                                    startDate={formattedStartDate}
                                    endDate={formattedEndDate}
                                />
                            </ErrorBoundary>
                        </Paper>
                    </Box>

                    {/* Category Stats Table */}
                    <Box sx={{ flex: 1 }}>
                        <Paper
                            sx={{
                                p: { xs: 2, sm: 2.5 },
                                borderRadius: 2,
                                boxShadow: 1,
                                height: '100%',
                            }}
                        >
                            <ErrorBoundary>
                                <CategoryStatsTable
                                    key={`table-${refreshKey}`}
                                    startDate={formattedStartDate}
                                    endDate={formattedEndDate}
                                />
                            </ErrorBoundary>
                        </Paper>
                    </Box>
                </Box>

                {/* Info Section */}
                <Paper
                    sx={{
                        p: { xs: 2, sm: 2.5 },
                        mt: 3,
                        borderRadius: 2,
                        boxShadow: 1,
                        backgroundColor: '#f8f9fa',
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        About Category Analytics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        This page provides insights into complaint distribution across different categories.
                        Use the date range filters to analyze trends over specific periods. The pie chart
                        shows the overall distribution, while the table provides detailed breakdowns including
                        subcategories. Click on category rows in the table to expand and view subcategory details.
                    </Typography>
                </Paper>
            </Box>
        </MainLayout>
    );
};

export default CategoryAnalytics;
