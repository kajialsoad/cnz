import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types/auth.types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already authenticated on mount
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const profile = await authService.getProfile();
            setUser(profile);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string, rememberMe: boolean = false) => {
        const response = await authService.login({ email, password, rememberMe });
        setUser(response.user);
        setIsLoading(false); // Ensure loading is false after successful login

        // Dispatch custom event to notify ProfileContext
        window.dispatchEvent(new CustomEvent('auth:login'));
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setIsLoading(false); // Reset loading state after logout

        // Dispatch custom event to notify ProfileContext
        window.dispatchEvent(new CustomEvent('auth:logout'));
    };

    const refreshProfile = async () => {
        try {
            const profile = await authService.getProfile();
            setUser(profile);
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
