/**
 * Profile Error Handler
 * Centralized error handling for profile operations
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import axios, { AxiosError } from 'axios';

export enum ProfileErrorType {
    NETWORK_ERROR = 'NETWORK_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    SERVER_ERROR = 'SERVER_ERROR',
    UPLOAD_ERROR = 'UPLOAD_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ProfileError {
    type: ProfileErrorType;
    message: string;
    details?: any;
    retryable: boolean;
    statusCode?: number;
}

/**
 * Parse error from API response
 */
export function parseApiError(error: unknown): ProfileError {
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;

        // Network error (no response)
        if (!axiosError.response) {
            if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
                return {
                    type: ProfileErrorType.TIMEOUT_ERROR,
                    message: 'Request timed out. Please check your internet connection and try again.',
                    retryable: true,
                };
            }

            return {
                type: ProfileErrorType.NETWORK_ERROR,
                message: 'Network error. Please check your internet connection and try again.',
                retryable: true,
            };
        }

        const { status, data } = axiosError.response;

        // Authentication error (401)
        if (status === 401) {
            return {
                type: ProfileErrorType.AUTHENTICATION_ERROR,
                message: data?.message || 'Your session has expired. Please log in again.',
                statusCode: status,
                retryable: false,
            };
        }

        // Authorization error (403)
        if (status === 403) {
            return {
                type: ProfileErrorType.AUTHORIZATION_ERROR,
                message: data?.message || 'You do not have permission to perform this action.',
                statusCode: status,
                retryable: false,
            };
        }

        // Validation error (400)
        if (status === 400) {
            return {
                type: ProfileErrorType.VALIDATION_ERROR,
                message: data?.message || 'Invalid data provided. Please check your input.',
                details: data?.issues || data?.errors,
                statusCode: status,
                retryable: false,
            };
        }

        // Server error (500+)
        if (status >= 500) {
            return {
                type: ProfileErrorType.SERVER_ERROR,
                message: data?.message || 'Server error. Please try again later.',
                statusCode: status,
                retryable: true,
            };
        }

        // Other HTTP errors
        return {
            type: ProfileErrorType.UNKNOWN_ERROR,
            message: data?.message || `Request failed with status ${status}`,
            statusCode: status,
            retryable: false,
        };
    }

    // Handle standard Error objects
    if (error instanceof Error) {
        return {
            type: ProfileErrorType.UNKNOWN_ERROR,
            message: error.message,
            retryable: false,
        };
    }

    // Handle unknown errors
    return {
        type: ProfileErrorType.UNKNOWN_ERROR,
        message: 'An unexpected error occurred. Please try again.',
        retryable: false,
    };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: ProfileError): string {
    switch (error.type) {
        case ProfileErrorType.NETWORK_ERROR:
            return 'Unable to connect to the server. Please check your internet connection.';

        case ProfileErrorType.TIMEOUT_ERROR:
            return 'The request took too long. Please try again.';

        case ProfileErrorType.AUTHENTICATION_ERROR:
            return 'Your session has expired. Please log in again.';

        case ProfileErrorType.AUTHORIZATION_ERROR:
            return 'You do not have permission to perform this action.';

        case ProfileErrorType.VALIDATION_ERROR:
            return error.message || 'Please check your input and try again.';

        case ProfileErrorType.SERVER_ERROR:
            return 'Server error. Our team has been notified. Please try again later.';

        case ProfileErrorType.UPLOAD_ERROR:
            return error.message || 'Failed to upload file. Please try again.';

        default:
            return error.message || 'An unexpected error occurred. Please try again.';
    }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ProfileError): boolean {
    return error.retryable;
}

/**
 * Get retry delay based on attempt number (exponential backoff)
 */
export function getRetryDelay(attemptNumber: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);
    return delay;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    onRetry?: (attempt: number, error: ProfileError) => void
): Promise<T> {
    let lastError: ProfileError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = parseApiError(error);

            // Don't retry if error is not retryable
            if (!lastError.retryable) {
                throw lastError;
            }

            // Don't retry on last attempt
            if (attempt === maxRetries) {
                throw lastError;
            }

            // Call retry callback
            onRetry?.(attempt, lastError);

            // Wait before retrying
            const delay = getRetryDelay(attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Retry failed');
}

/**
 * Handle profile fetch error
 */
export function handleProfileFetchError(error: unknown): ProfileError {
    const parsedError = parseApiError(error);

    // Log error for debugging
    console.error('Profile fetch error:', {
        type: parsedError.type,
        message: parsedError.message,
        statusCode: parsedError.statusCode,
        details: parsedError.details,
    });

    return parsedError;
}

/**
 * Handle profile update error
 */
export function handleProfileUpdateError(error: unknown): ProfileError {
    const parsedError = parseApiError(error);

    // Log error for debugging
    console.error('Profile update error:', {
        type: parsedError.type,
        message: parsedError.message,
        statusCode: parsedError.statusCode,
        details: parsedError.details,
    });

    // Check for specific validation errors
    if (parsedError.type === ProfileErrorType.VALIDATION_ERROR && parsedError.details) {
        // Format validation errors
        if (Array.isArray(parsedError.details)) {
            const errorMessages = parsedError.details.map((issue: any) => {
                return issue.message || issue.path?.join('.') || 'Validation error';
            });
            parsedError.message = errorMessages.join(', ');
        }
    }

    return parsedError;
}

/**
 * Handle avatar upload error
 */
export function handleAvatarUploadError(error: unknown): ProfileError {
    const parsedError = parseApiError(error);
    parsedError.type = ProfileErrorType.UPLOAD_ERROR;

    // Log error for debugging
    console.error('Avatar upload error:', {
        type: parsedError.type,
        message: parsedError.message,
        statusCode: parsedError.statusCode,
        details: parsedError.details,
    });

    // Provide more specific error messages for upload errors
    if (parsedError.statusCode === 413) {
        parsedError.message = 'File is too large. Please choose a smaller image.';
    } else if (parsedError.statusCode === 415) {
        parsedError.message = 'Invalid file type. Please upload a JPG, PNG, or WebP image.';
    }

    return parsedError;
}

/**
 * Check if user should be logged out due to error
 */
export function shouldLogoutUser(error: ProfileError): boolean {
    return error.type === ProfileErrorType.AUTHENTICATION_ERROR;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string>): string {
    const errorMessages = Object.entries(errors).map(([field, message]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        return `${fieldName}: ${message}`;
    });

    return errorMessages.join('\n');
}
