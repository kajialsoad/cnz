/**
 * Profile Context
 * Provides global profile state management with caching and synchronization
 * 
 * Features:
 * - Global profile state accessible throughout the app
 * - Automatic caching to reduce API calls
 * - Cross-tab synchronization using localStorage events
 * - Error handling and loading states
 * - Profile update and avatar upload functionality
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { profileService } from '../services/profileService';
import type { UserProfile, ProfileUpdateData, ProfileContextValue } from '../types/profile.types';

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

// Cache configuration
const CACHE_KEY = 'cc_profile_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const SYNC_EVENT = 'cc_profile_update';

interface CachedProfile {
    data: UserProfile;
    timestamp: number;
}

interface ProfileProviderProps {
    children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isInitialized = useRef(false);

    /**
     * Load profile from cache
     */
    const loadFromCache = useCallback((): UserProfile | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const { data, timestamp }: CachedProfile = JSON.parse(cached);
            const now = Date.now();

            // Check if cache is still valid
            if (now - timestamp < CACHE_DURATION) {
                return data;
            }

            // Cache expired, remove it
            localStorage.removeItem(CACHE_KEY);
            return null;
        } catch (error) {
            console.error('Failed to load profile from cache:', error);
            return null;
        }
    }, []);

    /**
     * Save profile to cache
     */
    const saveToCache = useCallback((profileData: UserProfile) => {
        try {
            const cached: CachedProfile = {
                data: profileData,
                timestamp: Date.now(),
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
        } catch (error) {
            console.error('Failed to save profile to cache:', error);
        }
    }, []);

    /**
     * Broadcast profile update to other tabs
     */
    const broadcastUpdate = useCallback((profileData: UserProfile) => {
        try {
            localStorage.setItem(SYNC_EVENT, JSON.stringify({
                data: profileData,
                timestamp: Date.now(),
            }));
            // Remove the event immediately to allow repeated updates
            localStorage.removeItem(SYNC_EVENT);
        } catch (error) {
            console.error('Failed to broadcast profile update:', error);
        }
    }, []);

    /**
     * Refresh profile from API with retry logic
     */
    const refreshProfile = useCallback(async () => {
        // Check if user is authenticated before fetching
        const hasToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!hasToken) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const profileData = await profileService.getProfile();
            setProfile(profileData);
            saveToCache(profileData);
            broadcastUpdate(profileData);
        } catch (err: any) {
            // Silently fail for expected errors when user is not logged in
            // Don't log or set error state for these cases
            const errorMessage = err instanceof Error ? err.message : '';
            const isExpectedError =
                errorMessage.includes('Network error') ||
                errorMessage.includes('timed out') ||
                errorMessage.includes('expired') ||
                errorMessage.toLowerCase().includes('unauthorized') ||
                errorMessage.includes('404') ||
                errorMessage.includes('401');

            if (isExpectedError) {
                // Silently ignore - user is not logged in yet
                setIsLoading(false);
                return;
            }

            // Only log and set error for unexpected errors
            setError(errorMessage || 'Failed to load profile');
            console.error('Profile refresh error:', err);

            // Don't throw error, just set it in state
            // This allows the app to continue functioning with cached data
        } finally {
            setIsLoading(false);
        }
    }, [saveToCache, broadcastUpdate]);

    /**
     * Update profile with validation and error handling
     */
    const updateProfile = useCallback(async (data: ProfileUpdateData) => {
        setIsLoading(true);
        setError(null);

        try {
            // Validate that we have data to update
            // Allow empty data when only password is being changed (handled separately in ProfileEditForm)
            if (!data || Object.keys(data).length === 0) {
                // Don't throw error - just return current profile
                // This allows password-only changes to work
                setIsLoading(false);
                return;
            }

            const updatedProfile = await profileService.updateProfile(data);
            setProfile(updatedProfile);
            saveToCache(updatedProfile);
            broadcastUpdate(updatedProfile);

            // Clear all related caches to force refresh everywhere
            try {
                localStorage.removeItem('cc_users_cache');
                localStorage.removeItem('cc_admins_cache');
                localStorage.removeItem('cc_super_admins_cache');
                // Trigger a storage event to notify other components
                window.dispatchEvent(new Event('storage'));
            } catch (cacheError) {
                console.error('Failed to clear related caches:', cacheError);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
            setError(errorMessage);
            throw err; // Re-throw to allow caller to handle
        } finally {
            setIsLoading(false);
        }
    }, [saveToCache, broadcastUpdate]);

    /**
     * Upload avatar with validation and error handling
     */
    const uploadAvatar = useCallback(async (file: File): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            // Validate file exists
            if (!file) {
                throw new Error('No file provided for upload');
            }

            const avatarUrl = await profileService.uploadAvatar(file);

            // Update profile with new avatar
            if (profile) {
                const updatedProfile = { ...profile, avatar: avatarUrl };
                setProfile(updatedProfile);
                saveToCache(updatedProfile);
                broadcastUpdate(updatedProfile);
            } else {
                console.warn('Profile not loaded, avatar URL not saved to profile');
            }

            return avatarUrl;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [profile, saveToCache, broadcastUpdate]);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Initialize profile on mount
     */
    useEffect(() => {
        // Check if user has a token before fetching profile
        const hasToken = localStorage.getItem('accessToken') || localStorage.getItem('token');

        // Reset initialization if no token (after logout)
        if (!hasToken) {
            isInitialized.current = false;
            setProfile(null);
            setIsLoading(false);
            return;
        }

        // Only initialize once when token is available
        if (isInitialized.current) return;
        isInitialized.current = true;

        // Try to load from cache first
        const cachedProfile = loadFromCache();
        if (cachedProfile) {
            setProfile(cachedProfile);
            setIsLoading(false); // Set loading to false immediately when cache is available
        }

        // Then refresh from API in the background
        refreshProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount - token changes handled by storage event

    /**
     * Listen for auth events (login/logout) from AuthContext
     */
    useEffect(() => {
        const handleLogin = () => {
            console.log('🔄 ProfileContext: Login event detected, reinitializing profile');
            isInitialized.current = false; // Reset to allow re-initialization

            // Check if token exists
            const hasToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
            if (!hasToken) return;

            isInitialized.current = true;

            // Try to load from cache first
            const cachedProfile = loadFromCache();
            if (cachedProfile) {
                setProfile(cachedProfile);
                setIsLoading(false);
            }

            // Then refresh from API
            refreshProfile();
        };

        const handleLogout = () => {
            console.log('🔄 ProfileContext: Logout event detected, clearing profile');
            isInitialized.current = false;
            setProfile(null);
            setIsLoading(false);
            localStorage.removeItem(CACHE_KEY);
        };

        window.addEventListener('auth:login', handleLogin);
        window.addEventListener('auth:logout', handleLogout);

        return () => {
            window.removeEventListener('auth:login', handleLogin);
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, [loadFromCache, refreshProfile]);

    /**
     * Listen for logout/login events to clear/reinitialize profile
     */
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            // Handle profile sync from other tabs
            if (event.key === SYNC_EVENT && event.newValue) {
                try {
                    const { data } = JSON.parse(event.newValue);
                    setProfile(data);
                    saveToCache(data);
                } catch (error) {
                    console.error('Failed to sync profile from other tab:', error);
                }
            }

            // Handle logout - clear profile when token is removed
            if (event.key === 'accessToken' && !event.newValue) {
                isInitialized.current = false;
                setProfile(null);
                setIsLoading(false);
                localStorage.removeItem(CACHE_KEY);
            }

            // Handle login - reinitialize when token is added
            if (event.key === 'accessToken' && event.newValue && !isInitialized.current) {
                isInitialized.current = true;
                const cachedProfile = loadFromCache();
                if (cachedProfile) {
                    setProfile(cachedProfile);
                    setIsLoading(false);
                }
                refreshProfile();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [saveToCache, loadFromCache, refreshProfile]);

    const value: ProfileContextValue = {
        profile,
        isLoading,
        error,
        refreshProfile,
        updateProfile,
        uploadAvatar,
        clearError,
    };

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

/**
 * Hook to access profile context
 * Must be used within ProfileProvider
 */
export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};


