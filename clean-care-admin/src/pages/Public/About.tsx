import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import PublicNavbar from '../../components/layout/PublicNavbar';

const About = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />
      
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, color: '#1B5E20', textAlign: 'center', mb: 6 }}>
          About Clean Care
        </Typography>

        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box 
              component="img"
              src="https://images.unsplash.com/photo-1591567936460-26b28b70742a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
              alt="Dhaka City"
              sx={{ width: '100%', borderRadius: 4, boxShadow: 3 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
              Our Mission
            </Typography>
            <Typography paragraph color="text.secondary">
              Clean Care is an initiative by the Dhaka South City Corporation to revolutionize waste management and city cleanliness through technology and community participation. Our goal is to create a cleaner, healthier, and more sustainable environment for all citizens.
            </Typography>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mt: 4 }}>
              What We Do
            </Typography>
            <Typography paragraph color="text.secondary">
              We provide a smart platform for citizens to report waste management issues directly to the authorities. Through our app and web portal, we ensure timely resolution of complaints, efficient waste collection, and continuous monitoring of city cleanliness.
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            Dhaka South City Corporation
          </Typography>
          <Typography align="center" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
            Dhaka South City Corporation (DSCC) is committed to serving the people of Dhaka South by providing essential civic services. Clean Care is one of our flagship digital initiatives to modernize our service delivery and enhance citizen engagement.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default About;
