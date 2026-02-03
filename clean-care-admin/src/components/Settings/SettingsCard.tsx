import React from 'react';
import { Box, Typography, Button } from '@mui/material';

type ColorVariant = 'green' | 'blue' | 'red' | 'purple' | 'gray' | 'orange';

interface SettingsCardProps {
  title: string;
  description: string;
  buttonLabel: string;
  icon?: React.ReactNode;
  color?: ColorVariant;
  iconBg?: string;
  onClick?: () => void;
  sx?: any;
}

const COLOR_MAP: Record<ColorVariant, { button: string; iconBg: string }> = {
  green: { button: '#3fa564', iconBg: '#f0fdf4' },
  blue: { button: '#2b7fff', iconBg: '#eff6ff' },
  red: { button: '#fb2c36', iconBg: '#fef2f2' },
  purple: { button: '#ad46ff', iconBg: '#faf5ff' },
  gray: { button: '#4a5565', iconBg: '#f3f4f6' },
  orange: { button: '#ff6900', iconBg: '#fff7ed' },
};

const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  buttonLabel,
  icon,
  color = 'green',
  iconBg,
  onClick,
  sx,
}) => {
  const palette = COLOR_MAP[color];
  const resolvedIconBg = iconBg || palette.iconBg;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderRadius: '14px',
        boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
        background: '#ffffff',
        p: 3,
        height: 188,
        rowGap: 2,
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', columnGap: 1.5 }}>
        {icon && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              borderRadius: '10px',
              background: resolvedIconBg,
              p: '12px',
              height: 48,
              width: 48,
            }}
          >
            <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </Box>
          </Box>
        )}
        <Box sx={{ flexShrink: 0, height: 28, display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1e2939' }}>{title}</Typography>
        </Box>
      </Box>

      <Typography sx={{ fontSize: 14, color: '#4a5565', lineHeight: '20px' }}>{description}</Typography>

      <Button
        onClick={onClick}
        sx={{
          mt: 'auto',
          alignSelf: 'stretch',
          borderRadius: '10px',
          textTransform: 'none',
          py: 1.2,
          fontSize: 16,
          backgroundColor: palette.button,
          color: '#ffffff',
          '&:hover': { backgroundColor: palette.button },
        }}
      >
        {buttonLabel}
      </Button>
    </Box>
  );
};

export default SettingsCard;



