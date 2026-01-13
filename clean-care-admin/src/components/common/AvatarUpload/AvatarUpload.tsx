/**
 * AvatarUpload Component
 * Provides avatar upload functionality with drag-and-drop, preview, and validation
 * 
 * Features:
 * - Drag and drop support
 * - Click to browse
 * - Image preview before upload
 * - File validation (type, size)
 * - Upload progress indicator
 * - Cloudinary integration
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    Avatar,
    IconButton,
    CircularProgress,
    Typography,
    Paper,
    Tooltip,
    useTheme,
    useMediaQuery,
    Alert,
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    PhotoCamera as PhotoCameraIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useAvatarUpload } from '../../../hooks/useAvatarUpload';

interface AvatarUploadProps {
    /** Current avatar URL */
    currentAvatar?: string;
    /** Callback when upload completes successfully */
    onUpload: (url: string) => Promise<void>;
    /** Avatar size in pixels */
    size?: number;
    /** User's initials for default avatar */
    initials?: string;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** Maximum file size in MB */
    maxSizeInMB?: number;
    /** Allowed file types */
    allowedTypes?: string[];
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
    currentAvatar,
    onUpload,
    size = 120,
    initials = '?',
    disabled = false,
    maxSizeInMB = 5,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const {
        uploadAvatar,
        isUploading,
        uploadProgress,
        uploadError,
        previewUrl,
        clearUploadError,
        generatePreview,
        clearPreview,
    } = useAvatarUpload({
        maxSizeInMB,
        allowedTypes,
        onSuccess: async (url) => {
            await onUpload(url);
            setShowPreview(false);
            clearPreview();
            setSelectedFile(null);
        },
        onError: (error) => {
            console.error('Upload error:', error);
        },
    });

    // Responsive size
    const responsiveSize = isMobile ? Math.min(size, 100) : size;

    /**
     * Handle file selection
     */
    const handleFileSelect = useCallback(
        (file: File) => {
            if (disabled || isUploading) return;

            // Store file for upload
            setSelectedFile(file);

            // Generate preview
            generatePreview(file);
            setShowPreview(true);
        },
        [disabled, isUploading, generatePreview]
    );

    /**
     * Handle file input change
     */
    const handleFileInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                handleFileSelect(file);
            }
            // Reset input value to allow selecting the same file again
            event.target.value = '';
        },
        [handleFileSelect]
    );

    /**
     * Handle click to browse
     */
    const handleBrowseClick = useCallback(() => {
        if (disabled || isUploading) return;
        fileInputRef.current?.click();
    }, [disabled, isUploading]);

    /**
     * Handle drag events
     */
    const handleDragEnter = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled && !isUploading) {
                setIsDragging(true);
            }
        },
        [disabled, isUploading]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (disabled || isUploading) return;

            const file = e.dataTransfer.files?.[0];
            if (file) {
                handleFileSelect(file);
            }
        },
        [disabled, isUploading, handleFileSelect]
    );

    /**
     * Handle upload confirmation
     */
    const handleUploadConfirm = useCallback(async () => {
        if (!previewUrl || !selectedFile) return;

        try {
            await uploadAvatar(selectedFile);
        } catch (error) {
            console.error('Upload failed:', error);
        }
    }, [previewUrl, selectedFile, uploadAvatar]);

    /**
     * Handle cancel preview
     */
    const handleCancelPreview = useCallback(() => {
        setShowPreview(false);
        clearPreview();
        clearUploadError();
        setSelectedFile(null);
    }, [clearPreview, clearUploadError]);

    /**
     * Cleanup preview URL on unmount
     */
    useEffect(() => {
        return () => {
            clearPreview();
        };
    }, [clearPreview]);

    /**
     * Render upload progress
     */
    const renderProgress = () => {
        if (!isUploading) return null;

        return (
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '50%',
                    zIndex: 2,
                }}
            >
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                        variant="determinate"
                        value={uploadProgress}
                        size={responsiveSize * 0.4}
                        sx={{ color: '#fff' }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography
                            variant="caption"
                            component="div"
                            sx={{ color: '#fff', fontWeight: 600 }}
                        >
                            {`${Math.round(uploadProgress)}%`}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    };

    /**
     * Render preview modal
     */
    const renderPreview = () => {
        if (!showPreview || !previewUrl) return null;

        return (
            <Paper
                elevation={8}
                role="dialog"
                aria-modal="true"
                aria-labelledby="avatar-preview-title"
                sx={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1300,
                    p: 3,
                    maxWidth: isMobile ? '90vw' : 400,
                    width: '100%',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" id="avatar-preview-title">Preview Avatar</Typography>
                    <IconButton
                        size="small"
                        onClick={handleCancelPreview}
                        disabled={isUploading}
                        aria-label="Close preview"
                    >
                        <CloseIcon aria-hidden="true" />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Avatar
                        src={previewUrl}
                        alt="Preview of new profile picture"
                        sx={{
                            width: isMobile ? 150 : 200,
                            height: isMobile ? 150 : 200,
                            border: `4px solid ${theme.palette.primary.main}`,
                        }}
                        role="img"
                        aria-label="Preview of new profile picture"
                    />
                </Box>

                {uploadError && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={clearUploadError}>
                        {uploadError}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <IconButton
                        onClick={handleCancelPreview}
                        disabled={isUploading}
                        aria-label="Cancel avatar upload"
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            px: 2,
                            '&:focus-visible': {
                                outline: `2px solid ${theme.palette.primary.main}`,
                                outlineOffset: '2px',
                            },
                        }}
                    >
                        <Typography variant="button" sx={{ mr: 1 }}>
                            Cancel
                        </Typography>
                        <CloseIcon fontSize="small" aria-hidden="true" />
                    </IconButton>
                    <IconButton
                        onClick={handleUploadConfirm}
                        disabled={isUploading}
                        aria-label={isUploading ? 'Uploading avatar' : 'Confirm and upload avatar'}
                        aria-busy={isUploading}
                        sx={{
                            background: theme.palette.primary.main,
                            color: '#fff',
                            borderRadius: 1,
                            px: 2,
                            '&:hover': {
                                background: theme.palette.primary.dark,
                            },
                            '&:disabled': {
                                background: theme.palette.action.disabledBackground,
                            },
                            '&:focus-visible': {
                                outline: `2px solid ${theme.palette.primary.main}`,
                                outlineOffset: '2px',
                            },
                        }}
                    >
                        <Typography variant="button" sx={{ mr: 1 }}>
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </Typography>
                        <CloudUploadIcon fontSize="small" aria-hidden="true" />
                    </IconButton>
                </Box>
            </Paper>
        );
    };

    /**
     * Render backdrop for preview
     */
    const renderBackdrop = () => {
        if (!showPreview) return null;

        return (
            <Box
                onClick={handleCancelPreview}
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1299,
                }}
            />
        );
    };

    return (
        <>
            <Box
                sx={{
                    position: 'relative',
                    display: 'inline-block',
                }}
            >
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={allowedTypes.join(',')}
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                    disabled={disabled || isUploading}
                    aria-label="Upload profile picture"
                    id="avatar-upload-input"
                />

                {/* Avatar with drag-and-drop zone */}
                <Box
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    sx={{
                        position: 'relative',
                        cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.6 : 1,
                    }}
                >
                    <Avatar
                        src={currentAvatar}
                        alt={`Current profile picture${initials ? ` (${initials})` : ''}`}
                        sx={{
                            width: responsiveSize,
                            height: responsiveSize,
                            fontSize: responsiveSize * 0.4,
                            border: isDragging
                                ? `3px dashed ${theme.palette.primary.main}`
                                : `3px solid ${theme.palette.divider}`,
                            transition: 'all 0.2s ease-in-out',
                            backgroundColor: theme.palette.grey[300],
                        }}
                        role="img"
                        aria-label={`Profile picture${initials ? ` showing initials ${initials}` : ''}`}
                    >
                        {initials}
                    </Avatar>

                    {/* Upload progress overlay */}
                    <Box role="status" aria-live="polite" aria-atomic="true">
                        {renderProgress()}
                    </Box>

                    {/* Drag overlay */}
                    {isDragging && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                borderRadius: '50%',
                                zIndex: 1,
                            }}
                            role="status"
                            aria-label="Drop file to upload"
                        >
                            <CloudUploadIcon
                                sx={{
                                    fontSize: responsiveSize * 0.4,
                                    color: theme.palette.primary.main,
                                }}
                                aria-hidden="true"
                            />
                        </Box>
                    )}

                    {/* Upload button */}
                    {!isUploading && (
                        <Tooltip title="Upload new avatar" arrow>
                            <IconButton
                                onClick={handleBrowseClick}
                                disabled={disabled}
                                aria-label="Upload new profile picture"
                                component="label"
                                htmlFor="avatar-upload-input"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    backgroundColor: theme.palette.primary.main,
                                    color: '#fff',
                                    width: responsiveSize * 0.3,
                                    height: responsiveSize * 0.3,
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.dark,
                                    },
                                    '&:disabled': {
                                        backgroundColor: theme.palette.action.disabledBackground,
                                    },
                                    '&:focus-visible': {
                                        outline: `2px solid ${theme.palette.primary.main}`,
                                        outlineOffset: '2px',
                                    },
                                }}
                            >
                                <PhotoCameraIcon sx={{ fontSize: responsiveSize * 0.15 }} aria-hidden="true" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                {/* Helper text */}
                {!isMobile && (
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            textAlign: 'center',
                            mt: 1,
                            color: theme.palette.text.secondary,
                        }}
                    >
                        Click or drag to upload
                    </Typography>
                )}
            </Box>

            {/* Preview modal */}
            {renderBackdrop()}
            {renderPreview()}
        </>
    );
};

export default AvatarUpload;
