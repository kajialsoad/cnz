import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    TextField,
    Grid,
    IconButton,
    Alert,
    CircularProgress,
    Paper,
    Avatar,
    Chip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    RecordVoiceOver as OfficerIcon,
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
import MainLayout from '../../components/common/Layout/MainLayout/MainLayout';
import OfficerReviewModal from '../../components/OfficerReview/OfficerReviewModal';
import officerReviewService from '../../services/officerReviewService';
import { OfficerReview } from '../../types/officer-review.types';
import { fadeIn, slideInUp, animationConfig, buttonHoverAnimation } from '../../styles/animations';

// Sortable Item Component
interface SortableItemProps {
    review: OfficerReview;
    onEdit: (review: OfficerReview) => void;
    onDelete: (review: OfficerReview) => void;
    onToggleActive: (review: OfficerReview) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ review, onEdit, onDelete, onToggleActive }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: review.id });

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
                borderRadius: 3,
                boxShadow: isDragging
                    ? '0 8px 24px rgba(0,0,0,0.15)'
                    : '0 4px 18px rgba(0,0,0,0.06)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                    boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                },
            }}
        >
            <CardContent>
                <Grid container spacing={2} alignItems="center">
                    <Grid>
                        <Box
                            {...attributes}
                            {...listeners}
                            sx={{
                                cursor: 'grab',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'text.secondary',
                                '&:active': { cursor: 'grabbing' },
                            }}
                        >
                            <DragIcon />
                        </Box>
                    </Grid>
                    <Grid>
                        <Avatar
                            src={review.imageUrl || undefined}
                            sx={{ width: 64, height: 64 }}
                        >
                            <OfficerIcon />
                        </Avatar>
                    </Grid>
                    <Grid xs>
                        <Typography variant="h6" gutterBottom>
                            {review.name}
                            {review.nameBn && (
                                <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ml: 1 }}
                                >
                                    ({review.nameBn})
                                </Typography>
                            )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {review.designation}
                            {review.designationBn && ` (${review.designationBn})`}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            <Chip
                                label={`${review.messages.length} message${review.messages.length !== 1 ? 's' : ''}`}
                                size="small"
                                sx={{ mr: 1 }}
                            />
                            <Chip
                                label={review.isActive ? 'Active' : 'Inactive'}
                                size="small"
                                color={review.isActive ? 'success' : 'default'}
                            />
                        </Box>
                    </Grid>
                    <Grid>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                                onClick={() => onToggleActive(review)}
                                color={review.isActive ? 'success' : 'default'}
                                title={review.isActive ? 'Deactivate' : 'Activate'}
                            >
                                {review.isActive ? (
                                    <VisibilityIcon />
                                ) : (
                                    <VisibilityOffIcon />
                                )}
                            </IconButton>
                            <IconButton
                                onClick={() => onEdit(review)}
                                color="primary"
                                title="Edit"
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => onDelete(review)}
                                color="error"
                                title="Delete"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

const OfficerReviewManagementPage: React.FC = () => {
    const [reviews, setReviews] = useState<OfficerReview[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<OfficerReview | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await officerReviewService.getAll();
            setReviews(data);
        } catch (err: any) {
            console.error('Failed to load officer reviews:', err);
            setError(err.message || 'Failed to load officer reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedReview(null);
        setModalOpen(true);
    };

    const handleEdit = (review: OfficerReview) => {
        setSelectedReview(review);
        setModalOpen(true);
    };

    const handleDelete = async (review: OfficerReview) => {
        if (!window.confirm(`Are you sure you want to delete ${review.name}?`)) {
            return;
        }

        try {
            setLoading(true);
            await officerReviewService.delete(review.id);
            setSuccess('Officer review deleted successfully!');
            loadReviews();
        } catch (err: any) {
            setError(err.message || 'Failed to delete officer review');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (review: OfficerReview) => {
        try {
            await officerReviewService.toggleActive(review.id);
            setSuccess(`Officer review ${review.isActive ? 'deactivated' : 'activated'} successfully!`);
            loadReviews();
        } catch (err: any) {
            setError(err.message || 'Failed to toggle status');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = reviews.findIndex((r) => r.id === active.id);
        const newIndex = reviews.findIndex((r) => r.id === over.id);

        const items = arrayMove(reviews, oldIndex, newIndex);

        // Update local state immediately
        setReviews(items);

        // Update display orders
        const orders = items.map((item, index) => ({
            id: item.id,
            displayOrder: index,
        }));

        try {
            await officerReviewService.reorder(orders);
            setSuccess('Officer reviews reordered successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to reorder officer reviews');
            loadReviews(); // Reload on error
        }
    };

    const handleModalClose = (shouldReload?: boolean) => {
        setModalOpen(false);
        setSelectedReview(null);
        if (shouldReload) {
            loadReviews();
        }
    };

    return (
        <MainLayout title="Officer Review Management">
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Paper
                    sx={{
                        p: { xs: 2, md: 3 },
                        mb: 3,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #0f766e 0%, #22c55e 100%)',
                        color: 'white',
                        animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
                        animationFillMode: 'both',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: { xs: 'flex-start', md: 'center' },
                            justifyContent: 'space-between',
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                                Officer Review Management
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Manage officer reviews displayed on the home page
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreate}
                            sx={{
                                bgcolor: 'white',
                                color: '#0f766e',
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': { bgcolor: '#f0fdf4' },
                                ...buttonHoverAnimation,
                            }}
                        >
                            Add Officer Review
                        </Button>
                    </Box>
                </Paper>

                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : reviews.length === 0 ? (
                    <Card
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: 3,
                            boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
                        }}
                    >
                        <OfficerIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Officer Reviews Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Create your first officer review to display on the home page
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreate}
                            sx={{ ...buttonHoverAnimation }}
                        >
                            Add Officer Review
                        </Button>
                    </Card>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={reviews.map((r) => r.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {reviews.map((review) => (
                                <SortableItem
                                    key={review.id}
                                    review={review}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleActive={handleToggleActive}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}

                <OfficerReviewModal
                    open={modalOpen}
                    review={selectedReview}
                    onClose={handleModalClose}
                    onSuccess={(message) => {
                        setSuccess(message);
                        setTimeout(() => setSuccess(null), 3000);
                    }}
                    onError={(message) => {
                        setError(message);
                    }}
                />
            </Box>
        </MainLayout>
    );
};

export default OfficerReviewManagementPage;


