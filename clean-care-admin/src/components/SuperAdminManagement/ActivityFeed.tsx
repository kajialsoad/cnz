import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Stack,
    Avatar,
    Chip,
    CircularProgress,
    Divider,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

// Activity log interface
interface ActivityLog {
    id: number;
    userId: number;
    action: string;
    entityType: string;
    entityId: number | null;
    oldValue: any;
    newValue: any;
    timestamp: string;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string | null;
        role: string;
    };
}

// Action translations to Bengali
const actionTranslations: Record<string, string> = {
    CREATE_USER: 'তৈরি করেছেন',
    UPDATE_USER: 'আপডেট করেছেন',
    DELETE_USER: 'মুছে ফেলেছেন',
    UPDATE_USER_STATUS: 'স্ট্যাটাস পরিবর্তন করেছেন',
    UPDATE_USER_PERMISSIONS: 'পারমিশন আপডেট করেছেন',
};

// Entity type translations to Bengali
const entityTypeTranslations: Record<string, string> = {
    USER: 'ইউজার',
    COMPLAINT: 'অভিযোগ',
    MESSAGE: 'মেসেজ',
    ZONE: 'জোন',
    WARD: 'ওয়ার্ড',
};

// Get action color
const getActionColor = (action: string): string => {
    if (action.includes('CREATE')) return '#00a63e';
    if (action.includes('UPDATE')) return '#155dfc';
    if (action.includes('DELETE')) return '#e7000b';
    return '#4a5565';
};

// Format activity description
const formatActivityDescription = (log: ActivityLog): string => {
    const action = actionTranslations[log.action] || log.action;
    const entityType = entityTypeTranslations[log.entityType] || log.entityType;

    if (log.action === 'CREATE_USER' && log.newValue) {
        return `${log.newValue.name} নামে নতুন ${entityType} ${action}`;
    }

    if (log.action === 'UPDATE_USER' && log.oldValue && log.newValue) {
        const changes: string[] = [];
        if (log.oldValue.name !== log.newValue.name) {
            changes.push(`নাম: ${log.oldValue.name} → ${log.newValue.name}`);
        }
        if (log.oldValue.phone !== log.newValue.phone) {
            changes.push(`ফোন: ${log.oldValue.phone} → ${log.newValue.phone}`);
        }
        if (log.oldValue.status !== log.newValue.status) {
            changes.push(`স্ট্যাটাস: ${log.oldValue.status} → ${log.newValue.status}`);
        }
        if (changes.length > 0) {
            return `${log.newValue.name} এর তথ্য ${action}: ${changes.join(', ')}`;
        }
        return `${log.newValue.name} এর তথ্য ${action}`;
    }

    if (log.action === 'DELETE_USER' && log.oldValue) {
        return `${log.oldValue.name} নামে ${entityType} ${action}`;
    }

    if (log.action === 'UPDATE_USER_PERMISSIONS' && log.newValue) {
        return `${entityType} এর পারমিশন ${action}`;
    }

    return `${entityType} ${action}`;
};

// Format timestamp
const formatTimestamp = (timestamp: string): string => {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'এইমাত্র';
        if (diffInMinutes < 60) return `${diffInMinutes} মিনিট আগে`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ঘন্টা আগে`;

        return format(date, 'dd MMM yyyy, hh:mm a', { locale: bn });
    } catch (error) {
        return timestamp;
    }
};

const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Load recent activities
    const loadActivities = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/activity-logs', {
                params: {
                    page: 1,
                    limit: 10,
                    entityType: 'USER', // Only show user-related activities
                },
            });

            if (response.data.success) {
                setActivities(response.data.data.logs);
            }
        } catch (error: any) {
            console.error('Error loading activities:', error);
            toast.error('কার্যকলাপ লোড করতে ব্যর্থ');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    return (
        <Card sx={{ borderRadius: 2, boxShadow: '0px 1px 3px 0px #0000001a, 0px 1px 2px -1px #0000001a' }}>
            <CardContent>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1e2939', mb: 2 }}>
                    সাম্প্রতিক কার্যকলাপ
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : activities.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography sx={{ color: '#6a7282', fontSize: 14 }}>
                            কোনো কার্যকলাপ পাওয়া যায়নি
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {activities.map((activity, index) => (
                            <React.Fragment key={activity.id}>
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    {/* User Avatar */}
                                    <Avatar
                                        sx={{
                                            bgcolor: getActionColor(activity.action),
                                            width: 40,
                                            height: 40,
                                            fontSize: 16,
                                        }}
                                    >
                                        {activity.user.firstName.charAt(0).toUpperCase()}
                                    </Avatar>

                                    {/* Activity Details */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1e2939' }}>
                                                {activity.user.firstName} {activity.user.lastName}
                                            </Typography>
                                            <Chip
                                                label={activity.user.role}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: 11,
                                                    bgcolor: '#f3f4f6',
                                                    color: '#4a5565',
                                                }}
                                            />
                                        </Stack>

                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                color: '#4a5565',
                                                mt: 0.5,
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {formatActivityDescription(activity)}
                                        </Typography>

                                        <Typography sx={{ fontSize: 12, color: '#9ca3af', mt: 0.5 }}>
                                            {formatTimestamp(activity.timestamp)}
                                        </Typography>
                                    </Box>
                                </Stack>

                                {/* Divider between activities */}
                                {index < activities.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
};

export default ActivityFeed;
