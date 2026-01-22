import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../assets/images/logo_clean_c.png';

const PublicNavbar = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="sticky" sx={{ background: 'white', color: 'text.primary', boxShadow: 1 }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo */}
          <Box 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1 }}
            onClick={() => navigate('/home')}
          >
            <img 
              src={logoImage} 
              alt="Clean Care" 
              style={{ height: 40, marginRight: 10 }} 
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: '#2E7D32' }}>
              Clean Care
            </Typography>
          </Box>

          {/* Menu Items */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            <Button color="inherit" onClick={() => navigate('/home')}>Home</Button>
            <Button color="inherit" onClick={() => navigate('/about')}>About</Button>
            <Button color="inherit" onClick={() => navigate('/blog')}>Blog</Button>
            <Button 
              variant="contained" 
              color="success" 
              onClick={() => navigate('/login')}
              sx={{ borderRadius: 20, px: 3 }}
            >
              Login
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default PublicNavbar;
