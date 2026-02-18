import React from 'react';
import { Box, Typography, Container, Grid, Paper, Card, CardContent, Divider } from '@mui/material';
import PublicNavbar from '../../components/layout/PublicNavbar';
import logoImage from '../../assets/images/logo_clean_c.png';
import { VerifiedUser, Visibility, Spa, Groups } from '@mui/icons-material';
import { motion } from 'framer-motion';

const About = () => {
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

      {/* 🔹 ABOUT HERO */}
      <Box sx={{ position: 'relative', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', color: 'white' }}>
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
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4)), url('${import.meta.env.BASE_URL}about-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container>
            <Grid size={{ xs: 12, md: 8 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography variant="overline" sx={{ color: '#81c784', letterSpacing: 3, fontWeight: 'bold' }}>ABOUT US</Typography>
                <Typography variant="h2" fontWeight="800" gutterBottom>আমাদের লক্ষ্য ও দায়িত্ব</Typography>
                <Box sx={{ width: 60, height: 4, bgcolor: '#4caf50', mb: 3, borderRadius: 2 }} />
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, lineHeight: 1.6, maxWidth: 600 }}>
                  আমরা বিশ্বাস করি, একটি পরিচ্ছন্ন ও স্বাস্থ্যকর পরিবেশ একটি মৌলিক মানবাধিকার। এই উদ্যোগের মাধ্যমে আমরা ঢাকা শহরের পরিবেশ ব্যবস্থাপনায় দীর্ঘমেয়াদি, দায়িত্বশীল এবং প্রযুক্তিনির্ভর সমাধান বাস্তবায়নের পথে কাজ করছি।
                </Typography>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Mission & Vision Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              style={{ height: '100%' }}
            >
              <Paper elevation={0} sx={{ p: 5, height: '100%', bgcolor: '#e8f5e9', borderRadius: 4, borderLeft: '6px solid #2e7d32', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1b5e20' }}>আমাদের মিশন</Typography>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#333' }}>
                  পরিবেশ দূষণ নিয়ন্ত্রণ, কার্যকর বর্জ্য ব্যবস্থাপনা এবং নাগরিক সচেতনতা বৃদ্ধির মাধ্যমে ঢাকাকে একটি পরিচ্ছন্ন ও বাসযোগ্য শহর হিসেবে গড়ে তোলা।
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
              style={{ height: '100%' }}
            >
              <Paper elevation={0} sx={{ p: 5, height: '100%', bgcolor: '#e3f2fd', borderRadius: 4, borderLeft: '6px solid #1565c0', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#0d47a1' }}>আমাদের ভিশন</Typography>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#333' }}>
                  একটি ভবিষ্যৎ বাংলাদেশ, যেখানে শহর হবে সবুজ, নদী হবে পরিষ্কার এবং নাগরিকরা হবে পরিবেশ-সচেতন ও দায়িত্বশীল।
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* 🔹 VALUES */}
      <Box sx={{ bgcolor: 'white', py: 12 }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h3" align="center" fontWeight="800" gutterBottom sx={{ mb: 8 }}>আমাদের মূল্যবোধ</Typography>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Grid container spacing={4}>
              {[
                { icon: <Visibility sx={{ fontSize: 50 }} />, title: "স্বচ্ছতা", desc: "সকল কাজে স্বচ্ছতা ও জবাবদিহিতা নিশ্চিত করা।" },
                { icon: <VerifiedUser sx={{ fontSize: 50 }} />, title: "দায়িত্ববোধ", desc: "পরিবেশ ও সমাজের প্রতি পূর্ণ দায়িত্ব পালন।" },
                { icon: <Spa sx={{ fontSize: 50 }} />, title: "টেকসই উন্নয়ন", desc: "দীর্ঘমেয়াদী ও পরিবেশবান্ধব উন্নয়ন পরিকল্পনা।" },
                { icon: <Groups sx={{ fontSize: 50 }} />, title: "জনগণের অংশগ্রহণ", desc: "নাগরিকদের সম্পৃক্ত করে সম্মিলিতভাবে কাজ করা।" }
              ].map((item, index) => (
                <Grid size={{  xs: 12, sm: 6 , md: 3 }} key={index}>
                  <motion.div variants={fadeInUp} style={{ height: '100%' }}>
                    <Card elevation={0} sx={{ textAlign: 'center', height: '100%', border: '1px solid #eee', borderRadius: 4, transition: '0.3s', '&:hover': { boxShadow: '0 10px 30px rgba(0,0,0,0.1)', transform: 'translateY(-5px)' } }}>
                      <CardContent sx={{ py: 5 }}>
                        <Box sx={{ color: 'success.main', mb: 2 }}>{item.icon}</Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>{item.title}</Typography>
                        <Typography color="text.secondary">{item.desc}</Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

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

export default About;


