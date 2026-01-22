import React, { useEffect } from 'react';
import { Box, Typography, Button, Container, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { DeleteOutline, NaturePeople, Recycling } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/images/logo_clean_c.png';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />
      
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', 
          py: 12, 
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 800, 
                    color: '#1B5E20',
                    lineHeight: 1.2,
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  Building a Cleaner, <br />
                  <span style={{ color: '#2E7D32' }}>Greener Future</span>
                </Typography>
                <Typography variant="h6" paragraph color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
                  Join Dhaka South City Corporation in our mission to manage waste efficiently and keep our city clean. Your awareness makes a difference.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    color="success"
                    onClick={() => navigate('/about')}
                    sx={{ 
                      borderRadius: 3, 
                      px: 4, 
                      py: 1.5, 
                      fontSize: '1.1rem',
                      boxShadow: '0 8px 16px rgba(46, 125, 50, 0.2)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 20px rgba(46, 125, 50, 0.3)',
                      }
                    }}
                  >
                    Learn More
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    color="success"
                    onClick={() => navigate('/login')}
                    sx={{ 
                      borderRadius: 3, 
                      px: 4, 
                      py: 1.5, 
                      fontSize: '1.1rem',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        bgcolor: 'rgba(46, 125, 50, 0.05)'
                      }
                    }}
                  >
                    Admin Login
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    bottom: -20,
                    left: -20,
                    background: 'rgba(255,255,255,0.4)',
                    borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                    zIndex: 0,
                    animation: 'blob 7s infinite'
                  }
                }}
              >
                <Box 
                  component="img"
                  src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
                  alt="Waste Management Awareness"
                  sx={{ 
                    width: '100%', 
                    borderRadius: 4, 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    transform: 'perspective(1000px) rotateY(-5deg)',
                    transition: 'transform 0.3s ease',
                    position: 'relative',
                    zIndex: 1,
                    '&:hover': {
                      transform: 'perspective(1000px) rotateY(0deg) scale(1.02)'
                    }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700, mb: 6 }}>
          Our Initiatives
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#F9FAFB', borderRadius: 4 }}>
              <DeleteOutline sx={{ fontSize: 60, color: '#4CAF50', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">Smart Waste Collection</Typography>
              <Typography color="text.secondary">
                Efficient waste collection routes and schedules to ensure timely disposal.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#F9FAFB', borderRadius: 4 }}>
              <Recycling sx={{ fontSize: 60, color: '#4CAF50', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">Recycling Programs</Typography>
              <Typography color="text.secondary">
                Promoting recycling habits to reduce landfill waste and protect the environment.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#F9FAFB', borderRadius: 4 }}>
              <NaturePeople sx={{ fontSize: 60, color: '#4CAF50', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">Community Awareness</Typography>
              <Typography color="text.secondary">
                Educating citizens about proper waste disposal and environmental care.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1B5E20', color: 'white', py: 6, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <img src={logoImage} alt="Clean Care" style={{ height: 40, marginRight: 10, filter: 'brightness(0) invert(1)' }} />
                <Typography variant="h6" fontWeight="bold">Clean Care</Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Smart Complaint Management System for Dhaka South City Corporation.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">Quick Links</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography component="a" href="/home" sx={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>Home</Typography>
                <Typography component="a" href="/about" sx={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>About Us</Typography>
                <Typography component="a" href="/blog" sx={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>Blog</Typography>
                <Typography component="a" href="/login" sx={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>Admin Login</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">Contact Us</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Dhaka South City Corporation<br />
                Nagar Bhaban, Dhaka - 1000<br />
                Email: info@dscc.gov.bd
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', mt: 4, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2026 Clean Care. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
