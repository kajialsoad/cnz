import React from 'react';
import { Box, Container, Grid, Typography, Paper } from '@mui/material';
import UserSatisfactionWidget from './UserSatisfactionWidget';

/**
 * Demo page for UserSatisfactionWidget component
 * 
 * This page demonstrates various use cases of the UserSatisfactionWidget:
 * 1. Basic usage without filters
 * 2. With city corporation filter
 * 3. With zone filter
 * 4. With date range filter
 * 5. With multiple filters combined
 */
const UserSatisfactionWidgetDemo: React.FC = () => {
    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
                UserSatisfactionWidget Demo
            </Typography>

            <Grid container spacing={3}>
                {/* Demo 1: Basic Usage */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            1. Basic Usage (No Filters)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Displays all user satisfaction data without any filters
                        </Typography>
                        <Box sx={{ height: 600 }}>
                            <UserSatisfactionWidget />
                        </Box>
                    </Paper>
                </Grid>

                {/* Demo 2: With City Corporation Filter */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            2. With City Corporation Filter
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Filtered by DSCC (Dhaka South City Corporation)
                        </Typography>
                        <Box sx={{ height: 600 }}>
                            <UserSatisfactionWidget cityCorporationCode="DSCC" />
                        </Box>
                    </Paper>
                </Grid>

                {/* Demo 3: With Zone Filter */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            3. With Zone Filter
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Filtered by Zone 1
                        </Typography>
                        <Box sx={{ height: 600 }}>
                            <UserSatisfactionWidget zoneId={1} />
                        </Box>
                    </Paper>
                </Grid>

                {/* Demo 4: With Date Range */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            4. With Date Range Filter
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Last 30 days
                        </Typography>
                        <Box sx={{ height: 600 }}>
                            <UserSatisfactionWidget
                                startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}
                                endDate={new Date().toISOString()}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Demo 5: Multiple Filters */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            5. Multiple Filters Combined
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            DSCC, Zone 1, Ward 5, Last 30 days
                        </Typography>
                        <Box sx={{ height: 600 }}>
                            <UserSatisfactionWidget
                                cityCorporationCode="DSCC"
                                zoneId={1}
                                wardId={5}
                                startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}
                                endDate={new Date().toISOString()}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Demo 6: Side by Side Comparison */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            6. Side by Side Comparison
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Compare satisfaction between DSCC and DNCC
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    DSCC (Dhaka South)
                                </Typography>
                                <Box sx={{ height: 600 }}>
                                    <UserSatisfactionWidget cityCorporationCode="DSCC" />
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    DNCC (Dhaka North)
                                </Typography>
                                <Box sx={{ height: 600 }}>
                                    <UserSatisfactionWidget cityCorporationCode="DNCC" />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {/* Usage Instructions */}
            <Paper sx={{ p: 3, mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Usage Instructions
                </Typography>
                <Typography variant="body2" paragraph>
                    The UserSatisfactionWidget component displays user satisfaction metrics based on complaint reviews.
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Props:
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                    <li>
                        <Typography variant="body2">
                            <strong>cityCorporationCode</strong> (optional): Filter by city corporation (e.g., "DSCC", "DNCC")
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            <strong>zoneId</strong> (optional): Filter by zone ID
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            <strong>wardId</strong> (optional): Filter by ward ID
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            <strong>startDate</strong> (optional): Start date for filtering (ISO format)
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            <strong>endDate</strong> (optional): End date for filtering (ISO format)
                        </Typography>
                    </li>
                </Box>

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Features:
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                    <li>
                        <Typography variant="body2">
                            Average rating display with visual star rating
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            Total reviews count and percentage of resolved complaints reviewed
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            Rating distribution with progress bars and bar chart
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            Recent reviews list with user details and comments
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            Color-coded ratings (red for 1-star to green for 5-star)
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            Relative timestamps (e.g., "2 days ago")
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            Loading and error states
                        </Typography>
                    </li>
                </Box>

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Example Code:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', m: 0 }}>
                        {`import { UserSatisfactionWidget } from './components/UserSatisfaction';

function Dashboard() {
    return (
        <UserSatisfactionWidget
            cityCorporationCode="DSCC"
            zoneId={1}
            startDate="2024-01-01"
            endDate="2024-12-31"
        />
    );
}`}
                    </Typography>
                </Paper>
            </Paper>
        </Container>
    );
};

export default UserSatisfactionWidgetDemo;


