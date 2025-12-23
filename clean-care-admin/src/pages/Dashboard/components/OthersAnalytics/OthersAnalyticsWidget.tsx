import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    CircularProgress as LoadingSpinner,
    Alert,
    Chip,
    Divider,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
} from 'recharts';
import axios from 'axios';
import { API_CONFIG } from '../../../../config/apiConfig';

interface OthersAnalyticsWidgetProps {
    cityCorporationCode?: string;
    zoneId?: number;
    startDate?: string;
    endDate?: string;
}

interface OthersAnalyticsData {
    totalOthers: number;
    byCategory: {
        CORPORATION_INTERNAL: number;
        CORPORATION_EXTERNAL: number;
    };
    bySubcategory: Record<string, number>;
    topSubcategories: Array<{
        subcategory: string;
        count: number;
    }>;
    averageResolutionTime: {
        overall: number;
        bySubcategory: Record<string, number>;
    };
    trend: Array<{
        date: string;
        count: number;
    }>;
}

const OthersAnalyticsWidget: React.FC<OthersAnalyticsWidgetProps> = ({
    cityCorporationCode,
    zoneId,
    startDate,
    endDate,
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<OthersAnalyticsData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('accessToken');
                const params: any = {};

                if (cityCorporationCode) params.cityCorporationCode = cityCorporationCode;
                if (zoneId) params.zoneId = zoneId;
                if (startDate) params.startDate = startDate;
                if (endDate) params.endDate = endDate;

                const response = await axios.get(
                    `${API_CONFIG.BASE_URL}/api/admin/complaints/analytics/others`,
                    {
                        params,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        withCredentials: true,
                    }
                );

                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError('Failed to load Others analytics');
                }
            } catch (err) {
                console.error('Error fetching Others analytics:', err);
                setError('Failed to load Others analytics. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [cityCorporationCode, zoneId, startDate, endDate]);

    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent
                    sx={{
                        p: 3,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 400,
                    }}
                >
                    <LoadingSpinner />
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                    <Alert severity="error">{error || 'No data available'}</Alert>
                </CardContent>
            </Card>
        );
    }

    // Calculate percentages for category breakdown
    const internalPercentage =
        data.totalOthers > 0
            ? Math.round((data.byCategory.CORPORATION_INTERNAL / data.totalOthers) * 100)
            : 0;
    const externalPercentage =
        data.totalOthers > 0
            ? Math.round((data.byCategory.CORPORATION_EXTERNAL / data.totalOthers) * 100)
            : 0;

    // Prepare data for top subcategories chart
    const topSubcategoriesChartData = data.topSubcategories.map((item) => ({
        name: item.subcategory,
        count: item.count,
    }));

    // Prepare data for trend chart (last 7 days for better visibility)
    const trendChartData = data.trend.slice(-7).map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }),
        count: item.count,
    }));

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Box
                        sx={{
                            width: 20,
                            height: 20,
                            bgcolor: '#9C27B0',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                            📊
                        </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                        Others Complaints Breakdown
                    </Typography>
                </Box>

                {/* Total Others Count */}
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#9C27B0' }}>
                        {data.totalOthers}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        Total Others Complaints
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Category Breakdown */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
                        Category Breakdown
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2" sx={{ color: '#374151' }}>
                                    Corporation Internal
                                </Typography>
                                <Chip
                                    label={`${internalPercentage}%`}
                                    size="small"
                                    sx={{
                                        bgcolor: '#FF9800',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                    }}
                                />
                            </Box>
                            <Box
                                sx={{
                                    height: 8,
                                    bgcolor: '#F3F4F6',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        height: '100%',
                                        width: `${internalPercentage}%`,
                                        bgcolor: '#FF9800',
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#6B7280', mt: 0.5 }}>
                                {data.byCategory.CORPORATION_INTERNAL} complaints
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2" sx={{ color: '#374151' }}>
                                    Corporation External
                                </Typography>
                                <Chip
                                    label={`${externalPercentage}%`}
                                    size="small"
                                    sx={{
                                        bgcolor: '#673AB7',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                    }}
                                />
                            </Box>
                            <Box
                                sx={{
                                    height: 8,
                                    bgcolor: '#F3F4F6',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        height: '100%',
                                        width: `${externalPercentage}%`,
                                        bgcolor: '#673AB7',
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#6B7280', mt: 0.5 }}>
                                {data.byCategory.CORPORATION_EXTERNAL} complaints
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Top Subcategories */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
                        Top Departments/Agencies
                    </Typography>
                    {data.topSubcategories.length > 0 ? (
                        <>
                            <List sx={{ p: 0, mb: 2 }}>
                                {data.topSubcategories.map((item, index) => (
                                    <ListItem
                                        key={index}
                                        sx={{
                                            px: 0,
                                            py: 1,
                                            borderBottom:
                                                index < data.topSubcategories.length - 1
                                                    ? '1px solid #F3F4F6'
                                                    : 'none',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                bgcolor: '#9C27B0',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                mr: 2,
                                            }}
                                        >
                                            {index + 1}
                                        </Box>
                                        <ListItemText
                                            primary={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                                                        {item.subcategory}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#9C27B0' }}>
                                                        {item.count} complaints
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ my: 0 }}
                                        />
                                    </ListItem>
                                ))}
                            </List>

                            {/* Bar Chart for Top Subcategories */}
                            <Box sx={{ mt: 2, height: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topSubcategoriesChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: '#6B7280' }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Bar dataKey="count" fill="#9C27B0" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </>
                    ) : (
                        <Typography variant="body2" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                            No subcategory data available
                        </Typography>
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Average Resolution Time */}
                {data.averageResolutionTime.overall > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
                            Average Resolution Time
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 2,
                                bgcolor: '#F9FAFB',
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#9C27B0', mr: 1 }}>
                                {data.averageResolutionTime.overall.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                hours
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Trend Chart (Last 7 Days) */}
                {trendChartData.length > 0 && trendChartData.some((d) => d.count > 0) && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
                                7-Day Trend
                            </Typography>
                            <Box sx={{ height: 180 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                                        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#9C27B0"
                                            strokeWidth={2}
                                            dot={{ fill: '#9C27B0', r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name="Others Complaints"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default OthersAnalyticsWidget;
