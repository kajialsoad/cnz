import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Language as LanguageIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../../../contexts/LanguageContext';
import ProfileButton from '../../ProfileButton/ProfileButton';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  title = 'Dashboard Overview',
}) => {
  const { language, setLanguage } = useLanguage();
  const [searchValues, setSearchValues] = useState({
    complaint: '',
    adminName: '',
    username: '',
    areaName: '',
    wardNo: '',
    zoneNo: '',
  });

  const handleSearchChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValues(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const newLang = event.target.value as 'en' | 'bn';
    setLanguage(newLang);
  };

  return (
    <AppBar position="fixed" elevation={1} sx={{ bgcolor: 'white', color: 'black' }}>
      <Toolbar sx={{ minHeight: '70px !important', px: 3 }}>
        {/* Left Section - Menu + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 4 }}>
          <IconButton
            edge="start"
            sx={{ color: 'text.primary' }}
            aria-label="menu"
            onClick={onMenuClick}
          >
            <MenuIcon />
          </IconButton>

          <Box>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Real-time analytics and system insights
            </Typography>
          </Box>
        </Box>

        {/* Center Section - Search Bars */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flex: 1,
          mr: 3,
        }}>
          {/* Complaint Search */}
          <TextField
            size="small"
            placeholder="Complaint"
            value={searchValues.complaint}
            onChange={handleSearchChange('complaint')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Admin Name Search */}
          <TextField
            size="small"
            placeholder="Admin Name"
            value={searchValues.adminName}
            onChange={handleSearchChange('adminName')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 130,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Username Search */}
          <TextField
            size="small"
            placeholder="Username"
            value={searchValues.username}
            onChange={handleSearchChange('username')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Area Name Search */}
          <TextField
            size="small"
            placeholder="Area Name"
            value={searchValues.areaName}
            onChange={handleSearchChange('areaName')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Ward No Search */}
          <TextField
            size="small"
            placeholder="Ward No."
            value={searchValues.wardNo}
            onChange={handleSearchChange('wardNo')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 100,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Zone No Search */}
          <TextField
            size="small"
            placeholder="Zone No."
            value={searchValues.zoneNo}
            onChange={handleSearchChange('zoneNo')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 100,
              '& .MuiOutlinedInput-root': {
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
              },
            }}
          />

          {/* Language Selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={language}
              onChange={handleLanguageChange}
              displayEmpty
              IconComponent={KeyboardArrowDownIcon}
              startAdornment={
                <InputAdornment position="start">
                  <LanguageIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              }
              sx={{
                height: 36,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f0f1f2',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  pl: 0,
                },
              }}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="bn">বাংলা</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Right Section - Notifications + User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton sx={{ color: 'text.primary' }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <ProfileButton
            variant="header"
            showName={true}
            showRole={true}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
