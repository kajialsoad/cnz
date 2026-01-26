import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    IconButton,
    Chip,
    Stack,
    Switch,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BotMessageConfig } from '../../types/bot-message.types';

interface BotMessageItemProps {
    message: BotMessageConfig;
    onEdit: (message: BotMessageConfig) => void;
    onDelete: (messageId: number) => void;
    onToggleActive: (messageId: number, isActive: boolean) => Promise<void>;
    disabled?: boolean;
}

/**
 * Bot Message Item Component
 * Displays a single bot message with actions
 */
const BotMessageItem: React.FC<BotMessageItemProps> = ({
    message,
    onEdit,
    onDelete,
    onToggleActive,
    disabled = false,
}) => {
    const [toggling, setToggling] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: message.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    /**
     * Handle toggle active with loading state
     */
    const handleToggle = async (checked: boolean) => {
        setToggling(true);
        try {
            await onToggleActive(message.id, checked);
        } finally {
            setToggling(false);
        }
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            sx={{
                border: '2px solid',
                borderColor: message.isActive ? 'primary.light' : 'divider',
                borderRadius: 2,
                boxShadow: 1,
                bgcolor: message.isActive ? 'background.paper' : 'action.hover',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    boxShadow: 4,
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Drag Handle */}
                    <Box
                        {...attributes}
                        {...listeners}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'text.secondary',
                            cursor: disabled ? 'default' : 'grab',
                            p: 1,
                            borderRadius: 1,
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: 'action.hover',
                                color: 'primary.main',
                            },
                            '&:active': {
                                cursor: disabled ? 'default' : 'grabbing',
                                bgcolor: 'action.selected',
                            },
                        }}
                    >
                        <DragIndicatorIcon />
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Header */}
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mb: 1.5, flexWrap: 'wrap' }}
                        >
                            <Chip
                                label={`Step ${message.stepNumber}`}
                                size="small"
                                color="primary"
                                variant="filled"
                                sx={{ fontWeight: 600 }}
                            />
                            <Chip
                                label={message.isActive ? 'Active' : 'Inactive'}
                                size="small"
                                color={message.isActive ? 'success' : 'default'}
                                sx={{ fontWeight: 600 }}
                            />
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontFamily: 'monospace',
                                    bgcolor: 'action.hover',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                }}
                            >
                                {message.messageKey}
                            </Typography>
                        </Stack>

                        {/* English Content */}
                        <Box sx={{
                            mb: 1.5,
                            p: 1.5,
                            bgcolor: 'background.default',
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                }}
                            >
                                English
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                                {message.content}
                            </Typography>
                        </Box>

                        {/* Bangla Content */}
                        <Box sx={{
                            p: 1.5,
                            bgcolor: 'background.default',
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                }}
                            >
                                বাংলা
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                                {message.contentBn}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        {/* Active Toggle with Loading State */}
                        <Tooltip title={message.isActive ? 'Deactivate' : 'Activate'} arrow>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <Switch
                                    checked={message.isActive}
                                    onChange={(e) => handleToggle(e.target.checked)}
                                    disabled={disabled || toggling}
                                    size="small"
                                    color="success"
                                />
                                {toggling && (
                                    <CircularProgress
                                        size={20}
                                        sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            marginTop: '-10px',
                                            marginLeft: '-10px',
                                        }}
                                    />
                                )}
                            </Box>
                        </Tooltip>

                        {/* Edit Button */}
                        <Tooltip title="Edit" arrow>
                            <IconButton
                                size="small"
                                onClick={() => onEdit(message)}
                                disabled={disabled || toggling}
                                color="primary"
                                sx={{
                                    '&:hover': {
                                        bgcolor: 'primary.light',
                                        color: 'primary.dark',
                                    }
                                }}
                            >
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        {/* Delete Button */}
                        <Tooltip title="Delete" arrow>
                            <IconButton
                                size="small"
                                onClick={() => onDelete(message.id)}
                                disabled={disabled || toggling}
                                color="error"
                                sx={{
                                    '&:hover': {
                                        bgcolor: 'error.light',
                                        color: 'error.dark',
                                    }
                                }}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );
};

export default BotMessageItem;
