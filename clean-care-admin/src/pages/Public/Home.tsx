import React, { useEffect } from 'react';
import { Box, Typography, Button, Container, Grid, Paper, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { AdminPanelSettings, Warning, HealthAndSafety, Groups } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/images/logo_clean_c.png';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const rotateIcon = {
    hidden: { rotate: 0 },
    visible: {
      rotate: [0, 5, -5, 0],
      transition: { duration: 0.8, ease: "easeInOut", delay: 0.2 }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa', fontFamily: "'Noto Sans Bengali', sans-serif" }}>
      <PublicNavbar />

      {/* 🟢 HERO SECTION */}
      <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        {/* Background Image with Parallax Zoom */}
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
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url('${import.meta.env.BASE_URL}hero-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, color: 'white', pt: { xs: 8, md: 0 } }}>
          <Box sx={{ maxWidth: '900px', mx: 'auto', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontSize: { xs: '0.75rem', md: '1rem' },
                  letterSpacing: { xs: '0.1rem', md: '0.2rem' },
                  fontWeight: 600,
                  color: '#81c784',
                  mb: 2,
                  display: 'block',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  textShadow: '0 4px 20px rgba(0,0,0,0.6)',
                  fontSize: { xs: '2.5rem', md: '4.5rem' },
                  lineHeight: { xs: 1.2, md: 1.1 }
                }}
              >
                Cleaner Dhaka,<br />
                Greener Tomorrow
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: '#e8f5e9',
                  fontSize: { xs: '1.25rem', md: '1.5rem' }
                }}
              >
                পরিবেশ সুরক্ষা কোনো বিকল্প নয়—এটি আমাদের দায়িত্ব।
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 5,
                  opacity: 0.9,
                  fontSize: { xs: '1rem', md: '1.2rem' },
                  lineHeight: 1.6,
                  maxWidth: '750px',
                  mx: 'auto',
                  display: { xs: 'none', md: 'block' } // Hide long description on very small screens if needed, or keep strictly responsive
                }}
              >
                সচেতনতা, প্রযুক্তি ও সম্মিলিত উদ্যোগের মাধ্যমে গড়ে তুলুন একটি পরিচ্ছন্ন ঢাকা। এই প্ল্যাটফর্মটি ঢাকার পরিবেশ দূষণ নিয়ন্ত্রণ, বর্জ্য ব্যবস্থাপনা উন্নয়ন এবং নাগরিক সচেতনতা বৃদ্ধির লক্ষ্যে তৈরি একটি দায়িত্বশীল উদ্যোগ।
              </Typography>
              {/* Mobile only short desc */}
              <Typography
                variant="body1"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontSize: '1rem',
                  lineHeight: 1.5,
                  display: { xs: 'block', md: 'none' }
                }}
              >
                সচেতনতা ও প্রযুক্তির মাধ্যমে গড়ে তুলুন একটি পরিচ্ছন্ন ঢাকা।
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}
            >
              <Button
                variant="contained"
                size="large"
                color="success"
                onClick={() => navigate('/about')}
                sx={{
                  py: 1.5,
                  px: 5,
                  fontSize: '1.1rem',
                  borderRadius: '50px',
                  boxShadow: '0 8px 20px rgba(46, 125, 50, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px rgba(46, 125, 50, 0.6)'
                  }
                }}
              >
                Learn More
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  py: 1.5,
                  px: 5,
                  fontSize: '1.1rem',
                  borderRadius: '50px',
                  borderColor: 'white',
                  color: 'white',
                  borderWidth: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderWidth: 2,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Admin Login
              </Button>
            </motion.div>
          </Box>
        </Container>
      </Box>

      {/* 🟢 SECTION 2: বর্তমান বাস্তবতা (The Reality We Face) */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={slideInLeft}
              style={{ position: 'relative' }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  left: -20,
                  width: 100,
                  height: 100,
                  bgcolor: '#ffebee',
                  borderRadius: '50%',
                  zIndex: 0
                }}
              />
              <Box
                component="img"
                src={`${import.meta.env.BASE_URL}pollution-reality.png`}
                alt="Polluted City"
                sx={{
                  width: '100%',
                  borderRadius: '16px',
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  transition: 'transform 0.5s ease',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <Warning color="error" />
                <Typography variant="overline" color="error" fontWeight="bold">CURRENT SITUATION</Typography>
              </Box>
              <Typography variant="h3" fontWeight="800" gutterBottom sx={{ color: '#263238' }}>
                ঢাকার পরিবেশ:<br /> একটি নীরব সংকট
              </Typography>
              <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#455a64' }}>
                ঢাকা শহর আজ বায়ু দূষণ, প্লাস্টিক বর্জ্য, অপরিকল্পিত আবর্জনা ব্যবস্থাপনা এবং নদী দূষণের মতো গুরুতর সমস্যার মুখোমুখি। প্রতিদিনের এই দূষণ আমাদের স্বাস্থ্য, জীবনমান এবং ভবিষ্যৎ প্রজন্মের উপর সরাসরি প্রভাব ফেলছে।
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f1f8e9', borderLeft: '4px solid #43a047', mb: 2 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#2e7d32' }}>
                  "এই সমস্যাগুলো শুধু সংখ্যার হিসাব নয়—এগুলো মানুষের শ্বাস-প্রশ্বাস, পানির নিরাপত্তা এবং একটি বাসযোগ্য শহরের প্রশ্ন।"
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* 🟢 SECTION 3: সমাধান ও প্রশাসনিক উদ্যোগ */}
      <Box sx={{ bgcolor: '#e8f5e9', py: 12 }}>
        <Container maxWidth="lg">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <Typography variant="overline" color="success.main" fontWeight="bold" sx={{ letterSpacing: 2 }}>OUR APPROACH</Typography>
            <Typography variant="h3" fontWeight="800" sx={{ color: '#1a1a1a', mt: 1 }}>
              দায়িত্বশীল সমাধান, আধুনিক ব্যবস্থাপনা
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, maxWidth: 700, mx: 'auto', color: '#546e7a', fontSize: '1.1rem' }}>
              আমাদের লক্ষ্য—সমস্যা চিহ্নিত করা নয় শুধু, বরং বাস্তবসম্মত ও টেকসই সমাধান বাস্তবায়ন।
            </Typography>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Grid container spacing={4}>
              {[
                { icon: <AdminPanelSettings color="success" sx={{ fontSize: 50, mb: 2 }} />, title: "প্রশাসনিক মনিটরিং", desc: "এই প্ল্যাটফর্মটি একটি প্রযুক্তি-ভিত্তিক প্রশাসনিক ব্যবস্থার মাধ্যমে পরিবেশ সংক্রান্ত সমস্যাগুলো চিহ্নিত, পর্যবেক্ষণ ও সমাধানের পথ তৈরি করে।" },
                { icon: <Groups color="primary" sx={{ fontSize: 50, mb: 2 }} />, title: "স্বচ্ছ ও কার্যকর সিদ্ধান্ত", desc: "ডিজিটাল রিপোর্টিং, ডাটা বিশ্লেষণ এবং রিপোর্টিং সিস্টেমের মাধ্যমে স্বচ্ছ ও কার্যকর সিদ্ধান্ত গ্রহণ নিশ্চিত করা হয়।" },
                { icon: <HealthAndSafety color="warning" sx={{ fontSize: 50, mb: 2 }} />, title: "টেকসই সমাধান", desc: "শুধু সাময়িক পদক্ষেপ নয়, দীর্ঘমেয়াদী টেকসই নগর ব্যবস্থাপনার ভিত্তি গড়ে তোলাই আমাদের মূল লক্ষ্য।" }
              ].map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div variants={fadeInUp} style={{ height: '100%' }}>
                    <Paper
                      sx={{
                        p: 5,
                        height: '100%',
                        borderRadius: 4,
                        transition: '0.3s',
                        '&:hover': { transform: 'translateY(-10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }
                      }}
                    >
                      {item.icon}
                      <Typography variant="h5" fontWeight="bold" gutterBottom>{item.title}</Typography>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {item.desc}
                      </Typography>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* 🟢 SECTION 4: মানুষ ও কমিউনিটি */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Typography variant="h3" fontWeight="800" gutterBottom sx={{ color: '#263238' }}>
                পরিবর্তনের মূল শক্তি: মানুষ
              </Typography>
              <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#455a64' }}>
                একটি পরিচ্ছন্ন শহর গড়ে তুলতে সরকার, প্রশাসন এবং নাগরিকদের সম্মিলিত প্রচেষ্টা অপরিহার্য। প্রকৃত পরিবর্তন আসে মানুষের সচেতনতা ও অংশগ্রহণ থেকে।
              </Typography>
              <Box component="ul" sx={{ pl: 2, color: '#455a64' }}>
                <Typography component="li" sx={{ mb: 1 }}>পরিচ্ছন্নতা কর্মীদের সম্মানজনক অংশগ্রহণ</Typography>
                <Typography component="li" sx={{ mb: 1 }}>স্বেচ্ছাসেবক ও শিক্ষার্থীদের সক্রিয় ভূমিকা</Typography>
                <Typography component="li" sx={{ mb: 1 }}>সাধারণ নাগরিকদের সচেতন নাগরিক দায়িত্ব পালন</Typography>
              </Box>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.05 }}
            >
              <Box
                component="img"
                src={`${import.meta.env.BASE_URL}community-volunteers.png`}
                alt="Community Volunteers"
                sx={{ width: '100%', borderRadius: 4, boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}
              />
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* 🟢 SECTION 5: কেন এই প্ল্যাটফর্ম (Why Us) */}
      <Box sx={{ bgcolor: '#263238', color: 'white', py: 12 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <Typography variant="h3" fontWeight="bold" gutterBottom>কেন এই উদ্যোগ প্রয়োজন?</Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.2rem', mb: 3, lineHeight: 1.8 }}>
                  পরিবেশ রক্ষা কোনো একক প্রতিষ্ঠানের কাজ নয়। এটি একটি দীর্ঘমেয়াদি দায়িত্ব। আমাদের লক্ষ্য একটি টেকসই ভবিষ্যৎ নিশ্চিত করা।
                </Typography>
                <Button variant="outlined" color="inherit" onClick={() => navigate('/about')} sx={{ borderRadius: 20, px: 4, py: 1 }}>
                  আমাদের সম্পর্কে আরও জানুন
                </Button>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <Grid container spacing={3}>
                  {[
                    "পরিবেশ সংক্রান্ত তথ্যকে সংগঠিত করা",
                    "প্রশাসনিক স্বচ্ছতা নিশ্চিত করা",
                    "নাগরিক সচেতনতা বাড়ানো",
                    "টেকসই নগর ব্যবস্থাপনার ভিত্তি গড়ে তোলা"
                  ].map((text, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <motion.div variants={fadeInUp} style={{ height: '100%' }}>
                        <motion.div variants={rotateIcon}>
                          <Box sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4, height: '100%', border: '1px solid rgba(255,255,255,0.1)', transition: 'background-color 0.3s', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                            <Typography variant="h6" fontWeight="bold" color="success.light" sx={{ mb: 1 }}>0{i + 1}.</Typography>
                            <Typography sx={{ opacity: 0.9 }}>{text}</Typography>
                          </Box>
                        </motion.div>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <Box sx={{ bgcolor: '#1a1a1a', color: 'rgba(255,255,255,0.7)', py: 6, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" color="white" gutterBottom fontWeight="bold">Together for a Cleaner Dhaka and a Sustainable Bangladesh.</Typography>
              <Typography variant="body1">পরিবর্তন আজই শুরু হোক—আমাদের সবার অংশগ্রহণে।</Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 4 }} />
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <img src={`${import.meta.env.BASE_URL}logo_clean_c.png`} alt="Clean Care" style={{ height: 40, width: 'auto', marginRight: 10 }} />
                  <Typography variant="h6" color="white">Clean Care</Typography>
                </Box>
                <Typography variant="body2">Smart Complaint Management System for Dhaka South City Corporation.</Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { md: 'center' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { md: 'center' } }}>
                  <Typography component="a" href="/" sx={{ color: 'inherit', textDecoration: 'none' }}>Home</Typography>
                  <Typography component="a" href="/about" sx={{ color: 'inherit', textDecoration: 'none' }}>About Us</Typography>
                  <Typography component="a" href="/blog" sx={{ color: 'inherit', textDecoration: 'none' }}>Blog</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
                <Typography variant="body2" color="white">Dhaka South City Corporation</Typography>
                <Typography variant="body2">Nagar Bhaban, Dhaka - 1000</Typography>
                <Typography variant="caption" display="block" sx={{ mt: 2 }}>© 2026 Clean Care. All rights reserved.</Typography>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </motion.div>
    </Box>
  );
};

export default Home;
