import React, { useState, useRef } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import {
    Box,
    TextField,
    IconButton,
    CircularProgress,
    Tooltip,
    Paper,
} from '@mui/material';
import {
    Send as SendIcon,
    Image as ImageIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_CONFIG } from '../../config/apiConfig';
import { compressImage, validateImageFile, blobToFile } from '../../utils/imageOptimization';

interface MessageInputProps {
    onSend: (message: string, imageUrl?: string) => Promise<void>;
    onSendWithFile?: (message: string, imageFile: File) => Promise<void>;
    sending: boolean;
    disabled?: boolean;
}

/**
 * MessageInput Component
 * Provides input area for sending text messages and images in chat conversations
 * Features:
 * - Multiline text input with auto-resize
 * - Image upload with preview
 * - Enter to send (Shift+Enter for new line)
 * - Send button with loading state
 * - Character count (optional)
 * - Error handling with toast notifications
 */
const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    onSendWithFile,
    sending,
    disabled = false,
}) => {
    // State management
    const [text, setText] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textFieldRef = useRef<HTMLInputElement>(null);

    /**
     * Handle text input change
     */
    const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
        setText(event.target.value);
    };

    /**
     * Handle image file selection
     */
    const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        // Validate file
        const validation = validateImageFile(file, 5);
        if (!validation.valid) {
            toast.error(validation.error || 'Invalid image file', {
                icon: '❌',
            });
            return;
        }

        try {
            // Show loading toast
            const loadingToast = toast.loading('Compressing image...');

            // Compress image before upload
            const compressedBlob = await compressImage(file, 1920, 1080, 0.8);
            const compressedFile = blobToFile(compressedBlob, file.name);

            // Calculate compression ratio
            const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(0);

            toast.dismiss(loadingToast);

            if (compressedFile.size < file.size) {
                toast.success(`Image compressed by ${compressionRatio}%`, {
                    icon: '✅',
                    duration: 2000,
                });
            }

            // Set file and create preview
            setImageFile(compressedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);

            // Upload compressed image
            uploadImage(compressedFile);
        } catch (error) {
            console.error('Error compressing image:', error);
            toast.error('Failed to process image. Please try again.', {
                icon: '❌',
            });
        }
    };

    /**
     * Upload image to server
     * Note: We don't actually upload here anymore - we'll send the file
     * directly with the message to let the backend handle Cloudinary upload
     */
    const uploadImage = async (file: File) => {
        try {
            setUploading(true);

            // Just mark as ready - we'll send the file with the message
            setUploadedImageUrl('READY_TO_SEND'); // Placeholder to indicate file is ready

            toast.success('Image ready to send', {
                icon: '✅',
                duration: 2000,
            });
        } catch (error) {
            console.error('Error processing image:', error);
            toast.error('Failed to process image. Please try again.', {
                icon: '❌',
            });
            // Clear image on error
            handleRemoveImage();
        } finally {
            setUploading(false);
        }
    };

    /**
     * Handle remove image
     */
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setUploadedImageUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    /**
     * Handle send message
     */
    const handleSend = async () => {
        // Validate input - CRITICAL: Check both text and image
        const trimmedText = text.trim();

        console.log('🔍 Validation check:', {
            text: text,
            trimmedText: trimmedText,
            uploadedImageUrl: uploadedImageUrl,
            imageFile: imageFile?.name,
            hasText: !!trimmedText,
            hasImage: !!uploadedImageUrl
        });

        // MUST have either text OR image
        if (!trimmedText && !uploadedImageUrl) {
            console.error('❌ Validation failed: No text and no image');
            toast.error('Please enter a message or select an image', {
                icon: '⚠️',
                duration: 3000,
            });
            return;
        }

        // Ensure image is uploaded before sending
        if (imageFile && !uploadedImageUrl) {
            console.error('❌ Validation failed: Image not uploaded yet');
            toast.error('Please wait for image to finish uploading', {
                icon: '⏳',
            });
            return;
        }

        try {
            console.log('📤 Sending message with image file:', imageFile?.name);
            console.log('📤 onSendWithFile available:', !!onSendWithFile);

            // If there's an image file, we need to send it differently
            if (imageFile && onSendWithFile) {
                console.log('✅ Using onSendWithFile for file:', imageFile.name);
                // Send with file upload
                await onSendWithFile(trimmedText || 'Image', imageFile);
            } else if (imageFile && !onSendWithFile) {
                console.error('❌ onSendWithFile not available!');
                console.error('❌ This means ChatConversationPanel did not pass onSendWithFile prop');
                toast.error('Cannot send image - feature not available', {
                    icon: '❌',
                });
                return; // Don't send at all
            } else {
                console.log('✅ Sending text only (no image)');
                console.log('✅ Text content:', trimmedText);
                // Send text only - ONLY if we have text
                if (trimmedText) {
                    await onSend(trimmedText, undefined);
                } else {
                    console.error('❌ Cannot send: No text content');
                    toast.error('Please enter a message', {
                        icon: '⚠️',
                        duration: 3000,
                    });
                    return;
                }
            }

            // Clear input after successful send
            setText('');
            handleRemoveImage();

            // Focus back on text field
            textFieldRef.current?.focus();
        } catch (error) {
            // Error is handled by parent component
            console.error('❌ Error sending message:', error);
        }
    };

    /**
     * Handle Enter key down
     * Enter: Send message
     * Shift+Enter: New line
     */
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            console.log('⌨️ Enter key pressed');

            // Validate input before sending
            const trimmedText = text.trim();

            console.log('🔍 Enter validation:', {
                text: text,
                trimmedText: trimmedText,
                uploadedImageUrl: uploadedImageUrl,
                hasText: !!trimmedText,
                hasImage: !!uploadedImageUrl
            });

            if (!trimmedText && !uploadedImageUrl) {
                console.error('❌ Enter validation failed: No text and no image');
                toast.error('Please enter a message or select an image', {
                    icon: '⚠️',
                    duration: 2000,
                });
                return;
            }

            if (!sending && !uploading && !disabled) {
                console.log('✅ Enter validation passed, calling handleSend');
                handleSend();
            } else {
                console.log('⏸️ Cannot send: sending=', sending, 'uploading=', uploading, 'disabled=', disabled);
            }
        }
    };

    /**
     * Handle image upload button click
     */
    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Check if send button should be disabled
    const isSendDisabled =
        disabled ||
        sending ||
        uploading ||
        (!text.trim() && !uploadedImageUrl);

    return (
        <Box
            sx={{
                p: 2,
                backgroundColor: '#ffffff',
                borderTop: '1px solid #f3f4f6',
            }}
        >
            {/* Image Preview */}
            {imagePreview && (
                <Paper
                    elevation={0}
                    sx={{
                        mb: 2,
                        p: 1,
                        position: 'relative',
                        display: 'inline-block',
                        maxWidth: '200px',
                        borderRadius: 3,
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        component="img"
                        src={imagePreview}
                        alt="Preview"
                        sx={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '150px',
                            objectFit: 'cover',
                            borderRadius: 2,
                        }}
                    />

                    {/* Remove button */}
                    <IconButton
                        size="small"
                        onClick={handleRemoveImage}
                        disabled={uploading}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>

                    {/* Uploading indicator */}
                    {uploading && (
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
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            }}
                        >
                            <CircularProgress size={24} />
                        </Box>
                    )}
                </Paper>
            )}

            {/* Input Area */}
            <Box sx={{ 
                display: 'flex', 
                gap: 1.5, 
                alignItems: 'flex-end',
                bgcolor: '#f9fafb',
                p: 1.5,
                borderRadius: '24px', // Pill shape
                border: '1px solid #e5e7eb',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:focus-within': {
                    borderColor: '#3fa564',
                    boxShadow: '0 0 0 3px rgba(63, 165, 100, 0.1)'
                }
            }}>
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                />

                {/* Image upload button */}
                <Tooltip title="ছবি সংযুক্ত করুন">
                    <IconButton
                        onClick={handleImageButtonClick}
                        disabled={disabled || sending || uploading || !!imageFile}
                        sx={{
                            color: '#6b7280',
                            '&:hover': { color: '#3fa564', bgcolor: '#f0fdf4' },
                            p: 1
                        }}
                    >
                        <ImageIcon />
                    </IconButton>
                </Tooltip>

                {/* Text input */}
                <TextField
                    inputRef={textFieldRef}
                    fullWidth
                    multiline
                    maxRows={6} // Increased max rows
                    placeholder="Type a message..."
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || sending}
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                    }}
                    sx={{
                        '& .MuiInputBase-root': {
                            fontSize: '1rem', // Larger font
                            py: 1, // More vertical padding
                            color: '#1f2937',
                            lineHeight: 1.5
                        },
                    }}
                />

                {/* Send button */}
                <Tooltip title={sending ? 'পাঠানো হচ্ছে...' : 'পাঠান (Enter)'}>
                    <IconButton
                        onClick={handleSend}
                        disabled={isSendDisabled}
                        sx={{
                            backgroundColor: isSendDisabled ? '#e5e7eb' : '#3fa564',
                            color: 'white',
                            width: 40,
                            height: 40,
                            '&:hover': {
                                backgroundColor: isSendDisabled ? '#e5e7eb' : '#15803d',
                            },
                            transition: 'all 0.2s',
                            transform: sending ? 'scale(0.9)' : 'scale(1)',
                            boxShadow: isSendDisabled ? 'none' : '0 2px 4px rgba(63, 165, 100, 0.3)'
                        }}
                    >
                        {sending ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <SendIcon fontSize="small" sx={{ ml: 0.5 }} />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Character count (optional) */}
            {text.length > 0 && (
                <Box
                    sx={{
                        mt: 1,
                        mr: 1,
                        textAlign: 'right',
                    }}
                >
                    <Box
                        component="span"
                        sx={{
                            fontSize: '0.75rem',
                            color: text.length > 1000 ? 'error.main' : 'text.secondary',
                            fontWeight: 500
                        }}
                    >
                        {text.length} / 1000
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default MessageInput;


