import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import PublicNavbar from '../../components/layout/PublicNavbar';

const blogPosts = [
  {
    id: 1,
    title: "5 Tips for Effective Home Waste Segregation",
    excerpt: "Learn how to separate your household waste efficiently to support recycling efforts.",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    date: "Jan 20, 2026"
  },
  {
    id: 2,
    title: "DSCC Launches New Clean City Drive",
    excerpt: "Dhaka South City Corporation announces a month-long initiative to clean up major public spaces.",
    image: "https://images.unsplash.com/photo-1591567936460-26b28b70742a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    date: "Jan 18, 2026"
  },
  {
    id: 3,
    title: "The Impact of Plastic Pollution on Our City",
    excerpt: "Understanding why reducing single-use plastic is crucial for Dhaka's drainage system.",
    image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    date: "Jan 15, 2026"
  }
];

const Blog = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />
      
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, color: '#1B5E20', textAlign: 'center', mb: 2 }}>
          Latest Updates & News
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 8 }}>
          Stay informed about waste management initiatives and eco-friendly tips.
        </Typography>

        <Grid container spacing={4}>
          {blogPosts.map((post) => (
            <Grid item xs={12} md={4} key={post.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4, boxShadow: 2 }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={post.image}
                  alt={post.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" color="primary" fontWeight="bold">
                    {post.date}
                  </Typography>
                  <Typography gutterBottom variant="h5" component="div" fontWeight="bold" sx={{ mt: 1 }}>
                    {post.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {post.excerpt}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button size="small" color="success" fontWeight="bold">Read More</Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Blog;
