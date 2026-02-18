import React from 'react';
import { Box, Typography, Container, Grid, Paper, Button, Card, CardMedia, CardContent, CardActions, Divider } from '@mui/material';
import PublicNavbar from '../../components/layout/PublicNavbar';
import logoImage from '../../assets/images/logo_clean_c.png';
import { ArrowForward } from '@mui/icons-material';
import { motion } from 'framer-motion';

const Blog = () => {
  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
      <PublicNavbar />

      {/* 🔹 BLOG HERO */}
      <Box sx={{ position: 'relative', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 20, ease: "linear" }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${import.meta.env.BASE_URL}blog-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography variant="overline" sx={{ color: '#81c784', letterSpacing: 3, fontWeight: 'bold' }}>BLOG & UPDATES</Typography>
            <Typography variant="h2" fontWeight="800" gutterBottom>সচেতনতা ও শিক্ষার সেতুবন্ধন</Typography>
            <Box sx={{ width: 60, height: 4, bgcolor: '#4caf50', mx: 'auto', mb: 3, borderRadius: 2 }} />
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, lineHeight: 1.6 }}>
              আমাদের ব্লগে জানুন পরিবেশ সুরক্ষার টিপস, বিশেষজ্ঞ মতামত এবং সফলতার গল্প।
              আসুন, তথ্যে সমৃদ্ধ হয়ে সচেতন নাগরিক হিসেবে দায়িত্ব পালন করি।
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* 🟢 BLOG INTRO / Featured */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Paper elevation={0} sx={{ p: 6, borderRadius: 4, bgcolor: 'white', border: '1px solid #e0e0e0', mb: 8 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#2e7d32' }}>পরিবেশ রক্ষার প্রথম ধাপ হলো সঠিক তথ্য জানা</Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', color: '#546e7a' }}>
              এখানে আমরা তুলে ধরি—
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {['দূষণের কারণ ও প্রভাব', 'সচেতনতার গুরুত্ব', 'নাগরিক করণীয়', 'বাস্তব উদাহরণ ও সমাধান'].map((item, idx) => (
                <Grid size={{  xs: 12, sm: 6 , md: 3 }} key={idx}>
                  <Box sx={{ p: 2, bgcolor: '#f1f8e9', borderRadius: 2, textAlign: 'center', color: '#33691e', fontWeight: 'bold' }}>
                    {item}
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Typography variant="body1" sx={{ fontStyle: 'italic', color: '#546e7a' }}>
              এই লেখাগুলো নাগরিকদের সিদ্ধান্ত নিতে ও সচেতন ভূমিকা রাখতে সহায়তা করবে।
            </Typography>
          </Paper>
        </motion.div>

        <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>Recent Articles</Typography>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Grid container spacing={4}>
            {/* Dummy Articles matching the theme */}
            {[
              {
                title: "বায়ু দূষণ: আমাদের করণীয় কী?",
                desc: "শহরের বায়ু দূষণ কমাতে ব্যক্তিগত ও সামাজিকভাবে আমরা কী কী পদক্ষেপ নিতে পারি তার একটি বিস্তারিত গাইড।",
                img: `${import.meta.env.BASE_URL}pollution-reality.png`
              },
              {
                title: "প্লাস্টিক বর্জ্য ও নদীর মৃত্যু",
                desc: "একবার ব্যবহারযোগ্য প্লাস্টিক কীভাবে আমাদের নদীগুলোকে ধ্বংস করছে এবং এর প্রতিকার।",
                img: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80&w=500"
              },
              {
                title: "কমিউনিটি ক্লিন-আপ: সাফল্যের গল্প",
                desc: "ঢাকাবাসীর সম্মিলিত প্রচেষ্টায় কীভাবে একটি এলাকা পরিচ্ছন্ন হলো তার অনুপ্রেরণামূলক গল্প।",
                img: `${import.meta.env.BASE_URL}community-volunteers.png`
              }
            ].map((post, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <motion.div
                  variants={fadeInUp}
                  whileHover={{ y: -6 }}
                  style={{ height: '100%' }}
                >
                  <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, border: '1px solid #eee', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
                    <Box sx={{ overflow: 'hidden', height: 200 }}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        style={{ height: '100%' }}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={post.img}
                          alt={post.title}
                          sx={{ objectFit: 'cover', height: '100%', width: '100%' }}
                        />
                      </motion.div>
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h5" component="div" fontWeight="bold">
                        {post.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {post.desc}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button size="small" endIcon={<ArrowForward />} color="success">Read More</Button>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a1a1a', color: 'rgba(255,255,255,0.7)', py: 6, borderTop: '1px solid rgba(255,255,255,0.1)', mt: 'auto' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" color="white" gutterBottom fontWeight="bold">Together for a Cleaner Dhaka and a Sustainable Bangladesh.</Typography>
              <Typography variant="body1">পরিবর্তন আজই শুরু হোক—আমাদের সবার অংশগ্রহণে।</Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Typography component="a" href={import.meta.env.BASE_URL} sx={{ color: 'inherit', textDecoration: 'none' }}>Home</Typography>
              <Typography component="a" href={`${import.meta.env.BASE_URL}about`} sx={{ color: 'inherit', textDecoration: 'none' }}>About Us</Typography>
              <Typography component="a" href={`${import.meta.env.BASE_URL}blog`} sx={{ color: 'inherit', textDecoration: 'none' }}>Blog</Typography>
              <Typography component="a" href={`${import.meta.env.BASE_URL}user-privacy-policy.html`} sx={{ color: 'inherit', textDecoration: 'none' }}>User Privacy Policy</Typography>
              <Typography component="a" href={`${import.meta.env.BASE_URL}admin-privacy-policy.html`} sx={{ color: 'inherit', textDecoration: 'none' }}>Admin Privacy Policy</Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Blog;


