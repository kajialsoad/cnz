import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLanguage } from '../../../../contexts/LanguageContext';

const WelcomeBanner: React.FC = () => {
    const { user } = useAuth();
    const { language } = useLanguage();

    if (!user) return null;

    // Role display mapping
    const roleDisplay = {
        MASTER_ADMIN: {
            en: 'MASTER ADMIN / Chief Controller',
            bn: 'মাস্টার অ্যাডমিন / প্রধান নিয়ন্ত্রক',
        },
        SUPER_ADMIN: {
            en: 'SUPER ADMIN / Senior Controller',
            bn: 'সুপার অ্যাডমিন / সিনিয়র নিয়ন্ত্রক',
        },
        ADMIN: {
            en: 'ADMIN / Controller',
            bn: 'অ্যাডমিন / নিয়ন্ত্রক',
        },
        WARD_INSPECTOR: {
            en: 'WARD INSPECTOR',
            bn: 'ওয়ার্ড ইন্সপেক্টর',
        },
    };

    const welcomeText = language === 'bn' ? 'স্বাগতম' : 'Welcome';
    const roleText = roleDisplay[user.role as keyof typeof roleDisplay]?.[language] || user.role;

    return (
        <Paper
            elevation={0}
            sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: 2,
                p: 3,
                mb: 3,
                color: 'white',
            }}
        >
            <Box>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    {welcomeText}, {user.firstName} {user.lastName}
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        opacity: 0.95,
                        fontWeight: 500,
                        letterSpacing: '0.5px',
                    }}
                >
                    {roleText}
                </Typography>
                {user.cityCorporation && (
                    <Typography
                        variant="body2"
                        sx={{
                            opacity: 0.9,
                            mt: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                        }}
                    >
                        📍 {user.cityCorporation.name}
                        {user.zone && ` • Zone ${user.zone.zoneNumber}`}
                        {user.ward && ` • Ward ${user.ward.wardNumber}`}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export default WelcomeBanner;
