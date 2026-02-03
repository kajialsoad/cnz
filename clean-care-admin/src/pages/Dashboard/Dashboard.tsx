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
import { dashboardService } from '../../services/dashboardService';
import { cityCorporationService } from '../../services/cityCorporationService';
import type { CityCorporation } from '../../services/cityCorporationService';

import { useAuth } from '../../contexts/AuthContext';
import { superAdminService } from '../../services/superAdminService';
import { UserRole } from '../../types/userManagement.types';
import { ZoneComparison } from './components/ZoneComparison/ZoneComparison';
import { ZoneFilter } from '../../components/common';
import type { Zone } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import type { Ward } from '../../services/wardService';
import { OthersAnalyticsWidget } from './components/OthersAnalytics';
import { UserSatisfactionWidget } from './components/UserSatisfaction';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [cityCorps, setCityCorps] = useState<CityCorporation[]>([]);
  const [selectedCityCorporation, setSelectedCityCorporation] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<number | ''>('');
  const [selectedWardId, setSelectedWardId] = useState<number | ''>('');
  const [assignedZones, setAssignedZones] = useState<Zone[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null); // Using any to avoid strict type issues during refactor, ideally DashboardStats
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch data
  const fetchData = useCallback(async () => {
    // Don't fetch if user is not loaded yet
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Set loading false immediately - we'll show UI with loading states for individual components
      setLoading(false);
      console.log('🔄 Dashboard: Starting data fetch for user:', user?.id, user?.role);

      // Fetch city corporations
      const cityResponse = await cityCorporationService.getCityCorporations('ACTIVE');
      let availableCityCorps = cityResponse.cityCorporations || [];

      if (user && user.role !== UserRole.MASTER_ADMIN) {
        const assignedCityCode = (user as any).cityCorporationCode || (user as any).cityCorporation?.code;
        if (assignedCityCode) {
          availableCityCorps = availableCityCorps.filter(cc => cc.code === assignedCityCode);
          setSelectedCityCorporation(assignedCityCode);
        }
      }
      setCityCorps(availableCityCorps);

      // Fetch assigned zones if Super Admin
      if (user?.role === UserRole.SUPER_ADMIN) {
        try {
          const zonesResponse = await superAdminService.getAssignedZones(Number(user.id));
          console.log('✅ Raw assigned zones for Super Admin:', zonesResponse);

          // Map ZoneAssignment[] to Zone[]
          const formattedZones: Zone[] = (zonesResponse as any[])
            .map(z => {
              const zoneData = z.zone || z;
              if (!zoneData || !zoneData.id) return null;

              return {
                id: zoneData.id,
                zoneNumber: zoneData.zoneNumber,
                name: zoneData.name,
                cityCorporationId: zoneData.cityCorporationId || 0,
                status: 'ACTIVE' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } as Zone;
            })
            .filter((z): z is Zone => z !== null);

          console.log('✅ Formatted assigned zones:', formattedZones);
          setAssignedZones(formattedZones);
        } catch (err) {
          console.error('Error fetching assigned zones:', err);
        }
      }

      // Fetch assigned wards if Admin
      if (user?.role === UserRole.ADMIN) {
        console.log('👤 Loading assigned wards for Admin');

        // Parse ward IDs from permissions
        let adminWardIds: number[] = [];
        if ((user as any).permissions) {
          try {
            const permissionsData = JSON.parse((user as any).permissions);
            if (permissionsData.wards && Array.isArray(permissionsData.wards)) {
              adminWardIds = permissionsData.wards;
            }
          } catch (error) {
            console.error('Error parsing admin permissions:', error);
          }
        }

        console.log(`🔒 ADMIN assigned ward IDs: [${adminWardIds.join(', ')}]`);

        // Fetch ward details for assigned ward IDs
        if (adminWardIds.length > 0) {
          try {
            setWardsLoading(true);
            const assignedCityCode = (user as any).cityCorporationCode || (user as any).cityCorporation?.code;
            if (assignedCityCode) {
              const wardsResponse = await wardService.getWards({
                cityCorporationCode: assignedCityCode,
                status: 'ACTIVE'
              });

              // Filter by assigned ward IDs
              const assignedWards = wardsResponse.wards.filter((ward: Ward) =>
                adminWardIds.includes(ward.id)
              );

              console.log('✅ Loaded assigned wards:', assignedWards);
              setWards(assignedWards);
            }
          } catch (error) {
            console.error('❌ Error fetching assigned wards:', error);
            setWards([]);
          } finally {
            setWardsLoading(false);
          }
        } else {
          console.log('⚠️ ADMIN has no assigned wards');
          setWards([]);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch Statistics separately when filters change
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const stats = await dashboardService.getDashboardStats({
          cityCorporationCode: selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined,
          zoneId: selectedZoneId || undefined,
          wardId: selectedWardId || undefined
        });
        setDashboardStats(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Don't block UI on stats error - show empty state
        setDashboardStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    // Fetch stats immediately when user is available, don't wait for initial loading
    if (user && !loading) {
      fetchStats();
    }
  }, [selectedCityCorporation, selectedZoneId, selectedWardId, refreshKey, loading, user]);

  useEffect(() => {
    // Only fetch data when user is available
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, fetchData]);

  // Update wards when zone changes (NOT for ADMIN role)
  useEffect(() => {
    // Skip for ADMIN role - they have pre-loaded assigned wards
    if (user?.role === UserRole.ADMIN) {
      return;
    }

    const fetchWards = async () => {
      if (selectedZoneId) {
        try {
          setWardsLoading(true);
          const wardsData = await wardService.getWardsByZone(Number(selectedZoneId), 'ACTIVE');
          setWards(wardsData);
        } catch (err) {
          console.error('Error fetching wards:', err);
          setWards([]);
        } finally {
          setWardsLoading(false);
        }
      } else {
        setWards([]);
      }
      setSelectedWardId('');
    };

    fetchWards();
  }, [selectedZoneId, user]);

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

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ minWidth: 'fit-content' }}>
              Filters:
            </Typography>
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel>City Corporation</InputLabel>
              <Select
                value={selectedCityCorporation}
                onChange={(e) => handleCityCorporationChange(e.target.value)}
                label="City Corporation"
                disabled={loading || (user?.role !== UserRole.MASTER_ADMIN && cityCorps.length <= 1)}
              >
                {/* Only Show 'All' for Master Admin */}
                {user?.role === UserRole.MASTER_ADMIN && (
                  <MenuItem value="ALL">All City Corporations</MenuItem>
                )}

                {cityCorps.map((cc) => (
                  <MenuItem key={cc.code} value={cc.code}>
                    {cc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Zone Filter - HIDE for ADMIN role */}
            {user?.role !== UserRole.ADMIN && (
              <Box sx={{ minWidth: 200 }}>
                <ZoneFilter
                  value={selectedZoneId}
                  onChange={(val) => setSelectedZoneId(val as number | '')}
                  cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined}
                  disabled={loading}
                  zones={assignedZones.length > 0 ? assignedZones : undefined}
                />
              </Box>
            )}

            {/* Ward Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Ward</InputLabel>
              <Select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(e.target.value as number | '')}
                label="Ward"
                disabled={loading || wardsLoading || (user?.role !== UserRole.ADMIN && !selectedZoneId)}
              >
                <MenuItem value="">All Wards</MenuItem>
                {wards.map((ward) => (
                  <MenuItem key={ward.id} value={ward.id}>
                    Ward {ward.wardNumber || ward.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedCityCorporation !== 'ALL' && (
              <Typography variant="body2" color="text.secondary">
                Showing data for {cityCorps.find(cc => cc.code === selectedCityCorporation)?.name}
                {selectedZoneId && ` (Zone ${selectedZoneId})`}
                {selectedWardId && ` (Ward ${wards.find(w => w.id === selectedWardId)?.wardNumber || selectedWardId})`}
              </Typography>
            )}

            {/* Display Assigned Zones for Super Admin */}
            {user?.role === UserRole.SUPER_ADMIN && assignedZones.length > 0 && (
              <Box sx={{ mt: 1, width: '100%', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Assigned Zones:
                </Typography>
                {assignedZones.map(zone => (
                  <Typography key={zone.id} variant="caption" sx={{ bgcolor: '#e3f2fd', px: 1, borderRadius: 1 }}>
                    {zone.name || `Zone ${zone.zoneNumber}`}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Display Assigned Wards for Admin */}
            {user?.role === UserRole.ADMIN && wards.length > 0 && (
              <Box sx={{ mt: 1, width: '100%', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Assigned Wards:
                </Typography>
                {wards.map(ward => (
                  <Typography key={ward.id} variant="caption" sx={{ bgcolor: '#e8f5e9', px: 1, borderRadius: 1 }}>
                    Ward {ward.wardNumber || ward.id}
                  </Typography>
                ))}
              </Box>
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
            stats={dashboardStats}
            loading={statsLoading}
            cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined}
            // @ts-ignore - Prop might not exist yet
            zoneId={selectedZoneId || undefined}
            // @ts-ignore - Prop might not exist yet
            wardId={selectedWardId || undefined}
          />
        </ErrorBoundary>

        {/* Middle Dashboard Widgets */}
        <Box sx={{ mt: 4 }}>
          <ErrorBoundary>
            <MiddleDashboardWidgets
              key={`widgets-${refreshKey}`}
              cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined}
              // @ts-ignore - Prop might not exist yet
              zoneId={selectedZoneId || undefined}
              // @ts-ignore - Prop might not exist yet
              wardId={selectedWardId || undefined}
            />
          </ErrorBoundary>
        </Box>

        {/* Bottom Dashboard Section - Charts and Users */}
        <Box sx={{ mt: 4 }}>
          <ErrorBoundary>
            <BottomDashboardSection
              key={`bottom-${refreshKey}`}
              userStats={dashboardStats?.users}
              loading={statsLoading}
              cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined}
              // @ts-ignore - Prop might not exist yet
              zoneId={selectedZoneId || undefined}
              // @ts-ignore - Prop might not exist yet
              wardId={selectedWardId || undefined}
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

        {/* Zone Comparison - Show when a City Corp is selected but no specific Zone */}
        {selectedCityCorporation !== 'ALL' && !selectedZoneId && (
          <Box sx={{ mt: 4 }}>
            <ErrorBoundary>
              <ZoneComparison
                cityCorporationCode={selectedCityCorporation}
                assignedZones={assignedZones}
              />
            </ErrorBoundary>
          </Box>
        )}

        {/* Others Analytics and User Satisfaction Widgets */}
        <Box sx={{ mt: 4 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
              },
              gap: 3,
              mb: 4,
            }}
          >
            <ErrorBoundary>
              <OthersAnalyticsWidget
                key={`others-${refreshKey}`}
                cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined}
                zoneId={selectedZoneId || undefined}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <UserSatisfactionWidget
                key={`satisfaction-${refreshKey}`}
                cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined}
                zoneId={selectedZoneId || undefined}
              />
            </ErrorBoundary>
          </Box>
        </Box>

        {/* Operational Monitoring - Coming Soon */}
        <Box sx={{ mt: 4 }}>
          {/* Operational monitoring components will go here */}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default Dashboard;

