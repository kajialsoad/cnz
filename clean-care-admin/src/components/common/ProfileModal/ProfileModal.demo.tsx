/**
 * ProfileModal Demo
 * Example usage of the ProfileModal component
 */

import React, { useState } from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import ProfileModal from './ProfileModal';

/**
 * Demo component showing ProfileModal usage
 */
const ProfileModalDemo: React.FC = () => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    ProfileModal Demo
                </Typography>

                <Typography variant="body1" paragraph>
                    Click the button below to open the profile modal.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={<PersonIcon />}
                        onClick={() => setIsProfileOpen(true)}
                        size="large"
                    >
                        Open Profile Modal
                    </Button>
                </Box>

                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Features:
                    </Typography>
                    <ul>
                        <li>Displays user avatar with role badge</li>
                        <li>Shows personal information (email, phone, ward, zone, address)</li>
                        <li>Shows account information (member since, last login, status)</li>
                        <li>Verification status indicators for email and phone</li>
                        <li>Edit profile button (prepared for Task 7)</li>
                        <li>Logout button with loading state</li>
                        <li>Loading skeleton while fetching data</li>
                        <li>Responsive design for all screen sizes</li>
                        <li>Smooth animations</li>
                    </ul>
                </Box>

                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Usage:
                    </Typography>
                    <Paper
                        sx={{
                            p: 2,
                            backgroundColor: '#f5f5f5',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            overflow: 'auto',
                        }}
                    >
                        <pre>{`import ProfileModal from './components/common/ProfileModal';

function MyComponent() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsProfileOpen(true)}>
        Open Profile
      </Button>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}`}</pre>
                    </Paper>
                </Box>
            </Paper>

            {/* ProfileModal */}
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </Container>
    );
};

export default ProfileModalDemo;
