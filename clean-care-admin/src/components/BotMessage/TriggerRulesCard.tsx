import React, { useState, useEffect } from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    FormControlLabel,
    Switch,
    TextField,
    Button,
    Stack,
    Typography,
    Box,
    Divider,
    CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import type { BotTriggerRule } from '../../types/bot-message.types';

interface TriggerRulesCardProps {
    rules: BotTriggerRule;
    onUpdate: (rules: Partial<BotTriggerRule>) => Promise<void>;
    disabled?: boolean;
}

/**
 * Trigger Rules Card Component
 * Displays and allows editing of bot trigger rules
 */
const TriggerRulesCard: React.FC<TriggerRulesCardProps> = ({
    rules,
    onUpdate,
    disabled = false,
}) => {
    const [localRules, setLocalRules] = useState<BotTriggerRule>(rules);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    /**
     * Update local rules when props change (e.g., chat type switch)
     */
    useEffect(() => {
        setLocalRules(rules);
        setHasChanges(false);
    }, [rules]);

    /**
     * Handle field change
     */
    const handleChange = (field: keyof BotTriggerRule, value: any) => {
        setLocalRules((prev) => {
            const newValue = field === 'reactivationThreshold'
                ? (typeof value === 'number' && !isNaN(value) ? value : prev.reactivationThreshold)
                : value;
            return { ...prev, [field]: newValue };
        });
        setHasChanges(true);
    };

    /**
     * Handle save with loading state
     */
    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(localRules);
            setHasChanges(false);
        } finally {
            setSaving(false);
        }
    };

    /**
     * Handle reset
     */
    const handleReset = () => {
        setLocalRules(rules);
        setHasChanges(false);
    };

    const isDisabled = disabled || saving;

    return (
        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardHeader
                title={
                    <Typography variant="h6" fontWeight={600}>
                        Bot Trigger Rules
                    </Typography>
                }
                subheader={
                    <Typography variant="body2" color="text.secondary">
                        Configure when and how bot messages are triggered
                    </Typography>
                }
                sx={{ pb: 1 }}
            />
            <CardContent>
                <Stack spacing={3}>
                    {/* Enable/Disable Bot */}
                    <Box sx={{
                        p: 2,
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localRules.isEnabled}
                                    onChange={(e) => handleChange('isEnabled', e.target.checked)}
                                    disabled={isDisabled}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1" fontWeight={600}>
                                        Enable Bot Messages
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Turn on/off automated bot messages for this chat type
                                    </Typography>
                                </Box>
                            }
                        />
                    </Box>

                    <Divider />

                    {/* Reactivation Threshold */}
                    <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                            Reactivation Threshold
                        </Typography>
                        <TextField
                            type="number"
                            value={localRules.reactivationThreshold || 5}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                handleChange('reactivationThreshold', isNaN(val) ? 5 : val);
                            }}
                            disabled={isDisabled || !localRules.isEnabled}
                            fullWidth
                            size="small"
                            helperText="Number of user messages after admin reply before bot reactivates"
                            slotProps={{
                                htmlInput: { min: 1, max: 20 }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                }
                            }}
                        />
                    </Box>

                    {/* Reset Steps on Reactivate */}
                    <Box sx={{
                        p: 2,
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localRules.resetStepsOnReactivate}
                                    onChange={(e) =>
                                        handleChange('resetStepsOnReactivate', e.target.checked)
                                    }
                                    disabled={isDisabled || !localRules.isEnabled}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1" fontWeight={600}>
                                        Reset Steps on Reactivation
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Start from step 1 when bot reactivates (otherwise continues from last step)
                                    </Typography>
                                </Box>
                            }
                        />
                    </Box>

                    {/* Action Buttons */}
                    {hasChanges && (
                        <Stack
                            direction="row"
                            spacing={2}
                            justifyContent="flex-end"
                            sx={{ pt: 2 }}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleReset}
                                disabled={isDisabled}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                onClick={handleSave}
                                disabled={isDisabled}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    boxShadow: 2,
                                    '&:hover': {
                                        boxShadow: 4,
                                    }
                                }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default TriggerRulesCard;


