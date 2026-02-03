import React from 'react';
import type { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface RoleBasedRouteProps {
    children: ReactNode;
    allowedRoles: string[];
    redirectTo?: string;
    showForbiddenPage?: boolean; // If false, silently redirects instead of showing 403
}

/**
 * RoleBasedRoute Component
 * 
 * Protects routes based on user role. If user's role is not in allowedRoles,
 * either shows a 403 Forbidden error page or redirects to dashboard.
 * 
 * Features:
 * - Route protection based on role
 * - 403 Forbidden error page for unauthorized access
 * - Automatic redirect option
 * - User-friendly error messages
 * 
 * Requirements: 20.4, 20.5, 20.6, 20.7
 * 
 * @param children - The protected content to render
 * @param allowedRoles - Array of roles that can access this route
 * @param redirectTo - Where to redirect unauthorized users (default: '/')
 * @param showForbiddenPage - If true, shows 403 page; if false, silently redirects (default: true)
 */
export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
    children,
    allowedRoles,
    redirectTo = '/',
    showForbiddenPage = true,
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Check if user's role is allowed
    const isAllowed = user?.role && allowedRoles.includes(user.role);

    // If not allowed, either show 403 page or redirect
    if (!isAllowed) {
        // Option 1: Silent redirect (for programmatic navigation)
        if (!showForbiddenPage) {
            return <Navigate to={redirectTo} replace />;
        }

        // Option 2: Show 403 Forbidden page (default behavior)
        // This provides better UX by explaining why access was denied
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    padding: 3,
                }}
            >
                <Box
                    sx={{
                        textAlign: 'center',
                        backgroundColor: 'white',
                        borderRadius: 4,
                        padding: 6,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        maxWidth: 500,
                    }}
                >
                    <LockIcon
                        sx={{
                            fontSize: 80,
                            color: '#f44336',
                            marginBottom: 2,
                        }}
                    />
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            color: '#333',
                            marginBottom: 2,
                        }}
                    >
                        403
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 600,
                            color: '#555',
                            marginBottom: 1,
                        }}
                    >
                        Access Forbidden
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#777',
                            marginBottom: 4,
                        }}
                    >
                        You don't have permission to access this page.
                        {user?.role && (
                            <>
                                <br />
                                Your role: <strong>{user.role}</strong>
                            </>
                        )}
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate(redirectTo)}
                        sx={{
                            backgroundColor: '#3FA564',
                            color: 'white',
                            padding: '12px 32px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: '#2D7A4A',
                            },
                        }}
                    >
                        Go to Dashboard
                    </Button>
                </Box>
            </Box>
        );
    }

    // If allowed, render the protected content
    return <>{children}</>;
};



