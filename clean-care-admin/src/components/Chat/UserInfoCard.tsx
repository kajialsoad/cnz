import React from 'react';
import { Box, Typography, Avatar, Chip, Paper } from '@mui/material';
import {
    Person as PersonIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Badge as BadgeIcon,
} from '@mui/icons-material';

interface UserInfoCardProps {
    user: {
        id: number;
        name: string;
        phone?: string;
        email?: string;
        ward?: string;
        zone?: string;
        cityCorporation?: string;
        profilePicture?: string;
        role?: string;
    };
    compact?: boolean;
}

/**
 * UserInfoCard Component
 * Displays user information in a card format for Live Chat
 * Features:
 * - User avatar with fallback to initials
 * - User name and contact information
 * - Location details (ward, zone, city corporation)
 * - Role badge
 * - Compact mode for smaller displays
 */
const UserInfoCard: React.FC<UserInfoCardProps> = ({ user, compact = false }) => {
    /**
     * Get user initials from name
     */
    const getUserInitials = (name: string): string => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    /**
     * Get role color
     */
    const getRoleColor = (role?: string): string => {
        switch (role?.toUpperCase()) {
            case 'ADMIN':
            case 'WARD_ADMIN':
                return '#1976d2';
            case 'ZONE_ADMIN':
                return '#2e7d32';
            case 'SUPER_ADMIN':
            case 'MASTER_ADMIN':
                return '#d32f2f';
            default:
                return '#757575';
        }
    };

    /**
     * Format role name
     */
    const formatRoleName = (role?: string): string => {
        if (!role) return 'User';
        return role
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    if (compact) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                }}
            >
                {/* Avatar */}
                <Avatar
                    src={user.profilePicture}
                    alt={user.name}
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: getRoleColor(user.role),
                        fontSize: '0.9rem',
                        fontWeight: 600,
                    }}
                >
                    {!user.profilePicture && getUserInitials(user.name)}
                </Avatar>

                {/* User Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {user.name}
                    </Typography>
                    {user.phone && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {user.phone}
                        </Typography>
                    )}
                </Box>

                {/* Role Badge */}
                {user.role && (
                    <Chip
                        label={formatRoleName(user.role)}
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: getRoleColor(user.role),
                            color: 'white',
                        }}
                    />
                )}
            </Box>
        );
    }

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
            }}
        >
            {/* Header with Avatar and Name */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 2,
                }}
            >
                {/* Avatar */}
                <Avatar
                    src={user.profilePicture}
                    alt={user.name}
                    sx={{
                        width: 64,
                        height: 64,
                        bgcolor: getRoleColor(user.role),
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                >
                    {!user.profilePicture && getUserInitials(user.name)}
                </Avatar>

                {/* Name and Role */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {user.name}
                    </Typography>
                    {user.role && (
                        <Chip
                            icon={<BadgeIcon sx={{ fontSize: '0.9rem' }} />}
                            label={formatRoleName(user.role)}
                            size="small"
                            sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                bgcolor: getRoleColor(user.role),
                                color: 'white',
                            }}
                        />
                    )}
                </Box>
            </Box>

            {/* Contact Information */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                }}
            >
                {/* Phone */}
                {user.phone && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                        }}
                    >
                        <PhoneIcon
                            sx={{
                                fontSize: '1.2rem',
                                color: 'primary.main',
                            }}
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.primary',
                                fontWeight: 500,
                            }}
                        >
                            {user.phone}
                        </Typography>
                    </Box>
                )}

                {/* Email */}
                {user.email && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                        }}
                    >
                        <PersonIcon
                            sx={{
                                fontSize: '1.2rem',
                                color: 'primary.main',
                            }}
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.primary',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {user.email}
                        </Typography>
                    </Box>
                )}

                {/* Location */}
                {(user.ward || user.zone || user.cityCorporation) && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                        }}
                    >
                        <LocationIcon
                            sx={{
                                fontSize: '1.2rem',
                                color: 'primary.main',
                                mt: 0.2,
                            }}
                        />
                        <Box>
                            {user.ward && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'text.primary',
                                        fontWeight: 500,
                                    }}
                                >
                                    Ward {user.ward}
                                </Typography>
                            )}
                            {user.zone && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        display: 'block',
                                    }}
                                >
                                    Zone {user.zone}
                                </Typography>
                            )}
                            {user.cityCorporation && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        display: 'block',
                                    }}
                                >
                                    {user.cityCorporation}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default UserInfoCard;
