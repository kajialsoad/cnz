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
  TableHead,
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
import AvatarUpload from '../../components/common/AvatarUpload/AvatarUpload';
import { toast } from 'react-hot-toast';

interface ActivityItem {
  name: string;
  tag: string;
  phone: string;
  city?: string;
  zone?: string;
  changedAt: string;
}

interface SuperAdminRow {
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

const ActivityCard: React.FC<{ item: ActivityItem }> = ({ item }) => (
  <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ width: 48, height: 48, bgcolor: '#8200db' }}>🛡️</Avatar>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1e2939' }}>{item.name}</Typography>
          <Chip label={item.tag} size="small" sx={{ mt: 0.5, bgcolor: '#dcfce7', color: '#008236' }}
            icon={<CheckCircleOutline sx={{ color: '#008236' }} />} />
        </Box>
      </Stack>
      <Box sx={{ mt: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ color: '#4a5565', fontSize: 14 }}>ফোন:</Typography>
            <Typography sx={{ color: '#1e2939', fontSize: 14, fontWeight: 700 }}>{item.phone}</Typography>
          </Stack>
          {item.city && (
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: '#4a5565', fontSize: 14 }}>সিটি:</Typography>
              <Typography sx={{ color: '#1e2939', fontSize: 14, fontWeight: 700 }}>{item.city}</Typography>
            </Stack>
          )}
          {item.zone && (
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: '#4a5565', fontSize: 14 }}>জোন:</Typography>
              <Typography sx={{ color: '#1e2939', fontSize: 14, fontWeight: 700 }}>{item.zone}</Typography>
            </Stack>
          )}
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ color: '#4a5565', fontSize: 14 }}>পরিবর্তনের সময় :</Typography>
            <Typography sx={{ color: '#1e2939', fontSize: 14, fontWeight: 700 }}>{item.changedAt}</Typography>
          </Stack>
        </Stack>
      </Box>
      <Stack direction="row" spacing={1} sx={{ mt: 2, pt: 2, borderTop: '1px solid #e5e7eb' }}>
        <Button variant="contained" startIcon={<EditOutlined />} sx={{ bgcolor: '#2b7fff' }}>হ্যাঁ</Button>
        <Button variant="contained" color="error" startIcon={<DeleteOutline />}>ডিলিট</Button>
      </Stack>
    </CardContent>
  </Card>
);

const SuperAdminManagement: React.FC = () => {
  const [openAdd, setOpenAdd] = useState(false);
  const stats = useMemo(() => ([
    { title: 'মোট সুপার এডমিন', value: '45', bg: '#eff6ff', color: '#155dfc' },
    { title: 'সক্রিয়', value: '42', bg: '#f0fdf4', color: '#00a63e' },
    { title: 'নিষ্ক্রিয়', value: '3', bg: '#fef2f2', color: '#e7000b' },
    { title: 'আজ নতুন', value: '+2', bg: '#faf5ff', color: '#9810fa' },
  ]), []);

  const [query, setQuery] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const activities: ActivityItem[] = [
    { name: 'রহিম উদ্দিন', tag: 'আপডেট নাম্বার', phone: '01712345678', changedAt: '2024-01-15' },
    { name: 'করিম হোসেন', tag: 'আপডেট প্রোফাইল', phone: '01812345678', city: 'ঢাকা দক্ষিণ সিটি কর্পোরেশন', zone: 'জোন ১', changedAt: '2024-02-20' },
  ];

  const rows: SuperAdminRow[] = [
    { name: 'করিম হোসেন', phone: '01712345678', area: 'ঢাকা উত্তর', zoneWard: 'জোন ১, ওয়ার্ড ৫', active: true, online: true, total: 87, solved: 62, pending: 21 },
    { name: 'রহিম আলী', phone: '01812345678', area: 'ঢাকা উত্তর', zoneWard: 'জোন ২, ওয়ার্ড ৮', active: true, online: false, total: 65, solved: 48, pending: 15 },
  ];

  const filteredRows = rows.filter(r => [r.name, r.phone].join(' ').includes(query));

  const AddDialog = () => {
    const { register, handleSubmit, reset } = useForm({
      defaultValues: {
        name: '',
        father: '',
        phone: '',
        email: '',
        city: '',
        zone: '',
        ward: '',
        permMsgUser: true,
        permMsgAdmin: true,
        permFeedAdmin: true,
        permNotify: true,
        permSms: true,
      },
    });

    const onSubmit = (data: any) => {
      toast.success('সুপার এডমিন যুক্ত হয়েছে');
      setOpenAdd(false);
      reset();
    };

    return (
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }}>নতুন সুপার এডমিন যোগ করুন</Typography>
          <IconButton onClick={() => setOpenAdd(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <AvatarUpload currentAvatar={avatarUrl} onUpload={async (url) => setAvatarUrl(url)} size={80} initials={'?'} />
            </Stack>
            <TextField placeholder="নাম লিখুন..." label="নাম" {...register('name')} />
            <TextField placeholder="পিতার নাম..." label="পিতার" {...register('father')} />
            <TextField placeholder="ফোন নাম্বার..." label="ফোন" {...register('phone')} />
            <TextField placeholder="ইমেইল..." label="ইমেইল" {...register('email')} />
            <FormControl>
              <InputLabel>সিটি কর্পোরেশন</InputLabel>
              <Select label="সিটি কর্পোরেশন" defaultValue="" {...register('city')}>
                <MenuItem value="ঢাকা উত্তর">ঢাকা উত্তর</MenuItem>
                <MenuItem value="ঢাকা দক্ষিণ">ঢাকা দক্ষিণ</MenuItem>
              </Select>
            </FormControl>
            <TextField placeholder="জোন" label="জোন" {...register('zone')} />
            <TextField placeholder="ওয়ার্ড" label="ওয়ার্ড" {...register('ward')} />
            <Box>
              <Typography sx={{ mb: 1, color: '#4a5565' }}>পারমিশন</Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography>মেসেজ টু ইউজার</Typography>
                  <Switch defaultChecked {...register('permMsgUser')} sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }} />
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography>মেসেজ টু এডমিন</Typography>
                  <Switch defaultChecked {...register('permMsgAdmin')} sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }} />
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography>ফিড অ্যাডমিন</Typography>
                  <Switch defaultChecked {...register('permFeedAdmin')} sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }} />
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography>রিসিভ নোটিফিকেশন</Typography>
                  <Switch defaultChecked {...register('permNotify')} sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }} />
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography>এসএমএস অনুমতি</Typography>
                  <Switch defaultChecked {...register('permSms')} sx={{ '& .Mui-checked+.MuiSwitch-track': { bgcolor: '#3fa564' } }} />
                </Stack>
              </Stack>
            </Box>
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
    <MainLayout title="সুপার এডমিন ম্যানেজমেন্ট">
      <Stack spacing={3}>
        <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
          <CardContent>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1e2939', mb: 2 }}>সুপার এডমিন ম্যানেজমেন্ট</Typography>
            <Grid container spacing={2}>
              {stats.map((s, i) => (
                <Grid item xs={12} md={3} key={i}>
                  <StatCard title={s.title} value={s.value} bg={s.bg} color={s.color} />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
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
              sx={{ maxWidth: 700 }}
            />
            <Button variant="contained" sx={{ bgcolor: '#3fa564' }} startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>নতুন সুপার এডমিন যোগ করুন</Button>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {activities.map((a, i) => (
            <Grid item xs={12} md={6} key={i}>
              <ActivityCard item={a} />
            </Grid>
          ))}
        </Grid>

        <Typography sx={{ fontSize: 20, color: '#000000' }}>সুপার এডমিন তালিকা</Typography>
        <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
          <Box sx={{ bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb', px: 3, py: 1.5 }}>
            <Grid container>
              <Grid item xs={4}><Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>সুপার এডমিন</Typography></Grid>
              <Grid item xs={3}><Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>এলাকা</Typography></Grid>
              <Grid item xs={3}><Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>স্ট্যাটাস</Typography></Grid>
              <Grid item xs={2}><Typography sx={{ color: '#364153', fontWeight: 700, fontSize: 14 }}>অভিযোগ পরিসংখ্যান</Typography></Grid>
            </Grid>
          </Box>
          <CardContent sx={{ px: 0 }}>
            <Table>
              <TableBody>
                {filteredRows.map((r, i) => (
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
              <TableHead sx={{ display: 'none' }}>
                <TableRow>
                  <TableCell />
                </TableRow>
              </TableHead>
            </Table>
          </CardContent>
        </Card>
        <AddDialog />
      </Stack>
    </MainLayout>
  );
};

export default SuperAdminManagement;
