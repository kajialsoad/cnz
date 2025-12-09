import React, { useMemo, useState } from 'react';
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
  Switch,
} from '@mui/material';
import MainLayout from '../../components/common/Layout/MainLayout';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import Close from '@mui/icons-material/Close';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

interface AdminRow {
  name: string;
  phone: string;
  area: string;
  zoneWard: string;
  active: boolean;
  online: boolean;
  total: number;
  solved: number;
  pending: number;
}

const StatCard: React.FC<{ title: string; value: string; bg: string; color: string }> = ({ title, value, bg, color }) => (
  <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
    <CardContent sx={{ bgcolor: bg, borderRadius: 2 }}>
      <Stack spacing={0.5}>
        <Typography sx={{ color: '#4a5565', fontSize: 14 }}>{title}</Typography>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color }}>{value}</Typography>
      </Stack>
    </CardContent>
  </Card>
);

const AdminManagement: React.FC = () => {
  const [query, setQuery] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [cityFilter, setCityFilter] = useState('সকল সিটি কর্পোরেশন');
  const [zoneFilter, setZoneFilter] = useState('সকল জোন');

  const stats = useMemo(() => ([
    { title: 'মোট এডমিন', value: '128', bg: '#eff6ff', color: '#155dfc' },
    { title: 'সক্রিয়', value: '115', bg: '#f0fdf4', color: '#00a63e' },
    { title: 'নিষ্ক্রিয়', value: '13', bg: '#fef2f2', color: '#e7000b' },
    { title: 'অনলাইন', value: '87', bg: '#faf5ff', color: '#9810fa' },
    { title: 'অফলাইন', value: '41', bg: '#f3f4f6', color: '#4a5565' },
    { title: 'আজ নতুন', value: '+5', bg: '#fff7ed', color: '#f54900' },
  ]), []);

  const rows: AdminRow[] = [
    { name: 'করিম হোসেন', phone: '01712345678', area: 'ঢাকা উত্তর', zoneWard: 'জোন ১, ওয়ার্ড ৫', active: true, online: true, total: 87, solved: 62, pending: 21 },
    { name: 'রহিম আলী', phone: '01812345678', area: 'ঢাকা উত্তর', zoneWard: 'জোন ২, ওয়ার্ড ৮', active: true, online: false, total: 65, solved: 48, pending: 15 },
  ];

  const filtered = rows.filter(r => [r.name, r.phone, r.area, r.zoneWard].join(' ').includes(query));

  const AddDialog = () => {
    const { register, handleSubmit, reset } = useForm({
      defaultValues: {
        name: '',
        designation: '',
        phone: '',
        email: '',
        city: '',
        zone: '',
        permMsgUser: true,
        permMsgAdmin: true,
        permViewOnly: true,
        permReportDownload: true,
        permActionApproval: true,
      },
    });

    const onSubmit = (data: any) => {
      toast.success('এডমিন যুক্ত হয়েছে');
      setOpenAdd(false);
      reset();
    };

    return (
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }}>নতুন এডমিন যোগ করুন</Typography>
          <IconButton onClick={() => setOpenAdd(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="নাম" placeholder="নাম লিখো..." {...register('name')} />
            <TextField label="পদবী" placeholder="নাম লিখো..." {...register('designation')} />
            <TextField label="ফোন" placeholder="*******************" {...register('phone')} />
            <TextField label="ইমেইল" placeholder="*************************" {...register('email')} />
            <TextField label="সিটি কর্পোরেশন" placeholder="এড সিটি কর্পোরেশন..." {...register('city')} />
            <FormControl>
              <InputLabel>জোন (১ থেকে ১৫)</InputLabel>
              <Select label="জোন (১ থেকে ১৫)" defaultValue="" {...register('zone')}>
                {Array.from({ length: 15 }, (_, i) => (
                  <MenuItem value={`জোন ${i + 1}`} key={i}>{`জোন ${i + 1}`}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography>মেসেজ টু ইউজার</Typography>
                <Switch defaultChecked {...register('permMsgUser')} sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }} />
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography>মেসেজ টু এডমিন</Typography>
                <Switch defaultChecked {...register('permMsgAdmin')} sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }} />
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography>ভিউ অনলি</Typography>
                <Switch defaultChecked {...register('permViewOnly')} sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }} />
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography>রিপোর্ট ডাউনলোড</Typography>
                <Switch defaultChecked {...register('permReportDownload')} sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }} />
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography>একশন এপ্রুভাল</Typography>
                <Switch defaultChecked {...register('permActionApproval')} sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }} />
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenAdd(false)}>বাতিল</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} sx={{ bgcolor: '#3fa564' }}>সংরক্ষণ করুন</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <MainLayout title="এডমিন ম্যানেজমেন্ট">
      <Stack spacing={3}>
        <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
          <CardContent>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1e2939', mb: 2 }}>এডমিন ম্যানেজমেন্ট</Typography>
            <Grid container spacing={2}>
              {stats.map((s, i) => (
                <Grid item xs={12} md={2} key={i}>
                  <StatCard title={s.title} value={s.value} bg={s.bg} color={s.color} />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>সকল সিটি কর্পোরেশন</InputLabel>
              <Select label="সকল সিটি কর্পোরেশন" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                <MenuItem value="সকল সিটি কর্পোরেশন">সকল সিটি কর্পোরেশন</MenuItem>
                <MenuItem value="ঢাকা উত্তর">ঢাকা উত্তর</MenuItem>
                <MenuItem value="ঢাকা দক্ষিণ">ঢাকা দক্ষিণ</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>সকল জোন</InputLabel>
              <Select label="সকল জোন" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
                <MenuItem value="সকল জোন">সকল জোন</MenuItem>
                {Array.from({ length: 15 }, (_, i) => (
                  <MenuItem value={`জোন ${i + 1}`} key={i}>{`জোন ${i + 1}`}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
            <Button variant="contained" sx={{ bgcolor: '#3fa564' }} startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>নতুন এডমিন যোগ করুন</Button>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
          <Box sx={{ bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb', px: 3, py: 1.5 }}>
            <Grid container>
              <Grid item xs={4}><Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>এডমিন</Typography></Grid>
              <Grid item xs={3}><Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>এলাকা</Typography></Grid>
              <Grid item xs={3}><Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>স্ট্যাটাস</Typography></Grid>
              <Grid item xs={2}><Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>অভিযোগ পরিসংখ্যান</Typography></Grid>
            </Grid>
          </Box>
          <CardContent sx={{ px: 0 }}>
            <Table>
              <TableBody>
                {filtered.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ width: '35%' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: '#2b7fff' }}>👥</Avatar>
                        <Box>
                          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{r.name}</Typography>
                          <Typography sx={{ fontSize: 14, color: '#4a5565' }}>{r.phone}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ width: '25%' }}>
                      <Typography sx={{ fontSize: 16, color: '#1e2939' }}>{r.area}</Typography>
                      <Typography sx={{ fontSize: 16, color: '#4a5565' }}>{r.zoneWard}</Typography>
                    </TableCell>
                    <TableCell sx={{ width: '20%' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={r.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} size="small" sx={{ bgcolor: '#dcfce7', color: '#008236' }} />
                        <Typography sx={{ fontSize: 12, color: r.online ? '#00a63e' : '#6a7282' }}>{r.online ? 'অনলাইন' : 'অফলাইন'}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ width: '20%' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Stack>
                          <Typography sx={{ fontSize: 14, color: '#1e2939', fontWeight: 700 }}>মোট: {r.total}</Typography>
                          <Stack direction="row" spacing={2}>
                            <Typography sx={{ fontSize: 12, color: '#00a63e' }}>সমাধান: {r.solved}</Typography>
                            <Typography sx={{ fontSize: 12, color: '#d08700' }}>পেন্ডিং: {r.pending}</Typography>
                          </Stack>
                        </Stack>
                        <Divider orientation="vertical" flexItem />
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small"><EditOutlined /></IconButton>
                          <IconButton size="small" color="error"><DeleteOutline /></IconButton>
                        </Stack>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AddDialog />
      </Stack>
    </MainLayout>
  );
};

export default AdminManagement;
