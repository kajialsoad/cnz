/**
 * useProfileUpdate Hook
 * Provides profile update functionality with comprehensive validation and error handling
 * 
 * Features:
 * - Form state management
 * - Comprehensive validation
 * - Success/error handling
 * - Loading states
 * - Retry logic
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useState, useCallback } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import type { ProfileUpdateData } from '../types/profile.types';
import { validateProfileUpdate, sanitizeString } from '../utils/profileValidation';

interface UseProfileUpdateOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

interface UseProfileUpdateReturn {
    updateProfile: (data: ProfileUpdateData) => Promise<void>;
    isUpdating: boolean;
    updateError: string | null;
    validationErrors: Record<string, string>;
    clearUpdateError: () => void;
    clearValidationErrors: () => void;
}

/**
 * Hook for updating user profile
 * Provides convenient interface for profile updates with comprehensive error handling
 */
export const useProfileUpdate = (options?: UseProfileUpdateOptions): UseProfileUpdateReturn => {
    const { updateProfile: contextUpdateProfile } = useProfile();
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const updateProfile = useCallback(async (data: ProfileUpdateData) => {
        setIsUpdating(true);
        setUpdateError(null);
        setValidationErrors({});

        try {
            // Check if data is provided
            if (!data || Object.keys(data).length === 0) {
                throw new Error('No data provided for update');
            }

            // Validate data
            const validation = validateProfileUpdate(data);
            if (!validation.isValid) {
                setValidationErrors(validation.errors);
                const errorMessage = Object.values(validation.errors)[0];
                throw new Error(errorMessage);
            }

            // Sanitize data before sending
            const sanitizedData: ProfileUpdateData = {};
            if (data.firstName) {
                sanitizedData.firstName = sanitizeString(data.firstName);
            }
            if (data.lastName) {
                sanitizedData.lastName = sanitizeString(data.lastName);
            }
            if (data.avatar) {
                sanitizedData.avatar = data.avatar.trim();
            }
            if (data.ward) {
                sanitizedData.ward = sanitizeString(data.ward);
            }
            if (data.zone) {
                sanitizedData.zone = sanitizeString(data.zone);
            }
            if (data.address) {
                sanitizedData.address = sanitizeString(data.address);
            }

            // Update profile
            await contextUpdateProfile(sanitizedData);

            // Call success callback
            options?.onSuccess?.();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
            setUpdateError(errorMessage);
            options?.onError?.(errorMessage);
            throw err;
        } finally {
            setIsUpdating(false);
        }
    }, [contextUpdateProfile, options]);

    const clearUpdateError = useCallback(() => {
        setUpdateError(null);
    }, []);

    const clearValidationErrors = useCallback(() => {
        setValidationErrors({});
    }, []);

    return {
        updateProfile,
        isUpdating,
        updateError,
        validationErrors,
        clearUpdateError,
        clearValidationErrors,
    };
};
