import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color = 'primary',
  icon,
}) => {
  const getColorScheme = (colorName: string) => {
    const colorMap = {
      primary: { main: '#4CAF50', light: '#E8F5E8' },
      secondary: { main: '#2196F3', light: '#E3F2FD' },
      success: { main: '#4CAF50', light: '#E8F5E8' },
      warning: { main: '#FF9800', light: '#FFF3E0' },
      error: { main: '#F44336', light: '#FFEBEE' },
      info: { main: '#2196F3', light: '#E3F2FD' },
    };
    return colorMap[colorName as keyof typeof colorMap] || colorMap.primary;
  };

  const colors = getColorScheme(color);

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: colors.main,
          borderRadius: '12px 12px 0 0',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500, fontSize: '0.875rem' }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: '50%',
                bgcolor: colors.light,
                color: colors.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            fontSize: '2.25rem',
            lineHeight: 1.2,
            color: 'text.primary',
            mb: 1,
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.75rem', mb: trend ? 1 : 0 }}
          >
            {subtitle}
          </Typography>
        )}

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={trend.isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: trend.isPositive ? 'success.light' : 'error.light',
                color: trend.isPositive ? 'success.dark' : 'error.dark',
                '& .MuiChip-icon': {
                  fontSize: '1rem',
                },
              }}
            />
            {trend.label && (
              <Typography variant="caption" color="text.secondary">
                {trend.label}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;