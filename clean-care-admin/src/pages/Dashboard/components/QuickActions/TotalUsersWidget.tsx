import React from 'react';
import { Card, CardContent, Typography, Box, Avatar, Chip } from '@mui/material';

const userCategories = [
  {
    id: 'super-admins',
    title: 'Super Admins',
    count: 3,
    color: '#10B981',
    icon: '👑',
  },
  {
    id: 'admins', 
    title: 'Admins',
    count: 24,
    color: '#F59E0B',
    icon: '👤',
  },
  {
    id: 'citizens',
    title: 'Citizens', 
    count: 12847,
    color: '#6366F1',
    icon: '👥',
  },
];

const TotalUsersWidget: React.FC = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: '#8B5CF6',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: 'white', fontSize: '12px' }}>👥</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
            Total Users
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {userCategories.map((category) => (
            <Box 
              key={category.id}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 2,
                borderRadius: 2,
                bgcolor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: '#F3F4F6',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: category.color,
                    fontSize: '1.2rem',
                  }}
                >
                  {category.icon}
                </Avatar>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 500, 
                    color: '#374151',
                    fontSize: '0.9rem',
                  }}
                >
                  {category.title}
                </Typography>
              </Box>
              
              <Chip
                label={category.count.toLocaleString()}
                sx={{
                  bgcolor: category.color,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  height: 28,
                  '& .MuiChip-label': {
                    px: 1.5,
                  },
                }}
              />
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
            Active user statistics
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TotalUsersWidget;