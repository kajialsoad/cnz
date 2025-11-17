/**
 * Error types for better error categorization
 */
export const ErrorType = {
    NETWORK: 'NETWORK',
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    VALIDATION: 'VALIDATION',
    NOT_FOUND: 'NOT_FOUND',
    SERVER: 'SERVER',
    UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

/**
 * Enhanced error information
 */
export interface EnhancedError {
    type: ErrorType;
    message: string;
    userMessage: string;
    statusCode?: number;
    retryable: boolean;
    details?: any;
}

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
    return (
        !error.response &&
        (error.code === 'ECONNABORTED' ||
            error.code === 'ERR_NETWORK' ||
            error.message === 'Network Error' ||
            error.message?.includes('timeout'))
    );
};

/**
 * Get error type from error object
 */
export const getErrorType = (error: any): ErrorType => {
    if (isNetworkError(error)) {
        return ErrorType.NETWORK;
    }

    const statusCode = error.response?.status || error.statusCode;

    if (statusCode === 401) {
        return ErrorType.AUTHENTICATION;
    }

    if (statusCode === 403) {
        return ErrorType.AUTHORIZATION;
    }

    if (statusCode === 404) {
        return ErrorType.NOT_FOUND;
    }

    if (statusCode >= 400 && statusCode < 500) {
        return ErrorType.VALIDATION;
    }

    if (statusCode >= 500) {
        return ErrorType.SERVER;
    }

    return ErrorType.UNKNOWN;
};

/**
 * Get user-friendly error message based on error type
 */
export const getUserFriendlyMessage = (
    errorType: ErrorType,
    originalMessage?: string
): string => {
    switch (errorType) {
        case ErrorType.NETWORK:
            return 'Unable to connect to the server. Please check your internet connection and try again.';
        case ErrorType.AUTHENTICATION:
            return 'Your session has expired. Please log in again.';
        case ErrorType.AUTHORIZATION:
            return 'You do not have permission to perform this action.';
        case ErrorType.NOT_FOUND:
            return 'The requested resource was not found.';
        case ErrorType.VALIDATION:
            return originalMessage || 'Invalid data provided. Please check your input and try again.';
        case ErrorType.SERVER:
            return 'A server error occurred. Please try again later.';
        case ErrorType.UNKNOWN:
        default:
            return originalMessage || 'An unexpected error occurred. Please try again.';
    }
};

/**
 * Check if error is retryable
 */
export const isRetryable = (errorType: ErrorType): boolean => {
    const retryableTypes: ErrorType[] = [
        ErrorType.NETWORK,
        ErrorType.SERVER,
        ErrorType.UNKNOWN,
    ];
    return retryableTypes.includes(errorType);
};

/**
 * Handle API error and convert to enhanced error
 */
export const handleApiError = (error: any): EnhancedError => {
    const errorType = getErrorType(error);
    const statusCode = error.response?.status || error.statusCode;
    const originalMessage = error.response?.data?.message || error.message;
    const userMessage = getUserFriendlyMessage(errorType, originalMessage);
    const retryable = isRetryable(errorType);

    return {
        type: errorType,
        message: originalMessage || 'An error occurred',
        userMessage,
        statusCode,
        retryable,
        details: error.response?.data?.errors,
    };
};

/**
 * Format error message for display
 */
export const formatErrorMessage = (error: any): string => {
    const enhancedError = handleApiError(error);
    return enhancedError.userMessage;
};

/**
 * Log error for debugging (can be extended to send to error tracking service)
 */
export const logError = (error: any, context?: string): void => {
    const enhancedError = handleApiError(error);

    console.error('Error occurred:', {
        context,
        type: enhancedError.type,
        message: enhancedError.message,
        statusCode: enhancedError.statusCode,
        retryable: enhancedError.retryable,
        details: enhancedError.details,
        timestamp: new Date().toISOString(),
    });

    // In production, you could send this to an error tracking service like Sentry
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: { context, enhancedError } });
    // }
};
