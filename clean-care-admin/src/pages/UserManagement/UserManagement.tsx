import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Skeleton,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  PersonOff as PersonOffIcon,
  SearchOff as SearchOffIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout';
import UserDetailsModal from '../../components/UserManagement/UserDetailsModal';
import UserEditModal from '../../components/UserManagement/UserEditModal';
import UserAddModal from '../../components/UserManagement/UserAddModal';
import EmptyState from '../../components/common/EmptyState';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { userManagementService } from '../../services/userManagementService';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import type { CityCorporation } from '../../services/cityCorporationService';
import type { Zone } from '../../services/zoneService';
import type { Ward } from '../../services/wardService';
import type {
  UserWithStats,
  UserStatisticsResponse,
  CreateUserDto,
  UpdateUserDto,
  UserStatus
} from '../../types/userManagement.types';

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const UserManagement: React.FC = () => {
  // State for users and data
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');

  // State for city corporation filters
  const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
  const [selectedCityCorporation, setSelectedCityCorporation] = useState<string>('ALL');
  const [selectedCityCorporationId, setSelectedCityCorporationId] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [cityCorporationsLoading, setCityCorporationsLoading] = useState<boolean>(false);
  const [zonesLoading, setZonesLoading] = useState<boolean>(false);
  const [wardsLoading, setWardsLoading] = useState<boolean>(false);

  // State for statistics
  const [statistics, setStatistics] = useState<UserStatisticsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // State for selected user and modals
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [selectedUserComplaints, setSelectedUserComplaints] = useState<any[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  // State for toast notifications
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });



  // State for action loading
  const [actionLoading, setActionLoading] = useState<{
    viewUser: number | null;
    statusChange: number | null;
  }>({
    viewUser: null,
    statusChange: null,
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch city corporations on mount
  useEffect(() => {
    fetchCityCorporations();
  }, []);

  // Update zones when city corporation changes
  useEffect(() => {
    if (selectedCityCorporation !== 'ALL') {
      const cityCorporation = cityCorporations.find(cc => cc.code === selectedCityCorporation);
      if (cityCorporation) {
        setSelectedCityCorporationId(cityCorporation.id);
        fetchZones(cityCorporation.id);
      }
    } else {
      setSelectedCityCorporationId(null);
      setZones([]);
      setWards([]);
    }
    setSelectedZone(null);
    setSelectedWard(null);
  }, [selectedCityCorporation, cityCorporations]);

  // Update wards when zone changes
  useEffect(() => {
    if (selectedZone) {
      fetchWards(selectedZone);
    } else {
      setWards([]);
    }
    setSelectedWard(null);
  }, [selectedZone]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [debouncedSearchTerm, statusFilter, selectedCityCorporation, selectedZone, selectedWard, pagination.page]);

  // Fetch statistics when city corporation filter changes
  useEffect(() => {
    fetchStatistics();
  }, [selectedCityCorporation]);

  // Auto-refresh statistics every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchStatistics();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [selectedCityCorporation]);

  // Fetch city corporations function
  const fetchCityCorporations = async () => {
    try {
      setCityCorporationsLoading(true);
      const response = await cityCorporationService.getCityCorporations('ACTIVE');
      console.log('✅ City Corporations response in UserManagement:', response);
      // getCityCorporations returns { cityCorporations: [...] }
      setCityCorporations(response.cityCorporations || []);
    } catch (err: any) {
      console.error('Error fetching city corporations:', err);
      showToast('Failed to load city corporations', 'error');
      setCityCorporations([]); // Ensure it's always an array
    } finally {
      setCityCorporationsLoading(false);
    }
  };

  // Fetch zones function
  const fetchZones = async (cityCorporationId: number) => {
    try {
      setZonesLoading(true);
      const zonesData = await zoneService.getZonesByCityCorporation(cityCorporationId, 'ACTIVE');
      setZones(zonesData);
    } catch (err: any) {
      console.error('Error fetching zones:', err);
      showToast('Failed to load zones', 'error');
    } finally {
      setZonesLoading(false);
    }
  };

  // Fetch wards function
  const fetchWards = async (zoneId: number) => {
    try {
      setWardsLoading(true);
      const wardsData = await wardService.getWardsByZone(zoneId, 'ACTIVE');
      setWards(wardsData);
    } catch (err: any) {
      console.error('Error fetching wards:', err);
      showToast('Failed to load wards', 'error');
    } finally {
      setWardsLoading(false);
    }
  };

  // Fetch users function
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userManagementService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        role: 'CUSTOMER', // Only show app users (citizens), not admins or super admins
        cityCorporationCode: selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined,
        zoneId: selectedZone || undefined,
        wardId: selectedWard || undefined,
      });

      setUsers(response.users);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users. Please try again.');
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, selectedCityCorporation, selectedZone, selectedWard, pagination.page, pagination.limit]);

  // Fetch statistics function
  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const stats = await userManagementService.getUserStatistics(
        selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined,
        'CUSTOMER' // Only count app users (citizens), not admins or super admins
      );
      setStatistics(stats);
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
      // Don't show error toast for statistics, just log it
    } finally {
      setStatsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle status filter
  const handleStatusFilter = (status: UserStatus | 'ALL') => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSelectedCityCorporation('ALL');
    setSelectedZone(null);
    setSelectedWard(null);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle view user
  const handleViewUser = async (userId: number) => {
    try {
      setActionLoading(prev => ({ ...prev, viewUser: userId }));
      const response = await userManagementService.getUserById(userId);
      setSelectedUser(response.user);
      setSelectedUserComplaints(response.recentComplaints || []);
      setIsDetailsModalOpen(true);
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      showToast('Failed to load user details', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, viewUser: null }));
    }
  };

  // Handle edit user
  const handleEditUser = (user: UserWithStats) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Handle add user
  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  // Handle update user
  const handleUpdateUser = async (data: UpdateUserDto) => {
    if (!selectedUser) return;

    try {
      await userManagementService.updateUser(selectedUser.id, data);
      showToast('User updated successfully', 'success');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      await fetchUsers(); // Refresh the list
      await fetchStatistics(); // Refresh statistics
    } catch (err: any) {
      console.error('Error updating user:', err);
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
      throw err; // Re-throw to let the modal handle it
    }
  };

  // Handle create user
  const handleCreateUser = async (data: CreateUserDto) => {
    try {
      await userManagementService.createUser(data);
      showToast('User created successfully', 'success');
      setIsAddModalOpen(false);
      await fetchUsers(); // Refresh the list
      await fetchStatistics(); // Refresh statistics
    } catch (err: any) {
      console.error('Error creating user:', err);
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
      throw err; // Re-throw to let the modal handle it
    }
  };



  // Show toast notification
  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setToast({
      open: true,
      message,
      severity,
    });
  };

  // Close toast
  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  // Format phone number
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return 'N/A';
    // If already formatted, return as is
    if (phone.startsWith('+')) return phone;
    // Format Bangladesh phone numbers
    if (phone.length === 11 && phone.startsWith('0')) {
      return `+880 ${phone.substring(1, 5)}-${phone.substring(5)}`;
    }
    return phone;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get user initials
  const getUserInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Calculate success rate
  const calculateSuccessRate = (): string => {
    if (!statistics || statistics.totalComplaints === 0) return '0';
    return ((statistics.resolvedComplaints / statistics.totalComplaints) * 100).toFixed(0);
  };

  // Statistics cards data
  const stats = [
    {
      title: 'Total Citizens',
      value: statsLoading ? '...' : (statistics?.totalCitizens || 0).toString(),
      color: '#2196F3',
    },
    {
      title: 'Total Complaints',
      value: statsLoading ? '...' : (statistics?.totalComplaints || 0).toString(),
      color: '#FF9800',
    },
    {
      title: 'Resolved',
      value: statsLoading ? '...' : (statistics?.resolvedComplaints || 0).toString(),
      color: '#4CAF50',
    },
    {
      title: 'Success Rate',
      value: statsLoading ? '...' : `${calculateSuccessRate()}%`,
      color: '#9C27B0',
    },
  ];

  return (
    <ErrorBoundary>
      <MainLayout title="User Management">
        <Box sx={{ width: '100%', maxWidth: '100%', px: 1.5, mx: 0 }}>
          {/* Header Section */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
          }}>
            {/* Left Side - Title and Subtitle */}
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                User Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage citizen accounts and information
              </Typography>
            </Box>

            {/* Right Side - Add New User Button */}
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleAddUser}
              sx={{
                backgroundColor: '#4CAF50',
                '&:hover': {
                  backgroundColor: '#45a049',
                },
                textTransform: 'none',
                px: 3,
                py: 1.5,
                borderRadius: 2,
              }}
            >
              Add New User
            </Button>
          </Box>

          {/* Stats Cards */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(4, 1fr)',
            },
            gap: 2,
            mb: 4,
          }}>
            {stats.map((stat, index) => (
              <Card
                key={index}
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  {statsLoading ? (
                    <>
                      <Skeleton
                        variant="rectangular"
                        width="60%"
                        height={48}
                        sx={{ mx: 'auto', mb: 1, borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="text"
                        width="80%"
                        height={20}
                        sx={{ mx: 'auto' }}
                      />
                    </>
                  ) : (
                    <>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 700,
                          color: stat.color,
                          mb: 1,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        {stat.title}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Citizen Directory Section */}
          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              {/* Directory Header */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                gap: 2,
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Citizen Directory
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    placeholder="Search by name, email, or ward..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: 300,
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        backgroundColor: '#f8f9fa',
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Filters Row */}
              <Box sx={{
                display: 'flex',
                gap: 2,
                mb: 3,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                {/* City Corporation Filter */}
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel id="city-corporation-filter-label" sx={{ top: -8 }}>
                    City Corporation
                  </InputLabel>
                  <Select
                    labelId="city-corporation-filter-label"
                    value={selectedCityCorporation}
                    onChange={(e) => setSelectedCityCorporation(e.target.value)}
                    label="City Corporation"
                    disabled={cityCorporationsLoading}
                    sx={{
                      height: 40,
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <MenuItem value="ALL">All City Corporations</MenuItem>
                    {cityCorporations && cityCorporations.map((cc) => (
                      <MenuItem key={cc.code} value={cc.code}>
                        {cc.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Zone Filter */}
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel id="zone-filter-label" sx={{ top: -8 }}>
                    Zone
                  </InputLabel>
                  <Select
                    labelId="zone-filter-label"
                    value={selectedZone || ''}
                    onChange={(e) => setSelectedZone(e.target.value ? Number(e.target.value) : null)}
                    label="Zone"
                    disabled={selectedCityCorporation === 'ALL' || zonesLoading || !zones || zones.length === 0}
                    sx={{
                      height: 40,
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <MenuItem value="">All Zones</MenuItem>
                    {zones && zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>
                        Zone {zone.zoneNumber}{zone.name ? ` - ${zone.name}` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Ward Filter */}
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel id="ward-filter-label" sx={{ top: -8 }}>Ward</InputLabel>
                  <Select
                    labelId="ward-filter-label"
                    value={selectedWard || ''}
                    onChange={(e) => setSelectedWard(e.target.value ? Number(e.target.value) : null)}
                    label="Ward"
                    disabled={!selectedZone || wardsLoading || !wards || wards.length === 0}
                    sx={{
                      height: 40,
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <MenuItem value="">All Wards</MenuItem>
                    {wards && wards.map((ward) => (
                      <MenuItem key={ward.id} value={ward.id}>
                        Ward {ward.wardNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Status Filter */}
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel id="status-filter-label" sx={{ top: -8 }}>Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    onChange={(e) => handleStatusFilter(e.target.value as UserStatus | 'ALL')}
                    label="Status"
                    startAdornment={
                      <InputAdornment position="start">
                        <FilterIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    }
                    sx={{
                      height: 40,
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <MenuItem value="ALL">All Status</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="SUSPENDED">Suspended</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                  </Select>
                </FormControl>

                {/* Clear Filters Button */}
                {(searchTerm || statusFilter !== 'ALL' || selectedCityCorporation !== 'ALL' || selectedZone || selectedWard) && (
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    sx={{
                      height: 40,
                      textTransform: 'none',
                      borderColor: '#e0e0e0',
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: '#4CAF50',
                        color: '#4CAF50',
                      },
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>

              {/* Users Table */}
              <TableContainer component={Paper} elevation={0}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Citizen</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>City Corporation</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Complaints</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Resolved</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Unresolved</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Join Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      // Loading skeleton
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                        </TableRow>
                      ))
                    ) : error ? (
                      // Error state
                      <TableRow>
                        <TableCell colSpan={9}>
                          <Alert severity="error" sx={{ my: 2 }}>
                            {error}
                          </Alert>
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      // Empty state
                      <TableRow>
                        <TableCell colSpan={9}>
                          <EmptyState
                            icon={
                              searchTerm || statusFilter !== 'ALL' ? (
                                <SearchOffIcon sx={{ fontSize: 40, color: '#9e9e9e' }} />
                              ) : (
                                <PersonOffIcon sx={{ fontSize: 40, color: '#9e9e9e' }} />
                              )
                            }
                            title={
                              searchTerm || statusFilter !== 'ALL'
                                ? 'No users found'
                                : 'No users registered yet'
                            }
                            description={
                              searchTerm || statusFilter !== 'ALL'
                                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                : 'Users who register through the mobile app will appear here.'
                            }
                            action={
                              searchTerm || statusFilter !== 'ALL'
                                ? {
                                  label: 'Clear Filters',
                                  onClick: handleClearFilters,
                                }
                                : undefined
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      // User rows
                      users.map((user) => (
                        <TableRow
                          key={user.id}
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f8f9fa'
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {user.avatar ? (
                                <Avatar src={user.avatar} sx={{ width: 40, height: 40 }} />
                              ) : (
                                <Avatar sx={{ width: 40, height: 40, bgcolor: '#4CAF50' }}>
                                  {getUserInitials(user.firstName, user.lastName)}
                                </Avatar>
                              )}
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {`${user.firstName} ${user.lastName}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  #{user.id.toString().padStart(6, '0')}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">{user.email || 'N/A'}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">{formatPhoneNumber(user.phone)}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {user.cityCorporation?.name || 'N/A'}
                              </Typography>
                              {user.cityCorporation && (
                                <Typography variant="caption" color="text.secondary">
                                  {user.cityCorporation.code}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {user.zone && (
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  Zone {user.zone.zoneNumber}{user.zone.name ? ` - ${user.zone.name}` : ''}
                                </Typography>
                              )}
                              {user.ward && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Ward {user.ward.wardNumber}
                                  </Typography>
                                </Box>
                              )}
                              {!user.zone && !user.ward && (
                                <Typography variant="body2" color="text.secondary">
                                  N/A
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.statistics.totalComplaints}
                              sx={{
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2',
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.statistics.resolvedComplaints}
                              sx={{
                                backgroundColor: '#e8f5e8',
                                color: '#2e7d2e',
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.statistics.unresolvedComplaints}
                              sx={{
                                backgroundColor: '#ffebee',
                                color: '#c62828',
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">{formatDate(user.createdAt)}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={actionLoading.viewUser === user.id ? <CircularProgress size={16} /> : <VisibilityIcon />}
                                onClick={() => handleViewUser(user.id)}
                                disabled={actionLoading.viewUser === user.id}
                                sx={{
                                  textTransform: 'none',
                                  borderColor: '#e0e0e0',
                                  color: 'text.primary',
                                  '&:hover': {
                                    borderColor: '#4CAF50',
                                    color: '#4CAF50',
                                  },
                                }}
                              >
                                {actionLoading.viewUser === user.id ? 'Loading...' : 'View'}
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditUser(user)}
                                sx={{
                                  textTransform: 'none',
                                  borderColor: '#e0e0e0',
                                  color: 'text.primary',
                                  '&:hover': {
                                    borderColor: '#4CAF50',
                                    color: '#4CAF50',
                                  },
                                }}
                              >
                                Edit
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {!loading && !error && users.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderTop: '1px solid #e0e0e0',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  {/* Pagination Info */}
                  <Typography variant="body2" color="text.secondary">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total.toLocaleString()} users
                  </Typography>

                  {/* Pagination Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {/* Rows per page selector */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Rows per page:
                      </Typography>
                      <Select
                        value={pagination.limit}
                        onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                        size="small"
                        sx={{ minWidth: 80 }}
                      >
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                        <MenuItem value={200}>200</MenuItem>
                      </Select>
                    </Box>

                    {/* Page navigation */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                        disabled={pagination.page === 1}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        First
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        Previous
                      </Button>

                      <Typography variant="body2" sx={{ mx: 2 }}>
                        Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                      </Typography>

                      <Button
                        size="small"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        Next
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.ceil(pagination.total / pagination.limit) }))}
                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        Last
                      </Button>
                    </Box>

                    {/* Direct page input */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Go to:
                      </Typography>
                      <TextField
                        type="number"
                        size="small"
                        value={pagination.page}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          const maxPage = Math.ceil(pagination.total / pagination.limit);
                          if (page >= 1 && page <= maxPage) {
                            setPagination(prev => ({ ...prev, page }));
                          }
                        }}
                        inputProps={{
                          min: 1,
                          max: Math.ceil(pagination.total / pagination.limit),
                          style: { textAlign: 'center' }
                        }}
                        sx={{ width: 80 }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Modals */}
        <UserDetailsModal
          user={selectedUser}
          recentComplaints={selectedUserComplaints}
          open={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedUser(null);
            setSelectedUserComplaints([]);
          }}
          onEdit={() => {
            setIsDetailsModalOpen(false);
            setIsEditModalOpen(true);
          }}
        />

        <UserEditModal
          user={selectedUser}
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleUpdateUser}
        />

        <UserAddModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleCreateUser}
        />

        {/* Toast Notification */}
        <Snackbar
          open={toast.open}
          autoHideDuration={6000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseToast}
            severity={toast.severity}
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </MainLayout>
    </ErrorBoundary>
  );
};

export default UserManagement;