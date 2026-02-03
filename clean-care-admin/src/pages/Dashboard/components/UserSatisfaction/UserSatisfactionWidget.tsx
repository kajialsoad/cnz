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
    Avatar,
    Rating,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import axios from 'axios';
import { API_CONFIG } from '../../../../config/apiConfig';
import { formatDistanceToNow } from 'date-fns';

interface UserSatisfactionWidgetProps {
    cityCorporationCode?: string;
    zoneId?: number;
    wardId?: number;
    startDate?: string;
    endDate?: string;
}

interface RatingDistribution {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
}

interface RecentReview {
    id: number;
    rating: number;
    comment: string | null;
    createdAt: string;
    complaint: {
        id: number;
        title: string;
    };
    user: {
        firstName: string;
        lastName: string;
    };
}

interface UserSatisfactionData {
    averageRating: number;
    totalReviews: number;
    reviewPercentage: number;
    ratingDistribution: RatingDistribution;
    recentReviews: RecentReview[];
}

const UserSatisfactionWidget: React.FC<UserSatisfactionWidgetProps> = ({
    cityCorporationCode,
    zoneId,
    wardId,
    startDate,
    endDate,
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<UserSatisfactionData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('accessToken');
                const params: any = {};

                if (cityCorporationCode) params.cityCorporationCode = cityCorporationCode;
                if (zoneId) params.zoneId = zoneId;
                if (wardId) params.wardId = wardId;
                if (startDate) params.startDate = startDate;
                if (endDate) params.endDate = endDate;

                const response = await axios.get(
                    `${API_CONFIG.BASE_URL}/api/admin/complaints/analytics/reviews`,
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
                    setError('Failed to load user satisfaction data');
                }
            } catch (err) {
                console.error('Error fetching user satisfaction data:', err);
                setError('Failed to load user satisfaction data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [cityCorporationCode, zoneId, wardId, startDate, endDate]);

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

    // Prepare data for rating distribution chart
    const ratingColors = ['#F44336', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'];
    const distributionChartData = [
        { rating: '5★', count: data.ratingDistribution[5], color: ratingColors[4] },
        { rating: '4★', count: data.ratingDistribution[4], color: ratingColors[3] },
        { rating: '3★', count: data.ratingDistribution[3], color: ratingColors[2] },
        { rating: '2★', count: data.ratingDistribution[2], color: ratingColors[1] },
        { rating: '1★', count: data.ratingDistribution[1], color: ratingColors[0] },
    ];

    // Calculate percentages for distribution
    const totalRatings = Object.values(data.ratingDistribution).reduce((sum, count) => sum + count, 0);
    const getPercentage = (count: number) => {
        return totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
    };

    // Get user initials for avatar
    const getUserInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    // Format relative time
    const formatRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Box
                        sx={{
                            width: 20,
                            height: 20,
                            bgcolor: '#4CAF50',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                            ⭐
                        </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                        User Satisfaction
                    </Typography>
                </Box>

                {/* Average Rating Display */}
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                            {data.averageRating.toFixed(1)}
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#6B7280' }}>
                            / 5.0
                        </Typography>
                    </Box>
                    <Rating
                        value={data.averageRating}
                        precision={0.1}
                        readOnly
                        size="large"
                        sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        {data.totalReviews} {data.totalReviews === 1 ? 'review' : 'reviews'} ({data.reviewPercentage}% of resolved)
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Rating Distribution */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
                        Rating Distribution
                    </Typography>

                    {/* Distribution Bars */}
                    <Box sx={{ mb: 2 }}>
                        {distributionChartData.map((item, index) => {
                            const percentage = getPercentage(item.count);
                            return (
                                <Box key={index} sx={{ mb: 1.5 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 0.5,
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: '#374151', minWidth: 30 }}>
                                            {item.rating}
                                        </Typography>
                                        <Box
                                            sx={{
                                                flex: 1,
                                                mx: 2,
                                                height: 8,
                                                bgcolor: '#F3F4F6',
                                                borderRadius: 1,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    height: '100%',
                                                    width: `${percentage}%`,
                                                    bgcolor: item.color,
                                                    transition: 'width 0.3s ease',
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="body2" sx={{ color: '#6B7280', minWidth: 60, textAlign: 'right' }}>
                                            {item.count} ({percentage}%)
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>

                    {/* Bar Chart */}
                    <Box sx={{ height: 200, mt: 2, minHeight: 200, position: 'relative', width: '100%', minWidth: 0 }}>
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart data={distributionChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                                <YAxis
                                    dataKey="rating"
                                    type="category"
                                    tick={{ fontSize: 11, fill: '#6B7280' }}
                                    width={40}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {distributionChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Recent Reviews */}
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
                        Recent Reviews
                    </Typography>
                    {data.recentReviews.length > 0 ? (
                        <List sx={{ p: 0 }}>
                            {data.recentReviews.slice(0, 5).map((review, index) => (
                                <ListItem
                                    key={review.id}
                                    sx={{
                                        px: 0,
                                        py: 2,
                                        borderBottom:
                                            index < Math.min(data.recentReviews.length, 5) - 1
                                                ? '1px solid #F3F4F6'
                                                : 'none',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            bgcolor: '#4CAF50',
                                            mr: 2,
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {getUserInitials(review.user.firstName, review.user.lastName)}
                                    </Avatar>
                                    <ListItemText
                                        primary={
                                            <Box>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                                                        {review.user.firstName} {review.user.lastName}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                                        {formatRelativeTime(review.createdAt)}
                                                    </Typography>
                                                </Box>
                                                <Rating value={review.rating} size="small" readOnly sx={{ mb: 0.5 }} />
                                                {review.comment && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: '#6B7280',
                                                            fontStyle: 'italic',
                                                            mt: 0.5,
                                                            wordBreak: 'break-word',
                                                        }}
                                                    >
                                                        "{review.comment}"
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 0.5, display: 'block' }}>
                                                    Complaint #{review.complaint.id}
                                                </Typography>
                                            </Box>
                                        }
                                        primaryTypographyProps={{ component: 'div' }}
                                        sx={{ my: 0 }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: 4,
                                bgcolor: '#F9FAFB',
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="body2" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                                No reviews yet
                            </Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default UserSatisfactionWidget;


