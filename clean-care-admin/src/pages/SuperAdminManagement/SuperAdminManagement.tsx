import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Avatar,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Divider,
  CircularProgress,
  Pagination,
} from '@mui/material';
import MainLayout from '../../components/common/Layout/MainLayout';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { toast } from 'react-hot-toast';
import { superAdminService } from '../../services/superAdminService';
import type { SuperAdmin, SuperAdminStatistics } from '../../services/superAdminService';
import SuperAdminAddModal from '../../components/SuperAdminManagement/SuperAdminAddModal';
import SuperAdminEditModal from '../../components/SuperAdminManagement/SuperAdminEditModal';
import ActivityFeed from '../../components/SuperAdminManagement/ActivityFeed';
import { UserStatus } from '../../types/userManagement.types';

const StatCard: React.FC<{ title: string; value: string | number; bg: string; color: string }> = ({ title, value, bg, color }) => (
  <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
    <CardContent sx={{ bgcolor: bg, borderRadius: 2 }}>
      <Stack spacing={0.5}>
        <Typography sx={{ color: '#4a5565', fontSize: 14 }}>{title}</Typography>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color }}>{value}</Typography>
      </Stack>
    </CardContent>
  </Card>
);

const StatCardSkeleton: React.FC<{ bg: string }> = ({ bg }) => (
  <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
    <CardContent sx={{ bgcolor: bg, borderRadius: 2 }}>
      <Stack spacing={0.5}>
        <Box sx={{ width: '60%', height: 14, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }} />
        <Box sx={{ width: '40%', height: 28, bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 1, mt: 0.5 }} />
      </Stack>
    </CardContent>
  </Card>
);

const SuperAdminManagement: React.FC = () => {
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedSuperAdmin, setSelectedSuperAdmin] = useState<SuperAdmin | null>(null);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [statistics, setStatistics] = useState<SuperAdminStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Load super admins
  const loadSuperAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getSuperAdmins({
        page,
        limit,
        search: query || undefined,
      });
      setSuperAdmins(response.users);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Error loading super admins:', error);
      toast.error('সুপার এডমিন লোড করতে ব্যর্থ');
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    setStatisticsLoading(true);
    try {
      const stats = await superAdminService.getSuperAdminStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('পরিসংখ্যান লোড করতে ব্যর্থ');
    } finally {
      setStatisticsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuperAdmins();
  }, [loadSuperAdmins]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1); // Reset to first page on search
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে ${name} কে মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      await superAdminService.deleteSuperAdmin(id);
      toast.success('সুপার এডমিন সফলভাবে মুছে ফেলা হয়েছে');
      loadSuperAdmins();
      loadStatistics();
    } catch (error: any) {
      console.error('Error deleting super admin:', error);
      toast.error(error.response?.data?.message || 'সুপার এডমিন মুছে ফেলতে ব্যর্থ');
    }
  };

  const handleAddSuccess = () => {
    loadSuperAdmins();
    loadStatistics();
  };

  const handleEdit = (admin: SuperAdmin) => {
    setSelectedSuperAdmin(admin);
    setOpenEdit(true);
  };

  const handleEditSuccess = () => {
    loadSuperAdmins();
    loadStatistics();
  };

  return (
    <MainLayout title="সুপার এডমিন ম্যানেজমেন্ট">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' }, gap: 3 }}>
        {/* Main Content */}
        <Stack spacing={3}>
          {/* Statistics Cards */}
          <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
            <CardContent>
              <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1e2939', mb: 2 }}>
                সুপার এডমিন ম্যানেজমেন্ট
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                {statisticsLoading ? (
                  <>
                    <StatCardSkeleton bg="#eff6ff" />
                    <StatCardSkeleton bg="#f0fdf4" />
                    <StatCardSkeleton bg="#fef2f2" />
                    <StatCardSkeleton bg="#faf5ff" />
                  </>
                ) : (
                  <>
                    <StatCard
                      title="মোট সুপার এডমিন"
                      value={(statistics?.statusBreakdown.active ?? 0) + (statistics?.statusBreakdown.inactive ?? 0)}
                      bg="#eff6ff"
                      color="#155dfc"
                    />
                    <StatCard
                      title="সক্রিয়"
                      value={statistics?.statusBreakdown.active ?? 0}
                      bg="#f0fdf4"
                      color="#00a63e"
                    />
                    <StatCard
                      title="নিষ্ক্রিয়"
                      value={statistics?.statusBreakdown.inactive ?? 0}
                      bg="#fef2f2"
                      color="#e7000b"
                    />
                    <StatCard
                      title="আজ নতুন"
                      value={`+${statistics?.newUsersThisMonth || 0}`}
                      bg="#faf5ff"
                      color="#9810fa"
                    />
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Search and Add Button */}
          <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="নাম/নাম্বার দিয়ে খুঁজুন..."
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#0a0a0a80' }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ maxWidth: 700 }}
              />
              <Button
                variant="contained"
                sx={{ bgcolor: '#3fa564', whiteSpace: 'nowrap' }}
                startIcon={<AddIcon />}
                onClick={() => setOpenAdd(true)}
              >
                নতুন সুপার এডমিন যোগ করুন
              </Button>
            </CardContent>
          </Card>

          {/* Super Admin List */}
          <Typography sx={{ fontSize: 20, color: '#000000' }}>সুপার এডমিন তালিকা</Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : superAdmins.length === 0 ? (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography sx={{ textAlign: 'center', py: 4, color: '#6a7282' }}>
                  কোনো সুপার এডমিন পাওয়া যায়নি
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
                <Box sx={{ bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb', px: 3, py: 1.5 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '30% 20% 15% 15% 20%', gap: 2 }}>
                    <Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>সুপার এডমিন</Typography>
                    <Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>এলাকা ও জোন</Typography>
                    <Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>নিয়ন্ত্রণ</Typography>
                    <Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>স্ট্যাটাস</Typography>
                    <Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>অভিযোগ পরিসংখ্যান</Typography>
                  </Box>
                </Box>
                <CardContent sx={{ px: 0 }}>
                  <Table>
                    <TableBody>
                      {superAdmins.map((admin) => (
                        <TableRow key={admin.id} hover>
                          <TableCell sx={{ width: '30%' }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ bgcolor: '#2b7fff' }}>
                                {admin.avatar ? (
                                  <img src={admin.avatar} alt={admin.firstName} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                  admin.firstName.charAt(0).toUpperCase()
                                )}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                                  {admin.firstName} {admin.lastName}
                                </Typography>
                                <Typography sx={{ fontSize: 14, color: '#4a5565' }}>{admin.phone}</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ width: '20%' }}>
                            <Typography sx={{ fontSize: 14, color: '#1e2939', fontWeight: 600 }}>
                              {admin.cityCorporation?.name || 'N/A'}
                            </Typography>
                            {admin.assignedZones && admin.assignedZones.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {admin.assignedZones.map((az) => (
                                  <Chip
                                    key={az.zone.id}
                                    label={az.zone.name}
                                    size="small"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Box>
                                <Typography sx={{ fontSize: 13, color: '#4a5565', fontWeight: 600 }}>
                                  {admin.zone ? `🏢 ${admin.zone.name}` : '⚠️ জোন নির্ধারিত নেই'}
                                </Typography>
                                {admin.zone && (
                                  <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                                    জোন নং: {admin.zone.zoneNumber || 'N/A'}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell sx={{ width: '15%' }}>
                            <Stack spacing={0.5}>
                              {admin.zone || (admin.assignedZones && admin.assignedZones.length > 0) ? (
                                <>
                                  <Typography sx={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>
                                    ✓ জোন অফিসার
                                  </Typography>
                                  <Typography sx={{ fontSize: 12, color: '#4a5565' }}>
                                    👥 এডমিন ম্যানেজ করে
                                  </Typography>
                                  <Typography sx={{ fontSize: 12, color: '#4a5565' }}>
                                    📍 ওয়ার্ড দেখতে পারে
                                  </Typography>
                                </>
                              ) : (
                                <Typography sx={{ fontSize: 13, color: '#dc2626' }}>
                                  ⚠️ জোন assign করুন
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ width: '15%' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={admin.status === UserStatus.ACTIVE ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                size="small"
                                sx={{
                                  bgcolor: admin.status === UserStatus.ACTIVE ? '#dcfce7' : '#fef2f2',
                                  color: admin.status === UserStatus.ACTIVE ? '#008236' : '#e7000b',
                                }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ width: '20%' }}>
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
                                <IconButton size="small" onClick={() => handleEdit(admin)}>
                                  <EditOutlined />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(admin.id, `${admin.firstName} ${admin.lastName}`)}
                                >
                                  <DeleteOutline />
                                </IconButton>
                              </Stack>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableHead sx={{ display: 'none' }}>
                      <TableRow>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                  </Table>
                </CardContent>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}

          {/* Add Modal */}
          <SuperAdminAddModal open={openAdd} onClose={() => setOpenAdd(false)} onSuccess={handleAddSuccess} />

          {/* Edit Modal */}
          <SuperAdminEditModal
            open={openEdit}
            onClose={() => {
              setOpenEdit(false);
              setSelectedSuperAdmin(null);
            }}
            onSuccess={handleEditSuccess}
            superAdmin={selectedSuperAdmin}
          />
        </Stack>

        {/* Activity Feed Sidebar */}
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <ActivityFeed />
        </Box>
      </Box>
    </MainLayout>
  );
};

export default SuperAdminManagement;
