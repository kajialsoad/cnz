import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Card,
    CardHeader,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    Stack,
    Skeleton,
    TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import MainLayout from '../../components/common/Layout/MainLayout';
import { botMessageService } from '../../services/botMessageService';
import { systemConfigService } from '../../services/systemConfigService';
import type {
    BotMessageConfig,
    BotTriggerRule,
    ChatType,
} from '../../types/bot-message.types';
import { toast } from 'react-hot-toast';
import TriggerRulesCard from '../../components/BotMessage/TriggerRulesCard';
import BotMessagesList from '../../components/BotMessage/BotMessagesList';
import BotMessageModal from '../../components/BotMessage/BotMessageModal';
import BotAnalyticsChart from '../../components/BotMessage/BotAnalyticsChart';
import DeleteConfirmDialog from '../../components/BotMessage/DeleteConfirmDialog';
import { BotMessagesListSkeleton } from '../../components/BotMessage/BotMessageSkeleton';

/**
 * System Control Page
 * Allows MASTER_ADMIN to manage bot messages, trigger rules, and complaint limits
 */
const SystemControlPage: React.FC = () => {
    // Bot Messages State
    const [chatType, setChatType] = useState<ChatType>('LIVE_CHAT');
    const [messages, setMessages] = useState<BotMessageConfig[]>([]);
    const [rules, setRules] = useState<BotTriggerRule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<BotMessageConfig | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    // Complaint Limits State
    const [dailyLimit, setDailyLimit] = useState('20');
    const [wardImageLimit, setWardImageLimit] = useState('10');
    const [liveChatLimit, setLiveChatLimit] = useState('120');
    const [limitsLoading, setLimitsLoading] = useState(true);
    const [limitsSaving, setLimitsSaving] = useState(false);

    /**
     * Load bot messages and rules
     */
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await botMessageService.getBotMessages(chatType);
            setMessages(data.messages);
            setRules(data.rules);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load bot messages';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [chatType]);

    /**
     * Load complaint limits
     */
    const loadComplaintLimits = useCallback(async () => {
        try {
            setLimitsLoading(true);

            // Fetch daily limit
            const dailyResponse = await systemConfigService.getConfig('daily_complaint_limit');
            if (dailyResponse.success && dailyResponse.data) {
                setDailyLimit(dailyResponse.data.value);
            }

            // Fetch ward image limit
            const wardResponse = await systemConfigService.getConfig('ward_image_limit');
            if (wardResponse.success && wardResponse.data) {
                setWardImageLimit(wardResponse.data.value);
            }

            // Fetch live chat message limit
            const liveChatResponse = await systemConfigService.getConfig('LIVE_CHAT_MESSAGE_LIMIT');
            if (liveChatResponse.success && liveChatResponse.data) {
                setLiveChatLimit(liveChatResponse.data.value);
            }
        } catch (err) {
            console.error('Error loading complaint limits:', err);
        } finally {
            setLimitsLoading(false);
        }
    }, []);

    /**
     * Load data on mount and when chat type changes
     */
    useEffect(() => {
        loadData();
        loadComplaintLimits();
    }, [loadData, loadComplaintLimits]);

    /**
     * Handle chat type change
     */
    const handleChatTypeChange = (_event: React.SyntheticEvent, newValue: ChatType) => {
        setChatType(newValue);
    };

    /**
     * Handle add message
     */
    const handleAddMessage = () => {
        setEditingMessage(null);
        setModalOpen(true);
    };

    /**
     * Handle edit message
     */
    const handleEditMessage = (message: BotMessageConfig) => {
        setEditingMessage(message);
        setModalOpen(true);
    };

    /**
     * Handle delete message
     */
    const handleDeleteMessage = (messageId: number) => {
        setDeletingMessageId(messageId);
        setDeleteConfirmOpen(true);
    };

    /**
     * Confirm delete message
     */
    const confirmDelete = async () => {
        if (!deletingMessageId) return;

        try {
            setSaving(true);
            await botMessageService.deleteBotMessage(deletingMessageId);
            toast.success('Bot message deleted successfully');
            await loadData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete bot message';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
            setDeleteConfirmOpen(false);
            setDeletingMessageId(null);
        }
    };

    /**
     * Handle toggle active
     */
    const handleToggleActive = async (messageId: number, isActive: boolean): Promise<void> => {
        try {
            await botMessageService.toggleBotMessageActive(messageId, isActive);
            toast.success(`Bot message ${isActive ? 'activated' : 'deactivated'} successfully`);
            await loadData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update bot message';
            toast.error(errorMessage);
        }
    };

    /**
     * Handle save complaint limits
     */
    const handleSaveComplaintLimits = async () => {
        try {
            setLimitsSaving(true);

            // Validate inputs
            const dailyLimitNum = parseInt(dailyLimit, 10);
            const wardLimitNum = parseInt(wardImageLimit, 10);
            const liveChatLimitNum = parseInt(liveChatLimit, 10);

            if (isNaN(dailyLimitNum) || dailyLimitNum < 1) {
                toast.error('Daily complaint limit must be a positive number');
                return;
            }

            if (isNaN(wardLimitNum) || wardLimitNum < 1) {
                toast.error('Ward image limit must be a positive number');
                return;
            }

            if (isNaN(liveChatLimitNum) || liveChatLimitNum < 1) {
                toast.error('Live chat message limit must be a positive number');
                return;
            }

            // Save all limits
            await systemConfigService.updateConfig(
                'daily_complaint_limit',
                dailyLimit,
                'Maximum complaints a user can submit per day'
            );

            await systemConfigService.updateConfig(
                'ward_image_limit',
                wardImageLimit,
                'Maximum images allowed per ward'
            );

            await systemConfigService.updateConfig(
                'LIVE_CHAT_MESSAGE_LIMIT',
                liveChatLimit,
                'Maximum number of messages to load in live chat'
            );

            toast.success('System limits updated successfully');
        } catch (err) {
            console.error('Error saving complaint limits:', err);
            toast.error('Failed to save complaint limits');
        } finally {
            setLimitsSaving(false);
        }
    };

    /**
     * Handle save message (create or update)
     */
    const handleSaveMessage = async (data: any) => {
        try {
            setSaving(true);

            // Trim whitespace from content fields
            const trimmedData = {
                ...data,
                content: data.content?.trim(),
                contentBn: data.contentBn?.trim(),
                stepNumber: Number(data.stepNumber),
            };

            // Validate trimmed content is not empty
            if (!trimmedData.content || trimmedData.content.length === 0) {
                toast.error('English content cannot be empty');
                return;
            }

            if (!trimmedData.contentBn || trimmedData.contentBn.length === 0) {
                toast.error('Bangla content cannot be empty');
                return;
            }

            if (isNaN(trimmedData.stepNumber) || trimmedData.stepNumber < 1) {
                toast.error('Step number must be a valid positive number');
                return;
            }

            if (editingMessage) {
                // Update existing message - only send changed fields
                const updateData: any = {};

                if (trimmedData.content !== editingMessage.content) {
                    updateData.content = trimmedData.content;
                }
                if (trimmedData.contentBn !== editingMessage.contentBn) {
                    updateData.contentBn = trimmedData.contentBn;
                }
                if (trimmedData.stepNumber !== editingMessage.stepNumber) {
                    updateData.stepNumber = trimmedData.stepNumber;
                }

                // Only update if there are changes
                if (Object.keys(updateData).length === 0) {
                    toast.info('No changes to save');
                    setModalOpen(false);
                    setEditingMessage(null);
                    return;
                }

                await botMessageService.updateBotMessage(editingMessage.id, updateData);
                toast.success('Bot message updated successfully');
            } else {
                // Create new message
                await botMessageService.createBotMessage({
                    ...trimmedData,
                    chatType,
                    displayOrder: messages.length,
                });
                toast.success('Bot message created successfully');
            }

            setModalOpen(false);
            setEditingMessage(null);
            await loadData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save bot message';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    /**
     * Handle reorder messages
     */
    const handleReorder = async (reorderedMessages: BotMessageConfig[]) => {
        try {
            const messageIds = reorderedMessages.map((msg) => msg.id);
            await botMessageService.reorderBotMessages(chatType, messageIds);
            setMessages(reorderedMessages);
            toast.success('Bot messages reordered successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to reorder bot messages';
            toast.error(errorMessage);
            // Reload to restore original order
            await loadData();
        }
    };

    /**
     * Handle update trigger rules
     */
    const handleUpdateRules = async (updatedRules: Partial<BotTriggerRule>) => {
        try {
            setSaving(true);

            // Ensure all values are valid numbers
            const reactivationThreshold = typeof updatedRules.reactivationThreshold === 'number' &&
                !isNaN(updatedRules.reactivationThreshold)
                ? updatedRules.reactivationThreshold
                : 5;

            await botMessageService.updateTriggerRules(chatType, {
                isEnabled: updatedRules.isEnabled ?? true,
                reactivationThreshold,
                resetStepsOnReactivate: updatedRules.resetStepsOnReactivate ?? false,
            });
            toast.success('Trigger rules updated successfully');
            await loadData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update trigger rules';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            mb: 1,
                            color: 'primary.main',
                            fontSize: { xs: '1.75rem', sm: '2.125rem' }
                        }}
                    >
                        Bot Message System Control
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
                        Manage automated bot messages, trigger rules, and complaint limits
                    </Typography>
                </Box>

                {/* Chat Type Selector */}
                <Box sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: 4,
                    bgcolor: 'background.paper',
                    borderRadius: '8px 8px 0 0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <Tabs
                        value={chatType}
                        onChange={handleChatTypeChange}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                minHeight: 56,
                            }
                        }}
                    >
                        <Tab label="Live Chat" value="LIVE_CHAT" />
                        <Tab label="Complaint Chat" value="COMPLAINT_CHAT" />
                    </Tabs>
                </Box>

                {/* Error Display */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            '& .MuiAlert-message': {
                                width: '100%'
                            }
                        }}
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}

                {/* Loading State */}
                {loading ? (
                    <Stack spacing={3}>
                        {/* Complaint Limits Skeleton */}
                        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                            <CardHeader
                                title={<Skeleton width={250} />}
                                subheader={<Skeleton width={350} />}
                            />
                            <CardContent>
                                <Stack spacing={3}>
                                    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                                    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                                    <Skeleton variant="rectangular" height={40} width={150} sx={{ borderRadius: 1 }} />
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Trigger Rules Skeleton */}
                        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                            <CardHeader
                                title={<Skeleton width={200} />}
                                subheader={<Skeleton width={300} />}
                            />
                            <CardContent>
                                <Stack spacing={3}>
                                    <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                                    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                                    <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Bot Messages Skeleton */}
                        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                            <CardHeader
                                title={<Skeleton width={150} />}
                                subheader={<Skeleton width={250} />}
                            />
                            <CardContent>
                                <BotMessagesListSkeleton count={3} />
                            </CardContent>
                        </Card>

                        {/* Analytics Skeleton */}
                        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                            <CardHeader
                                title={<Skeleton width={250} />}
                                subheader={<Skeleton width={350} />}
                            />
                            <CardContent>
                                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
                            </CardContent>
                        </Card>
                    </Stack>
                ) : (
                    <Stack spacing={3}>
                        {/* Complaint Limits Section */}
                        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                            <CardHeader
                                title={
                                    <Typography variant="h6" fontWeight={600}>
                                        অভিযোগের সীমা (Complaint Limits)
                                    </Typography>
                                }
                                subheader={
                                    <Typography variant="body2" color="text.secondary">
                                        Configure daily complaint and image upload limits
                                    </Typography>
                                }
                                sx={{ pb: 1 }}
                            />
                            <CardContent>
                                {limitsLoading ? (
                                    <Stack spacing={3}>
                                        <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                                        <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                                        <Skeleton variant="rectangular" height={40} width={150} sx={{ borderRadius: 1 }} />
                                    </Stack>
                                ) : (
                                    <Stack spacing={3}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                                                দৈনিক অভিযোগের সীমা (Daily Complaint Limit)
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                value={dailyLimit}
                                                onChange={(e) => setDailyLimit(e.target.value)}
                                                helperText="একজন ব্যবহারকারী প্রতিদিন কতগুলো অভিযোগ করতে পারবেন"
                                                InputProps={{
                                                    inputProps: { min: 1 },
                                                }}
                                                disabled={limitsSaving}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                    }
                                                }}
                                            />
                                        </Box>

                                        <Box>
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                                                ওয়ার্ডের ছবির সীমা (Ward Image Limit)
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                value={wardImageLimit}
                                                onChange={(e) => setWardImageLimit(e.target.value)}
                                                helperText="প্রতি অভিযোগের জন্য ওয়ার্ডে সর্বোচ্চ কতগুলো ছবি আপলোড করা যাবে"
                                                InputProps={{
                                                    inputProps: { min: 1 },
                                                }}
                                                disabled={limitsSaving}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                    }
                                                }}
                                            />
                                        </Box>

                                        <Box>
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                                                লাইভ চ্যাট মেসেজ সীমা (Live Chat Message Limit)
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                value={liveChatLimit}
                                                onChange={(e) => setLiveChatLimit(e.target.value)}
                                                helperText="একসাথে কতগুলো পুরনো মেসেজ লোড হবে (Default: 120)"
                                                InputProps={{
                                                    inputProps: { min: 1 },
                                                }}
                                                disabled={limitsSaving}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                    }
                                                }}
                                            />
                                        </Box>

                                        <Box>
                                            <Button
                                                variant="contained"
                                                startIcon={limitsSaving ? <CircularProgress size={20} color="inherit" /> : <SaveOutlined />}
                                                onClick={handleSaveComplaintLimits}
                                                disabled={limitsSaving}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    px: 3,
                                                    py: 1.5,
                                                    borderRadius: 2,
                                                    boxShadow: 2,
                                                    '&:hover': {
                                                        boxShadow: 4,
                                                    }
                                                }}
                                            >
                                                {limitsSaving ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </Box>
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>

                        {/* Trigger Rules Section */}
                        {rules && (
                            <TriggerRulesCard
                                rules={rules}
                                onUpdate={handleUpdateRules}
                                disabled={saving}
                            />
                        )}

                        {/* Bot Messages Section */}
                        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                            <CardHeader
                                title={
                                    <Typography variant="h6" fontWeight={600}>
                                        Bot Messages
                                    </Typography>
                                }
                                subheader={
                                    <Typography variant="body2" color="text.secondary">
                                        Manage automated messages for {chatType === 'LIVE_CHAT' ? 'Live Chat' : 'Complaint Chat'}
                                    </Typography>
                                }
                                action={
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={handleAddMessage}
                                        disabled={saving}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            px: 3,
                                            borderRadius: 2,
                                            boxShadow: 2,
                                            '&:hover': {
                                                boxShadow: 4,
                                            }
                                        }}
                                    >
                                        Add Message
                                    </Button>
                                }
                                sx={{ pb: 1 }}
                            />
                            <CardContent>
                                <BotMessagesList
                                    messages={messages}
                                    onEdit={handleEditMessage}
                                    onDelete={handleDeleteMessage}
                                    onToggleActive={handleToggleActive}
                                    onReorder={handleReorder}
                                    disabled={saving}
                                />
                            </CardContent>
                        </Card>

                        {/* Analytics Section */}
                        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                            <CardHeader
                                title={
                                    <Typography variant="h6" fontWeight={600}>
                                        Bot Performance Analytics
                                    </Typography>
                                }
                                subheader={
                                    <Typography variant="body2" color="text.secondary">
                                        View bot message effectiveness and user engagement metrics
                                    </Typography>
                                }
                                sx={{ pb: 1 }}
                            />
                            <CardContent>
                                <BotAnalyticsChart chatType={chatType} />
                            </CardContent>
                        </Card>
                    </Stack>
                )}

                {/* Bot Message Modal */}
                <BotMessageModal
                    open={modalOpen}
                    message={editingMessage}
                    onClose={() => {
                        setModalOpen(false);
                        setEditingMessage(null);
                    }}
                    onSave={handleSaveMessage}
                    saving={saving}
                />

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmDialog
                    open={deleteConfirmOpen}
                    onClose={() => {
                        setDeleteConfirmOpen(false);
                        setDeletingMessageId(null);
                    }}
                    onConfirm={confirmDelete}
                    loading={saving}
                    title="Delete Bot Message"
                    message="Are you sure you want to delete this bot message? This action cannot be undone and will remove the message from the bot's response sequence."
                />
            </Box>
        </MainLayout>
    );
};

export default SystemControlPage;


