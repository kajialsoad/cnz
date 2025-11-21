import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  Pagination,
  AlertTitle,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Chat as ChatIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  WifiOff as WifiOffIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { showSuccessToast, showErrorToast, showNetworkErrorToast } from '../../utils/toastUtils';
import MainLayout from '../../components/common/Layout/MainLayout';
import ComplaintCardSkeleton from '../../components/common/ComplaintCardSkeleton';
import ComplaintDetailsModal from '../../components/Complaints/ComplaintDetailsModal';
import ChatModal from '../../components/Complaints/ChatModal';
import CategoryFilter from '../../components/Complaints/CategoryFilter';
import SubcategoryFilter from '../../components/Complaints/SubcategoryFilter';
import CategoryBadge from '../../components/Complaints/CategoryBadge';
import LoadingButton from '../../components/common/LoadingButton';
import PageLoadingBar from '../../components/common/PageLoadingBar';
import { complaintService } from '../../services/complaintService';
import { cityCorporationService } from '../../services/cityCorporationService';
import { thanaService } from '../../services/thanaService';
import type { CityCorporation } from '../../services/cityCorporationService';
import type { Thana } from '../../services/thanaService';
import { useDebounce } from '../../hooks/useDebounce';
import { formatTimeAgo } from '../../utils/dateUtils';
import { handleApiError, logError, ErrorType } from '../../utils/errorHandler';
import { fadeIn, animationConfig, getStaggerDelay, statusBadgeTransition } from '../../styles/animations';
import type {
  Complaint,
  ComplaintStatus,
  ComplaintStats,
} from '../../types/complaint-service.types';

const AllComplaints: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px

  // Initialize state from URL query parameters
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [isRetryable, setIsRetryable] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'ALL'>(
    (searchParams.get('status') as ComplaintStatus) || 'ALL'
  );
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [subcategoryFilter, setSubcategoryFilter] = useState(searchParams.get('subcategory') || '');

  // City Corporation filters
  const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
  const [selectedCityCorporation, setSelectedCityCorporation] = useState<string>(
    searchParams.get('cityCorporation') || 'ALL'
  );
  const [selectedWard, setSelectedWard] = useState<string>(
    searchParams.get('ward') || 'ALL'
  );
  const [selectedThana, setSelectedThana] = useState<number | null>(
    searchParams.get('thana') ? Number(searchParams.get('thana')) : null
  );
  const [wardRange, setWardRange] = useState<{ min: number; max: number }>({ min: 1, max: 100 });
  const [thanas, setThanas] = useState<Thana[]>([]);
  const [cityCorporationsLoading, setCityCorporationsLoading] = useState<boolean>(false);
  const [thanasLoading, setThanasLoading] = useState<boolean>(false);

  const [statusCounts, setStatusCounts] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  });
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '20', 10),
    total: 0,
    totalPages: 0,
  });

  // Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatComplaintId, setSelectedChatComplaintId] = useState<number | null>(null);
  const [selectedChatCitizenName, setSelectedChatCitizenName] = useState<string>('');
  const [selectedChatComplaintTitle, setSelectedChatComplaintTitle] = useState<string>('');

  // Button loading states
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  /**
   * Fetch city corporations on mount
   */
  useEffect(() => {
    fetchCityCorporations();
  }, []);

  /**
   * Update ward range and thanas when city corporation changes
   */
  useEffect(() => {
    if (selectedCityCorporation !== 'ALL') {
      const cityCorporation = cityCorporations.find(cc => cc.code === selectedCityCorporation);
      if (cityCorporation) {
        setWardRange({ min: cityCorporation.minWard, max: cityCorporation.maxWard });
        fetchThanas(cityCorporation.code);
      }
    } else {
      setWardRange({ min: 1, max: 100 });
      setThanas([]);
    }
    setSelectedWard('ALL');
    setSelectedThana(null);
  }, [selectedCityCorporation, cityCorporations]);

  /**
   * Update URL query parameters when filters change
   */
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (subcategoryFilter) params.set('subcategory', subcategoryFilter);
    if (selectedCityCorporation !== 'ALL') params.set('cityCorporation', selectedCityCorporation);
    if (selectedWard !== 'ALL') params.set('ward', selectedWard);
    if (selectedThana) params.set('thana', selectedThana.toString());
    if (pagination.page !== 1) params.set('page', pagination.page.toString());
    if (pagination.limit !== 20) params.set('limit', pagination.limit.toString());

    setSearchParams(params, { replace: true });
  }, [searchTerm, statusFilter, categoryFilter, subcategoryFilter, selectedCityCorporation, selectedWard, selectedThana, pagination.page, pagination.limit]);

  /**
   * Fetch city corporations
   */
  const fetchCityCorporations = async () => {
    try {
      setCityCorporationsLoading(true);
      const cityCorps = await cityCorporationService.getCityCorporations('ACTIVE');
      setCityCorporations(cityCorps);
    } catch (err: any) {
      console.error('Error fetching city corporations:', err);
      showErrorToast('Failed to load city corporations');
    } finally {
      setCityCorporationsLoading(false);
    }
  };

  /**
   * Fetch thanas for selected city corporation
   */
  const fetchThanas = async (cityCorporationCode: string) => {
    try {
      setThanasLoading(true);
      const thanasData = await thanaService.getThanasByCityCorporation(cityCorporationCode, 'ACTIVE');
      setThanas(thanasData);
    } catch (err: any) {
      console.error('Error fetching thanas:', err);
      showErrorToast('Failed to load thanas');
    } finally {
      setThanasLoading(false);
    }
  };

  /**
   * Fetch complaints from the backend
   */
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorType(null);
      setIsRetryable(false);

      const filters: any = {};

      // Add status filter if not "ALL"
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }

      // Add search term if present
      if (debouncedSearchTerm) {
        filters.search = debouncedSearchTerm;
      }

      // Add category filter if present
      if (categoryFilter) {
        filters.category = categoryFilter;
      }

      // Add subcategory filter if present
      if (subcategoryFilter) {
        filters.subcategory = subcategoryFilter;
      }

      // Add city corporation filter if present
      if (selectedCityCorporation !== 'ALL') {
        filters.cityCorporationCode = selectedCityCorporation;
      }

      // Add ward filter if present
      if (selectedWard !== 'ALL') {
        filters.ward = selectedWard;
      }

      // Add thana filter if present
      if (selectedThana) {
        filters.thanaId = selectedThana;
      }

      console.log('Fetching complaints with params:', {
        page: pagination.page,
        limit: pagination.limit,
        filters
      });

      const response = await complaintService.getComplaints(
        pagination.page,
        pagination.limit,
        filters
      );

      console.log('Complaints fetched successfully:', response);

      setComplaints(response.complaints);
      setStatusCounts(response.statusCounts);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (err: any) {
      // Log error for debugging
      console.error('Error fetching complaints:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      logError(err, 'fetchComplaints');

      // Handle error with enhanced error handling
      const enhancedError = handleApiError(err);
      setError(enhancedError.userMessage);
      setErrorType(enhancedError.type);
      setIsRetryable(enhancedError.retryable);

      // Show toast notification for errors
      if (enhancedError.type === ErrorType.NETWORK) {
        showNetworkErrorToast(enhancedError.userMessage);
      } else {
        showErrorToast(enhancedError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, categoryFilter, subcategoryFilter, selectedCityCorporation, selectedWard, selectedThana, debouncedSearchTerm]);

  /**
   * Fetch complaints on component mount and when filters change
   */
  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  /**
   * Handle page change
   */
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPagination((prev) => ({ ...prev, page: value }));
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as ComplaintStatus | 'ALL');
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Handle search term change
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Reset to page 1 when search changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Handle category filter change
   */
  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    // Reset subcategory when category changes
    setSubcategoryFilter('');
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Handle subcategory filter change
   */
  const handleSubcategoryFilterChange = (value: string) => {
    setSubcategoryFilter(value);
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Handle city corporation filter change
   */
  const handleCityCorporationFilterChange = (value: string) => {
    setSelectedCityCorporation(value);
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Handle ward filter change
   */
  const handleWardFilterChange = (value: string) => {
    setSelectedWard(value);
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Handle thana filter change
   */
  const handleThanaFilterChange = (value: number | null) => {
    setSelectedThana(value);
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setCategoryFilter('');
    setSubcategoryFilter('');
    setSelectedCityCorporation('ALL');
    setSelectedWard('ALL');
    setSelectedThana(null);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Retry fetching complaints
   */
  const handleRetry = () => {
    fetchComplaints();
  };

  /**
   * Handle status update for a complaint
   * Updates the complaint in the list and refreshes status counts
   */
  const handleStatusUpdate = useCallback(async (
    complaintId: number,
    newStatus: ComplaintStatus
  ) => {
    try {
      setUpdatingStatusId(complaintId);

      // Update the complaint status via API
      const updatedComplaint = await complaintService.updateComplaintStatus(
        complaintId,
        { status: newStatus }
      );

      // Update the complaint in the local state
      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) =>
          complaint.id === complaintId ? updatedComplaint : complaint
        )
      );

      // Update status counts in real-time
      setStatusCounts((prevCounts) => {
        const oldComplaint = complaints.find((c) => c.id === complaintId);
        if (!oldComplaint) return prevCounts;

        const newCounts = { ...prevCounts };

        // Decrement old status count
        if (oldComplaint.status === 'PENDING') {
          newCounts.pending = Math.max(0, newCounts.pending - 1);
        } else if (oldComplaint.status === 'IN_PROGRESS') {
          newCounts.inProgress = Math.max(0, newCounts.inProgress - 1);
        } else if (oldComplaint.status === 'RESOLVED') {
          newCounts.resolved = Math.max(0, newCounts.resolved - 1);
        } else if (oldComplaint.status === 'REJECTED') {
          newCounts.rejected = Math.max(0, newCounts.rejected - 1);
        }

        // Increment new status count
        if (newStatus === 'PENDING') {
          newCounts.pending += 1;
        } else if (newStatus === 'IN_PROGRESS') {
          newCounts.inProgress += 1;
        } else if (newStatus === 'RESOLVED') {
          newCounts.resolved += 1;
        } else if (newStatus === 'REJECTED') {
          newCounts.rejected += 1;
        }

        return newCounts;
      });

      showSuccessToast('Complaint status updated successfully');
    } catch (err: any) {
      // Log error for debugging
      logError(err, 'handleStatusUpdate');

      // Handle error with enhanced error handling
      const enhancedError = handleApiError(err);

      if (enhancedError.type === ErrorType.NETWORK) {
        showNetworkErrorToast(enhancedError.userMessage);
      } else {
        showErrorToast(enhancedError.userMessage);
      }
    } finally {
      setUpdatingStatusId(null);
    }
  }, [complaints]);

  /**
   * Handle opening complaint details modal
   */
  const handleViewDetails = (complaintId: number) => {
    setSelectedComplaintId(complaintId);
    setDetailsModalOpen(true);
  };

  /**
   * Handle closing complaint details modal
   */
  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedComplaintId(null);
  };

  /**
   * Handle opening chat modal
   */
  const handleOpenChat = (complaint: Complaint) => {
    setSelectedChatComplaintId(complaint.id);
    setSelectedChatCitizenName(`${complaint.user.firstName} ${complaint.user.lastName}`);
    setSelectedChatComplaintTitle(complaint.category || complaint.title);
    setChatModalOpen(true);
  };

  /**
   * Handle closing chat modal
   */
  const handleCloseChatModal = () => {
    setChatModalOpen(false);
    setSelectedChatComplaintId(null);
    setSelectedChatCitizenName('');
    setSelectedChatComplaintTitle('');
  };

  /**
   * Handle opening chat from details modal
   */
  const handleChatOpenFromDetails = (complaintId: number) => {
    handleCloseDetailsModal();
    navigate(`/chats/${complaintId}`);
  };

  /**
   * Handle status update from modal
   */
  const handleModalStatusUpdate = useCallback(async (
    complaintId: number,
    newStatus: ComplaintStatus
  ) => {
    await handleStatusUpdate(complaintId, newStatus);
    // Optionally refresh the complaint list
    fetchComplaints();
  }, [handleStatusUpdate, fetchComplaints]);

  /**
   * Get status color based on complaint status
   */
  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderColor: '#ffeeba'
        };
      case 'IN_PROGRESS':
        return {
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          borderColor: '#bee5eb'
        };
      case 'RESOLVED':
        return {
          backgroundColor: '#d4edda',
          color: '#155724',
          borderColor: '#c3e6cb'
        };
      case 'REJECTED':
        return {
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderColor: '#f5c6cb'
        };
      default:
        return { backgroundColor: '#f8f9fa', color: '#6c757d' };
    }
  };

  /**
   * Get display label for status
   */
  const getStatusLabel = (status: ComplaintStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'RESOLVED':
        return 'Solved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  /**
   * Get available status transitions for a complaint
   */
  const getAvailableStatusTransitions = (currentStatus: ComplaintStatus): { status: ComplaintStatus; label: string; color: string }[] => {
    const transitions: Record<ComplaintStatus, { status: ComplaintStatus; label: string; color: string }[]> = {
      PENDING: [
        { status: 'IN_PROGRESS', label: 'Mark In Progress', color: '#0c5460' },
        { status: 'RESOLVED', label: 'Mark Solved', color: '#155724' },
        { status: 'REJECTED', label: 'Mark Rejected', color: '#721c24' },
      ],
      IN_PROGRESS: [
        { status: 'PENDING', label: 'Mark Pending', color: '#856404' },
        { status: 'RESOLVED', label: 'Mark Solved', color: '#155724' },
        { status: 'REJECTED', label: 'Mark Rejected', color: '#721c24' },
      ],
      RESOLVED: [
        { status: 'PENDING', label: 'Mark Pending', color: '#856404' },
        { status: 'IN_PROGRESS', label: 'Mark In Progress', color: '#0c5460' },
        { status: 'REJECTED', label: 'Mark Rejected', color: '#721c24' },
      ],
      REJECTED: [
        { status: 'PENDING', label: 'Mark Pending', color: '#856404' },
        { status: 'IN_PROGRESS', label: 'Mark In Progress', color: '#0c5460' },
        { status: 'RESOLVED', label: 'Mark Solved', color: '#155724' },
      ],
    };

    return transitions[currentStatus] || [];
  };

  return (
    <MainLayout title="All Complaints">
      <PageLoadingBar loading={loading} />
      <Box sx={{
        width: '100%',
        maxWidth: '100%',
        px: { xs: 1, sm: 1.5, md: 2 },
        mx: 0
      }}>
        {/* Header Section */}
        <Box sx={{ mb: { xs: 2, sm: 3 }, width: '100%' }}>
          {/* Title and Status Summary Row */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'flex-start' },
            width: '100%',
            mb: 2,
            gap: { xs: 2, md: 0 },
          }}>
            {/* Left Side - Title and Subtitle */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}
              >
                All Complaints
              </Typography>
              <Typography
                variant={isMobile ? 'body2' : 'body1'}
                color="text.secondary"
              >
                Manage and track citizen complaints
                {pagination.total > 0 && ` (${pagination.total} total)`}
              </Typography>
            </Box>

            {/* Right Side - Status Summary */}
            <Box sx={{
              display: 'flex',
              gap: { xs: 1, sm: 1.5 },
              alignItems: 'center',
              flexWrap: 'wrap',
              width: { xs: '100%', md: 'auto' },
            }}>
              <Chip
                label={`${statusCounts.pending} Pending`}
                sx={{
                  ...getStatusColor('PENDING'),
                  ...statusBadgeTransition,
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  height: { xs: 28, sm: 32 },
                  px: { xs: 1.5, sm: 2 },
                }}
              />
              <Chip
                label={`${statusCounts.inProgress} In Progress`}
                sx={{
                  ...getStatusColor('IN_PROGRESS'),
                  ...statusBadgeTransition,
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  height: { xs: 28, sm: 32 },
                  px: { xs: 1.5, sm: 2 },
                }}
              />
              <Chip
                label={`${statusCounts.resolved} Solved`}
                sx={{
                  ...getStatusColor('RESOLVED'),
                  ...statusBadgeTransition,
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  height: { xs: 28, sm: 32 },
                  px: { xs: 1.5, sm: 2 },
                }}
              />
              <Chip
                label={`${statusCounts.rejected} Rejected`}
                sx={{
                  ...getStatusColor('REJECTED'),
                  ...statusBadgeTransition,
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  height: { xs: 28, sm: 32 },
                  px: { xs: 1.5, sm: 2 },
                }}
              />
            </Box>
          </Box>

          {/* Enhanced Search and Filter Section */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: '#f8f9fa',
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            width: '100%',
          }}>
            {/* Main Search Row */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 2 },
              alignItems: { xs: 'stretch', sm: 'center' },
            }}>
              {/* Enhanced Search Input */}
              <TextField
                placeholder={isMobile ? "Search complaints..." : "Search by ID, title, location, or citizen name..."}
                value={searchTerm}
                onChange={handleSearchChange}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={() => {
                            setSearchTerm('');
                            setPagination((prev) => ({ ...prev, page: 1 }));
                          }}
                          sx={{
                            minWidth: 'auto',
                            p: 0.5,
                            color: 'text.secondary',
                            '&:hover': {
                              color: 'error.main',
                              backgroundColor: 'transparent',
                            },
                          }}
                        >
                          ✕
                        </Button>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    height: { xs: 40, sm: 44 },
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                        borderWidth: 2,
                      },
                    },
                  },
                }}
              />

              {/* Status Filter */}
              <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    </InputAdornment>
                  }
                  sx={{
                    backgroundColor: 'white',
                    height: { xs: 40, sm: 44 },
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      pl: 0,
                      fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    },
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  <MenuItem value="ALL">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#9e9e9e' }} />
                      All Status
                    </Box>
                  </MenuItem>
                  <MenuItem value="PENDING">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                      Pending
                    </Box>
                  </MenuItem>
                  <MenuItem value="IN_PROGRESS">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2196f3' }} />
                      In Progress
                    </Box>
                  </MenuItem>
                  <MenuItem value="RESOLVED">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                      Solved
                    </Box>
                  </MenuItem>
                  <MenuItem value="REJECTED">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f44336' }} />
                      Rejected
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Category Filter */}
              <CategoryFilter
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
              />

              {/* Subcategory Filter */}
              <SubcategoryFilter
                categoryId={categoryFilter}
                value={subcategoryFilter}
                onChange={handleSubcategoryFilterChange}
              />
            </Box>

            {/* Second Row - City Corporation Filters */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 2 },
              alignItems: { xs: 'stretch', sm: 'center' },
            }}>
              {/* City Corporation Filter */}
              <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                <Select
                  value={selectedCityCorporation}
                  onChange={(e) => handleCityCorporationFilterChange(e.target.value)}
                  displayEmpty
                  disabled={cityCorporationsLoading}
                  sx={{
                    backgroundColor: 'white',
                    height: { xs: 40, sm: 44 },
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    },
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                        borderWidth: 2,
                      },
                    },
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

              {/* Ward Filter */}
              <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                <Select
                  value={selectedWard}
                  onChange={(e) => handleWardFilterChange(e.target.value)}
                  displayEmpty
                  disabled={selectedCityCorporation === 'ALL'}
                  sx={{
                    backgroundColor: 'white',
                    height: { xs: 40, sm: 44 },
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    },
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  <MenuItem value="ALL">All Wards</MenuItem>
                  {Array.from(
                    { length: wardRange.max - wardRange.min + 1 },
                    (_, i) => wardRange.min + i
                  ).map((ward) => (
                    <MenuItem key={ward} value={ward.toString()}>
                      Ward {ward}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Thana Filter */}
              <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                <Select
                  value={selectedThana || ''}
                  onChange={(e) => handleThanaFilterChange(e.target.value ? Number(e.target.value) : null)}
                  displayEmpty
                  disabled={selectedCityCorporation === 'ALL' || thanasLoading || !thanas || thanas.length === 0}
                  sx={{
                    backgroundColor: 'white',
                    height: { xs: 40, sm: 44 },
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    },
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Thanas</MenuItem>
                  {thanas && thanas.map((thana) => (
                    <MenuItem key={thana.id} value={thana.id}>
                      {thana.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Clear Filters Button */}
              {(searchTerm || statusFilter !== 'ALL' || categoryFilter || subcategoryFilter || selectedCityCorporation !== 'ALL' || selectedWard !== 'ALL' || selectedThana) && (
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<RefreshIcon />}
                  sx={{
                    height: { xs: 40, sm: 44 },
                    textTransform: 'none',
                    borderColor: '#e0e0e0',
                    color: 'text.primary',
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    minWidth: { xs: '100%', sm: 'auto' },
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      borderColor: '#4CAF50',
                      color: '#4CAF50',
                      backgroundColor: 'rgba(76, 175, 80, 0.04)',
                    },
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>

            {/* Search Tips (shown when searching) */}
            {searchTerm && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1,
                py: 0.5,
                backgroundColor: 'rgba(76, 175, 80, 0.08)',
                borderRadius: 1,
                fontSize: '0.75rem',
                color: 'text.secondary',
              }}>
                <SearchIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">
                  Searching for: <strong>"{searchTerm}"</strong>
                  {debouncedSearchTerm !== searchTerm && ' (typing...)'}
                </Typography>
              </Box>
            )}

            {/* Active Filters Display */}
            {(searchTerm || statusFilter !== 'ALL' || selectedCityCorporation !== 'ALL' || selectedWard !== 'ALL' || selectedThana) && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}>
                <Typography variant="caption" color="text.secondary">
                  Active filters:
                </Typography>
                {searchTerm && (
                  <Chip
                    label={`Search: "${searchTerm.substring(0, 20)}${searchTerm.length > 20 ? '...' : ''}"`}
                    size="small"
                    onDelete={() => {
                      setSearchTerm('');
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    sx={{
                      backgroundColor: 'white',
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                )}
                {statusFilter !== 'ALL' && (
                  <Chip
                    label={`Status: ${statusFilter.replace('_', ' ')}`}
                    size="small"
                    onDelete={() => handleStatusFilterChange('ALL')}
                    sx={{
                      backgroundColor: 'white',
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                )}
                {selectedCityCorporation !== 'ALL' && (
                  <Chip
                    label={`City Corp: ${cityCorporations.find(cc => cc.code === selectedCityCorporation)?.name || selectedCityCorporation}`}
                    size="small"
                    onDelete={() => handleCityCorporationFilterChange('ALL')}
                    sx={{
                      backgroundColor: 'white',
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                )}
                {selectedWard !== 'ALL' && (
                  <Chip
                    label={`Ward: ${selectedWard}`}
                    size="small"
                    onDelete={() => handleWardFilterChange('ALL')}
                    sx={{
                      backgroundColor: 'white',
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                )}
                {selectedThana && (
                  <Chip
                    label={`Thana: ${thanas.find(t => t.id === selectedThana)?.name || selectedThana}`}
                    size="small"
                    onDelete={() => handleThanaFilterChange(null)}
                    sx={{
                      backgroundColor: 'white',
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Error State */}
        {error && !loading && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
            icon={errorType === ErrorType.NETWORK ? <WifiOffIcon /> : <ErrorIcon />}
            action={
              isRetryable && (
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleRetry}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Retry
                </Button>
              )
            }
          >
            <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
              {errorType === ErrorType.NETWORK
                ? 'Connection Error'
                : errorType === ErrorType.SERVER
                  ? 'Server Error'
                  : errorType === ErrorType.AUTHENTICATION
                    ? 'Authentication Error'
                    : 'Error'}
            </AlertTitle>
            {error}
            {errorType === ErrorType.NETWORK && (
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Please check your internet connection and try again.
              </Typography>
            )}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
          }}>
            {[1, 2, 3].map((index) => (
              <ComplaintCardSkeleton key={index} />
            ))}
          </Box>
        )}

        {/* Empty State */}
        {!loading && !error && complaints.length === 0 && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            px: 2,
          }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No complaints found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filters'
                : 'No complaints have been submitted yet'}
            </Typography>
            {(searchTerm || statusFilter !== 'ALL') && (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ mt: 2 }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        )}

        {/* Complaints List */}
        {!loading && !error && complaints.length > 0 && (
          <>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: '100%',
            }}>
              {complaints.map((complaint, index) => (
                <Card
                  key={complaint.id}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    width: '100%',
                    animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.normal.timing}`,
                    animationDelay: getStaggerDelay(index, 50),
                    animationFillMode: 'both',
                    transition: `box-shadow ${animationConfig.fast.duration} ${animationConfig.fast.timing}, transform ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                    '&:hover': {
                      boxShadow: 2,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'flex-start' },
                      mb: 2,
                      width: '100%',
                      gap: { xs: 1.5, sm: 0 },
                    }}>
                      {/* Left Section - Complaint Info */}
                      <Box sx={{ flex: 1, mr: { xs: 0, sm: 2 }, width: { xs: '100%', sm: 'auto' } }}>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: { xs: 0.5, sm: 2 },
                          mb: 1
                        }}>
                          <Typography
                            variant={isMobile ? 'subtitle1' : 'h6'}
                            sx={{ fontWeight: 600, color: '#4CAF50' }}
                          >
                            {complaint.trackingNumber || `C${String(complaint.id).padStart(6, '0')}`}
                          </Typography>
                          <Typography
                            variant={isMobile ? 'body2' : 'body1'}
                            sx={{ fontWeight: 500 }}
                          >
                            {complaint.title}
                          </Typography>
                        </Box>

                        {/* Category Badge - NEW */}
                        {complaint.category && (
                          <CategoryBadge
                            categoryId={complaint.category}
                            subcategoryId={complaint.subcategory}
                          />
                        )}

                        <Box sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: { xs: 0.5, sm: 1 },
                          mb: 1
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            📍 {complaint.location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ⏰ {formatTimeAgo(complaint.createdAt)}
                          </Typography>
                        </Box>

                        {/* Citizen Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant={isMobile ? 'body2' : 'body1'}
                            sx={{ fontWeight: 500 }}
                          >
                            {complaint.user.firstName} {complaint.user.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Citizen
                          </Typography>
                        </Box>
                      </Box>

                      {/* Right Section - Status */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                      }}>
                        <Chip
                          label={getStatusLabel(complaint.status)}
                          sx={{
                            ...getStatusColor(complaint.status),
                            ...statusBadgeTransition,
                            fontWeight: 500,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            height: { xs: 28, sm: 32 },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 1.5 },
                      mt: 2,
                      width: '100%',
                      flexWrap: 'wrap'
                    }}>
                      <LoadingButton
                        variant="outlined"
                        size={isMobile ? 'small' : 'medium'}
                        startIcon={!isMobile && <VisibilityIcon />}
                        onClick={() => handleViewDetails(complaint.id)}
                        sx={{
                          borderColor: '#4CAF50',
                          color: '#4CAF50',
                          '&:hover': {
                            backgroundColor: '#4CAF50',
                            color: 'white',
                          },
                          textTransform: 'none',
                          px: { xs: 2, sm: 2.5 },
                          py: { xs: 1, sm: 0.75 },
                          minHeight: { xs: 44, sm: 'auto' },
                          fontSize: { xs: '0.875rem', sm: '0.95rem' },
                        }}
                      >
                        View Details
                      </LoadingButton>

                      <LoadingButton
                        variant="outlined"
                        size={isMobile ? 'small' : 'medium'}
                        startIcon={!isMobile && <ChatIcon />}
                        onClick={() => handleOpenChat(complaint)}
                        sx={{
                          borderColor: '#e0e0e0',
                          color: 'text.primary',
                          textTransform: 'none',
                          px: { xs: 2, sm: 2.5 },
                          py: { xs: 1, sm: 0.75 },
                          minHeight: { xs: 44, sm: 'auto' },
                          fontSize: { xs: '0.875rem', sm: '0.95rem' },
                          '&:hover': {
                            borderColor: '#4CAF50',
                            color: '#4CAF50',
                          },
                        }}
                      >
                        Chat
                      </LoadingButton>

                      {/* Dynamic Status Change Buttons */}
                      {getAvailableStatusTransitions(complaint.status).map((transition) => (
                        <LoadingButton
                          key={transition.status}
                          variant="outlined"
                          size={isMobile ? 'small' : 'medium'}
                          startIcon={!isMobile && <CheckCircleIcon />}
                          onClick={() => handleStatusUpdate(complaint.id, transition.status)}
                          loading={updatingStatusId === complaint.id}
                          loadingText="Updating..."
                          sx={{
                            borderColor: transition.color,
                            color: transition.color,
                            textTransform: 'none',
                            px: { xs: 2, sm: 2.5 },
                            py: { xs: 1, sm: 0.75 },
                            minHeight: { xs: 44, sm: 'auto' },
                            fontSize: { xs: '0.875rem', sm: '0.95rem' },
                            '&:hover': {
                              backgroundColor: transition.color,
                              color: 'white',
                              borderColor: transition.color,
                            },
                          }}
                        >
                          {transition.label}
                        </LoadingButton>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Pagination Section */}
            {pagination.total > 0 && (
              <Box sx={{
                mt: { xs: 3, sm: 4 },
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}>
                {/* Pagination Info */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                  px: { xs: 1, sm: 2 },
                }}>
                  {/* Items per page selector */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Show:
                    </Typography>
                    <FormControl size="small">
                      <Select
                        value={pagination.limit}
                        onChange={(e) => {
                          setPagination((prev) => ({
                            ...prev,
                            limit: Number(e.target.value),
                            page: 1, // Reset to first page
                          }));
                        }}
                        sx={{
                          minWidth: 80,
                          fontSize: '0.875rem',
                        }}
                      >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary">
                      per page
                    </Typography>
                  </Box>

                  {/* Page info */}
                  <Typography variant="body2" color="text.secondary">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} complaints
                  </Typography>
                </Box>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Pagination
                      count={pagination.totalPages}
                      page={pagination.page}
                      onChange={handlePageChange}
                      color="primary"
                      size={isMobile ? 'small' : 'large'}
                      showFirstButton={!isMobile}
                      showLastButton={!isMobile}
                      siblingCount={isMobile ? 0 : 1}
                      boundaryCount={isMobile ? 1 : 1}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontSize: { xs: '0.875rem', sm: '0.95rem' },
                          minWidth: { xs: 32, sm: 40 },
                          height: { xs: 32, sm: 40 },
                        },
                        '& .Mui-selected': {
                          backgroundColor: '#4CAF50 !important',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#45a049 !important',
                          },
                        },
                      }}
                    />
                  </Box>
                )}

                {/* Quick page jump (desktop only) */}
                {!isMobile && pagination.totalPages > 5 && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Go to page:
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={pagination.page}
                      onChange={(e) => {
                        const page = Number(e.target.value);
                        if (page >= 1 && page <= pagination.totalPages) {
                          setPagination((prev) => ({ ...prev, page }));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      inputProps={{
                        min: 1,
                        max: pagination.totalPages,
                        style: { textAlign: 'center' },
                      }}
                      sx={{
                        width: 80,
                        '& input': {
                          fontSize: '0.875rem',
                        },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      of {pagination.totalPages}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        complaintId={selectedComplaintId}
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        onStatusUpdate={handleModalStatusUpdate}
        onChatOpen={handleChatOpenFromDetails}
      />

      {/* Chat Modal */}
      <ChatModal
        complaintId={selectedChatComplaintId}
        open={chatModalOpen}
        onClose={handleCloseChatModal}
        citizenName={selectedChatCitizenName}
        complaintTitle={selectedChatComplaintTitle}
      />
    </MainLayout>
  );
};

export default AllComplaints;