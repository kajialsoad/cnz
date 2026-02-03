import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Grid,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Visibility as ViewIcon,
    CheckCircle as ReadIcon,
    Notifications as NoticeIcon,
    Category as CategoryIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import noticeService from '../../../services/noticeService';
import { NoticeCategory, NoticeAnalytics } from '../../../types/notice.types';
import { fadeIn, slideInUp, animationConfig } from '../../../styles/animations';

interface NoticeAnalyticsDashboardProps {
    categories: NoticeCategory[];
}

const NoticeAnalyticsDashboard: React.FC<NoticeAnalyticsDashboardProps> = ({ categories }) => {
    const [analytics, setAnalytics] = useState<NoticeAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await noticeService.getAnalytics();
            setAnalytics(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!analytics) {
        return (
            <Alert severity="info">No analytics data available</Alert>
        );
    }

    const categoryData = analytics.categoryStats.map((stat) => {
        const category = categories.find((c) => c.id === stat.categoryId);
        return {
            name: category?.name || `Category ${stat.categoryId}`,
            count: stat._count,
            views: stat._sum.viewCount || 0,
            reads: stat._sum.readCount || 0,
            color: category?.color || '#3FA564',
        };
    });

    const typeData = [
        { name: 'Active', value: analytics.activeNotices, color: '#3FA564' },
        { name: 'Expired', value: analytics.expiredNotices, color: '#FF6B6B' },
        { name: 'Urgent', value: analytics.urgentNotices, color: '#FFE66D' },
    ];

    const engagementRate = analytics.totalViews > 0
        ? ((analytics.totalReads / analytics.totalViews) * 100).toFixed(1)
        : '0';

    return (
        <Box
            sx={{
                animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                animationFillMode: 'both',
            }}
        >
            <Typography variant="h6" sx={{ mb: 3 }} fontWeight="bold">
                Notice Analytics Dashboard
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card
                        sx={{
                            color: 'white',
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                            boxShadow: '0 10px 24px rgba(34, 197, 94, 0.25)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 30px rgba(34, 197, 94, 0.35)' },
                            animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                            animationDelay: '50ms',
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <NoticeIcon sx={{ mr: 1 }} />
                                <Typography variant="subtitle2">Total Notices</Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {analytics.totalNotices}
                            </Typography>
                            <Typography variant="caption">
                                {analytics.activeNotices} active
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card
                        sx={{
                            color: 'white',
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)',
                            boxShadow: '0 10px 24px rgba(14, 165, 233, 0.25)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 30px rgba(14, 165, 233, 0.35)' },
                            animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                            animationDelay: '110ms',
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ViewIcon sx={{ mr: 1 }} />
                                <Typography variant="subtitle2">Total Views</Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {analytics.totalViews.toLocaleString()}
                            </Typography>
                            <Typography variant="caption">
                                Across all notices
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card
                        sx={{
                            color: '#1f2937',
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)',
                            boxShadow: '0 10px 24px rgba(251, 191, 36, 0.25)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 30px rgba(251, 191, 36, 0.35)' },
                            animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                            animationDelay: '170ms',
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ReadIcon sx={{ mr: 1 }} />
                                <Typography variant="subtitle2">Total Reads</Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {analytics.totalReads.toLocaleString()}
                            </Typography>
                            <Typography variant="caption">
                                Full content reads
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card
                        sx={{
                            color: 'white',
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                            boxShadow: '0 10px 24px rgba(239, 68, 68, 0.25)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 30px rgba(239, 68, 68, 0.35)' },
                            animation: `${slideInUp} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                            animationDelay: '230ms',
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TrendingUpIcon sx={{ mr: 1 }} />
                                <Typography variant="subtitle2">Engagement Rate</Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {engagementRate}%
                            </Typography>
                            <Typography variant="caption">
                                Read/View ratio
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        sx={{
                            animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                            animationDelay: '80ms',
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                Notice Status Distribution
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={typeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        animationDuration={1200}
                                    >
                                        {typeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        sx={{
                            animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                            animationFillMode: 'both',
                            animationDelay: '120ms',
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                Category Performance
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={categoryData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#3FA564" name="Notices" animationDuration={1100} />
                                    <Bar dataKey="views" fill="#4ECDC4" name="Views" animationDuration={1300} />
                                    <Bar dataKey="reads" fill="#FFE66D" name="Reads" animationDuration={1500} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Card
                sx={{
                    animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                    animationFillMode: 'both',
                    animationDelay: '140ms',
                }}
            >
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Category-wise Statistics
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell>Category</TableCell>
                                    <TableCell align="center">Total Notices</TableCell>
                                    <TableCell align="center">Total Views</TableCell>
                                    <TableCell align="center">Total Reads</TableCell>
                                    <TableCell align="center">Avg Views/Notice</TableCell>
                                    <TableCell align="center">Engagement Rate</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {categoryData.map((cat, index) => {
                                    const avgViews = cat.count > 0 ? (cat.views / cat.count).toFixed(1) : '0';
                                    const catEngagement = cat.views > 0 ? ((cat.reads / cat.views) * 100).toFixed(1) : '0';

                                    return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: '50%',
                                                            bgcolor: cat.color,
                                                        }}
                                                    />
                                                    <Typography fontWeight="medium">{cat.name}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={cat.count} size="small" color="primary" />
                                            </TableCell>
                                            <TableCell align="center">{cat.views.toLocaleString()}</TableCell>
                                            <TableCell align="center">{cat.reads.toLocaleString()}</TableCell>
                                            <TableCell align="center">{avgViews}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={`${catEngagement}%`}
                                                    size="small"
                                                    color={parseFloat(catEngagement) > 50 ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {categoryData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography color="text.secondary">No data available</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Card
                sx={{
                    mt: 3,
                    bgcolor: '#f9f9f9',
                    animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                    animationFillMode: 'both',
                    animationDelay: '180ms',
                }}
            >
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        Summary Insights
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Most Active Category
                                </Typography>
                                <Typography variant="h6" fontWeight="bold">
                                    {categoryData.length > 0
                                        ? categoryData.reduce((prev, current) =>
                                            prev.count > current.count ? prev : current
                                        ).name
                                        : 'N/A'}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Most Viewed Category
                                </Typography>
                                <Typography variant="h6" fontWeight="bold">
                                    {categoryData.length > 0
                                        ? categoryData.reduce((prev, current) =>
                                            prev.views > current.views ? prev : current
                                        ).name
                                        : 'N/A'}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Urgent Notices
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" color="error">
                                    {analytics.urgentNotices} Active
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default NoticeAnalyticsDashboard;


