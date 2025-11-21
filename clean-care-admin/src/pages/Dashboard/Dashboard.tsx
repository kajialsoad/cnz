import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, Paper } from '@mui/material';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import MainLayout from '../../components/common/Layout/MainLayout';
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

  // Fetch city corporations on mount
  useEffect(() => {
    const fetchCityCorps = async () => {
      try {
        setLoading(true);
        const data = await cityCorporationService.getCityCorporations('ACTIVE');
        setCityCorps(data);
      } catch (error) {
        console.error('Error fetching city corporations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCityCorps();
  }, []);

  const handleCityCorporationChange = (value: string) => {
    setSelectedCityCorporation(value);
  };

  return (
    <MainLayout title="Dashboard Overview">
      <Box>
        {/* City Corporation Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          </Box>
        </Paper>

        {/* Stats Cards */}
        <ErrorBoundary>
          <StatsCards cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined} />
        </ErrorBoundary>

        {/* Middle Dashboard Widgets */}
        <Box sx={{ mt: 4 }}>
          <ErrorBoundary>
            <MiddleDashboardWidgets cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined} />
          </ErrorBoundary>
        </Box>

        {/* Bottom Dashboard Section - Charts and Users */}
        <Box sx={{ mt: 4 }}>
          <ErrorBoundary>
            <BottomDashboardSection cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined} />
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