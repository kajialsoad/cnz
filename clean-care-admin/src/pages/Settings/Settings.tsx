import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  ImageOutlined,
  PhotoLibraryOutlined,
  PhoneOutlined,
  PaymentOutlined,
  PolicyOutlined,
  DescriptionOutlined,
} from '@mui/icons-material';
import MainLayout from '../../components/common/Layout/MainLayout';
import SettingsCard from '../../components/Settings/SettingsCard';

const Settings: React.FC = () => {
  return (
    <MainLayout title="সেটিংস">
      <Box sx={{ px: 3, py: 4, background: '#f8faf9' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            borderRadius: '14px',
            boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            background: '#ffffff',
            p: 3,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', width: '100%' }}>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1e2939' }}>সেটিংস</Typography>
          </Box>
          <Box sx={{ display: 'flex', width: '100%' }}>
            <Typography sx={{ fontSize: 16, color: '#4a5565' }}>অ্যাপ্লিকেশন সেটিংস কনফিগার করুন</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <SettingsCard
            title="ওয়েস্ট ম্যানেজমেন্ট লোকেটর"
            description="ভবিষ্যৎ ও বর্তমান বর্জ্য ব্যবস্থাপনা সম্পর্কে ধারণা"
            buttonLabel="ছবি আপলোড করুন"
            color="green"
            icon={<ImageOutlined sx={{ color: '#3fa564' }} />}
            onClick={() => console.log('Waste management upload clicked')}
          />

          <SettingsCard
            title="গ্যালারি সেটিংস"
            description="অ্যাপে প্রদর্শিত গ্যালারি ছবি আপলোড করুন"
            buttonLabel="গ্যালারি ম্যানেজ করুন"
            color="blue"
            icon={<PhotoLibraryOutlined sx={{ color: '#2b7fff' }} />}
            onClick={() => console.log('Gallery manage clicked')}
          />

          <SettingsCard
            title="জরুরী ফোন নাম্বার"
            description="জরুরী যোগাযোগের জন্য নাম্বার যোগ করুন"
            buttonLabel="নাম্বার যোগ করুন"
            color="red"
            icon={<PhoneOutlined sx={{ color: '#fb2c36' }} />}
            onClick={() => console.log('Emergency number add clicked')}
          />

          <SettingsCard
            title="পেমেন্ট গেটওয়ে"
            description="পেমেন্ট গেটওয়ে সেটিংস কনফিগার করুন"
            buttonLabel="সেটআপ করুন"
            color="purple"
            icon={<PaymentOutlined sx={{ color: '#ad46ff' }} />}
            onClick={() => console.log('Payment gateway setup clicked')}
          />

          <SettingsCard
            title="প্রাইভেসি পলিসি"
            description="গোপনীয়তা নীতি এডিট করুন"
            buttonLabel="এডিট করুন"
            color="gray"
            icon={<PolicyOutlined sx={{ color: '#4a5565' }} />}
            onClick={() => console.log('Privacy policy edit clicked')}
          />

          <SettingsCard
            title="শর্তাবলী"
            description="ব্যবহারের শর্তাবলী এডিট করুন"
            buttonLabel="এডিট করুন"
            color="orange"
            icon={<DescriptionOutlined sx={{ color: '#ff6900' }} />}
            onClick={() => console.log('Terms edit clicked')}
          />
        </Box>

        <Box
          sx={{
            mt: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            borderRadius: '14px',
            boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            background: '#ffffff',
            p: 3,
          }}
        >
          <Box sx={{ display: 'flex', width: '100%' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1e2939' }}>অ্যাক্টিভিটি লগ</Typography>
          </Box>
          <Typography sx={{ mt: 2, fontSize: 16, color: '#4a5565' }}>
            গত ১ মাসের সকল পরিবর্তন দেখুন এবং Revert/Rollback করুন
          </Typography>
          <Box sx={{ mt: 2, alignSelf: 'stretch' }}>
            <Box
              component="button"
              onClick={() => console.log('Activity log clicked')}
              style={{
                border: 'none',
                borderRadius: 10,
                padding: '10px 29px',
                background: '#3fa564',
                color: '#ffffff',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              অ্যাক্টিভিটি লগ দেখুন
            </Box>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
};

export default Settings;
