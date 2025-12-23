import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid
} from '@mui/material';
import { Close, CloudUpload, Delete, Image as ImageIcon } from '@mui/icons-material';
import { Complaint, ComplaintStatus } from '../../types/complaint-service.types';

interface EditResolutionModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: { status: ComplaintStatus; note: string; existingImages: string[]; newImages: File[]; category?: string; subcategory?: string }) => Promise<void>;
    complaint: Complaint;
    type: 'RESOLVED' | 'OTHERS'; // Context of what we are editing
    loading?: boolean;
}

// Category types matching backend API
type OthersCategory = 'CORPORATION_INTERNAL' | 'CORPORATION_EXTERNAL';

// Category display configuration
const CATEGORIES: Record<OthersCategory, { label: string; description: string }> = {
    CORPORATION_INTERNAL: {
        label: 'Corporation Internal',
        description: 'Issues within city corporation jurisdiction handled by specific departments',
    },
    CORPORATION_EXTERNAL: {
        label: 'Corporation External',
        description: 'Issues outside city corporation jurisdiction handled by external agencies',
    },
};

// Subcategories matching backend validation
const SUB_CATEGORIES: Record<OthersCategory, string[]> = {
    CORPORATION_INTERNAL: [
        'Engineering',
        'Electricity',
        'Health',
        'Property (Eviction)',
    ],
    CORPORATION_EXTERNAL: [
        'WASA',
        'Titas',
        'DPDC',
        'DESCO',
        'BTCL',
        'Fire Service',
        'Others',
    ],
};

export const EditResolutionModal: React.FC<EditResolutionModalProps> = ({
    open,
    onClose,
    onSave,
    complaint,
    type,
    loading = false
}) => {
    const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
    const [note, setNote] = useState(complaint.resolutionNote || '');
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

    // Others fields
    const [category, setCategory] = useState<string>('');
    const [subcategory, setSubcategory] = useState<string>('');

    useEffect(() => {
        if (open) {
            setStatus(complaint.status);
            setNote(complaint.resolutionNote || '');

            // Initialize category/subcategory if present (likely stored in complaint root or metadata)
            // Assuming complaint has category/subcategory fields on root as per typical design
            setCategory(complaint.category || '');
            setSubcategory(complaint.subcategory || '');

            if (complaint.resolutionImages) {
                setExistingImages(complaint.resolutionImages.split(',').filter(url => url.trim()));
            } else {
                setExistingImages([]);
            }
            setNewImages([]);
            setNewImagePreviews([]);
        }
    }, [open, complaint]);

    const handleCategoryChange = (val: string) => {
        setCategory(val);
        setSubcategory(''); // Reset sub-category when category changes
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const newFiles = [...newImages, ...files];
            setNewImages(newFiles);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setNewImagePreviews([...newImagePreviews, ...newPreviews]);
        }
    };

    const handleRemoveExistingImage = (indexToRemove: number) => {
        setExistingImages(existingImages.filter((_, index) => index !== indexToRemove));
    };

    const handleRemoveNewImage = (indexToRemove: number) => {
        setNewImages(newImages.filter((_, index) => index !== indexToRemove));
        URL.revokeObjectURL(newImagePreviews[indexToRemove]);
        setNewImagePreviews(newImagePreviews.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = async () => {
        try {
            await onSave({
                status,
                note,
                existingImages,
                newImages,
                category: status === 'OTHERS' ? category : undefined,
                subcategory: status === 'OTHERS' ? subcategory : undefined
            });
            onClose();
        } catch (error) {
            console.error('Failed to save resolution changes:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Edit {type === 'RESOLVED' ? 'Resolution' : 'Others'} Details
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                    {/* Status Selection */}
                    <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={status}
                            label="Status"
                            onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                        >
                            <MenuItem value="RESOLVED">RESOLVED</MenuItem>
                            <MenuItem value="OTHERS">OTHERS</MenuItem>
                            <MenuItem value="IN_PROGRESS">IN PROGRESS</MenuItem>
                            <MenuItem value="PENDING">PENDING</MenuItem>
                        </Select>
                    </FormControl>

                    {/* OTHERS Specific Fields */}
                    {status === 'OTHERS' && (
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={category}
                                        label="Category"
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                    >
                                        {Object.entries(CATEGORIES).map(([key, config]) => (
                                            <MenuItem key={key} value={key}>
                                                {config.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth required disabled={!category}>
                                    <InputLabel>Sub Category</InputLabel>
                                    <Select
                                        value={subcategory}
                                        label="Sub Category"
                                        onChange={(e) => setSubcategory(e.target.value)}
                                    >
                                        {category && SUB_CATEGORIES[category as OthersCategory]?.map((sub) => (
                                            <MenuItem key={sub} value={sub}>
                                                {sub}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}

                    {/* Note Input */}
                    <TextField
                        label={status === 'RESOLVED' ? 'Resolution Note' : 'Admin Note'}
                        multiline
                        rows={4}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={status === 'RESOLVED' ? "Enter resolution details (min 20 chars)..." : "Enter note here..."}
                        fullWidth
                        error={status === 'RESOLVED' && note.length < 20}
                        helperText={status === 'RESOLVED' && note.length < 20 ? `Note must be at least 20 characters (${note.length}/20)` : ''}
                    />

                    {/* Images Section */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Images
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {/* Existing Images */}
                            {existingImages.map((url, index) => (
                                <Box key={`existing-${index}`} sx={{ position: 'relative', width: 80, height: 80 }}>
                                    <img
                                        src={url}
                                        alt={`Existing ${index}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                                    />
                                    <IconButton
                                        size="small"
                                        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.light', color: 'white' } }}
                                        onClick={() => handleRemoveExistingImage(index)}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}

                            {/* New Images */}
                            {newImagePreviews.map((url, index) => (
                                <Box key={`new-${index}`} sx={{ position: 'relative', width: 80, height: 80 }}>
                                    <img
                                        src={url}
                                        alt={`New ${index}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, opacity: 0.8 }}
                                    />
                                    <IconButton
                                        size="small"
                                        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.light', color: 'white' } }}
                                        onClick={() => handleRemoveNewImage(index)}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}

                            {/* Upload Button */}
                            <Button
                                variant="outlined"
                                component="label"
                                sx={{ width: 80, height: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 1, borderStyle: 'dashed' }}
                            >
                                <CloudUpload />
                                <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
                            </Button>
                        </Box>
                        {status === 'RESOLVED' && existingImages.length === 0 && newImages.length === 0 && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                At least one image is required for RESOLVED status.
                            </Typography>
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={
                        loading ||
                        (status === 'RESOLVED' && (note.length < 20 || (existingImages.length === 0 && newImages.length === 0))) ||
                        (status === 'OTHERS' && (!category || !subcategory))
                    }
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
