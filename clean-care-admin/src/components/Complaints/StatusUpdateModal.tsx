import React, { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Typography,
    Box,
    IconButton,
    useTheme,
    useMediaQuery,
    Alert,
    LinearProgress,
    ImageList,
    ImageListItem,
    ImageListItemBar,
} from '@mui/material';
import {
    Close as CloseIcon,
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Image as ImageIcon,
} from '@mui/icons-material';

interface StatusUpdateModalProps {
    open: boolean;
    complaintId: number;
    status: 'IN_PROGRESS' | 'RESOLVED';
    existingImages?: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface ImagePreview {
    file: File;
    preview: string;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MIN_NOTE_LENGTH = 20;
const MAX_NOTE_LENGTH = 500;

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
    open,
    complaintId,
    status,
    existingImages = '',
    onClose,
    onSuccess,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [resolutionNote, setResolutionNote] = useState<string>('');
    const [images, setImages] = useState<ImagePreview[]>([]);
    // Parse existing images into array
    const [currentExistingImages, setCurrentExistingImages] = useState<string[]>(
        existingImages ? existingImages.split(',').filter(url => url.trim()) : []
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [touched, setTouched] = useState({ note: false, images: false });
    const [dragActive, setDragActive] = useState<boolean>(false);

    const isResolved = status === 'RESOLVED';
    const noteRequired = isResolved;
    const imagesRequired = isResolved;

    // Validation
    const noteError = touched.note && noteRequired && resolutionNote.length < MIN_NOTE_LENGTH
        ? `Resolution note must be at least ${MIN_NOTE_LENGTH} characters`
        : touched.note && resolutionNote.length > MAX_NOTE_LENGTH
            ? `Resolution note must not exceed ${MAX_NOTE_LENGTH} characters`
            : '';

    const totalImages = images.length + currentExistingImages.length;

    const imagesError = touched.images && imagesRequired && totalImages === 0
        ? 'At least one image is required for resolved status'
        : totalImages > MAX_IMAGES
            ? `Maximum ${MAX_IMAGES} images allowed`
            : '';

    const isValid = () => {
        if (noteRequired && (resolutionNote.length < MIN_NOTE_LENGTH || resolutionNote.length > MAX_NOTE_LENGTH)) {
            return false;
        }
        if (imagesRequired && (images.length + currentExistingImages.length) === 0) {
            return false;
        }
        if ((images.length + currentExistingImages.length) > MAX_IMAGES) {
            return false;
        }
        return true;
    };

    // Handle file selection
    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files) return;

        const newImages: ImagePreview[] = [];
        const errors: string[] = [];

        Array.from(files).forEach((file) => {
            // Check file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`);
                return;
            }

            // Check file size
            if (file.size > MAX_IMAGE_SIZE) {
                errors.push(`${file.name}: File size exceeds 5MB limit.`);
                return;
            }

            // Check total count
            if (images.length + currentExistingImages.length + newImages.length >= MAX_IMAGES) {
                errors.push(`Maximum ${MAX_IMAGES} images allowed.`);
                return;
            }

            // Create preview
            const preview = URL.createObjectURL(file);
            newImages.push({ file, preview });
        });

        if (errors.length > 0) {
            setError(errors.join(' '));
            setTimeout(() => setError(''), 5000);
        }

        if (newImages.length > 0) {
            setImages((prev) => [...prev, ...newImages]);
            setTouched({ ...touched, images: true });
        }
    }, [images.length, touched]);

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    }, [handleFileSelect]);

    // Remove image
    const handleRemoveImage = (index: number) => {
        setImages((prev) => {
            const newImages = [...prev];
            // Revoke object URL to free memory
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    // Remove existing image
    const handleRemoveExistingImage = (index: number) => {
        setCurrentExistingImages((prev) => {
            const newImages = [...prev];
            newImages.splice(index, 1);
            return newImages;
        });
    };

    // Handle submit
    const handleSubmit = async () => {
        // Validate
        setTouched({ note: true, images: true });

        if (!isValid()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('status', status);

            if (resolutionNote.trim()) {
                formData.append('resolutionNote', resolutionNote.trim());
            }

            if (currentExistingImages.length > 0) {
                formData.append('resolutionImages', currentExistingImages.join(','));
            }

            images.forEach((image) => {
                formData.append('resolutionImages', image.file);
            });

            // Get token
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            // Make API call
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/admin/complaints/${complaintId}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response received:', text.substring(0, 200));
                throw new Error('Server returned an invalid response. Please check if the backend server is running.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update complaint status');
            }

            // Success
            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error('Error updating status:', err);
            setError(err.message || 'Failed to update complaint status');
        } finally {
            setLoading(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (loading) return;

        // Cleanup object URLs
        images.forEach((image) => {
            URL.revokeObjectURL(image.preview);
        });

        setResolutionNote('');
        setImages([]);
        setCurrentExistingImages(existingImages ? existingImages.split(',').filter(url => url.trim()) : []);
        setError('');
        setTouched({ note: false, images: false });
        setDragActive(false);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 2,
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 2,
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
                Mark as {status === 'RESOLVED' ? 'Resolved' : 'In Progress'}
                <IconButton
                    onClick={handleClose}
                    disabled={loading}
                    size="small"
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, pb: 2 }}>
                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Image Upload Section */}
                    <Grid size={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Upload Images {imagesRequired && <span style={{ color: theme.palette.error.main }}>*</span>}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            {imagesRequired
                                ? 'At least 1 image required, maximum 5 images, 5MB each'
                                : 'Optional: Maximum 5 images, 5MB each'}
                        </Typography>

                        {/* Drag & Drop Area */}
                        <Box
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            sx={{
                                border: '2px dashed',
                                borderColor: dragActive
                                    ? 'primary.main'
                                    : imagesError
                                        ? 'error.main'
                                        : '#ccc',
                                borderRadius: 2,
                                p: 3,
                                textAlign: 'center',
                                bgcolor: dragActive ? 'action.hover' : 'background.paper',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover',
                                },
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileInputChange}
                                style={{ display: 'none' }}
                                disabled={loading}
                            />
                            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body1" color="text.secondary">
                                Drag & drop images here, or click to select
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                JPEG, PNG, WebP (max 5MB each)
                            </Typography>
                        </Box>

                        {imagesError && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                {imagesError}
                            </Typography>
                        )}

                        {/* Existing Images Display */}
                        {currentExistingImages.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                    Existing Images:
                                </Typography>
                                <ImageList
                                    sx={{ width: '100%', height: 'auto' }}
                                    cols={isMobile ? 3 : 4}
                                    rowHeight={100}
                                    gap={8}
                                >
                                    {currentExistingImages.map((url, index) => (
                                        <ImageListItem key={`existing-${index}`}>
                                            <img
                                                src={url}
                                                alt={`Existing ${index + 1}`}
                                                loading="lazy"
                                                style={{
                                                    height: 100,
                                                    objectFit: 'cover',
                                                    borderRadius: 8,
                                                }}
                                            />
                                            <ImageListItemBar
                                                sx={{
                                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                                                    borderRadius: '8px 8px 0 0',
                                                }}
                                                position="top"
                                                actionIcon={
                                                    <IconButton
                                                        sx={{ color: 'white' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveExistingImage(index);
                                                        }}
                                                        size="small"
                                                        disabled={loading}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                }
                                                actionPosition="right"
                                            />
                                        </ImageListItem>
                                    ))}
                                </ImageList>
                            </Box>
                        )}

                        {/* Image Previews (New) */}
                        {images.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <ImageList
                                    sx={{ width: '100%', height: 'auto' }}
                                    cols={isMobile ? 2 : 3}
                                    gap={8}
                                >
                                    {images.map((image, index) => (
                                        <ImageListItem key={index}>
                                            <img
                                                src={image.preview}
                                                alt={`Preview ${index + 1}`}
                                                loading="lazy"
                                                style={{
                                                    height: 150,
                                                    objectFit: 'cover',
                                                    borderRadius: 8,
                                                }}
                                            />
                                            <ImageListItemBar
                                                sx={{
                                                    background:
                                                        'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
                                                    borderRadius: '8px 8px 0 0',
                                                }}
                                                position="top"
                                                actionIcon={
                                                    <IconButton
                                                        sx={{ color: 'white' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveImage(index);
                                                        }}
                                                        disabled={loading}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                }
                                                actionPosition="right"
                                            />
                                        </ImageListItem>
                                    ))}
                                </ImageList>
                            </Box>
                        )}
                        {/* Count Display */}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {images.length + currentExistingImages.length} / {MAX_IMAGES} images selected
                        </Typography>

                    </Grid>

                    {/* Resolution Note */}
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            label={`Resolution Note ${noteRequired ? '*' : '(Optional)'}`}
                            multiline
                            rows={4}
                            value={resolutionNote}
                            onChange={(e) => {
                                setResolutionNote(e.target.value);
                                setTouched({ ...touched, note: true });
                            }}
                            disabled={loading}
                            placeholder={
                                isResolved
                                    ? 'Describe how the complaint was resolved...'
                                    : 'Add any notes about the progress...'
                            }
                            error={!!noteError}
                            helperText={
                                noteError || `${resolutionNote.length}/${MAX_NOTE_LENGTH} characters${noteRequired ? ` (minimum ${MIN_NOTE_LENGTH})` : ''
                                }`
                            }
                            inputProps={{ maxLength: MAX_NOTE_LENGTH }}
                            required={noteRequired}
                        />
                    </Grid>

                    {/* Info Box */}
                    <Grid size={12}>
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: isResolved ? 'success.lighter' : 'info.lighter',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: isResolved ? 'success.light' : 'info.light',
                            }}
                        >
                            <Typography variant="body2" color={isResolved ? 'success.dark' : 'info.dark'}>
                                <strong>Note:</strong> {isResolved ? (
                                    <>
                                        This complaint will be marked as <strong>Resolved</strong>. The user will receive a notification with your resolution images and notes. They will be able to submit a review after viewing the resolution.
                                    </>
                                ) : (
                                    <>
                                        This complaint will be marked as <strong>In Progress</strong>. The user will receive a notification that their complaint is being processed.
                                    </>
                                )}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions
                sx={{
                    borderTop: '1px solid #e0e0e0',
                    px: 3,
                    py: 2,
                    gap: 1.5,
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    '& > button': {
                        width: { xs: '100%', sm: 'auto' },
                        minHeight: { xs: 48, sm: 36 },
                    },
                }}
            >
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    color="inherit"
                    variant="outlined"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color={isResolved ? 'success' : 'primary'}
                    disabled={loading || !isValid()}
                    startIcon={loading ? undefined : <ImageIcon />}
                >
                    {loading
                        ? 'Updating...'
                        : isResolved
                            ? 'Mark as Resolved'
                            : 'Mark as In Progress'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StatusUpdateModal;
