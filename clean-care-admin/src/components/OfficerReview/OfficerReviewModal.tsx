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
    Avatar,
    CircularProgress,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import {
    Close as CloseIcon,
    CloudUpload as UploadIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
} from '@mui/icons-material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import officerReviewService from '../../services/officerReviewService';
import { OfficerReview, CreateOfficerReviewDto } from '../../types/officer-review.types';

interface MessageForm {
    content: string;
    contentBn: string;
    displayOrder: number;
}

// Sortable Message Item Component
interface SortableMessageItemProps {
    message: MessageForm;
    index: number;
    onMessageChange: (index: number, field: keyof MessageForm, value: string) => void;
    onRemoveMessage: (index: number) => void;
    messagesLength: number;
}

const SortableMessageItem: React.FC<SortableMessageItemProps> = ({
    message,
    index,
    onMessageChange,
    onRemoveMessage,
    messagesLength,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `message-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            sx={{
                mb: 2,
                boxShadow: isDragging
                    ? '0 8px 24px rgba(0,0,0,0.15)'
                    : '0 2px 8px rgba(0,0,0,0.06)',
            }}
        >
            <CardContent>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                    }}
                >
                    <Box
                        {...attributes}
                        {...listeners}
                        sx={{
                            cursor: 'grab',
                            pt: 1,
                            '&:active': { cursor: 'grabbing' },
                        }}
                    >
                        <DragIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <TextField
                            fullWidth
                            label="Message (English)"
                            value={message.content}
                            onChange={(e) =>
                                onMessageChange(
                                    index,
                                    'content',
                                    e.target.value
                                )
                            }
                            multiline
                            rows={2}
                            required
                            sx={{ mb: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="Message (Bangla)"
                            value={message.contentBn}
                            onChange={(e) =>
                                onMessageChange(
                                    index,
                                    'contentBn',
                                    e.target.value
                                )
                            }
                            multiline
                            rows={2}
                        />
                    </Box>
                    <IconButton
                        onClick={() => onRemoveMessage(index)}
                        color="error"
                        size="small"
                        disabled={messagesLength === 1}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

interface OfficerReviewModalProps {
    open: boolean;
    review: OfficerReview | null;
    onClose: (shouldReload?: boolean) => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

const OfficerReviewModal: React.FC<OfficerReviewModalProps> = ({
    open,
    review,
    onClose,
    onSuccess,
    onError,
}) => {
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        nameBn: '',
        designation: '',
        designationBn: '',
        imageUrl: '',
    });

    const [messages, setMessages] = useState<MessageForm[]>([
        { content: '', contentBn: '', displayOrder: 0 },
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (review) {
            setFormData({
                name: review.name,
                nameBn: review.nameBn || '',
                designation: review.designation,
                designationBn: review.designationBn || '',
                imageUrl: review.imageUrl || '',
            });
            setMessages(
                review.messages.map((msg) => ({
                    content: msg.content,
                    contentBn: msg.contentBn || '',
                    displayOrder: msg.displayOrder,
                }))
            );
            setImagePreview(review.imageUrl);
        } else {
            resetForm();
        }
    }, [review, open]);

    const resetForm = () => {
        setFormData({
            name: '',
            nameBn: '',
            designation: '',
            designationBn: '',
            imageUrl: '',
        });
        setMessages([{ content: '', contentBn: '', displayOrder: 0 }]);
        setImageFile(null);
        if (imagePreview && !imagePreview.startsWith('http')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            onError('Please select a valid image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            onError('Image size should be less than 5MB');
            return;
        }

        setImageFile(file);
        if (imagePreview && !imagePreview.startsWith('http')) {
            URL.revokeObjectURL(imagePreview);
        }
        const preview = URL.createObjectURL(file);
        setImagePreview(preview);
    };

    const handleUploadImage = async () => {
        if (!imageFile) return;

        try {
            setUploadingImage(true);
            const imageUrl = await officerReviewService.uploadImage(imageFile);
            setFormData({ ...formData, imageUrl });
            setImagePreview(imageUrl);
            setImageFile(null);
            onSuccess('Image uploaded successfully!');
        } catch (err: any) {
            onError(err.message || 'Failed to upload image');
            setImagePreview(null);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        if (imagePreview && !imagePreview.startsWith('http')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        setFormData({ ...formData, imageUrl: '' });
    };

    const handleAddMessage = () => {
        setMessages([
            ...messages,
            { content: '', contentBn: '', displayOrder: messages.length },
        ]);
    };

    const handleRemoveMessage = (index: number) => {
        if (messages.length === 1) {
            onError('At least one message is required');
            return;
        }
        setMessages(messages.filter((_, i) => i !== index));
    };

    const handleMessageChange = (index: number, field: keyof MessageForm, value: string) => {
        const updated = [...messages];
        updated[index] = { ...updated[index], [field]: value };
        setMessages(updated);
    };

    const handleMessageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = messages.findIndex((_, i) => `message-${i}` === active.id);
        const newIndex = messages.findIndex((_, i) => `message-${i}` === over.id);

        const items = arrayMove(messages, oldIndex, newIndex);

        // Update display orders
        const updated = items.map((item, index) => ({
            ...item,
            displayOrder: index,
        }));
        setMessages(updated);
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.name.trim()) {
            onError('Officer name is required');
            return;
        }
        if (!formData.designation.trim()) {
            onError('Designation is required');
            return;
        }
        if (messages.some((msg) => !msg.content.trim())) {
            onError('All messages must have content');
            return;
        }

        try {
            setLoading(true);

            const data: CreateOfficerReviewDto = {
                name: formData.name,
                nameBn: formData.nameBn || undefined,
                designation: formData.designation,
                designationBn: formData.designationBn || undefined,
                imageUrl: formData.imageUrl || null,
                messages: messages.map((msg, index) => ({
                    content: msg.content,
                    contentBn: msg.contentBn || undefined,
                    displayOrder: index,
                })),
            };

            if (review) {
                await officerReviewService.update(review.id, data);
                onSuccess('Officer review updated successfully!');
            } else {
                await officerReviewService.create(data);
                onSuccess('Officer review created successfully!');
            }

            onClose(true);
        } catch (err: any) {
            onError(err.message || 'Failed to save officer review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => onClose(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 },
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">
                        {review ? 'Edit Officer Review' : 'Add Officer Review'}
                    </Typography>
                    <IconButton onClick={() => onClose(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Image Upload */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Officer Photo
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                                src={imagePreview || undefined}
                                sx={{ width: 100, height: 100 }}
                            />
                            <Box sx={{ flex: 1 }}>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="officer-image-upload"
                                    type="file"
                                    onChange={handleImageSelect}
                                />
                                <label htmlFor="officer-image-upload">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<UploadIcon />}
                                        fullWidth
                                    >
                                        Select Image
                                    </Button>
                                </label>
                                {imageFile && (
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleUploadImage}
                                            disabled={uploadingImage}
                                            fullWidth
                                        >
                                            {uploadingImage ? <CircularProgress size={20} /> : 'Upload'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={handleRemoveImage}
                                            color="error"
                                        >
                                            Remove
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Officer Details */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Name (English)"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Name (Bangla)"
                                value={formData.nameBn}
                                onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Designation (English)"
                                value={formData.designation}
                                onChange={(e) =>
                                    setFormData({ ...formData, designation: e.target.value })
                                }
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Designation (Bangla)"
                                value={formData.designationBn}
                                onChange={(e) =>
                                    setFormData({ ...formData, designationBn: e.target.value })
                                }
                            />
                        </Grid>
                    </Grid>

                    {/* Messages */}
                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 2,
                            }}
                        >
                            <Typography variant="subtitle2">Messages</Typography>
                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleAddMessage}
                                variant="outlined"
                            >
                                Add Message
                            </Button>
                        </Box>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleMessageDragEnd}
                        >
                            <SortableContext
                                items={messages.map((_, i) => `message-${i}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                {messages.map((message, index) => (
                                    <SortableMessageItem
                                        key={`message-${index}`}
                                        message={message}
                                        index={index}
                                        onMessageChange={handleMessageChange}
                                        onRemoveMessage={handleRemoveMessage}
                                        messagesLength={messages.length}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => onClose(false)} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {review ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default OfficerReviewModal;


