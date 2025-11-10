import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  Button,
  Chip,
  Paper,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  FileDownload as FileDownloadIcon,
  BarChart as BarChartIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout';

interface Report {
  id: string;
  title: string;
  type: 'Monthly' | 'Quarterly' | 'Weekly' | 'Yearly';
  date: string;
  size: string;
  status: 'Ready';
}

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('Monthly Report');
  const [category, setCategory] = useState('All Categories');
  const [format, setFormat] = useState('PDF');

  // Sample reports data based on the reference image
  const reports: Report[] = [
    {
      id: '1',
      title: 'Monthly Report - October 2025',
      type: 'Monthly',
      date: 'Oct 31, 2025',
      size: '2.4 MB',
      status: 'Ready',
    },
    {
      id: '2',
      title: 'Quarterly Report - Q3 2025',
      type: 'Quarterly',
      date: 'Oct 01, 2025',
      size: '8.7 MB',
      status: 'Ready',
    },
    {
      id: '3',
      title: 'Weekly Report - Week 43',
      type: 'Weekly',
      date: 'Oct 27, 2025',
      size: '856 KB',
      status: 'Ready',
    },
    {
      id: '4',
      title: 'Annual Report - 2024',
      type: 'Yearly',
      date: 'Jan 01, 2025',
      size: '15.2 MB',
      status: 'Ready',
    },
  ];

  const stats = [
    {
      title: 'Total Reports',
      value: '248',
      icon: <AssessmentIcon />,
      color: '#3f51b5',
      bgColor: '#e8eaf6',
    },
    {
      title: 'This Month',
      value: '32',
      icon: <TrendingUpIcon />,
      color: '#4caf50',
      bgColor: '#e8f5e8',
    },
    {
      title: 'Downloaded',
      value: '186',
      icon: <DownloadIcon />,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
    },
    {
      title: 'Scheduled',
      value: '12',
      icon: <ScheduleIcon />,
      color: '#ff9800',
      bgColor: '#fff3e0',
    },
  ];

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'Monthly':
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      case 'Quarterly':
        return { backgroundColor: '#e8f5e8', color: '#2e7d2e' };
      case 'Weekly':
        return { backgroundColor: '#fff3e0', color: '#f57c00' };
      case 'Yearly':
        return { backgroundColor: '#f3e5f5', color: '#7b1fa2' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#616161' };
    }
  };

  return (
    <MainLayout title="Reports & Analytics">
      <Box sx={{ width: '100%', maxWidth: '100%', px: 1.5, mx: 0 }}>
        {/* Header Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate and download system reports
          </Typography>
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
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 700, 
                      color: 'text.primary',
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: stat.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {React.cloneElement(stat.icon, { 
                      sx: { color: stat.color, fontSize: 24 } 
                    })}
                  </Box>
                </Box>
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

        {/* Generate New Report Section */}
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <BarChartIcon sx={{ color: '#4CAF50' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Generate New Report
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr 1fr auto',
              },
              gap: 2,
              alignItems: 'center',
            }}>
              {/* Report Type */}
              <FormControl>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  sx={{
                    height: 48,
                    backgroundColor: '#f8f9fa',
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                    },
                  }}
                >
                  <MenuItem value="Monthly Report">Monthly Report</MenuItem>
                  <MenuItem value="Weekly Report">Weekly Report</MenuItem>
                  <MenuItem value="Quarterly Report">Quarterly Report</MenuItem>
                  <MenuItem value="Annual Report">Annual Report</MenuItem>
                </Select>
              </FormControl>

              {/* Category */}
              <FormControl>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  sx={{
                    height: 48,
                    backgroundColor: '#f8f9fa',
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                    },
                  }}
                >
                  <MenuItem value="All Categories">All Categories</MenuItem>
                  <MenuItem value="Complaints">Complaints</MenuItem>
                  <MenuItem value="Users">Users</MenuItem>
                  <MenuItem value="Performance">Performance</MenuItem>
                </Select>
              </FormControl>

              {/* Format */}
              <FormControl>
                <Select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  sx={{
                    height: 48,
                    backgroundColor: '#f8f9fa',
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                    },
                  }}
                >
                  <MenuItem value="PDF">PDF</MenuItem>
                  <MenuItem value="Excel">Excel</MenuItem>
                  <MenuItem value="CSV">CSV</MenuItem>
                </Select>
              </FormControl>

              {/* Generate Button */}
              <Button
                variant="contained"
                startIcon={<FileDownloadIcon />}
                sx={{
                  backgroundColor: '#4CAF50',
                  '&:hover': {
                    backgroundColor: '#45a049',
                  },
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  height: 48,
                }}
              >
                Generate Report
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Recent Reports Section */}
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Recent Reports
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {reports.map((report) => (
                <Paper
                  key={report.id}
                  elevation={0}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 2.5,
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                    },
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                  }}>
                    {/* Left Section - Report Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          backgroundColor: '#e8f5e8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <DescriptionIcon sx={{ color: '#4CAF50', fontSize: 24 }} />
                      </Box>

                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {report.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            label={report.type}
                            size="small"
                            sx={{
                              ...getReportTypeColor(report.type),
                              fontWeight: 500,
                              height: 24,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {report.date}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            • {report.size}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Right Section - Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={report.status}
                        sx={{
                          backgroundColor: '#e8f5e8',
                          color: '#2e7d2e',
                          fontWeight: 500,
                        }}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
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
                        Download
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
};

export default Reports;