/**
 * ProfileEditForm Demo
 * Example usage of the ProfileEditForm component
 */

import React, { useState } from 'react';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import ProfileEditForm from './ProfileEditForm';
import type { UserProfile, ProfileUpdateData } from '../../../types/profile.types';

// Mock profile data
const mockProfile: UserProfile = {
    id: 1,
    email: 'admin@cleancare.com',
    phone: '+8801712345678',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://via.placeholder.com/150',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
    ward: '10',
    zone: 'A',
    address: '123 Main Street, Dhaka',
    cityCorporationCode: 'DSCC',
    thanaId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    lastLoginAt: '2024-01-20T10:30:00Z',
};

const ProfileEditFormDemo: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile>(mockProfile);
    const [showForm, setShowForm] = useState(false);

    const handleSave = async (data: ProfileUpdateData) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Update profile
        setProfile((prev) => ({
            ...prev,
            ...data,
            updatedAt: new Date().toISOString(),
        }));

        console.log('Profile updated:', data);
        setShowForm(false);
    };

    const handleCancel = () => {
        console.log('Edit cancelled');
        setShowForm(false);
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                ProfileEditForm Demo
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Current Profile Data
                </Typography>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        <strong>Name:</strong> {profile.firstName} {profile.lastName}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Email:</strong> {profile.email}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Phone:</strong> {profile.phone}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Ward:</strong> {profile.ward || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Zone:</strong> {profile.zone || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Address:</strong> {profile.address || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Last Updated:</strong> {new Date(profile.updatedAt).toLocaleString()}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Hide Form' : 'Show Edit Form'}
                </Button>
            </Paper>

            {showForm && (
                <Paper elevation={3}>
                    <ProfileEditForm
                        initialData={profile}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                </Paper>
            )}

            <Paper elevation={1} sx={{ p: 2, mt: 3, bgcolor: 'info.light' }}>
                <Typography variant="subtitle2" gutterBottom>
                    Demo Instructions:
                </Typography>
                <Typography variant="body2" component="div">
                    <ul>
                        <li>Click "Show Edit Form" to display the form</li>
                        <li>Try editing the first name and last name</li>
                        <li>Try submitting with empty fields (validation error)</li>
                        <li>Try submitting with invalid characters (validation error)</li>
                        <li>Try submitting without making changes (no changes error)</li>
                        <li>Upload a new avatar image</li>
                        <li>Click "Cancel" to reset the form</li>
                        <li>Click "Save Changes" to submit (simulates 1.5s API call)</li>
                        <li>Check the console for logged events</li>
                    </ul>
                </Typography>
            </Paper>
        </Container>
    );
};

export default ProfileEditFormDemo;


