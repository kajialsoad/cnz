import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Avatar, Chip, CircularProgress } from '@mui/material';
import { dashboardService } from '../../../../services/dashboardService';
import type { UserStats } from '../../../../services/dashboardService';
import { useAuth } from '../../../../contexts/AuthContext';

interface TotalUsersWidgetProps {
  cityCorporationCode?: string;
}

const TotalUsersWidget: React.FC<TotalUsersWidgetProps> = ({ cityCorporationCode }) => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await dashboardService.getDashboardStats({
          cityCorporationCode,
        });
        setUserStats(stats.users);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [cityCorporationCode]);

  // Filter user categories based on logged-in user's role
  const userCategories = useMemo(() => {
    if (!userStats || !user) return [];

    const allCategories = [
      {
        id: 'super-admins',
        title: 'Super Admins',
        titleBn: 'সুপার অ্যাডমিন',
        count: userStats.totalSuperAdmins,
        color: '#9333EA',
        icon: '👑',
        role: 'SUPER_ADMIN',
      },
      {
        id: 'admins',
        title: 'Admins',
        titleBn: 'অ্যাডমিন',
        count: userStats.totalAdmins,
        color: '#3B82F6',
        icon: '👤',
        role: 'ADMIN',
      },
      {
        id: 'citizens',
        title: 'Citizens',
        titleBn: 'ব্যবহারকারী',
        count: userStats.totalCitizens,
        color: '#10B981',
        icon: '👥',
        role: 'USER',
      },
    ];

    // Role-based filtering
    const userRole = user.role;

    if (userRole === 'MASTER_ADMIN') {
      // Master Admin sees all three categories
      return allCategories;
    } else if (userRole === 'SUPER_ADMIN') {
      // Super Admin sees only Admins and Citizens
      return allCategories.filter((cat) => cat.role === 'ADMIN' || cat.role === 'USER');
    } else if (userRole === 'ADMIN') {
      // Admin sees only Citizens
      return allCategories.filter((cat) => cat.role === 'USER');
    }

    // Default: show nothing if role is not recognized
    return [];
  }, [userStats, user]);

  return (
    <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid #E5E7EB' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: '#374151',
            mb: 3,
            fontSize: '1.125rem',
          }}
        >
          ভূমিকা ভিত্তিক পরিসংখ্যান
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: '#EF4444', mb: 1 }}>
              {error}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Please try refreshing the page
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${userCategories.length}, 1fr)`,
              gap: 2,
            }}
          >
            {userCategories.map((category) => (
              <Box
                key={category.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#FAFAFA',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: '#F5F5F5',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                {/* Icon */}
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: category.color,
                    fontSize: '1.5rem',
                    mb: 1.5,
                  }}
                >
                  {category.icon}
                </Avatar>

                {/* Title */}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: '#6B7280',
                    fontSize: '0.875rem',
                    mb: 0.5,
                    textAlign: 'center',
                  }}
                >
                  {category.titleBn}
                </Typography>

                {/* Count */}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: category.color,
                    fontSize: '1.5rem',
                    mb: 1,
                  }}
                >
                  {category.count.toLocaleString()}
                </Typography>

                {/* Stats */}
                <Box sx={{ width: '100%' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                      সক্রিয়:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: category.color, fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      {Math.floor(category.count * 0.8)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                      নিষ্ক্রিয়:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, fontSize: '0.75rem' }}>
                      {Math.floor(category.count * 0.2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                      আজকে নতুন:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: '#10B981', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      +{Math.floor(category.count * 0.05)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TotalUsersWidget;