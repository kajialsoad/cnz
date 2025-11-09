import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Chat as ChatIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout';

interface Complaint {
  id: string;
  type: string;
  location: string;
  ward: string;
  citizenName: string;
  citizenRole: string;
  status: 'Pending' | 'In Progress' | 'Solved';
  timeAgo: string;
}

const AllComplaints: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Sample complaint data based on the reference image
  const complaints: Complaint[] = [
    {
      id: 'C001234',
      type: 'Household Waste',
      location: 'Mohammadpur, Ward 40',
      ward: '40',
      citizenName: 'Fatima Ahmed',
      citizenRole: 'Citizen',
      status: 'Pending',
      timeAgo: '2 hours ago',
    },
    {
      id: 'C001235',
      type: 'Drainage Issue',
      location: 'Dhanmondi, Ward 41',
      ward: '41',
      citizenName: 'Rakib Hassan',
      citizenRole: 'Citizen',
      status: 'In Progress',
      timeAgo: '4 hours ago',
    },
    {
      id: 'C001236',
      type: 'Street Cleaning',
      location: 'Gulshan, Ward 42',
      ward: '42',
      citizenName: 'Nusrat Islam',
      citizenRole: 'Citizen',
      status: 'Solved',
      timeAgo: '1 day ago',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return { 
          backgroundColor: '#fff3cd', 
          color: '#856404',
          borderColor: '#ffeeba'
        };
      case 'In Progress':
        return { 
          backgroundColor: '#d1ecf1', 
          color: '#0c5460',
          borderColor: '#bee5eb'
        };
      case 'Solved':
        return { 
          backgroundColor: '#d4edda', 
          color: '#155724',
          borderColor: '#c3e6cb'
        };
      default:
        return { backgroundColor: '#f8f9fa', color: '#6c757d' };
    }
  };

  const getStatusCount = (status: string) => {
    return complaints.filter(complaint => complaint.status === status).length;
  };

  return (
    <MainLayout title="All Complaints">
      <Box sx={{ width: '100%', maxWidth: '100%', px: 1.5, mx: 0 }}>
        {/* Header Section */}
        <Box sx={{ mb: 3, width: '100%' }}>
          {/* Title and Status Summary Row */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            width: '100%',
            mb: 2,
          }}>
            {/* Left Side - Title and Subtitle */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                All Complaints
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage and track citizen complaints
              </Typography>
            </Box>

            {/* Right Side - Status Summary */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Chip
                label={`${getStatusCount('Pending')} Pending`}
                sx={{
                  ...getStatusColor('Pending'),
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  height: 32,
                  px: 2,
                }}
              />
              <Chip
                label={`${getStatusCount('In Progress')} In Progress`}
                sx={{
                  ...getStatusColor('In Progress'),
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  height: 32,
                  px: 2,
                }}
              />
              <Chip
                label={`${getStatusCount('Solved')} Solved`}
                sx={{
                  ...getStatusColor('Solved'),
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  height: 32,
                  px: 2,
                }}
              />
            </Box>
          </Box>

          {/* Search and Filter Section */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            p: 2,
            borderRadius: 2,
            width: '100%',
          }}>
            <TextField
              placeholder="Search by complaint ID, location, or citizen name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  height: 44,
                  fontSize: '0.95rem',
                },
              }}
            />

            <FormControl sx={{ minWidth: 180 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  </InputAdornment>
                }
                sx={{
                  backgroundColor: 'white',
                  height: 44,
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    pl: 0,
                    fontSize: '0.95rem',
                  },
                }}
              >
                <MenuItem value="All Status">All Status</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Solved">Solved</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Complaints List */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          width: '100%',
        }}>
          {complaints.map((complaint) => (
            <Card
              key={complaint.id}
              sx={{
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                width: '100%',
                '&:hover': {
                  boxShadow: 2,
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: 2,
                  width: '100%',
                }}>
                  {/* Left Section - Complaint Info */}
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                        {complaint.id}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {complaint.type}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        📍 {complaint.location}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ⏰ {complaint.timeAgo}
                      </Typography>
                    </Box>

                    {/* Citizen Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {complaint.citizenName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {complaint.citizenRole}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right Section - Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                      label={complaint.status}
                      sx={{
                        ...getStatusColor(complaint.status),
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        height: 32,
                      }}
                    />
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2, width: '100%' }}>
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<VisibilityIcon />}
                    sx={{
                      backgroundColor: '#4CAF50',
                      '&:hover': {
                        backgroundColor: '#45a049',
                      },
                      textTransform: 'none',
                      px: 2.5,
                      py: 0.75,
                    }}
                  >
                    View Details
                  </Button>

                  <Button
                    variant="outlined"
                    size="medium"
                    startIcon={<ChatIcon />}
                    sx={{
                      borderColor: '#e0e0e0',
                      color: 'text.primary',
                      textTransform: 'none',
                      px: 2.5,
                      py: 0.75,
                      '&:hover': {
                        borderColor: '#4CAF50',
                        color: '#4CAF50',
                      },
                    }}
                  >
                    Chat
                  </Button>

                  {complaint.status !== 'Solved' && (
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={<CheckCircleIcon />}
                      sx={{
                        borderColor: '#e0e0e0',
                        color: 'text.primary',
                        textTransform: 'none',
                        px: 2.5,
                        py: 0.75,
                        '&:hover': {
                          borderColor: '#4CAF50',
                          color: '#4CAF50',
                        },
                      }}
                    >
                      Mark Solved
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default AllComplaints;