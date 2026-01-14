import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  InputLabel,
  FormControl,
  Select,

  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  Pagination,
  AlertTitle,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  Tabs,
  Tab,
  Grid,
  Menu,
  MenuItem,
  Divider,
  Rating,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Download as DownloadIcon,
  Print as PrintIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { ZoneFilter } from '../../components/common';
import { showSuccessToast, showErrorToast, showNetworkErrorToast } from '../../utils/toastUtils';
import MainLayout from '../../components/common/Layout/MainLayout';
import ComplaintCardSkeleton from '../../components/common/ComplaintCardSkeleton';
import ComplaintDetailsModal from '../../components/Complaints/ComplaintDetailsModal';
import ChatModal from '../../components/Complaints/ChatModal';
import CategoryFilter from '../../components/Complaints/CategoryFilter';
import SubcategoryFilter from '../../components/Complaints/SubcategoryFilter';
import CategoryBadge from '../../components/Complaints/CategoryBadge';
import OthersFilterDropdown, { type OthersFilterValue } from '../../components/Complaints/OthersFilterDropdown';
import LoadingButton from '../../components/common/LoadingButton';
import PageLoadingBar from '../../components/common/PageLoadingBar';
import { complaintService } from '../../services/complaintService';
import { cityCorporationService } from '../../services/cityCorporationService';
import { zoneService } from '../../services/zoneService';
import { wardService } from '../../services/wardService';
import type { CityCorporation } from '../../services/cityCorporationService';
import type { Ward } from '../../services/wardService';
import { useDebounce } from '../../hooks/useDebounce';
import { formatTimeAgo } from '../../utils/dateUtils';
import { handleApiError, logError, ErrorType } from '../../utils/errorHandler';
import { fadeIn, animationConfig, getStaggerDelay, statusBadgeTransition } from '../../styles/animations';
import type {
  Complaint,
  ComplaintStatus,
  ComplaintStats,
} from '../../types/complaint-service.types';
import { useAuth } from '../../contexts/AuthContext';
import { superAdminService } from '../../services/superAdminService';
// Removed invalid Zone import

const AllComplaints: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px


  const { user: currentUser } = useAuth();

  // Define Zone interface locally
  interface Zone {
    id: number;
    zoneNumber?: number;
    name?: string;
    cityCorporationId?: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  }

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
  const [othersFilter, setOthersFilter] = useState<OthersFilterValue>(
    (searchParams.get('othersFilter') as OthersFilterValue) || 'ALL'
  );



  // City Corporation filters
  const [cityCorporations, setCityCorporations] = useState<CityCorporation[]>([]);
  const [selectedCityCorporation, setSelectedCityCorporation] = useState<string>(
    searchParams.get('cityCorporation') || 'ALL'
  );
  const [assignedZones, setAssignedZones] = useState<Zone[]>([]); // Added assignedZones state
  const [selectedCityCorporationId, setSelectedCityCorporationId] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | ''>(
    searchParams.get('zone') ? Number(searchParams.get('zone')) : ''
  );
  const [selectedWard, setSelectedWard] = useState<number | null>(
    searchParams.get('ward') ? Number(searchParams.get('ward')) : null
  );
  const [wards, setWards] = useState<Ward[]>([]);
  const [cityCorporationsLoading, setCityCorporationsLoading] = useState<boolean>(false);
  const [wardsLoading, setWardsLoading] = useState<boolean>(false);

  const [statusCounts, setStatusCounts] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    others: 0,
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

  // Filter visibility state
  const [showFilters, setShowFilters] = useState(true);

  // Others Tab Menu State
  const [othersMenuAnchor, setOthersMenuAnchor] = useState<null | HTMLElement>(null);
  const [othersMenuOpen, setOthersMenuOpen] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [externalExpanded, setExternalExpanded] = useState(false);

  // Date filter state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Admin Note Modal State
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string>('');
  const [selectedNoteTitle, setSelectedNoteTitle] = useState<string>('');

  /**
   * Fetch city corporations and assigned zones on mount
   */
  useEffect(() => {
    const fetchData = async () => {
      console.log('🔄 AllComplaints: Starting data fetch for user:', currentUser?.id, currentUser?.role);

      const promises: Promise<any>[] = [
        cityCorporationService.getCityCorporations('ACTIVE').catch(err => {
          console.error('❌ Error fetching city corporations:', err);
          return { cityCorporations: [] };
        })
      ];

      // If Super Admin, add assigned zones fetch
      if (currentUser?.role === 'SUPER_ADMIN' && currentUser.id) {
        console.log('👤 Fetching assigned zones for Super Admin:', currentUser.id);
        promises.push(
          superAdminService.getAssignedZones(Number(currentUser.id)).catch(err => {
            console.error('❌ Error fetching assigned zones:', err);
            return [];
          })
        );
      }

      setCityCorporationsLoading(true);

      try {
        const results = await Promise.all(promises);
        const cityCorpResponse = results[0];
        const assignedZonesResponse = results[1]; // Will be undefined if not SUPER_ADMIN

        // 1. Handle City Corporations
        let availableCityCorps = cityCorpResponse.cityCorporations || [];
        console.log('🏙️ Fetched City Corps:', availableCityCorps.length);

        if (currentUser && currentUser.role !== 'MASTER_ADMIN') {
          const assignedCityCode = (currentUser as any).cityCorporationCode || (currentUser as any).cityCorporation?.code;
          if (assignedCityCode) {
            console.log('🎯 Filtering City Corps for assigned code:', assignedCityCode);
            availableCityCorps = availableCityCorps.filter((cc: any) => cc.code === assignedCityCode);
            if (selectedCityCorporation !== assignedCityCode) {
              setSelectedCityCorporation(assignedCityCode);
            }
          }
        }
        setCityCorporations(availableCityCorps);

        // 2. Handle Assigned Zones (SUPER_ADMIN only)
        if (assignedZonesResponse) {
          console.log('🛡️ Raw Assigned Zones:', assignedZonesResponse);
          // Filter valid zones and map to Zone interface
          const formattedZones: Zone[] = (assignedZonesResponse as any[])
            .map(z => {
              // Handle both nested { zone: {...} } and flat {...} structures
              const zoneData = z.zone || z;
              if (!zoneData || !zoneData.id) return null;

              return {
                id: zoneData.id,
                zoneNumber: zoneData.zoneNumber,
                name: zoneData.name,
                cityCorporationId: zoneData.cityCorporationId || 0, // Use actual cityCorpId if available
                status: 'ACTIVE' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } as Zone;
            })
            .filter((z): z is Zone => z !== null);

          console.log('✅ Formatted Assigned Zones:', formattedZones);
          setAssignedZones(formattedZones);

          // Auto-select if single zone
          if (formattedZones.length === 1) {
            console.log('👌 Auto-selecting single zone:', formattedZones[0].id);
            setSelectedZone(formattedZones[0].id);
          }
        }

        // 3. Handle Assigned Wards (ADMIN only)
        if (currentUser?.role === 'ADMIN') {
          console.log('👤 Loading assigned wards for Admin');

          // Parse ward IDs from permissions
          let adminWardIds: number[] = [];
          if ((currentUser as any).permissions) {
            try {
              const permissionsData = JSON.parse((currentUser as any).permissions);
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
              // Fetch wards by city corporation
              const assignedCityCode = (currentUser as any).cityCorporationCode || (currentUser as any).cityCorporation?.code;
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
            }
          } else {
            console.log('⚠️ ADMIN has no assigned wards');
            setWards([]);
          }
        }

      } catch (err) {
        console.error('❌ Error in AllComplaints fetchData:', err);
      } finally {
        setCityCorporationsLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  /**
   * Fetch zones for selected city corporation
   */


  /**
   * Update wards when zone changes (NOT for ADMIN role)
   */
  useEffect(() => {
    // Skip for ADMIN role - they have pre-loaded assigned wards
    if (currentUser?.role === 'ADMIN') {
      return;
    }

    console.log('🔄 useEffect triggered for selectedZone:', selectedZone);
    if (selectedZone) {
      console.log('🚀 Calling fetchWards with zoneId:', selectedZone);
      fetchWards(selectedZone);
    } else {
      setWards([]);
    }
    setSelectedWard(null);
  }, [selectedZone, currentUser]);

  // ...

  /**
   * Fetch wards for selected zone
   */
  const fetchWards = async (zoneId: number) => {
    try {
      console.log('📡 fetchWards called for zoneId:', zoneId);
      setWardsLoading(true);
      const wardsData = await wardService.getWardsByZone(zoneId, 'ACTIVE');
      console.log('✅ Wards fetched:', wardsData);
      setWards(wardsData);
    } catch (err: any) {
      console.error('Error fetching wards:', err);
      showErrorToast('Failed to load wards');
    } finally {
      setWardsLoading(false);
    }
  };

  // ...



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

      // Add Others filter if present
      if (othersFilter !== 'ALL') {
        if (othersFilter === 'OTHERS_ALL') {
          // Show all Others complaints (status = OTHERS)
          filters.status = 'OTHERS';
        } else if (othersFilter === 'CORPORATION_INTERNAL') {
          // Show all Corporation Internal complaints
          filters.status = 'OTHERS';
          filters.othersCategory = 'CORPORATION_INTERNAL';
        } else if (othersFilter === 'CORPORATION_EXTERNAL') {
          // Show all Corporation External complaints
          filters.status = 'OTHERS';
          filters.othersCategory = 'CORPORATION_EXTERNAL';
        } else {
          // Show specific subcategory
          filters.status = 'OTHERS';
          filters.othersSubcategory = othersFilter;
        }
      }

      // Add city corporation filter if present (using complaint location)
      if (selectedCityCorporation !== 'ALL') {
        filters.complaintCityCorporationCode = selectedCityCorporation;
      }

      // Add zone filter if present (using complaint location)
      if (selectedZone) {
        filters.complaintZoneId = selectedZone;
      }

      // Add ward filter if present (using complaint location)
      if (selectedWard) {
        filters.complaintWardId = selectedWard;
      }

      // Add date filters
      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
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
      setStatusCounts(response.statusCounts || {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0,
        others: 0,
      });
      setPagination({
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 20,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
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
  }, [pagination.page, pagination.limit, statusFilter, categoryFilter, subcategoryFilter, othersFilter, selectedCityCorporation, selectedZone, selectedWard, debouncedSearchTerm, startDate, endDate]);

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

    // Clear incompatible filters
    if (value === 'OTHERS') {
      setCategoryFilter('');
      setSubcategoryFilter('');
    } else {
      setOthersFilter('ALL');
    }

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
   * Handle Others filter change
   */
  const handleOthersFilterChange = (value: OthersFilterValue) => {
    setOthersFilter(value);
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Others Menu Handlers
   */
  const handleOthersMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent tab switching
    setOthersMenuAnchor(event.currentTarget);
    setOthersMenuOpen(true);
  };

  const handleOthersMenuClose = () => {
    setOthersMenuAnchor(null);
    setOthersMenuOpen(false);
    // Reset expansions
    setInternalExpanded(false);
    setExternalExpanded(false);
  };

  const handleOthersMenuItemClick = (value: OthersFilterValue) => {
    handleOthersFilterChange(value);
    handleStatusFilterChange('OTHERS'); // Ensure we are on Others tab
    if (!['CORPORATION_INTERNAL', 'CORPORATION_EXTERNAL'].includes(value as string)) {
      handleOthersMenuClose();
    }
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
   * Handle zone filter change
   */
  const handleZoneFilterChange = (value: number | '') => {
    setSelectedZone(value);
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Handle ward filter change
   */
  const handleWardFilterChange = (value: number | null) => {
    setSelectedWard(value);
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
    setOthersFilter('ALL');
    setSelectedCityCorporation('ALL');
    setSelectedCityCorporation('ALL');
    setSelectedZone('');
    setSelectedWard(null);
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
        } else if (oldComplaint.status === 'OTHERS') {
          newCounts.others = Math.max(0, newCounts.others - 1);
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
        } else if (newStatus === 'OTHERS') {
          newCounts.others += 1;
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
   * Handle opening complaint details page
   */
  const handleViewDetails = (complaintId: number) => {
    navigate(`/complaints/${complaintId}`);
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
        return 'Others';
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
        { status: 'REJECTED', label: 'Mark Others', color: '#721c24' },
      ],
      IN_PROGRESS: [
        { status: 'PENDING', label: 'Mark Pending', color: '#856404' },
        { status: 'RESOLVED', label: 'Mark Solved', color: '#155724' },
        { status: 'REJECTED', label: 'Mark Others', color: '#721c24' },
      ],
      RESOLVED: [
        { status: 'PENDING', label: 'Mark Pending', color: '#856404' },
        { status: 'IN_PROGRESS', label: 'Mark In Progress', color: '#0c5460' },
        { status: 'REJECTED', label: 'Mark Others', color: '#721c24' },
      ],
      REJECTED: [
        { status: 'PENDING', label: 'Mark Pending', color: '#856404' },
        { status: 'IN_PROGRESS', label: 'Mark In Progress', color: '#0c5460' },
        { status: 'RESOLVED', label: 'Mark Solved', color: '#155724' },
      ],
      OTHERS: [
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

      {/* Main Layout Container */}
      <Box sx={{
        p: { xs: 2, md: 3 },
        backgroundColor: '#f9fafb',
        minHeight: '100vh',
      }}>
        {/* Header Section */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e2939' }}>
            All Complaints
            {pagination.total > 0 && (
              <Typography component="span" variant="body1" sx={{ color: '#6b7280', ml: 1.5, fontWeight: 500 }}>
                (Total {pagination.total})
              </Typography>
            )}
          </Typography>

          <Button
            variant="contained"
            onClick={() => setShowFilters(!showFilters)}
            startIcon={<FilterIcon />}
            sx={{
              backgroundColor: '#4CAF50',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#45a049' },
            }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

        {/* Status Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={statusFilter === 'ALL' ? 'ALL' : statusFilter}
            onChange={(_, newValue) => handleStatusFilterChange(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                minWidth: 100,
                fontWeight: 600,
              },
            }}
          >
            <Tab label={`All (${statusCounts.total})`} value="ALL" />
            <Tab label={`Pending (${statusCounts.pending})`} value="PENDING" />
            <Tab label={`In Progress (${statusCounts.inProgress})`} value="IN_PROGRESS" />
            <Tab label={`Solved (${statusCounts.resolved})`} value="RESOLVED" />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {`Others (${statusCounts.others})`}
                  <Box
                    component="span"
                    onClick={handleOthersMenuOpen}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '50%',
                      p: 0.5,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                    }}
                  >
                    <ArrowDropDownIcon fontSize="small" />
                  </Box>
                </Box>
              }
              value="OTHERS"
            />
          </Tabs>
        </Box>

        {/* Others Tab Menu */}
        <Menu
          anchorEl={othersMenuAnchor}
          open={othersMenuOpen}
          onClose={handleOthersMenuClose}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            sx: {
              mt: 1,
              width: 250,
              maxHeight: 400
            }
          }}
        >
          <MenuItem onClick={() => handleOthersMenuItemClick('OTHERS_ALL')}>
            All Others
          </MenuItem>
          <Divider />

          {/* Corporation Internal */}
          <MenuItem
            onClick={() => setInternalExpanded(!internalExpanded)}
            sx={{ fontWeight: 'bold', justifyContent: 'space-between' }}
          >
            Corp. Internal
            <ArrowDropDownIcon
              sx={{
                transform: internalExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: '0.2s'
              }}
            />
          </MenuItem>

          {internalExpanded && [
            'Engineering',
            'Electricity',
            'Health',
            'Property (Eviction)'
          ].map((sub) => (
            <MenuItem
              key={sub}
              onClick={() => handleOthersMenuItemClick(sub)}
              sx={{ pl: 4, fontSize: '0.9rem' }}
              selected={othersFilter === sub}
            >
              {sub}
            </MenuItem>
          ))}

          <Divider />

          {/* Corporation External */}
          <MenuItem
            onClick={() => setExternalExpanded(!externalExpanded)}
            sx={{ fontWeight: 'bold', justifyContent: 'space-between' }}
          >
            Corp. External
            <ArrowDropDownIcon
              sx={{
                transform: externalExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: '0.2s'
              }}
            />
          </MenuItem>

          {externalExpanded && [
            'WASA',
            'Titas',
            'DPDC',
            'DESCO',
            'BTCL',
            'Fire Service',
            'Others'
          ].map((sub) => (
            <MenuItem
              key={sub}
              onClick={() => handleOthersMenuItemClick(sub)}
              sx={{ pl: 4, fontSize: '0.9rem' }}
              selected={othersFilter === sub}
            >
              {sub}
            </MenuItem>
          ))}
        </Menu>

        {/* Filter Section */}
        <Collapse in={showFilters}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
                Filter Options
              </Typography>
              <Button
                size="small"
                onClick={handleClearFilters}
                startIcon={<RefreshIcon />}
                sx={{ textTransform: 'none', color: '#ef4444' }}
              >
                Clear Filters
              </Button>
            </Box>

            <Grid container spacing={2}>
              {/* Date Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ backgroundColor: 'white' }}
                />
              </Grid>

              {/* City Corporation Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>All City Corporations</InputLabel>
                  <Select
                    value={selectedCityCorporation || ''}
                    onChange={(e) => handleCityCorporationFilterChange(e.target.value)}
                    label="All City Corporations"
                    disabled={currentUser?.role === 'ADMIN'}
                  >
                    <MenuItem value="ALL">All City Corporations</MenuItem>
                    {cityCorporations.map((city) => (
                      <MenuItem key={city.id} value={city.code}>
                        {city.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Zone Filter - HIDE for ADMIN role */}
              {currentUser?.role !== 'ADMIN' && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <ZoneFilter
                    value={selectedZone}
                    onChange={handleZoneFilterChange}
                    cityCorporationCode={selectedCityCorporation !== 'ALL' ? selectedCityCorporation : undefined}
                    zones={currentUser?.role === 'SUPER_ADMIN' ? (assignedZones as any) : undefined}
                    hideLabel={false}
                    label="All Zones"
                  />
                </Grid>
              )}

              {/* Ward Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>All Wards</InputLabel>
                  <Select
                    value={selectedWard || ''}
                    onChange={(e) => handleWardFilterChange(e.target.value ? Number(e.target.value) : null)}
                    label="All Wards"
                    displayEmpty
                  >
                    <MenuItem value="">All Wards</MenuItem>
                    {wards && wards.map((ward) => (
                      <MenuItem key={ward.id} value={ward.id}>
                        Ward {ward.wardNumber || ward.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Category Filter - Hide for Others tab */}
              {statusFilter !== 'OTHERS' && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <CategoryFilter
                    value={categoryFilter}
                    onChange={handleCategoryFilterChange}
                  />
                </Grid>
              )}

              {/* Subcategory Filter - Hide for Others tab */}
              {statusFilter !== 'OTHERS' && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <SubcategoryFilter
                    value={subcategoryFilter}
                    onChange={handleSubcategoryFilterChange}
                    categoryId={categoryFilter}
                    fullWidth
                  />
                </Grid>
              )}

              {/* Others Filter - Show ONLY for Others tab */}
              {statusFilter === 'OTHERS' && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <OthersFilterDropdown
                    value={othersFilter}
                    onChange={handleOthersFilterChange}
                    fullWidth
                  />
                </Grid>
              )}

              {/* Search Bar - Full Width */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  placeholder="Search by ID, citizen name, or phone number..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                  sx={{
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.95rem',
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {/* Utilities Row (Download, Print, etc - Placeholder) */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
          <Button startIcon={<DownloadIcon />} variant="outlined" size="small" sx={{ color: '#1976d2', borderColor: '#1976d2' }}>
            Download
          </Button>
          <Button startIcon={<PrintIcon />} variant="outlined" size="small" sx={{ color: '#9c27b0', borderColor: '#9c27b0' }}>
            Print
          </Button>
        </Box>

        {/* Complaints Table */}
        {!loading && !error && (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ backgroundColor: '#f9fafb' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Complaint No</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Citizen Info</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Review & Report</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">No complaints found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map((complaint) => (
                    <TableRow key={complaint.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                          {complaint.trackingNumber || `C${String(complaint.id).padStart(6, '0')}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {complaint.user.firstName} {complaint.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {complaint.user.phone || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {complaint.location}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Zone: {typeof complaint.user.zone === 'object' && complaint.user.zone !== null ? ((complaint.user.zone as any).name || (complaint.user.zone as any).zoneNumber || 'N/A') : (complaint.user.zone || 'N/A')} | Ward: {typeof complaint.user.ward === 'object' && complaint.user.ward !== null ? ((complaint.user.ward as any).wardNumber || (complaint.user.ward as any).number || 'N/A') : (complaint.user.ward || 'N/A')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {complaint.category || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {complaint.subcategory}
                          </Typography>

                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(complaint.status)}
                          size="small"
                          sx={{
                            ...getStatusColor(complaint.status),
                            fontWeight: 500,
                            borderRadius: 1,
                            height: 24,
                          }}
                        />
                        {(complaint.status === 'OTHERS' || complaint.status === 'REJECTED') && (complaint.othersCategory || complaint.othersSubcategory) && (
                          <Box sx={{ mt: 0.5, lineHeight: 1.2 }}>
                            {complaint.othersCategory && (
                              <Typography variant="caption" display="block" sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#4b5563' }}>
                                {complaint.othersCategory === 'CORPORATION_INTERNAL' ? 'Corp. Internal' :
                                  complaint.othersCategory === 'CORPORATION_EXTERNAL' ? 'Corp. External' :
                                    complaint.othersCategory}
                              </Typography>
                            )}
                            {complaint.othersSubcategory && (
                              <Typography variant="caption" display="block" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                {complaint.othersSubcategory}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        {['RESOLVED', 'OTHERS', 'REJECTED'].includes(complaint.status) ? (
                          <Box sx={{ maxWidth: 200 }}>
                            {/* Admin Note */}
                            {complaint.resolutionNote && (
                              <Tooltip title="Click to view full note">
                                <Typography
                                  variant="caption"
                                  display="block"
                                  sx={{
                                    color: '#1976d2',
                                    fontWeight: 500,
                                    mb: 0.5,
                                    cursor: 'pointer',
                                    '&:hover': { textDecoration: 'underline' }
                                  }}
                                  noWrap
                                  onClick={() => {
                                    setSelectedNote(complaint.resolutionNote || '');
                                    setSelectedNoteTitle('Admin Resolution Note');
                                    setNoteModalOpen(true);
                                  }}
                                >
                                  Admin: {complaint.resolutionNote}
                                </Typography>
                              </Tooltip>
                            )}

                            {/* User Review */}
                            {complaint.review ? (
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Rating value={complaint.review.rating} readOnly size="small" sx={{ fontSize: '1rem' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    ({complaint.review.rating})
                                  </Typography>
                                </Box>
                                {complaint.review.comment && (
                                  <Tooltip title={complaint.review.comment}>
                                    <Typography variant="caption" display="block" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                                      "{complaint.review.comment}"
                                    </Typography>
                                  </Tooltip>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                Not reviewed yet
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Chip
                            label="Unsolved"
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: '#e0e0e0',
                              color: '#9e9e9e',
                              height: 24,
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ChatIcon />}
                          onClick={() => handleOpenChat(complaint)}
                          sx={{
                            borderColor: '#e0e0e0',
                            color: 'text.primary',
                            textTransform: 'none',
                            mr: 1,
                            '&:hover': {
                              borderColor: '#4CAF50',
                              color: '#4CAF50',
                            },
                          }}
                        >
                          Chat
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleViewDetails(complaint.id)}
                          sx={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': {
                              backgroundColor: '#45a049',
                              boxShadow: 'none',
                            },
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Pagination Section */}
        {!loading && !error && complaints.length > 0 && pagination && pagination.total > 0 && (
          <Box sx={{
            mt: { xs: 3, sm: 4 },
            mb: 2,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <Pagination
              count={pagination.totalPages || 0}
              page={pagination.page || 1}
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
                  '&.Mui-selected': {
                    backgroundColor: '#4CAF50 !important',
                    color: 'white',
                  }
                }
              }}
            />
          </Box>
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
        open={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        complaintId={selectedChatComplaintId || 0}
        complaintTitle={selectedChatComplaintTitle}
        citizenName={selectedChatCitizenName}
      />

      {/* Admin Note View Modal */}
      <Dialog
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1f2937' }}>
          {selectedNoteTitle}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#374151' }}>
            {selectedNote}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteModalOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default AllComplaints;