import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    Collapse,
    useTheme,
    useMediaQuery,
    TableSortLabel,
} from '@mui/material';
import {
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { analyticsService } from '../../services/analyticsService';
import type { CategoryStatistic } from '../../types/category-service.types';

interface CategoryStatsTableProps {
    startDate?: string;
    endDate?: string;
    zoneId?: number;
}

type SortField = 'category' | 'count' | 'percentage';
type SortOrder = 'asc' | 'desc';

/**
 * CategoryStatsTable Component
 * 
 * Displays a table showing category statistics with subcategory breakdown.
 * Supports sorting and expandable rows for subcategories.
 * 
 * Requirements: 8.2, 8.3, 8.5
 */
const CategoryStatsTable: React.FC<CategoryStatsTableProps> = ({ startDate, endDate, zoneId }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statistics, setStatistics] = useState<CategoryStatistic[]>([]);
    const [totalComplaints, setTotalComplaints] = useState(0);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [sortField, setSortField] = useState<SortField>('count');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    useEffect(() => {
        fetchCategoryStatistics();
    }, [startDate, endDate, zoneId]);

    const fetchCategoryStatistics = async () => {
        try {
            setLoading(true);
            setError(null);

            const query: any = {};
            if (startDate) query.startDate = startDate;
            if (endDate) query.endDate = endDate;
            if (zoneId) query.zoneId = zoneId;

            const statistics = await analyticsService.getCategoryStats(query);
            setStatistics(statistics);

            // Calculate total
            const total = statistics.reduce((sum: number, s: any) => sum + s.totalCount, 0);
            setTotalComplaints(total);
        } catch (err: any) {
            console.error('Error fetching category statistics:', err);
            setError(err.message || 'Failed to load category statistics');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Toggle row expansion
     */
    const handleToggleRow = (categoryId: string) => {
        setExpandedRows((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    /**
     * Handle sort
     */
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    /**
     * Apply sorting
     */
    const sortedStats = React.useMemo(() => {
        let result = [...statistics];

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'category':
                    comparison = a.categoryNameEn.localeCompare(b.categoryNameEn);
                    break;
                case 'count':
                    comparison = a.totalCount - b.totalCount;
                    break;
                case 'percentage':
                    comparison = a.percentage - b.percentage;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [statistics, sortField, sortOrder]);

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

    if (sortedStats.length === 0) {
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
                    Category Statistics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Detailed breakdown by category and subcategory
                </Typography>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                <Table size={isMobile ? 'small' : 'medium'}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ width: 50 }} />
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'category'}
                                    direction={sortField === 'category' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('category')}
                                >
                                    Category
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                                <TableSortLabel
                                    active={sortField === 'count'}
                                    direction={sortField === 'count' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('count')}
                                >
                                    Count
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                                <TableSortLabel
                                    active={sortField === 'percentage'}
                                    direction={sortField === 'percentage' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('percentage')}
                                >
                                    Percentage
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedStats.map((stat) => (
                            <React.Fragment key={stat.category}>
                                {/* Category Row */}
                                <TableRow
                                    hover
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: '#f9f9f9',
                                        },
                                    }}
                                    onClick={() => handleToggleRow(stat.category)}
                                >
                                    <TableCell>
                                        <IconButton size="small">
                                            {expandedRows.has(stat.category) ? (
                                                <KeyboardArrowUpIcon />
                                            ) : (
                                                <KeyboardArrowDownIcon />
                                            )}
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label={stat.categoryNameEn}
                                                size="small"
                                                sx={{
                                                    backgroundColor: stat.categoryColor,
                                                    color: '#fff',
                                                    fontWeight: 500,
                                                }}
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {stat.totalCount}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {stat.percentage.toFixed(1)}%
                                        </Typography>
                                    </TableCell>
                                </TableRow>

                                {/* Subcategory Rows */}
                                <TableRow>
                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                                        <Collapse
                                            in={expandedRows.has(stat.category)}
                                            timeout="auto"
                                            unmountOnExit
                                        >
                                            <Box sx={{ py: 2, pl: 6, backgroundColor: '#fafafa' }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
                                                >
                                                    Subcategories
                                                </Typography>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Subcategory</TableCell>
                                                            <TableCell align="right">Count</TableCell>
                                                            <TableCell align="right">% of Category</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {stat.subcategories.map((sub) => (
                                                            <TableRow key={sub.subcategory}>
                                                                <TableCell>
                                                                    <Typography variant="body2">
                                                                        {sub.subcategoryNameEn}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="text.secondary"
                                                                        sx={{ fontStyle: 'italic' }}
                                                                    >
                                                                        {sub.subcategoryNameBn}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography variant="body2">{sub.count}</Typography>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography variant="body2">
                                                                        {sub.percentage.toFixed(1)}%
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}

                        {/* Total Row */}
                        <TableRow sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                            <TableCell />
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    Total
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {totalComplaints}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    100%
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default CategoryStatsTable;


