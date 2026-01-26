import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Stack,
    TextField,
    Button,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MessageIcon from '@mui/icons-material/Message';
import ReplyIcon from '@mui/icons-material/Reply';
import TimerIcon from '@mui/icons-material/Timer';
import DownloadIcon from '@mui/icons-material/Download';
import { botMessageService } from '../../services/botMessageService';
import type { ChatType, BotAnalyticsResponse } from '../../types/bot-message.types';

interface BotAnalyticsChartProps {
    chatType: ChatType;
}

/**
 * Bot Analytics Chart Component
 * Displays bot performance metrics and analytics
 */
const BotAnalyticsChart: React.FC<BotAnalyticsChartProps> = ({ chatType }) => {
    const [analytics, setAnalytics] = useState<BotAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    /**
     * Load analytics data
     */
    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await botMessageService.getBotAnalytics({
                chatType,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });

            setAnalytics(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load analytics on mount and when chat type changes
     */
    useEffect(() => {
        loadAnalytics();
    }, [chatType]);

    /**
     * Handle date filter
     */
    const handleFilter = () => {
        loadAnalytics();
    };

    /**
     * Handle reset filter
     */
    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setTimeout(() => loadAnalytics(), 0);
    };

    /**
     * Format response time
     */
    const formatResponseTime = (seconds: number): string => {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        } else if (seconds < 3600) {
            return `${Math.round(seconds / 60)}m`;
        } else {
            return `${Math.round(seconds / 3600)}h`;
        }
    };

    /**
     * Export analytics to CSV
     */
    const handleExportCSV = () => {
        if (!analytics) return;

        // Prepare CSV data
        const csvRows: string[] = [];

        // Add header
        csvRows.push('Bot Analytics Report');
        csvRows.push(`Chat Type: ${chatType}`);
        csvRows.push(`Generated: ${new Date().toLocaleString()}`);
        if (startDate || endDate) {
            csvRows.push(`Date Range: ${startDate || 'All'} to ${endDate || 'All'}`);
        }
        csvRows.push(''); // Empty line

        // Add summary metrics
        csvRows.push('Summary Metrics');
        csvRows.push('Metric,Value');
        csvRows.push(`Total Triggers,${analytics.totalTriggers}`);
        csvRows.push(`Admin Reply Rate,${Math.round(analytics.adminReplyRate * 100)}%`);
        csvRows.push(`Average Response Time,${formatResponseTime(analytics.avgResponseTime)}`);
        csvRows.push(''); // Empty line

        // Add step breakdown
        csvRows.push('Step Breakdown');
        csvRows.push('Step,Triggers,Replies,Reply Rate');
        analytics.stepBreakdown.forEach((step) => {
            const replyRate = step.triggers > 0
                ? `${Math.round((step.replies / step.triggers) * 100)}%`
                : 'N/A';
            csvRows.push(`Step ${step.step},${step.triggers},${step.replies},${replyRate}`);
        });

        // Create CSV content
        const csvContent = csvRows.join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `bot-analytics-${chatType}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" onClose={() => setError(null)}>
                {error}
            </Alert>
        );
    }

    if (!analytics) {
        return (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                No analytics data available
            </Typography>
        );
    }

    return (
        <Box>
            {/* Date Range Filter */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mb: 3 }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
            >
                <TextField
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    size="small"
                    slotProps={{
                        inputLabel: { shrink: true }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                        }
                    }}
                />
                <TextField
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    size="small"
                    slotProps={{
                        inputLabel: { shrink: true }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                        }
                    }}
                />
                <Button
                    variant="contained"
                    onClick={handleFilter}
                    size="small"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                    }}
                >
                    Filter
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleReset}
                    size="small"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                    }}
                >
                    Reset
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleExportCSV}
                    size="small"
                    startIcon={<DownloadIcon />}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                    }}
                >
                    Export CSV
                </Button>
            </Stack>

            {/* Metrics Cards */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)',
                    },
                    gap: 3,
                    mb: 3,
                }}
            >
                {/* Total Triggers */}
                <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    bgcolor: 'primary.light',
                                    color: 'primary.main',
                                    p: 1.5,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <MessageIcon fontSize="large" />
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={700}>
                                    {analytics.totalTriggers}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                    Total Triggers
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Admin Reply Rate */}
                <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    bgcolor: 'success.light',
                                    color: 'success.main',
                                    p: 1.5,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <ReplyIcon fontSize="large" />
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={700}>
                                    {Math.round(analytics.adminReplyRate * 100)}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                    Reply Rate
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Average Response Time */}
                <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    bgcolor: 'warning.light',
                                    color: 'warning.main',
                                    p: 1.5,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <TimerIcon fontSize="large" />
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={700}>
                                    {formatResponseTime(analytics.avgResponseTime)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                    Avg Response
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Effectiveness */}
                <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    bgcolor: 'info.light',
                                    color: 'info.main',
                                    p: 1.5,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <TrendingUpIcon fontSize="large" />
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={700}>
                                    {analytics.adminReplyRate > 0.7 ? 'High' : analytics.adminReplyRate > 0.4 ? 'Medium' : 'Low'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                    Effectiveness
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>

            {/* Step Breakdown */}
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                        Step Breakdown
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{
                                    borderBottom: '2px solid #e0e0e0',
                                    backgroundColor: '#f5f5f5'
                                }}>
                                    <th style={{
                                        padding: '16px 12px',
                                        textAlign: 'left',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}>
                                        Step
                                    </th>
                                    <th style={{
                                        padding: '16px 12px',
                                        textAlign: 'right',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}>
                                        Triggers
                                    </th>
                                    <th style={{
                                        padding: '16px 12px',
                                        textAlign: 'right',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}>
                                        Replies
                                    </th>
                                    <th style={{
                                        padding: '16px 12px',
                                        textAlign: 'right',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}>
                                        Reply Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.stepBreakdown.map((step, index) => (
                                    <tr
                                        key={step.step}
                                        style={{
                                            borderBottom: '1px solid #f0f0f0',
                                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                                        }}
                                    >
                                        <td style={{
                                            padding: '14px 12px',
                                            fontWeight: 600,
                                        }}>
                                            Step {step.step}
                                        </td>
                                        <td style={{
                                            padding: '14px 12px',
                                            textAlign: 'right',
                                            fontWeight: 500,
                                        }}>
                                            {step.triggers}
                                        </td>
                                        <td style={{
                                            padding: '14px 12px',
                                            textAlign: 'right',
                                            fontWeight: 500,
                                        }}>
                                            {step.replies}
                                        </td>
                                        <td style={{
                                            padding: '14px 12px',
                                            textAlign: 'right',
                                            fontWeight: 600,
                                            color: step.triggers > 0
                                                ? (step.replies / step.triggers) > 0.7
                                                    ? '#2e7d32'
                                                    : (step.replies / step.triggers) > 0.4
                                                        ? '#ed6c02'
                                                        : '#d32f2f'
                                                : '#666',
                                        }}>
                                            {step.triggers > 0
                                                ? `${Math.round((step.replies / step.triggers) * 100)}%`
                                                : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default BotAnalyticsChart;
