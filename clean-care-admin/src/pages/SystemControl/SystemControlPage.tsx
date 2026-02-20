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
    Switch,
    FormControlLabel,
    Divider,
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
    
    // Verification Settings State
    const [smsEnabled, setSmsEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [whatsappEnabled, setWhatsappEnabled] = useState(true);
    const [truecallerEnabled, setTruecallerEnabled] = useState(false);
    
    // API Configuration State
    const [smsApiUrl, setSmsApiUrl] = useState('');
    const [smsApiKey, setSmsApiKey] = useState('');
    const [smsApiSecret, setSmsApiSecret] = useState('');
    const [smsClientId, setSmsClientId] = useState('');
    const [smsPassword, setSmsPassword] = useState('');
    const [smsSenderId, setSmsSenderId] = useState('');
    const [whatsappApiUrl, setWhatsappApiUrl] = useState('');
    const [truecallerAppKey, setTruecallerAppKey] = useState('');
    const [truecallerPartnerKey, setTruecallerPartnerKey] = useState('');
    
    // Advanced Settings State
    const [verificationCodeExpiry, setVerificationCodeExpiry] = useState('15');
    const [verificationCodeLength, setVerificationCodeLength] = useState('6');
    const [pendingCleanupHours, setPendingCleanupHours] = useState('24');

    // SMTP Configuration State
    const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
    const [smtpPort, setSmtpPort] = useState('587');
    const [smtpSecure, setSmtpSecure] = useState(false);
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [smtpFromName, setSmtpFromName] = useState('Clean Care Bangladesh');
    const [smtpFromEmail, setSmtpFromEmail] = useState('');

    // Rate Limiting State
    const [verificationRequestLimit, setVerificationRequestLimit] = useState('3');
    const [verificationRequestWindow, setVerificationRequestWindow] = useState('15');
    const [verificationAttemptLimit, setVerificationAttemptLimit] = useState('5');

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

            // Fetch Verification Settings
            const smsResponse = await systemConfigService.getConfig('verification_sms_enabled');
            if (smsResponse.success && smsResponse.data) {
                setSmsEnabled(smsResponse.data.value !== 'false');
            }

            const emailResponse = await systemConfigService.getConfig('verification_email_enabled');
            if (emailResponse.success && emailResponse.data) {
                setEmailEnabled(emailResponse.data.value !== 'false');
            }

            const whatsappResponse = await systemConfigService.getConfig('verification_whatsapp_enabled');
            if (whatsappResponse.success && whatsappResponse.data) {
                setWhatsappEnabled(whatsappResponse.data.value !== 'false');
            }

            const truecallerResponse = await systemConfigService.getConfig('verification_truecaller_enabled');
            if (truecallerResponse.success && truecallerResponse.data) {
                setTruecallerEnabled(truecallerResponse.data.value === 'true');
            }

            // Fetch Advanced Settings
            const expiryResponse = await systemConfigService.getConfig('verification_code_expiry_minutes');
            if (expiryResponse.success && expiryResponse.data) {
                setVerificationCodeExpiry(expiryResponse.data.value);
            }

            const lengthResponse = await systemConfigService.getConfig('verification_code_length');
            if (lengthResponse.success && lengthResponse.data) {
                setVerificationCodeLength(lengthResponse.data.value);
            }

            const cleanupResponse = await systemConfigService.getConfig('pending_account_cleanup_hours');
            if (cleanupResponse.success && cleanupResponse.data) {
                setPendingCleanupHours(cleanupResponse.data.value);
            }

            // Fetch API Configurations
            const smsApiUrlResponse = await systemConfigService.getConfig('verification_sms_api_url');
            if (smsApiUrlResponse.success && smsApiUrlResponse.data) {
                setSmsApiUrl(smsApiUrlResponse.data.value);
            }

            const smsApiKeyResponse = await systemConfigService.getConfig('verification_sms_api_key');
            if (smsApiKeyResponse.success && smsApiKeyResponse.data) {
                setSmsApiKey(smsApiKeyResponse.data.value);
            }

            const smsApiSecretResponse = await systemConfigService.getConfig('verification_sms_api_secret');
            if (smsApiSecretResponse.success && smsApiSecretResponse.data) {
                setSmsApiSecret(smsApiSecretResponse.data.value);
            }

            const smsClientIdResponse = await systemConfigService.getConfig('verification_sms_client_id');
            if (smsClientIdResponse.success && smsClientIdResponse.data) {
                setSmsClientId(smsClientIdResponse.data.value);
            }

            const smsPasswordResponse = await systemConfigService.getConfig('verification_sms_password');
            if (smsPasswordResponse.success && smsPasswordResponse.data) {
                setSmsPassword(smsPasswordResponse.data.value);
            }

            const smsSenderIdResponse = await systemConfigService.getConfig('verification_sms_sender_id');
            if (smsSenderIdResponse.success && smsSenderIdResponse.data) {
                setSmsSenderId(smsSenderIdResponse.data.value);
            }

            const whatsappApiUrlResponse = await systemConfigService.getConfig('verification_whatsapp_api_url');
            if (whatsappApiUrlResponse.success && whatsappApiUrlResponse.data) {
                setWhatsappApiUrl(whatsappApiUrlResponse.data.value);
            }

            const truecallerAppKeyResponse = await systemConfigService.getConfig('verification_truecaller_app_key');
            if (truecallerAppKeyResponse.success && truecallerAppKeyResponse.data) {
                setTruecallerAppKey(truecallerAppKeyResponse.data.value);
            }

            const truecallerPartnerKeyResponse = await systemConfigService.getConfig('verification_truecaller_partner_key');
            if (truecallerPartnerKeyResponse.success && truecallerPartnerKeyResponse.data) {
                setTruecallerPartnerKey(truecallerPartnerKeyResponse.data.value);
            }

            // Fetch SMTP Settings
            const smtpHostResponse = await systemConfigService.getConfig('smtp_host');
            if (smtpHostResponse.success && smtpHostResponse.data) setSmtpHost(smtpHostResponse.data.value);

            const smtpPortResponse = await systemConfigService.getConfig('smtp_port');
            if (smtpPortResponse.success && smtpPortResponse.data) setSmtpPort(smtpPortResponse.data.value);

            const smtpSecureResponse = await systemConfigService.getConfig('smtp_secure');
            if (smtpSecureResponse.success && smtpSecureResponse.data) setSmtpSecure(smtpSecureResponse.data.value === 'true');

            const smtpUserResponse = await systemConfigService.getConfig('smtp_user');
            if (smtpUserResponse.success && smtpUserResponse.data) setSmtpUser(smtpUserResponse.data.value);

            const smtpPassResponse = await systemConfigService.getConfig('smtp_pass');
            if (smtpPassResponse.success && smtpPassResponse.data) setSmtpPass(smtpPassResponse.data.value);

            const smtpFromNameResponse = await systemConfigService.getConfig('smtp_from_name');
            if (smtpFromNameResponse.success && smtpFromNameResponse.data) setSmtpFromName(smtpFromNameResponse.data.value);

            const smtpFromEmailResponse = await systemConfigService.getConfig('smtp_from_email');
            if (smtpFromEmailResponse.success && smtpFromEmailResponse.data) setSmtpFromEmail(smtpFromEmailResponse.data.value);

            // Fetch Rate Limiting Settings
            const requestLimitResponse = await systemConfigService.getConfig('verification_request_limit');
            if (requestLimitResponse.success && requestLimitResponse.data) setVerificationRequestLimit(requestLimitResponse.data.value);

            const requestWindowResponse = await systemConfigService.getConfig('verification_request_window_minutes');
            if (requestWindowResponse.success && requestWindowResponse.data) setVerificationRequestWindow(requestWindowResponse.data.value);

            const attemptLimitResponse = await systemConfigService.getConfig('verification_attempt_limit');
            if (attemptLimitResponse.success && attemptLimitResponse.data) setVerificationAttemptLimit(attemptLimitResponse.data.value);
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

            // Save Verification Settings
            await systemConfigService.updateConfig(
                'verification_sms_enabled',
                String(smsEnabled),
                'Enable/Disable SMS verification'
            );

            await systemConfigService.updateConfig(
                'verification_email_enabled',
                String(emailEnabled),
                'Enable/Disable Email verification'
            );

            await systemConfigService.updateConfig(
                'verification_whatsapp_enabled',
                String(whatsappEnabled),
                'Enable/Disable WhatsApp verification'
            );

            await systemConfigService.updateConfig(
                'verification_truecaller_enabled',
                String(truecallerEnabled),
                'Enable/Disable Truecaller verification'
            );

            // Save Advanced Settings
            await systemConfigService.updateConfig(
                'verification_code_expiry_minutes',
                verificationCodeExpiry,
                'OTP Expiry in Minutes'
            );

            await systemConfigService.updateConfig(
                'verification_code_length',
                verificationCodeLength,
                'OTP Length (4-10)'
            );

            await systemConfigService.updateConfig(
                'pending_account_cleanup_hours',
                pendingCleanupHours,
                'Hours before unverified accounts are deleted'
            );

            // Save API Configurations
            await systemConfigService.updateConfig(
                'verification_sms_api_url',
                smsApiUrl,
                'SMS Gateway API URL'
            );

            await systemConfigService.updateConfig(
                'verification_sms_api_key',
                smsApiKey,
                'SMS Gateway API Key'
            );

            await systemConfigService.updateConfig(
                'verification_sms_api_secret',
                smsApiSecret,
                'SMS Gateway API Secret'
            );

            await systemConfigService.updateConfig(
                'verification_sms_client_id',
                smsClientId,
                'SMS Gateway Client ID'
            );

            await systemConfigService.updateConfig(
                'verification_sms_password',
                smsPassword,
                'SMS Gateway Password'
            );

            await systemConfigService.updateConfig(
                'verification_sms_sender_id',
                smsSenderId,
                'SMS Gateway Sender ID (Optional)'
            );

            await systemConfigService.updateConfig(
                'verification_whatsapp_api_url',
                whatsappApiUrl,
                'WhatsApp Gateway API URL'
            );

            await systemConfigService.updateConfig(
                'verification_truecaller_app_key',
                truecallerAppKey,
                'Truecaller App Key'
            );

            await systemConfigService.updateConfig(
                'verification_truecaller_partner_key',
                truecallerPartnerKey,
                'Truecaller Partner Key'
            );

            // Save SMTP Settings
            await systemConfigService.updateConfig('smtp_host', smtpHost, 'SMTP Host');
            await systemConfigService.updateConfig('smtp_port', smtpPort, 'SMTP Port');
            await systemConfigService.updateConfig('smtp_secure', String(smtpSecure), 'SMTP Secure');
            await systemConfigService.updateConfig('smtp_user', smtpUser, 'SMTP User');
            await systemConfigService.updateConfig('smtp_pass', smtpPass, 'SMTP Password');
            await systemConfigService.updateConfig('smtp_from_name', smtpFromName, 'SMTP From Name');
            await systemConfigService.updateConfig('smtp_from_email', smtpFromEmail, 'SMTP From Email');

            // Save Rate Limiting Settings
            await systemConfigService.updateConfig('verification_request_limit', verificationRequestLimit, 'Verification Request Limit');
            await systemConfigService.updateConfig('verification_request_window_minutes', verificationRequestWindow, 'Verification Window (Minutes)');
            await systemConfigService.updateConfig('verification_attempt_limit', verificationAttemptLimit, 'Verification Attempt Limit');

            toast.success('System settings updated successfully');
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

                                        <Divider />

                                        <Box>
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                                যাচাইকরণ সেটিংস (Verification Settings)
                                            </Typography>
                                            <Stack spacing={2}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={emailEnabled}
                                                            onChange={(e) => setEmailEnabled(e.target.checked)}
                                                            disabled={limitsSaving}
                                                        />
                                                    }
                                                    label="Email Verification (Enable/Disable)"
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={smsEnabled}
                                                            onChange={(e) => setSmsEnabled(e.target.checked)}
                                                            disabled={limitsSaving}
                                                        />
                                                    }
                                                    label="SMS Verification (Enable/Disable)"
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={whatsappEnabled}
                                                            onChange={(e) => setWhatsappEnabled(e.target.checked)}
                                                            disabled={limitsSaving}
                                                        />
                                                    }
                                                    label="WhatsApp Verification (Enable/Disable)"
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={truecallerEnabled}
                                                            onChange={(e) => setTruecallerEnabled(e.target.checked)}
                                                            disabled={limitsSaving}
                                                        />
                                                    }
                                                    label="Truecaller Verification (Enable/Disable)"
                                                />
                                            </Stack>
                                        </Box>

                                        <Divider />

                                        <Box>
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                                উন্নত সেটিংস (Advanced Settings)
                                            </Typography>
                                            <Stack spacing={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Verification Code Expiry (Minutes)"
                                                    value={verificationCodeExpiry}
                                                    onChange={(e) => setVerificationCodeExpiry(e.target.value)}
                                                    type="number"
                                                    helperText="Enter the number of minutes before OTP expires"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Verification Code Length"
                                                    value={verificationCodeLength}
                                                    onChange={(e) => setVerificationCodeLength(e.target.value)}
                                                    type="number"
                                                    helperText="Length of the OTP (4-10 digits)"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Pending Account Cleanup (Hours)"
                                                    value={pendingCleanupHours}
                                                    onChange={(e) => setPendingCleanupHours(e.target.value)}
                                                    type="number"
                                                    helperText="How many hours unverified accounts stay before deletion"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            </Stack>
                                        </Box>

                                        <Divider />

                                        <Box>
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                                SMS Gateway Configuration
                                            </Typography>
                                            <Stack spacing={3}>
                                                <TextField
                                                    fullWidth
                                                    label="SMS API URL"
                                                    value={smsApiUrl}
                                                    onChange={(e) => setSmsApiUrl(e.target.value)}
                                                    helperText="Full URL (e.g. http://portal.khudebarta.com/api/v3/sms/send)"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="SMS API Key"
                                                    value={smsApiKey}
                                                    onChange={(e) => setSmsApiKey(e.target.value)}
                                                    helperText="API Key for authentication"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="SMS API Secret (Optional)"
                                                    value={smsApiSecret}
                                                    onChange={(e) => setSmsApiSecret(e.target.value)}
                                                    helperText="Secret Key for authentication (if required)"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Client ID (Optional)"
                                                    value={smsClientId}
                                                    onChange={(e) => setSmsClientId(e.target.value)}
                                                    helperText="Client ID for authentication (if required)"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Password (Optional)"
                                                    value={smsPassword}
                                                    onChange={(e) => setSmsPassword(e.target.value)}
                                                    helperText="Password for authentication (if required)"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Sender ID (Optional)"
                                                    value={smsSenderId}
                                                    onChange={(e) => setSmsSenderId(e.target.value)}
                                                    helperText="Sender ID / Caller ID (if required)"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            </Stack>
                                        </Box>

                                        <Divider />

                                        <Box>
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                                WhatsApp Gateway Configuration
                                            </Typography>
                                            <Stack spacing={3}>
                                                <TextField
                                                    fullWidth
                                                    label="WhatsApp API URL"
                                                    value={whatsappApiUrl}
                                                    onChange={(e) => setWhatsappApiUrl(e.target.value)}
                                                    helperText="Full URL for the WhatsApp Gateway API"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            </Stack>
                                        </Box>

                                        <Divider />

                                        <Box>
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                                Truecaller Configuration
                                            </Typography>
                                            <Stack spacing={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Truecaller App Key"
                                                    value={truecallerAppKey}
                                                    onChange={(e) => setTruecallerAppKey(e.target.value)}
                                                    helperText="App Key from Truecaller Developer Portal"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Truecaller Partner Key"
                                                    value={truecallerPartnerKey}
                                                    onChange={(e) => setTruecallerPartnerKey(e.target.value)}
                                                    helperText="Partner Key from Truecaller"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            </Stack>
                                        </Box>
                                        <Divider />

                                        <Box>
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                                ইমেইল কনফিগারেশন (Email Configuration - SMTP)
                                            </Typography>
                                            <Stack spacing={3}>
                                                <TextField
                                                    fullWidth
                                                    label="SMTP Host"
                                                    value={smtpHost}
                                                    onChange={(e) => setSmtpHost(e.target.value)}
                                                    helperText="e.g., smtp.gmail.com"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="SMTP Port"
                                                    value={smtpPort}
                                                    onChange={(e) => setSmtpPort(e.target.value)}
                                                    helperText="e.g., 587"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={smtpSecure}
                                                            onChange={(e) => setSmtpSecure(e.target.checked)}
                                                            disabled={limitsSaving}
                                                        />
                                                    }
                                                    label="SMTP Secure (Enable for SSL/TLS)"
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="SMTP User"
                                                    value={smtpUser}
                                                    onChange={(e) => setSmtpUser(e.target.value)}
                                                    helperText="Email address for SMTP authentication"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="SMTP Password"
                                                    value={smtpPass}
                                                    onChange={(e) => setSmtpPass(e.target.value)}
                                                    helperText="Password or App Password for SMTP"
                                                    disabled={limitsSaving}
                                                    type="password"
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Sender Name"
                                                    value={smtpFromName}
                                                    onChange={(e) => setSmtpFromName(e.target.value)}
                                                    helperText="Name displayed in emails"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Sender Email"
                                                    value={smtpFromEmail}
                                                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                                                    helperText="Email address displayed as sender"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            </Stack>
                                        </Box>

                                        <Divider />

                                        <Box>
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                                রেট লিমিটিং (Rate Limiting)
                                            </Typography>
                                            <Stack spacing={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Verification Request Limit"
                                                    value={verificationRequestLimit}
                                                    onChange={(e) => setVerificationRequestLimit(e.target.value)}
                                                    type="number"
                                                    helperText="Max verification requests allowed in the window (e.g., 3)"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Request Window (Minutes)"
                                                    value={verificationRequestWindow}
                                                    onChange={(e) => setVerificationRequestWindow(e.target.value)}
                                                    type="number"
                                                    helperText="Time window for rate limiting in minutes (e.g., 15)"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Verification Attempt Limit"
                                                    value={verificationAttemptLimit}
                                                    onChange={(e) => setVerificationAttemptLimit(e.target.value)}
                                                    type="number"
                                                    helperText="Max incorrect attempts before lockout (e.g., 5)"
                                                    disabled={limitsSaving}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            </Stack>
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


