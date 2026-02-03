import React, { useState } from 'react';
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
    CircularProgress,
    Stack
} from '@mui/material';
import { CloudUpload as UploadIcon, Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface ResolveComplaintModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (note: string, file: File) => void;
    loading?: boolean;
}

const ResolveComplaintModal: React.FC<ResolveComplaintModalProps> = ({
    open,
    onClose,
    onConfirm,
    loading = false
}) => {
    const [note, setNote] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errors, setErrors] = useState({ note: false, file: false });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            // Validate file size (e.g., max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size too large (max 5MB)');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Only image files are allowed');
                return;
            }

            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, file: false }));
        }
    };

    const handleClose = () => {
        setNote('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setErrors({ note: false, file: false });
        onClose();
    };

    const handleSubmit = () => {
        const newErrors = {
            note: !note.trim(),
            file: !selectedFile
        };

        setErrors(newErrors);

        if (newErrors.note || newErrors.file) {
            return;
        }

        if (selectedFile) {
            onConfirm(note, selectedFile);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Mark Complaint as Solved</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <Box
                        sx={{
                            border: '2px dashed #ccc',
                            borderRadius: 2,
                            p: 3,
                            textAlign: 'center',
                            cursor: loading ? 'default' : 'pointer',
                            bgcolor: errors.file ? 'rgba(211, 47, 47, 0.05)' : 'transparent',
                            borderColor: errors.file ? '#d32f2f' : '#ccc',
                            '&:hover': {
                                borderColor: loading ? '#ccc' : '#2196f3',
                                bgcolor: loading ? undefined : 'rgba(33, 150, 243, 0.05)'
                            }
                        }}
                        onClick={() => !loading && document.getElementById('resolve-image-upload')?.click()}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            id="resolve-image-upload"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            disabled={loading}
                        />

                        {previewUrl ? (
                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: 200,
                                        borderRadius: 8
                                    }}
                                />
                                {!loading && (
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: -10,
                                            right: -10,
                                            bgcolor: 'white',
                                            border: '1px solid #ddd',
                                            '&:hover': { bgcolor: '#f5f5f5' }
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        ) : (
                            <>
                                <UploadIcon sx={{ fontSize: 48, color: errors.file ? '#d32f2f' : '#9e9e9e', mb: 1 }} />
                                <Typography color={errors.file ? 'error' : 'textSecondary'}>
                                    Upload Proof of Resolution (Required)
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block">
                                    Click to select image
                                </Typography>
                            </>
                        )}
                    </Box>

                    <TextField
                        label="Admin Note"
                        multiline
                        rows={3}
                        value={note}
                        onChange={(e) => {
                            setNote(e.target.value);
                            setErrors(prev => ({ ...prev, note: false }));
                        }}
                        required
                        error={errors.note}
                        helperText={errors.note ? "Note is required" : "Please describe the solution"}
                        disabled={loading}
                        fullWidth
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                    {loading ? 'Submitting...' : 'Mark as Solved'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ResolveComplaintModal;


