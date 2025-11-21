import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

const weeklyData = [
  { week: 'Mon', complaints: 35, resolved: 32 },
  { week: 'Tue', complaints: 42, resolved: 38 },
  { week: 'Wed', complaints: 38, resolved: 35 },
  { week: 'Thu', complaints: 45, resolved: 42 },
  { week: 'Fri', complaints: 48, resolved: 44 },
  { week: 'Sat', complaints: 52, resolved: 48 },
  { week: 'Sun', complaints: 40, resolved: 38 },
];

interface WeeklyTrendAnalysisProps {
  cityCorporationCode?: string;
}

const WeeklyTrendAnalysis: React.FC<WeeklyTrendAnalysisProps> = ({ cityCorporationCode }) => {
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
            <Typography sx={{ color: 'white', fontSize: '12px' }}>📈</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
            Weekly Trend Analysis
          </Typography>
        </Box>

        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="complaintsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                domain={[0, 'dataMax + 5']}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '12px'
                }}
                iconType="line"
              />
              <Area
                type="monotone"
                dataKey="complaints"
                name="Complaints"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#complaintsGradient)"
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#resolvedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeeklyTrendAnalysis;