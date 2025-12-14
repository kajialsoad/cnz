import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import MainLayout from '../../components/common/Layout/MainLayout';

// Mock Data for Pie Chart
const data = [
  { name: 'সমাধানকৃত', value: 856, color: '#10b981' }, // Green
  { name: 'পেন্ডিং', value: 312, color: '#f59e0b' },   // Yellow/Orange
  { name: 'অন্যান্য', value: 79, color: '#ef4444' },   // Red
];

const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, name, value, color }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill={color} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '12px', fontWeight: 500 }}>
      {`${name}: ${value}`}
    </text>
  );
};

const Reports: React.FC = () => {
  // States for Custom Report Filters
  const [timeFilter, setTimeFilter] = useState('month');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [zone, setZone] = useState('all');
  const [ward, setWard] = useState('all');
  const [format, setFormat] = useState('excel');

  return (
    <MainLayout title="রিপোর্টস ও এনালিটিক্স">
      <Box sx={{ p: 3 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            রিপোর্টস ও এনালিটিক্স
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            বিস্তারিত রিপোর্ট তৈরি ও ডাউনলোড করুন
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 3 }}>
          {/* Complaint Status Overview (Left Side) */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Card sx={{ height: '100%', borderRadius: '14px', boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)' }}>
              <CardContent sx={{ p: '24px !important' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  অভিযোগ স্ট্যাটাস ওভারভিউ
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={0}
                        dataKey="value"
                        label={renderCustomizedLabel}
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => (
                          <span style={{ color: '#333', fontWeight: 500, marginLeft: 5 }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Quick Report Download (Right Side) */}
          <Box sx={{ width: { xs: '100%', lg: 'auto' }, minWidth: { lg: '556px' } }}>
            <Card sx={{ height: '100%', borderRadius: '14px', boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)' }}>
              <CardContent sx={{ p: '24px !important' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  দ্রুত রিপোর্ট ডাউনলোড
                </Typography>
                <Stack spacing={2}>
                  {/* Current Week */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      height: '79px',
                      bgcolor: '#eff6ff', // Light Blue from Figma
                      border: '1px solid #bedbff',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#dbeafe' },
                      minWidth: { sm: '508px' }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e2939' }}>
                        চলমান সপ্তাহ
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#4a5565' }}>
                        সপ্তাহের সকল ডেটা
                      </Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: '#1565C0' }}>
                      <DownloadIcon />
                    </IconButton>
                  </Box>

                  {/* Current Month */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      height: '79px',
                      bgcolor: '#f0fdf4', // Light Green from Figma
                      border: '1px solid #b9f8cf',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#dcfce7' },
                      minWidth: { sm: '508px' }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e2939' }}>
                        চলমান মাস
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#4a5565' }}>
                        মাসের সকল ডেটা
                      </Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: '#2E7D32' }}>
                      <DownloadIcon />
                    </IconButton>
                  </Box>

                  {/* Last 3 Months */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      height: '79px',
                      bgcolor: '#faf5ff', // Light Purple from Figma
                      border: '1px solid #e9d4ff',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f3e8ff' },
                      minWidth: { sm: '508px' }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e2939' }}>
                        গত ৩ মাস
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#4a5565' }}>
                        ত্রৈমাসিক রিপোর্ট
                      </Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: '#7B1FA2' }}>
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>

          {/* Create Custom Report (Bottom) */}
          <Box sx={{ width: '100%' }}>
            <Card sx={{ borderRadius: '14px', boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)' }}>
              <CardContent sx={{ p: '24px !important' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  কাস্টম রিপোর্ট তৈরি করুন
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" /> সময় নির্বাচন করুন
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    {['দিন', 'সপ্তাহ', 'মাস', 'বছর'].map((label) => (
                      <Button
                        key={label}
                        variant={timeFilter === label ? 'contained' : 'outlined'}
                        onClick={() => setTimeFilter(label)}
                        sx={{
                          borderRadius: '10px',
                          textTransform: 'none',
                          px: 3,
                          height: '43px',
                          minWidth: '263px',
                          borderColor: '#d1d5dc',
                          bgcolor: timeFilter === label ? '#f0fdf4' : 'transparent',
                          color: timeFilter === label ? '#3fa564' : '#0a0a0a',
                          border: timeFilter === label ? '1px solid #3fa564' : '1px solid #d1d5dc',
                          '&:hover': {
                            bgcolor: timeFilter === label ? '#dcfce7' : '#f5f5f5',
                            border: timeFilter === label ? '1px solid #3fa564' : '1px solid #d1d5dc',
                          }
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>সকল ক্যাটাগরি</InputLabel>
                      <Select
                        value={category}
                        label="সকল ক্যাটাগরি"
                        onChange={(e) => setCategory(e.target.value)}
                        sx={{ borderRadius: '10px', height: '40px' }}
                      >
                        <MenuItem value="all">সকল ক্যাটাগরি</MenuItem>
                        <MenuItem value="road">রাস্তা ও নর্দমা</MenuItem>
                        <MenuItem value="garbage">বর্জ্য ব্যবস্থাপনা</MenuItem>
                        <MenuItem value="mosquito">মশা নিধন</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>সকল স্ট্যাটাস</InputLabel>
                      <Select
                        value={status}
                        label="সকল স্ট্যাটাস"
                        onChange={(e) => setStatus(e.target.value)}
                        sx={{ borderRadius: '10px', height: '40px' }}
                      >
                        <MenuItem value="all">সকল স্ট্যাটাস</MenuItem>
                        <MenuItem value="resolved">সমাধানকৃত</MenuItem>
                        <MenuItem value="pending">পেন্ডিং</MenuItem>
                        <MenuItem value="processing">প্রক্রিয়াধীন</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>সকল জোন</InputLabel>
                      <Select
                        value={zone}
                        label="সকল জোন"
                        onChange={(e) => setZone(e.target.value)}
                        sx={{ borderRadius: '10px', height: '40px' }}
                      >
                        <MenuItem value="all">সকল জোন</MenuItem>
                        <MenuItem value="zone1">জোন ১</MenuItem>
                        <MenuItem value="zone2">জোন ২</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>সকল ওয়ার্ড</InputLabel>
                      <Select
                        value={ward}
                        label="সকল ওয়ার্ড"
                        onChange={(e) => setWard(e.target.value)}
                        sx={{ borderRadius: '10px', height: '40px' }}
                      >
                        <MenuItem value="all">সকল ওয়ার্ড</MenuItem>
                        <MenuItem value="ward1">ওয়ার্ড ১</MenuItem>
                        <MenuItem value="ward2">ওয়ার্ড ২</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Excel ফরম্যাট</InputLabel>
                      <Select
                        value={format}
                        label="Excel ফরম্যাট"
                        onChange={(e) => setFormat(e.target.value)}
                        sx={{ borderRadius: '10px', height: '40px' }}
                      >
                        <MenuItem value="excel">Excel ফরম্যাট</MenuItem>
                        <MenuItem value="pdf">PDF ফরম্যাট</MenuItem>
                        <MenuItem value="csv">CSV ফরম্যাট</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<DescriptionIcon />}
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontSize: '1rem',
                      bgcolor: '#3fa564',
                      '&:hover': { bgcolor: '#358c54' },
                      minWidth: '204px'
                    }}
                  >
                    রিপোর্ট তৈরি করুন
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontSize: '1rem',
                      bgcolor: '#2b7fff',
                      '&:hover': { bgcolor: '#236ad6' },
                      minWidth: '195px'
                    }}
                  >
                    ডাউনলোড করুন
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
      </Box>
    </MainLayout>
  );
};

export default Reports;
