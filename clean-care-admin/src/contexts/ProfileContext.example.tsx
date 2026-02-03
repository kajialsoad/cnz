/**
 * Profile Context Usage Examples
 * 
 * This file demonstrates various ways to use the Profile Context and hooks
 */

import React, { useState } from 'react';
import { useProfile } from './ProfileContext';
import { useProfileUpdate } from '../hooks/useProfileUpdate';
import { useAvatarUpload } from '../hooks/useAvatarUpload';

/**
 * Example 1: Basic Profile Display
 * Shows how to display profile information
 */
export function BasicProfileDisplay() {
    const { profile, isLoading, error } = useProfile();

    if (isLoading) {
        return <div>Loading profile...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    if (!profile) {
        return <div>No profile data available</div>;
    }

    return (
        <div className="profile-display">
            <img src={profile.avatar || '/default-avatar.png'} alt="Avatar" />
            <h2>{profile.firstName} {profile.lastName}</h2>
            <p>Email: {profile.email}</p>
            <p>Role: {profile.role}</p>
            <p>Status: {profile.status}</p>
        </div>
    );
}

/**
 * Example 2: Profile Edit Form
 * Shows how to update profile information
 */
export function ProfileEditForm() {
    const { profile } = useProfile();
    const { updateProfile, isUpdating, updateError } = useProfileUpdate({
        onSuccess: () => alert('Profile updated successfully!'),
        onError: (error) => console.error('Update failed:', error),
    });

    const [formData, setFormData] = useState({
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        ward: profile?.ward || '',
        zone: profile?.zone || '',
        address: profile?.address || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateProfile(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="profile-edit-form">
            <h2>Edit Profile</h2>

            {updateError && (
                <div className="error-message">{updateError}</div>
            )}

            <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    minLength={2}
                />
            </div>

            <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    minLength={2}
                />
            </div>

            <div className="form-group">
                <label htmlFor="ward">Ward</label>
                <input
                    type="text"
                    id="ward"
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                />
            </div>

            <div className="form-group">
                <label htmlFor="zone">Zone</label>
                <input
                    type="text"
                    id="zone"
                    name="zone"
                    value={formData.zone}
                    onChange={handleChange}
                />
            </div>

            <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                />
            </div>

            <button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Profile'}
            </button>
        </form>
    );
}

/**
 * Example 3: Avatar Upload Component
 * Shows how to upload and preview avatar images
 */
export function AvatarUploadComponent() {
    const { profile } = useProfile();
    const {
        uploadAvatar,
        isUploading,
        uploadProgress,
        uploadError,
        previewUrl,
        generatePreview,
        clearPreview,
    } = useAvatarUpload({
        maxSizeInMB: 5,
        onSuccess: (url) => {
            console.log('Avatar uploaded successfully:', url);
            alert('Avatar updated!');
        },
        onError: (error) => {
            console.error('Upload failed:', error);
        },
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            generatePreview(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            await uploadAvatar(selectedFile);
            setSelectedFile(null);
            clearPreview();
        } catch (error) {
            // Error is already handled by the hook
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        clearPreview();
    };

    return (
        <div className="avatar-upload">
            <h3>Update Avatar</h3>

            <div className="current-avatar">
                <img
                    src={profile?.avatar || '/default-avatar.png'}
                    alt="Current avatar"
                    style={{ width: 100, height: 100, borderRadius: '50%' }}
                />
            </div>

            <div className="upload-controls">
                <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                />

                {previewUrl && (
                    <div className="preview">
                        <h4>Preview:</h4>
                        <img
                            src={previewUrl}
                            alt="Preview"
                            style={{ width: 100, height: 100, borderRadius: '50%' }}
                        />
                    </div>
                )}

                {uploadError && (
                    <div className="error-message">{uploadError}</div>
                )}

                {isUploading && (
                    <div className="progress">
                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                            {uploadProgress}%
                        </div>
                    </div>
                )}

                <div className="buttons">
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Example 4: Profile Refresh Button
 * Shows how to manually refresh profile data
 */
export function ProfileRefreshButton() {
    const { refreshProfile, isLoading } = useProfile();

    const handleRefresh = async () => {
        try {
            await refreshProfile();
            alert('Profile refreshed!');
        } catch (error) {
            console.error('Refresh failed:', error);
        }
    };

    return (
        <button onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh Profile'}
        </button>
    );
}

/**
 * Example 5: Role-Based Display
 * Shows how to display content based on user role
 */
export function RoleBasedContent() {
    const { profile } = useProfile();

    if (!profile) return null;

    return (
        <div className="role-based-content">
            <h2>Welcome, {profile.firstName}!</h2>

            {profile.role === 'MASTER_ADMIN' && (
                <div className="master-admin-content">
                    <h3>Master Admin Dashboard</h3>
                    <p>You have full system access</p>
                </div>
            )}

            {profile.role === 'SUPER_ADMIN' && (
                <div className="super-admin-content">
                    <h3>Super Admin Dashboard</h3>
                    <p>You can manage users and complaints</p>
                </div>
            )}

            {profile.role === 'ADMIN' && (
                <div className="admin-content">
                    <h3>Admin Dashboard</h3>
                    <p>You can manage complaints</p>
                </div>
            )}
        </div>
    );
}

/**
 * Example 6: Complete Profile Modal
 * Shows a complete profile management modal
 */
export function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { profile, isLoading, error, clearError } = useProfile();
    const [isEditing, setIsEditing] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Profile</h2>
                    <button onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {isLoading && <div>Loading...</div>}

                    {error && (
                        <div className="error-message">
                            {error}
                            <button onClick={clearError}>Dismiss</button>
                        </div>
                    )}

                    {profile && !isEditing && (
                        <div className="profile-view">
                            <BasicProfileDisplay />
                            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
                        </div>
                    )}

                    {profile && isEditing && (
                        <div className="profile-edit">
                            <ProfileEditForm />
                            <AvatarUploadComponent />
                            <button onClick={() => setIsEditing(false)}>Cancel</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


