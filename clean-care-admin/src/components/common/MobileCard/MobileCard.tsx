/**
 * MobileCard Component
 * Card-based layout for displaying table data on mobile devices
 */

import React from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    Avatar,
    Chip,
    IconButton,
    Stack,
    Divider,
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ChatBubbleOutline as ChatIcon,
} from '@mui/icons-material';
import { mobileStyles } from '../../../styles/responsive';

export interface MobileCardAction {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export interface MobileCardField {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export interface MobileCardProps {
    avatar?: {
        src?: string;
        alt?: string;
        fallback: string;
        color?: string;
    };
    title: string;
    subtitle?: string;
    status?: {
        label: string;
        color: string;
        bgColor: string;
    };
    fields: MobileCardField[];
    actions?: MobileCardAction[];
    onClick?: () => void;
}

const MobileCard: React.FC<MobileCardProps> = ({
    avatar,
    title,
    subtitle,
    status,
    fields,
    actions,
    onClick,
}) => {
    return (
        <Card
            sx={{
                ...mobileStyles.mobileTableCard,
                cursor: onClick ? 'pointer' : 'default',
            }}
            onClick={onClick}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Header Section */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    {/* Avatar */}
                    {avatar && (
                        <Avatar
                            src={avatar.src}
                            alt={avatar.alt}
                            sx={{
                                width: 48,
                                height: 48,
                                bgcolor: avatar.color || '#4CAF50',
                                mr: 1.5,
                                fontSize: 18,
                                fontWeight: 600,
                            }}
                        >
                            {!avatar.src && avatar.fallback}
                        </Avatar>
                    )}

                    {/* Title and Subtitle */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontSize: 16,
                                fontWeight: 600,
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    fontSize: 14,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    {/* Status Chip */}
                    {status && (
                        <Chip
                            label={status.label}
                            size="small"
                            sx={{
                                bgcolor: status.bgColor,
                                color: status.color,
                                fontWeight: 500,
                                fontSize: 12,
                                height: 24,
                                ml: 1,
                            }}
                        />
                    )}
                </Box>

                {/* Fields Section */}
                <Box sx={{ mb: actions && actions.length > 0 ? 2 : 0 }}>
                    {fields.map((field, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                mb: 1.5,
                                ...(field.fullWidth && {
                                    flexDirection: 'column',
                                }),
                            }}
                        >
                            {/* Field Label */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    minWidth: field.fullWidth ? 'auto' : 100,
                                    mr: field.fullWidth ? 0 : 2,
                                    mb: field.fullWidth ? 0.5 : 0,
                                }}
                            >
                                {field.icon && (
                                    <Box
                                        sx={{
                                            mr: 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: 'text.secondary',
                                        }}
                                    >
                                        {field.icon}
                                    </Box>
                                )}
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                    }}
                                >
                                    {field.label}:
                                </Typography>
                            </Box>

                            {/* Field Value */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {typeof field.value === 'string' ? (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: 'text.primary',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {field.value}
                                    </Typography>
                                ) : (
                                    field.value
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* Actions Section */}
                {actions && actions.length > 0 && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                            alignItems="center"
                        >
                            {actions.map((action, index) => (
                                <IconButton
                                    key={index}
                                    size="medium"
                                    color={action.color || 'default'}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick();
                                    }}
                                    sx={{
                                        minWidth: 44,
                                        minHeight: 44,
                                    }}
                                    aria-label={action.label}
                                >
                                    {action.icon}
                                </IconButton>
                            ))}
                        </Stack>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default MobileCard;
