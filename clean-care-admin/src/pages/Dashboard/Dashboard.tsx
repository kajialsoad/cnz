import React, { useState, useEffect, useCallback } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import MainLayout from '../../components/common/Layout/MainLayout';
import WelcomeBanner from './components/WelcomeBanner';
import StatsCards from './components/StatsCards';
import MiddleDashboardWidgets from './components/MiddleDashboardWidgets';
import BottomDashboardSection from './components/BottomDashboardSection';
import { CityCorporationComparison } from './components/CityCorporationComparison';
import { cityCorporationService } from '../../services/cityCorporationService';
import type { CityCorporation } from '../../services/cityCorporationService';

const Dashboard: React.FC = () => {
  const [cityCorps, setCityCorps] = useState<CityCorporation[]>([]);
  const [selectedCityCorporation, setSelectedCityCorporation] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch city corporations on mount
  useEffect(() => {
    const fetchCityCorps = async () => {
      try {
        setLoading(true);
        const response = await cityCorporationService.getCityCorporations('ACTIVE');
        setCityCorps(response.cityCorporations || []);
      } catch (error) {
        console.error('Error fetching city corporations:', error);
        setCityCorps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCityCorps();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleCityCorporationChange = (value: string) => {
    setSelectedCityCorporation(value);
  };

  const handleManualRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setLastRefresh(new Date());
  }, []);

  return (
    <MainLayout title="Dashboard Overview">
      <Box>
        {/* Welcome Banner */}
        <WelcomeBanner />

        {/* City Corporation Filter and Refresh */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ minWidth: 'fit-content' }}>
              Filter by City Corporation:
            </Typography>
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel>City Corporation</InputLabel>
              <Select
                value={selectedCityCorporation}
                onChange={(e) => handleCityCorporationChange(e.target.value)}
                label="City Corporation"
                disabled={loading}
              >
                <MenuItem value="ALL">All City Corporations</MenuItem>
                {cityCorps.map((cc) => (
                  <MenuItem key={cc.code} value={cc.code}>
                    {cc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedCityCorporation !== 'ALL' && (
              <Typography variant="body2" color="text.secondary">
                Showing data for {cityCorps.find(cc => cc.code === selectedCityCorporation)?.name}
              </Typography>
            )}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </Typography>
              <Tooltip title="Refresh dashboard">
                <IconButton onClick={handleManualRefresh} size="small" color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <ErrorBoundary>
          <StatsCards
            key={`stats-${refreshKey}`}
            cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined}
          />
        </ErrorBoundary>

        {/* Middle Dashboard Widgets */}
        <Box sx={{ mt: 4 }}>
          <ErrorBoundary>
            <MiddleDashboardWidgets
              key={`widgets-${refreshKey}`}
              cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined}
            />
          </ErrorBoundary>
        </Box>

        {/* Bottom Dashboard Section - Charts and Users */}
        <Box sx={{ mt: 4 }}>
          <ErrorBoundary>
            <BottomDashboardSection
              key={`bottom-${refreshKey}`}
              cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined}
            />
          </ErrorBoundary>
        </Box>

        {/* City Corporation Comparison - Show when "ALL" is selected */}
        {selectedCityCorporation === 'ALL' && (
          <Box sx={{ mt: 4 }}>
            <ErrorBoundary>
              <CityCorporationComparison />
            </ErrorBoundary>
          </Box>
        )}

        {/* Operational Monitoring - Coming Soon */}
        <Box sx={{ mt: 4 }}>
          {/* Operational monitoring components will go here */}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default Dashboard;