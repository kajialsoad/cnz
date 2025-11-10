import React, { useState } from 'react';
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
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  ward: string;
  zone: string;
  totalComplaints: number;
  resolvedComplaints: number;
  unresolvedComplaints: number;
  joinDate: string;
  avatar?: string;
}

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample user data based on the reference image
  const users: User[] = [
    {
      id: '#000001',
      name: 'Fatima Ahmed',
      email: 'fatima@example.com',
      phone: '+880 1712-345678',
      ward: 'Ward 40',
      zone: 'North Zone',
      totalComplaints: 12,
      resolvedComplaints: 10,
      unresolvedComplaints: 10,
      joinDate: 'Jan 15, 2024',
    },
    {
      id: '#000002',
      name: 'Rakib Hassan',
      email: 'rakib@example.com',
      phone: '+880 1812-345678',
      ward: 'Ward 41',
      zone: 'South Zone',
      totalComplaints: 8,
      resolvedComplaints: 7,
      unresolvedComplaints: 7,
      joinDate: 'Feb 20, 2024',
    },
    {
      id: '#000003',
      name: 'Nusrat Islam',
      email: 'nusrat@example.com',
      phone: '+880 1912-345678',
      ward: 'Ward 42',
      zone: 'East Zone',
      totalComplaints: 5,
      resolvedComplaints: 5,
      unresolvedComplaints: 5,
      joinDate: 'Mar 10, 2024',
    },
    {
      id: '#000004',
      name: 'Kamal Khan',
      email: 'kamal@example.com',
      phone: '+880 1612-345678',
      ward: 'Ward 43',
      zone: 'West Zone',
      totalComplaints: 15,
      resolvedComplaints: 12,
      unresolvedComplaints: 12,
      joinDate: 'Dec 05, 2023',
    },
  ];

  const stats = [
    {
      title: 'Total Citizens',
      value: '4',
      color: '#2196F3',
    },
    {
      title: 'Total Complaints',
      value: '40',
      color: '#FF9800',
    },
    {
      title: 'Resolved',
      value: '34',
      color: '#4CAF50',
    },
    {
      title: 'Success Rate',
      value: '85%',
      color: '#9C27B0',
    },
  ];

  return (
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
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Citizen Directory
              </Typography>

              <TextField
                placeholder="Search by name, email, or ward..."
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
                  width: 300,
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    backgroundColor: '#f8f9fa',
                  },
                }}
              />
            </Box>

            {/* Users Table */}
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Citizen</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Complaints</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Resolved</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Unresolved</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Join Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
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
                          <Avatar sx={{ width: 40, height: 40, bgcolor: '#4CAF50' }}>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {user.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{user.email}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{user.phone}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{user.ward}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {user.zone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.totalComplaints}
                          sx={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.resolvedComplaints}
                          sx={{
                            backgroundColor: '#e8f5e8',
                            color: '#2e7d2e',
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.unresolvedComplaints}
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
                          <Typography variant="body2">{user.joinDate}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
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
                            View
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
};

export default UserManagement;