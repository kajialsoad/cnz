import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Select,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
    Dashboard as DashboardIcon,
    ReportProblem as ComplaintIcon,
    People as PeopleIcon,
    Assessment as ReportIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Language as LanguageIcon,
    Check as CheckIcon,
    Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export const AdminNavbar: React.FC = () => {
    const { user, logout } = useAuth();
    const { language, setLanguage } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
        { path: '/complaints', label: 'Complaints', icon: <ComplaintIcon /> },
        { path: '/chats', label: 'Chat', icon: <ChatIcon /> },
        { path: '/users', label: 'Users', icon: <PeopleIcon /> },
        { path: '/reports', label: 'Reports', icon: <ReportIcon /> },
        { path: '/notifications', label: 'Notifications', icon: <NotificationsIcon /> },
        { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    const handleLanguageChange = (event: SelectChangeEvent<string>) => {
        const newLang = event.target.value as 'en' | 'bn';
        setLanguage(newLang);
    };

    const isActivePath = (path: string) => {
        return location.pathname === path;
    };

    return (
        <>
            <AppBar
                position="sticky"
                sx={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                <Toolbar>
                    {/* Logo/Brand */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            🌿 Clean Care Admin
                        </Typography>
                    </Box>

                    {/* Desktop Navigation */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
                        {navItems.map((item) => (
                            <Button
                                key={item.path}
                                startIcon={item.icon}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    color: 'white',
                                    textTransform: 'none',
                                    px: 2,
                                    py: 1,
                                    borderRadius: 2,
                                    backgroundColor: isActivePath(item.path)
                                        ? 'rgba(255, 255, 255, 0.2)'
                                        : 'transparent',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    },
                                    fontWeight: isActivePath(item.path) ? 600 : 400,
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>

                    {/* Language Selector */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 2 }}>
                        <Select
                            value={language}
                            onChange={handleLanguageChange}
                            sx={{
                                color: 'white',
                                minWidth: 120,
                                height: 40,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.7)',
                                },
                                '& .MuiSvgIcon-root': {
                                    color: 'white',
                                },
                            }}
                        >
                            <MenuItem value="en">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {language === 'en' && <CheckIcon fontSize="small" color="success" />}
                                    <LanguageIcon fontSize="small" />
                                    <span>English</span>
                                </Box>
                            </MenuItem>
                            <MenuItem value="bn">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {language === 'bn' && <CheckIcon fontSize="small" color="success" />}
                                    <LanguageIcon fontSize="small" />
                                    <span>বাংলা</span>
                                </Box>
                            </MenuItem>
                        </Select>
                    </Box>

                    {/* User Menu */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                        <IconButton
                            onClick={handleUserMenuOpen}
                            sx={{
                                p: 0.5,
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                '&:hover': {
                                    border: '2px solid rgba(255, 255, 255, 0.5)',
                                },
                            }}
                        >
                            <Avatar
                                src={user?.avatar}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: '#fff',
                                    color: '#4CAF50',
                                    fontWeight: 600,
                                }}
                            >
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </Avatar>
                        </IconButton>
                        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, lineHeight: 1.2 }}>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.2 }}>
                                {user?.roles?.[0]?.name || 'Admin'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Mobile Menu Button */}
                    <IconButton
                        sx={{ display: { xs: 'block', md: 'none' }, color: 'white' }}
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* User Menu Dropdown */}
            <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 200,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                }}
            >
                <MenuItem onClick={() => { navigate('/settings'); handleUserMenuClose(); }}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Settings</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                </MenuItem>
            </Menu>

            {/* Mobile Drawer */}
            <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                PaperProps={{
                    sx: {
                        width: 280,
                        background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                    },
                }}
            >
                {/* User Info in Mobile */}
                <Box sx={{ p: 3, color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar
                            src={user?.avatar}
                            sx={{
                                width: 56,
                                height: 56,
                                bgcolor: '#fff',
                                color: '#4CAF50',
                                fontWeight: 600,
                                fontSize: '1.5rem',
                            }}
                        >
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                {user?.email}
                            </Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                </Box>

                {/* Mobile Navigation */}
                <List sx={{ px: 2 }}>
                    {navItems.map((item) => (
                        <ListItem
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                setMobileMenuOpen(false);
                            }}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                backgroundColor: isActivePath(item.path)
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : 'transparent',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                },
                                cursor: 'pointer',
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                sx={{
                                    color: 'white',
                                    '& .MuiTypography-root': {
                                        fontWeight: isActivePath(item.path) ? 600 : 400,
                                    },
                                }}
                            />
                        </ListItem>
                    ))}
                </List>

                {/* Language Selector in Mobile */}
                <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1, display: 'block' }}>
                        Language / ভাষা
                    </Typography>
                    <Select
                        value={language}
                        onChange={handleLanguageChange}
                        fullWidth
                        sx={{
                            color: 'white',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                            '& .MuiSvgIcon-root': {
                                color: 'white',
                            },
                        }}
                    >
                        <MenuItem value="en">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {language === 'en' && <CheckIcon fontSize="small" color="success" />}
                                <span>English</span>
                            </Box>
                        </MenuItem>
                        <MenuItem value="bn">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {language === 'bn' && <CheckIcon fontSize="small" color="success" />}
                                <span>বাংলা</span>
                            </Box>
                        </MenuItem>
                    </Select>
                </Box>

                {/* Logout Button in Mobile */}
                <Box sx={{ p: 2, mt: 'auto' }}>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.3)',
                            },
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </Drawer>
        </>
    );
};
