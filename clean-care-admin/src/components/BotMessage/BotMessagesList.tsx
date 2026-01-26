import React from 'react';
import {
    Box,
    List,
    Typography,
} from '@mui/material';
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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { BotMessageConfig } from '../../types/bot-message.types';
import BotMessageItem from './BotMessageItem';

interface BotMessagesListProps {
    messages: BotMessageConfig[];
    onEdit: (message: BotMessageConfig) => void;
    onDelete: (messageId: number) => void;
    onToggleActive: (messageId: number, isActive: boolean) => void;
    onReorder: (reorderedMessages: BotMessageConfig[]) => void;
    disabled?: boolean;
}

/**
 * Bot Messages List Component
 * Displays a list of bot messages with drag-and-drop reordering
 */
const BotMessagesList: React.FC<BotMessagesListProps> = ({
    messages,
    onEdit,
    onDelete,
    onToggleActive,
    onReorder,
    disabled = false,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    /**
     * Handle drag end
     */
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = messages.findIndex((msg) => msg.id === active.id);
        const newIndex = messages.findIndex((msg) => msg.id === over.id);

        const reorderedMessages = arrayMove(messages, oldIndex, newIndex).map(
            (item, index) => ({
                ...item,
                displayOrder: index,
            })
        );

        onReorder(reorderedMessages);
    };

    if (messages.length === 0) {
        return (
            <Box
                sx={{
                    py: 10,
                    px: 3,
                    textAlign: 'center',
                    color: 'text.secondary',
                    bgcolor: 'background.default',
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    No bot messages configured yet
                </Typography>
                <Typography variant="body2">
                    Click "Add Message" to create your first bot message.
                </Typography>
            </Box>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={messages.map((msg) => msg.id)}
                strategy={verticalListSortingStrategy}
                disabled={disabled}
            >
                <List>
                    {messages.map((message) => (
                        <Box key={message.id} sx={{ mb: 2 }}>
                            <BotMessageItem
                                message={message}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggleActive={onToggleActive}
                                disabled={disabled}
                            />
                        </Box>
                    ))}
                </List>
            </SortableContext>
        </DndContext>
    );
};

export default BotMessagesList;
