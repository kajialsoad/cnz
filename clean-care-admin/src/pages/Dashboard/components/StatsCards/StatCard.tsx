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
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color = 'primary',
  icon,
  onClick,
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
      onClick={onClick}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        '&:hover': onClick
          ? {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }
          : {},
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          bgcolor: colors.main,
          borderRadius: '8px 0 0 8px',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, pl: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          {icon && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: colors.light,
                color: colors.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              {icon}
            </Box>
          )}
          {trend && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: trend.isPositive ? '#10B981' : '#EF4444',
              }}
            >
              {trend.isPositive ? <TrendingUpIcon sx={{ fontSize: 18 }} /> : <TrendingDownIcon sx={{ fontSize: 18 }} />}
            </Box>
          )}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: '0.875rem', mb: 0.5 }}
        >
          {title}
        </Typography>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: '1.875rem',
            lineHeight: 1.2,
            color: 'text.primary',
            mb: 0.5,
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.75rem',
              color: trend?.isPositive ? '#10B981' : '#6B7280',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;