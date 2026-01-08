import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useProfile } from '../../../../contexts/ProfileContext';

const WelcomeBanner: React.FC = () => {
    const { user } = useAuth();
    const { profile } = useProfile();
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

    // Use profile data if available (supports assignedZones), otherwise fallback to auth user data
    const cityCorporationName = profile?.cityCorporationCode || user.cityCorporation?.name;
    // Note: profile.cityCorporationCode is a string code (e.g. DNCC), user.cityCorporation.name is full name. 
    // Ideally we want the full name. Let's try to get it from profile.cityCorporationCode if possible, 
    // but the profile type only has the code string locally unless we fetched the object.
    // However, looking at ProfileContext, it fetches profile from API which returns cityCorporation object potentially? 
    // API returns cityCorporationCode string in the root and cityCorporation object nested.
    // Let's check profile type again. It has cityCorporationCode?: string. 
    // Actually the API response has cityCorporation object.

    // Let's stick to safe fallbacks.
    const displayCity = user.cityCorporation?.name || profile?.cityCorporationCode;

    const assignedZones = profile?.assignedZones;
    const singleZone = profile?.zone || user.zone;
    const ward = profile?.ward || user.ward;

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
                {(displayCity || singleZone || (assignedZones && assignedZones.length > 0)) && (
                    <Typography
                        variant="body2"
                        sx={{
                            opacity: 0.9,
                            mt: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            flexWrap: 'wrap'
                        }}
                    >
                        {displayCity && `📍 ${displayCity}`}

                        {(assignedZones && assignedZones.length > 0) ? (
                            ` • Zones: ${assignedZones.map(az => az.zone.name).join(', ')}`
                        ) : (
                            singleZone && ` • ${typeof singleZone === 'string' ? singleZone : `Zone ${singleZone.zoneNumber}`}`
                        )}

                        {ward && ` • ${typeof ward === 'string' ? ward : `Ward ${ward.wardNumber}`}`}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export default WelcomeBanner;
