/**
 * AvatarUpload Component Demo
 * 
 * This file demonstrates various usage patterns for the AvatarUpload component.
 * Use this as a reference for implementing avatar upload in your features.
 */

import React, { useState } from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import AvatarUpload from './AvatarUpload';

/**
 * Demo 1: Basic Usage
 */
export const BasicAvatarUploadDemo: React.FC = () => {
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
        'https://via.placeholder.com/150'
    );

    const handleUpload = async (url: string) => {
        console.log('Avatar uploaded:', url);
        setAvatarUrl(url);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Basic Avatar Upload
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click the camera icon or drag an image to upload
            </Typography>
            <AvatarUpload
                currentAvatar={avatarUrl}
                onUpload={handleUpload}
                initials="JD"
            />
        </Paper>
    );
};

/**
 * Demo 2: Different Sizes
 */
export const SizedAvatarUploadDemo: React.FC = () => {
    const [avatarUrl] = useState<string | undefined>(
        'https://via.placeholder.com/150'
    );

    const handleUpload = async (url: string) => {
        console.log('Avatar uploaded:', url);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Different Sizes
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="caption" display="block" gutterBottom>
                        Small (80px)
                    </Typography>
                    <AvatarUpload
                        currentAvatar={avatarUrl}
                        onUpload={handleUpload}
                        size={80}
                        initials="SM"
                    />
                </Box>
                <Box>
                    <Typography variant="caption" display="block" gutterBottom>
                        Medium (120px)
                    </Typography>
                    <AvatarUpload
                        currentAvatar={avatarUrl}
                        onUpload={handleUpload}
                        size={120}
                        initials="MD"
                    />
                </Box>
                <Box>
                    <Typography variant="caption" display="block" gutterBottom>
                        Large (160px)
                    </Typography>
                    <AvatarUpload
                        currentAvatar={avatarUrl}
                        onUpload={handleUpload}
                        size={160}
                        initials="LG"
                    />
                </Box>
            </Box>
        </Paper>
    );
};

/**
 * Demo 3: With Custom Validation
 */
export const CustomValidationDemo: React.FC = () => {
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

    const handleUpload = async (url: string) => {
        console.log('Avatar uploaded:', url);
        setAvatarUrl(url);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Custom Validation (Max 2MB, JPEG/PNG only)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This example restricts file size to 2MB and only allows JPEG/PNG
            </Typography>
            <AvatarUpload
                currentAvatar={avatarUrl}
                onUpload={handleUpload}
                initials="CV"
                maxSizeInMB={2}
                allowedTypes={['image/jpeg', 'image/png']}
            />
        </Paper>
    );
};

/**
 * Demo 4: Disabled State
 */
export const DisabledAvatarUploadDemo: React.FC = () => {
    const [avatarUrl] = useState<string | undefined>(
        'https://via.placeholder.com/150'
    );

    const handleUpload = async (url: string) => {
        console.log('Avatar uploaded:', url);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Disabled State
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload is disabled (e.g., during form submission)
            </Typography>
            <AvatarUpload
                currentAvatar={avatarUrl}
                onUpload={handleUpload}
                initials="DS"
                disabled={true}
            />
        </Paper>
    );
};

/**
 * Demo 5: Without Current Avatar
 */
export const NoAvatarDemo: React.FC = () => {
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

    const handleUpload = async (url: string) => {
        console.log('Avatar uploaded:', url);
        setAvatarUrl(url);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                No Current Avatar
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Shows initials when no avatar is set
            </Typography>
            <AvatarUpload
                currentAvatar={avatarUrl}
                onUpload={handleUpload}
                initials="NA"
            />
        </Paper>
    );
};

/**
 * Demo 6: Profile Integration Example
 */
export const ProfileIntegrationDemo: React.FC = () => {
    const [profile, setProfile] = useState({
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://via.placeholder.com/150',
    });

    const handleUpload = async (url: string) => {
        // Simulate API call to update profile
        console.log('Updating profile with new avatar:', url);

        // Update local state
        setProfile((prev) => ({
            ...prev,
            avatar: url,
        }));

        // In real implementation, you would call:
        // await profileService.updateProfile({ avatar: url });
    };

    const initials = `${profile.firstName[0]}${profile.lastName[0]}`;

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Profile Integration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Example of integrating with profile data
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <AvatarUpload
                    currentAvatar={profile.avatar}
                    onUpload={handleUpload}
                    initials={initials}
                />
                <Box>
                    <Typography variant="h6">
                        {profile.firstName} {profile.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Initials: {initials}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

/**
 * All Demos Combined
 */
export const AvatarUploadDemos: React.FC = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                AvatarUpload Component Demos
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Interactive examples demonstrating various usage patterns
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <BasicAvatarUploadDemo />
                <Divider />
                <SizedAvatarUploadDemo />
                <Divider />
                <CustomValidationDemo />
                <Divider />
                <DisabledAvatarUploadDemo />
                <Divider />
                <NoAvatarDemo />
                <Divider />
                <ProfileIntegrationDemo />
            </Box>
        </Box>
    );
};

export default AvatarUploadDemos;
