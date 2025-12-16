import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemIcon, ListItemText, CircularProgress as LoadingSpinner } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { analyticsService } from '../../../../services/analyticsService';

interface ComplaintStatusOverviewProps {
  cityCorporationCode?: string;
  zoneId?: number;
}

const ComplaintStatusOverview: React.FC<ComplaintStatusOverviewProps> = ({ cityCorporationCode, zoneId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analytics = await analyticsService.getAnalytics({
          cityCorporationCode,
          zoneId
        });

        const total = analytics.totalComplaints || 1; // Avoid division by zero
        const statusData = [
          {
            name: 'Pending',
            value: analytics.statusBreakdown?.pending || 0,
            percentage: Math.round(((analytics.statusBreakdown?.pending || 0) / total) * 100),
            color: '#F59E0B'
          },
          {
            name: 'In Progress',
            value: analytics.statusBreakdown?.inProgress || 0,
            percentage: Math.round(((analytics.statusBreakdown?.inProgress || 0) / total) * 100),
            color: '#6366F1'
          },
          {
            name: 'Resolved',
            value: analytics.statusBreakdown?.resolved || 0,
            percentage: Math.round(((analytics.statusBreakdown?.resolved || 0) / total) * 100),
            color: '#10B981'
          },
          {
            name: 'Rejected',
            value: analytics.statusBreakdown?.rejected || 0,
            percentage: Math.round(((analytics.statusBreakdown?.rejected || 0) / total) * 100),
            color: '#EF4444'
          },
        ];

        setData(statusData);
      } catch (error) {
        console.error('Error fetching complaint status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cityCorporationCode, zoneId]);

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: '#6366F1',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>📋</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
            Complaint Status Overview
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, position: 'relative', minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200} minWidth={200} minHeight={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center text showing total percentage */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#374151' }}>
                {data.find(d => d.name === 'Resolved')?.percentage || 0}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
                Resolved
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, ml: 3 }}>
            <List sx={{ p: 0 }}>
              {data.map((item, index) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        bgcolor: item.color,
                        borderRadius: '50%',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                          {item.value}
                        </Typography>
                      </Box>
                    }
                    sx={{ my: 0 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ComplaintStatusOverview;