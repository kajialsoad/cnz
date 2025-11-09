import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Submitted', value: 514, percentage: 50, color: '#6366F1' },
  { name: 'Solved', value: 342, percentage: 33, color: '#10B981' },
  { name: 'Pending', value: 127, percentage: 12, color: '#F59E0B' },
  { name: 'In Progress', value: 45, percentage: 4, color: '#EF4444' },
];

const ComplaintStatusOverview: React.FC = () => {
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
          <Box sx={{ flex: 1, position: 'relative' }}>
            <ResponsiveContainer width="100%" height={200}>
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
                50%
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