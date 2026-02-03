import React, { useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    IconButton,
    CircularProgress,
    Box,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { useForm, Controller } from 'react-hook-form';
import type { BotMessageConfig } from '../../types/bot-message.types';

interface BotMessageModalProps {
    open: boolean;
    message: BotMessageConfig | null;
    onClose: () => void;
    onSave: (data: BotMessageFormData) => Promise<void>;
    saving?: boolean;
}

interface BotMessageFormData {
    messageKey: string;
    content: string;
    contentBn: string;
    stepNumber: number;
}

/**
 * Bot Message Modal Component
 * Modal for creating/editing bot messages
 */
const BotMessageModal: React.FC<BotMessageModalProps> = ({
    open,
    message,
    onClose,
    onSave,
    saving = false,
}) => {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<BotMessageFormData>({
        defaultValues: {
            messageKey: '',
            content: '',
            contentBn: '',
            stepNumber: 1,
        },
    });

    /**
     * Reset form when message changes
     */
    useEffect(() => {
        if (message) {
            reset({
                messageKey: message.messageKey,
                content: message.content,
                contentBn: message.contentBn,
                stepNumber: message.stepNumber,
            });
        } else {
            reset({
                messageKey: '',
                content: '',
                contentBn: '',
                stepNumber: 1,
            });
        }
    }, [message, reset]);

    /**
     * Handle form submit
     */
    const onSubmit = async (data: BotMessageFormData) => {
        await onSave(data);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: 24,
                },
            }}
        >
            <DialogTitle sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h5" fontWeight={700}>
                        {message ? 'Edit Bot Message' : 'Add Bot Message'}
                    </Typography>
                    <IconButton
                        edge="end"
                        onClick={onClose}
                        disabled={saving}
                        size="small"
                        sx={{
                            '&:hover': {
                                bgcolor: 'action.hover',
                                transform: 'rotate(90deg)',
                            },
                            transition: 'all 0.2s',
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent dividers>
                    <Stack spacing={3}>
                        {/* Message Key */}
                        <Controller
                            name="messageKey"
                            control={control}
                            rules={{
                                required: 'Message key is required',
                                pattern: {
                                    value: /^[a-z0-9_-]+$/,
                                    message: 'Only lowercase letters, numbers, hyphens, and underscores allowed',
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Message Key"
                                    placeholder="e.g., welcome_message"
                                    error={!!errors.messageKey}
                                    helperText={
                                        errors.messageKey?.message ||
                                        'Unique identifier for this message (lowercase, no spaces)'
                                    }
                                    disabled={saving || !!message}
                                    fullWidth
                                    required
                                />
                            )}
                        />

                        {/* Step Number */}
                        <Controller
                            name="stepNumber"
                            control={control}
                            rules={{
                                required: 'Step number is required',
                                min: { value: 1, message: 'Step number must be at least 1' },
                                max: { value: 100, message: 'Step number cannot exceed 100' },
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="number"
                                    label="Step Number"
                                    error={!!errors.stepNumber}
                                    helperText={
                                        errors.stepNumber?.message ||
                                        'Order in which this message appears (1-100) - Bot will loop through all steps dynamically'
                                    }
                                    disabled={saving}
                                    fullWidth
                                    required
                                    inputProps={{ min: 1, max: 100 }}
                                />
                            )}
                        />

                        {/* English Content */}
                        <Controller
                            name="content"
                            control={control}
                            rules={{
                                required: 'English content is required',
                                validate: {
                                    notEmpty: (value) => value.trim().length > 0 || 'Content cannot be empty or whitespace only',
                                    minLength: (value) => value.trim().length >= 10 || 'Content must be at least 10 characters',
                                },
                                maxLength: {
                                    value: 500,
                                    message: 'Content cannot exceed 500 characters',
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="English Content"
                                    placeholder="Enter message in English"
                                    error={!!errors.content}
                                    helperText={
                                        errors.content?.message ||
                                        `${field.value.length}/500 characters`
                                    }
                                    disabled={saving}
                                    fullWidth
                                    required
                                    multiline
                                    rows={4}
                                />
                            )}
                        />

                        {/* Bangla Content */}
                        <Controller
                            name="contentBn"
                            control={control}
                            rules={{
                                required: 'Bangla content is required',
                                validate: {
                                    notEmpty: (value) => value.trim().length > 0 || 'Content cannot be empty or whitespace only',
                                    minLength: (value) => value.trim().length >= 10 || 'Content must be at least 10 characters',
                                },
                                maxLength: {
                                    value: 500,
                                    message: 'Content cannot exceed 500 characters',
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Bangla Content (বাংলা)"
                                    placeholder="বাংলায় বার্তা লিখুন"
                                    error={!!errors.contentBn}
                                    helperText={
                                        errors.contentBn?.message ||
                                        `${field.value.length}/500 characters`
                                    }
                                    disabled={saving}
                                    fullWidth
                                    required
                                    multiline
                                    rows={4}
                                />
                            )}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        disabled={saving}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        disabled={saving}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                            boxShadow: 2,
                            '&:hover': {
                                boxShadow: 4,
                            }
                        }}
                    >
                        {saving ? 'Saving...' : message ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default BotMessageModal;


