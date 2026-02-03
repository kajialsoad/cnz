import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Skeleton,
  Alert,
  CircularProgress,
  TableContainer,
  Paper,
  Checkbox,
} from '@mui/material';
import MainLayout from '../../components/common/Layout/MainLayout';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import Close from '@mui/icons-material/Close';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/userManagementService';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import type { UserWithStats, GetUsersQuery } from '../../types/userManagement.types';
import { UserStatus } from '../../types/userManagement.types';
import AdminAddModal from '../../components/AdminManagement/AdminAddModal';
import AdminEditModal from '../../components/AdminManagement/AdminEditModal';
import AdminDetailsModal from '../../components/AdminManagement/AdminDetailsModal';
import { ZoneFilter } from '../../components/common';

import { superAdminService } from '../../services/superAdminService';

// Interfaces
interface CityCorporation {
  code: string;
  name: string;
}

interface Zone {
  id: number;
  zoneNumber?: number;
  name?: string;
  cityCorporationId?: number;
  status?: string;
}



interface Ward {
  id: number;
  wardNumber: number | null;
  zoneId: number;
}

interface AdminFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password?: string;
  cityCorporationCode: string;
  zoneId: number;
  wardIds: number[];
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  bg: string;
  color: string;
  loading?: boolean
}> = ({ title, value, bg, color, loading = false }) => (
  <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
    <CardContent sx={{ bgcolor: bg, borderRadius: 2 }}>
      <Stack spacing={0.5}>
        <Typography sx={{ color: '#4a5565', fontSize: 14 }}>{title}</Typography>
        {loading ? (
          <Skeleton width={60} height={32} />
        ) : (
          <Typography sx={{ fontSize: 24, fontWeight: 700, color }}>{value}</Typography>
        )}
      </Stack>
    </CardContent>
  </Card>
);

const AdminManagement: React.FC = () => {
  // Get auth context
  const { user, isAuthenticated } = useAuth();

  // Debug: Log user role
  console.log('🔐 Admin Management Access Check:', {
    role: user?.role,
    canAddAdmin: user?.role === 'MASTER_ADMIN'
  });

  // State
  const [admins, setAdmins] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [cityCorporationFilter, setCityCorporationFilter] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<number | ''>('');

  // Modals
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<UserWithStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>(UserStatus.ACTIVE);

  // Dropdowns data
  const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
  const [assignedZones, setAssignedZones] = useState<Zone[]>([]); // Added assignedZones state

  const [wards, setWards] = useState<Ward[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    online: 0,
    offline: 0,
    newToday: 0,
  });

  // Get user role and zone from auth context
  const userRole = user?.role || null;
  const userZoneId = (user as any)?.zoneId || null;

  console.log('🔐 Admin Management Access Check:', {
    isAuthenticated,
    userRole,
    hasAccess: userRole === 'MASTER_ADMIN' || userRole === 'SUPER_ADMIN',
    isMasterAdmin: userRole === 'MASTER_ADMIN',
    isSuperAdmin: userRole === 'SUPER_ADMIN',
  });

  // Fetch city corporations and assigned zones
  const fetchCityCorporations = useCallback(async () => {
    try {
      const promises: Promise<any>[] = [
        cityCorporationService.getCityCorporations().catch(err => {
          console.error('❌ Error fetching city corporations:', err);
          return { cityCorporations: [] };
        })
      ];

      // If Super Admin, add assigned zones fetch
      if (userRole === 'SUPER_ADMIN' && user?.id) {
        console.log('👤 Fetching assigned zones for Super Admin:', user.id);
        promises.push(
          superAdminService.getAssignedZones(Number(user.id)).catch(err => {
            console.error('❌ Error fetching assigned zones:', err);
            return [];
          })
        );
      }

      const results = await Promise.all(promises);
      const cityCorpResponse = results[0];
      const assignedZonesResponse = results[1]; // Will be undefined if not SUPER_ADMIN

      // 1. Handle City Corporations
      let availableCityCorps = cityCorpResponse.cityCorporations || [];
      console.log('✅ City Corporations fetched:', availableCityCorps.length);

      if (userRole === 'SUPER_ADMIN') {
        const assignedCityCode = (user as any).cityCorporationCode || (user as any).cityCorporation?.code;
        if (assignedCityCode) {
          console.log('🎯 Filtering City Corps for assigned code:', assignedCityCode);
          availableCityCorps = availableCityCorps.filter((cc: any) => cc.code === assignedCityCode);
          // Auto-select if not selected
          if (cityCorporationFilter !== assignedCityCode) {
            setCityCorporationFilter(assignedCityCode);
          }
        } else if (assignedZonesResponse && Array.isArray(assignedZonesResponse) && assignedZonesResponse.length > 0) {
          // For Super Admin with assigned zones, restrict to the corporations of those zones
          const allowedCityCorpIds = new Set<number>();
          assignedZonesResponse.forEach((z: any) => {
            const zoneData = z.zone || z;
            if (zoneData.cityCorporationId) allowedCityCorpIds.add(zoneData.cityCorporationId);
          });

          if (allowedCityCorpIds.size > 0) {
            console.log('🎯 Filtering City Corps for Super Admin assigned zones:', Array.from(allowedCityCorpIds));
            availableCityCorps = availableCityCorps.filter((cc: any) => allowedCityCorpIds.has(cc.id));

            // Auto-select if only one corporation
            if (availableCityCorps.length === 1 && cityCorporationFilter !== availableCityCorps[0].code) {
              setCityCorporationFilter(availableCityCorps[0].code);
            }
          }
        }
      }
      setCityCorporations(availableCityCorps);

      // 2. Handle Assigned Zones
      if (assignedZonesResponse) {
        console.log('🛡️ Raw Assigned Zones:', assignedZonesResponse);
        // Filter valid zones and map to Zone interface
        const formattedZones: Zone[] = (assignedZonesResponse as any[])
          .map(z => {
            const zoneData = z.zone || z;
            if (!zoneData || !zoneData.id) return null;
            return {
              id: zoneData.id,
              zoneNumber: zoneData.zoneNumber,
              name: zoneData.name,
              cityCorporationId: zoneData.cityCorporationId || 0,
              status: 'ACTIVE'
            } as Zone;
          })
          .filter((z): z is Zone => z !== null);

        console.log('✅ Formatted Assigned Zones:', formattedZones);
        setAssignedZones(formattedZones);
      }

    } catch (error) {
      console.error('❌ Error in data fetching:', error);
      setCityCorporations([]);
    }
  }, [userRole, user, cityCorporationFilter]);



  // Fetch wards based on zone
  const fetchWards = useCallback(async (zoneId: number) => {
    try {
      const response = await wardService.getWards({ zoneId });
      console.log('✅ Wards response:', response);
      if (response && response.wards && Array.isArray(response.wards)) {
        setWards(response.wards);
      } else {
        console.warn('⚠️ Invalid wards response format:', response);
        setWards([]);
      }
    } catch (error) {
      console.error('❌ Error fetching wards:', error);
      setWards([]);
    }
  }, []);

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query: GetUsersQuery = {
        page,
        limit: 20,
        role: 'ADMIN',
        search: searchQuery || undefined,
        cityCorporationCode: cityCorporationFilter || undefined,
        zoneId: zoneFilter || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      };

      console.log('🔍 Admin Management Query:', query);
      const response = await userManagementService.getUsers(query);
      console.log('✅ Admin Management Response:', response);
      setAdmins(response.users || []);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      setError(error.message || 'Failed to fetch admins');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, cityCorporationFilter, zoneFilter, statusFilter]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await userManagementService.getUserStatistics(
        cityCorporationFilter || undefined,
        'ADMIN'
      );

      setStats({
        total: response.totalCitizens || 0,
        active: response.statusBreakdown?.active || 0,
        inactive: response.statusBreakdown?.inactive || 0,
        online: 0, // TODO: Implement online/offline tracking
        offline: 0,
        newToday: response.newUsersThisMonth || 0,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [cityCorporationFilter]);

  // Initial load
  useEffect(() => {
    fetchCityCorporations();
  }, [fetchCityCorporations]);

  // Load admins when filters change
  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Load statistics when filters change
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Reset zone filter when city corporation changes
  useEffect(() => {
    setZoneFilter('');
  }, [cityCorporationFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle delete admin
  const handleDelete = async () => {
    if (!selectedAdmin) return;

    try {
      // TODO: Implement delete API call
      toast.success('Admin deleted successfully');
      setOpenDelete(false);
      setSelectedAdmin(null);
      fetchAdmins();
      fetchStatistics();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete admin');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) {
      return;
    }

    try {
      await userManagementService.bulkDeleteUsers(selectedIds);
      toast.success('Users deleted successfully');
      setSelectedIds([]);
      fetchAdmins();
      fetchStatistics();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete users');
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = admins.map((n) => n.id);
      setSelectedIds(newSelecteds);
      return;
    }
    setSelectedIds([]);
  };

  const handleSelectOne = (id: number) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1),
      );
    }

    setSelectedIds(newSelected);
  };


  // Check if user has access to this page
  const hasAccess = userRole === 'MASTER_ADMIN' || userRole === 'SUPER_ADMIN';

  if (!hasAccess) {
    return (
      <MainLayout title="Admin Management">
        <Alert severity="error">
          You do not have permission to access this page.
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="এডমিন ম্যানেজমেন্ট">
      <Stack spacing={3}>
        {/* Statistics Cards */}
        <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
          <CardContent>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1e2939', mb: 2 }}>
              এডমিন ম্যানেজমেন্ট
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 2 }}>
                <StatCard
                  title="মোট এডমিন"
                  value={stats.total}
                  bg="#eff6ff"
                  color="#155dfc"
                  loading={statsLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <StatCard
                  title="সক্রিয়"
                  value={stats.active}
                  bg="#f0fdf4"
                  color="#00a63e"
                  loading={statsLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <StatCard
                  title="নিষ্ক্রিয়"
                  value={stats.inactive}
                  bg="#fef2f2"
                  color="#e7000b"
                  loading={statsLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <StatCard
                  title="অনলাইন"
                  value={stats.online}
                  bg="#faf5ff"
                  color="#9810fa"
                  loading={statsLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <StatCard
                  title="অফলাইন"
                  value={stats.offline}
                  bg="#f3f4f6"
                  color="#4a5565"
                  loading={statsLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <StatCard
                  title="আজ নতুন"
                  value={`+${stats.newToday}`}
                  bg="#fff7ed"
                  color="#f54900"
                  loading={statsLoading}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>সকল সিটি কর্পোরেশন</InputLabel>
              <Select
                label="সকল সিটি কর্পোরেশন"
                value={cityCorporationFilter}
                onChange={(e) => setCityCorporationFilter(e.target.value)}
                disabled={!cityCorporationFilter && userRole === 'MASTER_ADMIN' ? false : cityCorporations.length <= 1}
              >
                {userRole === 'MASTER_ADMIN' && <MenuItem value="">সকল সিটি কর্পোরেশন</MenuItem>}
                {Array.isArray(cityCorporations) && cityCorporations.map((cc) => (
                  <MenuItem key={cc.code} value={cc.code}>{cc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ minWidth: 200 }}>
              <ZoneFilter
                value={zoneFilter}
                onChange={(val) => setZoneFilter(val as number | '')}
                cityCorporationCode={cityCorporationFilter}
                disabled={!cityCorporationFilter && userRole === 'MASTER_ADMIN'}
                zones={userRole === 'SUPER_ADMIN' ? (assignedZones as any) : undefined}
                label="সকল জোন"
              />
            </Box>

            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value as UserStatus | 'ALL');
                  setPage(1);
                }}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value={UserStatus.ACTIVE}>Active</MenuItem>
                <MenuItem value={UserStatus.INACTIVE}>Inactive</MenuItem>
                <MenuItem value={UserStatus.PENDING}>Pending</MenuItem>
                <MenuItem value={UserStatus.SUSPENDED}>Suspended</MenuItem>
              </Select>
            </FormControl>

            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম/নাম্বার দিয়ে খুঁজুন..."
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#0a0a0a80' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 500 }}
            />

            {/* Only MASTER_ADMIN can add new admins */}
            {user?.role === 'MASTER_ADMIN' && (
              <Button
                variant="contained"
                sx={{ bgcolor: '#3fa564' }}
                startIcon={<AddIcon />}
                onClick={() => setOpenAdd(true)}
              >
                নতুন এডমিন যোগ করুন
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Admin Table */}
        <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
          <Box sx={{ width: '100%', p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            {selectedIds.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleBulkDelete}
                startIcon={<DeleteOutline />}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </Box>
          <Box sx={{ bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb', px: 3, py: 1.5 }}>
            <Grid container alignItems="center">
              <Grid size={{ xs: 1 }} sx={{ maxWidth: '50px', flexBasis: '50px' }}>
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < admins.length}
                  checked={admins.length > 0 && selectedIds.length === admins.length}
                  onChange={handleSelectAll}
                />
              </Grid>
              <Grid size={{ xs: 2.5 }}>
                <Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>
                  এডমিন
                </Typography>
              </Grid>
              <Grid size={{ xs: 3 }}>
                <Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>
                  এলাকা
                </Typography>
              </Grid>
              <Grid size={{ xs: 2 }}>
                <Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>
                  স্ট্যাটাস
                </Typography>
              </Grid>
              <Grid size={{ xs: 3.5 }}>
                <Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>
                  অভিযোগ পরিসংখ্যান
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <CardContent sx={{ px: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3].map((i) => (
                  <Stack key={i} spacing={1} sx={{ mb: 2 }}>
                    <Skeleton variant="rectangular" height={60} />
                  </Stack>
                ))}
              </Box>
            ) : error ? (
              <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
              </Box>
            ) : admins.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  কোনো এডমিন পাওয়া যায়নি
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableBody>
                    {admins.map((admin) => {
                      const isItemSelected = selectedIds.indexOf(admin.id) !== -1;
                      return (
                        <TableRow key={admin.id} hover selected={isItemSelected}>
                          <TableCell padding="checkbox" sx={{ width: '50px' }}>
                            <Checkbox
                              checked={isItemSelected}
                              onChange={() => handleSelectOne(admin.id)}
                            />
                          </TableCell>
                          <TableCell sx={{ width: '25%' }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar
                                src={admin.avatar}
                                alt={`${admin.firstName} ${admin.lastName}`}
                                sx={{ bgcolor: '#2b7fff' }}
                              >
                                {admin.firstName.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                                  {admin.firstName} {admin.lastName}
                                </Typography>
                                <Typography sx={{ fontSize: 14, color: '#4a5565' }}>
                                  {admin.phone}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ width: '30%' }}>
                            <Stack spacing={0.5}>
                              <Typography sx={{ fontSize: 16, color: '#1e2939' }}>
                                {admin.cityCorporation?.name || 'N/A'}
                              </Typography>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                                {admin.zone ? (
                                  <Chip
                                    label={admin.zone.name}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ height: 24 }}
                                  />
                                ) : null}
                                {admin.ward ? (
                                  <Chip
                                    label={`Ward ${admin.ward.wardNumber}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 24 }}
                                  />
                                ) : null}
                                {admin.extraWards && admin.extraWards.length > 0 && (
                                  <Chip
                                    label={`+${admin.extraWards.length} Wards`}
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    sx={{ height: 24 }}
                                  />
                                )}
                                {!admin.zone && !admin.ward && (!admin.extraWards || admin.extraWards.length === 0) && (
                                  <Typography variant="caption" color="text.secondary">
                                    N/A
                                  </Typography>
                                )}
                              </Stack>
                              {admin.address && (
                                <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.5 }}>
                                  📍 {admin.address}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ width: '15%' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={admin.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                size="small"
                                sx={{
                                  bgcolor: admin.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                                  color: admin.status === 'ACTIVE' ? '#008236' : '#dc2626'
                                }}
                              />
                              <Typography sx={{ fontSize: 12, color: '#6a7282' }}>
                                অফলাইন
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ width: '30%' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Stack>
                                <Typography sx={{ fontSize: 14, color: '#1e2939', fontWeight: 700 }}>
                                  মোট: {admin.statistics.totalComplaints}
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                  <Typography sx={{ fontSize: 12, color: '#00a63e' }}>
                                    সমাধান: {admin.statistics.resolvedComplaints}
                                  </Typography>
                                  <Typography sx={{ fontSize: 12, color: '#d08700' }}>
                                    পেন্ডিং: {admin.statistics.pendingComplaints}
                                  </Typography>
                                </Stack>
                              </Stack>
                              <Divider orientation="vertical" flexItem />
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    toast('Direct messaging coming soon!', {
                                      icon: '💬',
                                    });
                                  }}
                                >
                                  <ChatBubbleOutline />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedAdmin(admin);
                                    setOpenDetails(true);
                                  }}
                                >
                                  <VisibilityOutlined />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedAdmin(admin);
                                    setOpenEdit(true);
                                  }}
                                >
                                  <EditOutlined />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedAdmin(admin);
                                    setOpenDelete(true);
                                  }}
                                >
                                  <DeleteOutline />
                                </IconButton>
                              </Stack>
                            </Stack>
                          </TableCell>

                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <AdminAddModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onSuccess={() => {
            fetchAdmins();
            fetchStatistics();
          }}
        />

        <AdminEditModal
          open={openEdit}
          onClose={() => {
            setOpenEdit(false);
            setSelectedAdmin(null);
          }}
          onSuccess={async () => {
            await fetchAdmins();
            fetchStatistics();
          }}
          admin={selectedAdmin}
        />

        <AdminDetailsModal
          open={openDetails}
          onClose={() => {
            setOpenDetails(false);
            setSelectedAdmin(null);
          }}
          admin={selectedAdmin}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="sm" fullWidth>
          <DialogTitle component="div">
            <Typography sx={{ fontWeight: 700 }}>এডমিন মুছে ফেলুন</Typography>
          </DialogTitle>
          <DialogContent>
            <Typography>
              আপনি কি নিশ্চিত যে আপনি {selectedAdmin?.firstName} {selectedAdmin?.lastName} কে মুছে ফেলতে চান?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpenDelete(false)}>
              বাতিল
            </Button>
            <Button variant="contained" color="error" onClick={handleDelete}>
              মুছে ফেলুন
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </MainLayout >
  );
};

export default AdminManagement;


