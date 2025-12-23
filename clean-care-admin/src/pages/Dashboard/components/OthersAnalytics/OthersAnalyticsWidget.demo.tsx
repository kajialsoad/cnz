import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
} from '@mui/material';
import OthersAnalyticsWidget from './OthersAnalyticsWidget';

/**
 * Demo page for OthersAnalyticsWidget component
 * 
 * This demo shows:
 * 1. Basic usage without filters
 * 2. Usage with city corporation filter
 * 3. Usage with zone filter
 * 4. Usage with date range filters
 * 5. Usage with all filters combined
 */
const OthersAnalyticsWidgetDemo: React.FC = () => {
    const [cityCorporationCode, setCityCorporationCode] = useState<string>('');
    const [zoneId, setZoneId] = useState<number | undefined>(undefined);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const handleReset = () => {
        setCityCorporationCode('');
        setZoneId(undefined);
        setStartDate('');
        setEndDate('');
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
                OthersAnalyticsWidget Demo
            </Typography>

            {/* Filter Controls */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                    Filter Controls
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>City Corporation</InputLabel>
                            <Select
                                value={cityCorporationCode}
                                label="City Corporation"
                                onChange={(e) => setCityCorporationCode(e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="DSCC">DSCC</MenuItem>
                                <MenuItem value="DNCC">DNCC</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Zone</InputLabel>
                            <Select
                                value={zoneId || ''}
                                label="Zone"
                                onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value={1}>Zone 1</MenuItem>
                                <MenuItem value={2}>Zone 2</MenuItem>
                                <MenuItem value={3}>Zone 3</MenuItem>
                                <MenuItem value={4}>Zone 4</MenuItem>
                                <MenuItem value={5}>Zone 5</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Button variant="outlined" onClick={handleReset}>
                            Reset Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Demo Sections */}
            <Grid container spacing={3}>
                {/* Example 1: Basic Usage */}
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        1. Basic Usage (No Filters)
                    </Typography>
                    <Box sx={{ height: 600 }}>
                        <OthersAnalyticsWidget />
                    </Box>
                </Grid>

                {/* Example 2: With City Corporation Filter */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        2. With City Corporation Filter (DSCC)
                    </Typography>
                    <Box sx={{ height: 600 }}>
                        <OthersAnalyticsWidget cityCorporationCode="DSCC" />
                    </Box>
                </Grid>

                {/* Example 3: With Zone Filter */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        3. With Zone Filter (Zone 1)
                    </Typography>
                    <Box sx={{ height: 600 }}>
                        <OthersAnalyticsWidget zoneId={1} />
                    </Box>
                </Grid>

                {/* Example 4: With Date Range */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        4. With Date Range (Last 30 Days)
                    </Typography>
                    <Box sx={{ height: 600 }}>
                        <OthersAnalyticsWidget
                            startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            endDate={new Date().toISOString().split('T')[0]}
                        />
                    </Box>
                </Grid>

                {/* Example 5: With All Filters */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        5. With All Filters (Custom)
                    </Typography>
                    <Box sx={{ height: 600 }}>
                        <OthersAnalyticsWidget
                            cityCorporationCode={cityCorporationCode || undefined}
                            zoneId={zoneId}
                            startDate={startDate || undefined}
                            endDate={endDate || undefined}
                        />
                    </Box>
                </Grid>

                {/* Example 6: In Grid Layout */}
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        6. In Dashboard Grid Layout
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6} lg={4}>
                            <OthersAnalyticsWidget />
                        </Grid>
                        <Grid item xs={12} md={6} lg={4}>
                            <OthersAnalyticsWidget cityCorporationCode="DSCC" />
                        </Grid>
                        <Grid item xs={12} md={6} lg={4}>
                            <OthersAnalyticsWidget cityCorporationCode="DNCC" />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Usage Code Examples */}
            <Paper sx={{ p: 3, mt: 4, bgcolor: '#F9FAFB' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Code Examples
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Basic Usage:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#1F2937', color: '#F9FAFB' }}>
                        <code>
                            {`import { OthersAnalyticsWidget } from './components/OthersAnalytics';

function Dashboard() {
  return <OthersAnalyticsWidget />;
}`}
                        </code>
                    </Paper>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        With Filters:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#1F2937', color: '#F9FAFB' }}>
                        <code>
                            {`import { OthersAnalyticsWidget } from './components/OthersAnalytics';

function Dashboard() {
  return (
    <OthersAnalyticsWidget
      cityCorporationCode="DSCC"
      zoneId={1}
      startDate="2024-01-01"
      endDate="2024-12-31"
    />
  );
}`}
                        </code>
                    </Paper>
                </Box>

                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        In Grid Layout:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#1F2937', color: '#F9FAFB' }}>
                        <code>
                            {`import { Grid } from '@mui/material';
import { OthersAnalyticsWidget } from './components/OthersAnalytics';

function Dashboard() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6} lg={4}>
        <OthersAnalyticsWidget />
      </Grid>
    </Grid>
  );
}`}
                        </code>
                    </Paper>
                </Box>
            </Paper>

            {/* Features List */}
            <Paper sx={{ p: 3, mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Features
                </Typography>
                <ul>
                    <li>Total Others complaints count</li>
                    <li>Category breakdown (Corporation Internal vs External)</li>
                    <li>Top 5 departments/agencies with complaint counts</li>
                    <li>Bar chart visualization of top subcategories</li>
                    <li>Average resolution time display</li>
                    <li>7-day trend line chart</li>
                    <li>Loading state with spinner</li>
                    <li>Error handling with alert messages</li>
                    <li>Responsive design for all screen sizes</li>
                    <li>Filter support (city corporation, zone, date range)</li>
                </ul>
            </Paper>
        </Container>
    );
};

export default OthersAnalyticsWidgetDemo;
