import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    FormHelperText,
    Typography,
    Box,
    TextField,
    useTheme,
    useMediaQuery,
    IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface MarkOthersModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (category: string, subCategory: string, note: string, images: File[]) => void;
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

const MarkOthersModal: React.FC<MarkOthersModalProps> = ({
    open,
    onClose,
    onConfirm,
    loading = false,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [selectedCategory, setSelectedCategory] = useState<OthersCategory | ''>('');
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [touched, setTouched] = useState({ category: false, subCategory: false, note: false });

    const handleCategoryChange = (val: OthersCategory) => {
        setSelectedCategory(val);
        setSelectedSubCategory(''); // Reset sub-category when category changes
        setTouched({ ...touched, category: true, subCategory: false });
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesArray = Array.from(event.target.files);
            // Limit to 5 images total
            const totalFiles = [...selectedFiles, ...filesArray].slice(0, 5);
            setSelectedFiles(totalFiles);
        }
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!selectedCategory) {
            setTouched({ ...touched, category: true });
            return;
        }

        // Validate sub-category (always required for both categories)
        if (!selectedSubCategory) {
            setTouched({ ...touched, subCategory: true });
            return;
        }

        // Validate note
        if (!note || note.length < 20) {
            setTouched({ ...touched, note: true });
            return;
        }

        onConfirm(selectedCategory, selectedSubCategory, note, selectedFiles);
    };

    const handleClose = () => {
        if (loading) return;

        setSelectedCategory('');
        setSelectedSubCategory('');
        setNote('');
        setSelectedFiles([]);
        setTouched({ category: false, subCategory: false, note: false });
        onClose();
    };

    const availableSubCategories = selectedCategory ? SUB_CATEGORIES[selectedCategory] || [] : [];

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
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
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Mark as Others
                </Typography>
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
                <Grid container spacing={3}>
                    {/* Category Selection */}
                    <Grid size={12}>
                        <FormControl
                            fullWidth
                            error={touched.category && !selectedCategory}
                            required
                        >
                            <InputLabel>Select Category</InputLabel>
                            <Select
                                value={selectedCategory}
                                label="Select Category"
                                onChange={(e) => handleCategoryChange(e.target.value as OthersCategory)}
                                disabled={loading}
                            >
                                {(Object.keys(CATEGORIES) as OthersCategory[]).map((key) => (
                                    <MenuItem key={key} value={key}>
                                        <Box>
                                            <Typography variant="body1">
                                                {CATEGORIES[key].label}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ display: 'block', mt: 0.5 }}
                                            >
                                                {CATEGORIES[key].description}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            {touched.category && !selectedCategory && (
                                <FormHelperText>Please select a category</FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    {/* Subcategory Selection */}
                    {selectedCategory && availableSubCategories.length > 0 && (
                        <Grid size={12}>
                            <FormControl
                                fullWidth
                                error={touched.subCategory && !selectedSubCategory}
                                required
                            >
                                <InputLabel>Select Department/Agency</InputLabel>
                                <Select
                                    value={selectedSubCategory}
                                    label="Select Department/Agency"
                                    onChange={(e) => {
                                        setSelectedSubCategory(e.target.value);
                                        setTouched({ ...touched, subCategory: true });
                                    }}
                                    disabled={loading}
                                >
                                    {availableSubCategories.map((sub) => (
                                        <MenuItem key={sub} value={sub}>
                                            {sub}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {touched.subCategory && !selectedSubCategory && (
                                    <FormHelperText>Please select a department/agency</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>
                    )}

                    {/* Note Field (Mandatory) */}
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            label="Note (Required)"
                            required
                            multiline
                            rows={3}
                            value={note}
                            onChange={(e) => {
                                setNote(e.target.value);
                                if (e.target.value.length >= 20) {
                                    setTouched({ ...touched, note: false });
                                }
                            }}
                            onBlur={() => setTouched({ ...touched, note: true })}
                            disabled={loading}
                            placeholder="Add reason for marking as Others (min 20 characters)..."
                            helperText={
                                touched.note && (!note || note.length < 20)
                                    ? `Minimum 20 characters required (${note.length}/20)`
                                    : `${note.length}/500 characters`
                            }
                            error={touched.note && (!note || note.length < 20)}
                            inputProps={{ maxLength: 500 }}
                        />
                    </Grid>

                    {/* Image Upload */}
                    <Grid size={12}>
                        <Box sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                Attach Images (Optional)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Max 5 images. Supported formats: JPEG, PNG, WebP.
                            </Typography>
                        </Box>

                        <input
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            id="mark-others-image-upload"
                            multiple
                            type="file"
                            onChange={handleFileSelect}
                            disabled={loading || selectedFiles.length >= 5}
                        />
                        <label htmlFor="mark-others-image-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                disabled={loading || selectedFiles.length >= 5}
                                sx={{ mb: 2 }}
                            >
                                Upload Images
                            </Button>
                        </label>

                        {/* Image Previews */}
                        {selectedFiles.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {selectedFiles.map((file, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            position: 'relative',
                                            width: 80,
                                            height: 80,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Preview ${index}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveFile(index)}
                                            sx={{
                                                position: 'absolute',
                                                top: 2,
                                                right: 2,
                                                bgcolor: 'rgba(255,255,255,0.8)',
                                                p: 0.5,
                                                '&:hover': { bgcolor: 'white' },
                                            }}
                                        >
                                            <CloseIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Grid>

                    {/* Info Box */}
                    {selectedCategory && (
                        <Grid size={12}>
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: 'info.lighter',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'info.light',
                                }}
                            >
                                <Typography variant="body2" color="info.dark">
                                    <strong>Note:</strong> This complaint will be marked as "Others" and categorized under{' '}
                                    <strong>{selectedCategory === 'CORPORATION_INTERNAL' ? 'Corporation Internal' : 'Corporation External'}</strong>
                                    {selectedSubCategory && (
                                        <>
                                            {' - '}
                                            <strong>{selectedSubCategory}</strong>
                                        </>
                                    )}
                                    . The user will be notified of this status change.
                                </Typography>
                            </Box>
                        </Grid>
                    )}
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
                    color="primary"
                    disabled={
                        loading ||
                        !selectedCategory ||
                        !selectedSubCategory ||
                        !note ||
                        note.length < 20
                    }
                >
                    {loading ? 'Marking...' : 'Mark as Others'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MarkOthersModal;


