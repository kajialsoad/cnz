import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    useTheme,
    useMediaQuery,
    Paper,
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { analyticsService } from '../../services/analyticsService';

interface CategoryChartProps {
    startDate?: string;
    endDate?: string;
}

/**
 * CategoryChart Component
 * 
 * Displays a pie chart showing the distribution of complaints across categories.
 * Uses category colors from the backend configuration.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
const CategoryChart: React.FC<CategoryChartProps> = ({ startDate, endDate }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [totalComplaints, setTotalComplaints] = useState(0);

    useEffect(() => {
        fetchCategoryStatistics();
    }, [startDate, endDate]);

    const fetchCategoryStatistics = async () => {
        try {
            setLoading(true);
            setError(null);

            const query: any = {};
            if (startDate) query.startDate = startDate;
            if (endDate) query.endDate = endDate;

            const statistics = await analyticsService.getCategoryStats(query);

            // Convert to chart data
            const data = statistics.map((stat: any) => ({
                name: stat.categoryNameEn,
                value: stat.totalCount,
                color: stat.categoryColor,
                percentage: stat.percentage,
            }));

            // Sort by count descending
            data.sort((a: any, b: any) => b.value - a.value);

            // Calculate total
            const total = statistics.reduce((sum: number, s: any) => sum + s.totalCount, 0);

            setChartData(data);
            setTotalComplaints(total);
        } catch (err: any) {
            console.error('Error fetching category statistics:', err);
            setError(err.message || 'Failed to load category statistics');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Custom label for pie chart
     */
    const renderCustomLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
    }: any) => {
        if (percent < 0.05) return null; // Don't show label for slices < 5%

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: 'bold' }}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    /**
     * Custom tooltip
     */
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Paper
                    sx={{
                        p: 1.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: `2px solid ${data.color}`,
                        boxShadow: 2,
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {data.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Count: {data.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Percentage: {data.percentage.toFixed(1)}%
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 300,
                }}
            >
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

    if (chartData.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 300,
                    p: 3,
                }}
            >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Data Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    No complaints found for the selected period
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Complaints by Category
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Total: {totalComplaints} complaints
                </Typography>
            </Box>

            {/* Chart */}
            <ResponsiveContainer
                width="100%"
                height={isMobile ? 300 : isTablet ? 350 : 400}
                minWidth={250}
                minHeight={isMobile ? 300 : isTablet ? 350 : 400}
            >
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={isMobile ? 80 : isTablet ? 100 : 120}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value, entry: any) => (
                            <span style={{ fontSize: isMobile ? '12px' : '14px' }}>
                                {value} ({entry.payload.value})
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default CategoryChart;
