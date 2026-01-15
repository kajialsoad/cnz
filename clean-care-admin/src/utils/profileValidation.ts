/**
 * Profile Validation Utilities
 * Comprehensive validation for profile-related data
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * Validate first name
 */
export function validateFirstName(value: string): string | null {
    if (!value || !value.trim()) {
        return 'First name is required';
    }

    const trimmed = value.trim();

    if (trimmed.length < 2) {
        return 'First name must be at least 2 characters';
    }

    if (trimmed.length > 50) {
        return 'First name must not exceed 50 characters';
    }

    // Allow letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
        return 'First name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // Check for excessive spaces
    if (/\s{2,}/.test(trimmed)) {
        return 'First name cannot contain multiple consecutive spaces';
    }

    return null;
}

/**
 * Validate last name
 */
export function validateLastName(value: string): string | null {
    // Last name is optional - allow empty
    if (!value || !value.trim()) {
        return null;
    }

    const trimmed = value.trim();

    if (trimmed.length < 2) {
        return 'Last name must be at least 2 characters';
    }

    if (trimmed.length > 50) {
        return 'Last name must not exceed 50 characters';
    }

    // Allow letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
        return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // Check for excessive spaces
    if (/\s{2,}/.test(trimmed)) {
        return 'Last name cannot contain multiple consecutive spaces';
    }

    return null;
}

/**
 * Validate email
 */
export function validateEmail(value: string): string | null {
    if (!value || !value.trim()) {
        return 'Email is required';
    }

    const trimmed = value.trim();

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return 'Please enter a valid email address';
    }

    if (trimmed.length > 255) {
        return 'Email must not exceed 255 characters';
    }

    return null;
}

/**
 * Validate phone number (Bangladesh format)
 */
export function validatePhone(value: string): string | null {
    if (!value || !value.trim()) {
        return 'Phone number is required';
    }

    const trimmed = value.trim();

    // Bangladesh phone number format: 01XXXXXXXXX
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(trimmed)) {
        return 'Please enter a valid Bangladesh phone number (01XXXXXXXXX)';
    }

    return null;
}

/**
 * Validate ward
 */
export function validateWard(value: string): string | null {
    if (!value || !value.trim()) {
        return null; // Ward is optional
    }

    const trimmed = value.trim();

    if (trimmed.length > 20) {
        return 'Ward must not exceed 20 characters';
    }

    // Allow alphanumeric and basic punctuation
    if (!/^[a-zA-Z0-9\s\-/]+$/.test(trimmed)) {
        return 'Ward can only contain letters, numbers, spaces, hyphens, and slashes';
    }

    return null;
}

/**
 * Validate zone
 */
export function validateZone(value: string): string | null {
    if (!value || !value.trim()) {
        return null; // Zone is optional
    }

    const trimmed = value.trim();

    if (trimmed.length > 20) {
        return 'Zone must not exceed 20 characters';
    }

    // Allow alphanumeric and basic punctuation
    if (!/^[a-zA-Z0-9\s\-/]+$/.test(trimmed)) {
        return 'Zone can only contain letters, numbers, spaces, hyphens, and slashes';
    }

    return null;
}

/**
 * Validate address
 */
export function validateAddress(value: string): string | null {
    if (!value || !value.trim()) {
        return null; // Address is optional
    }

    const trimmed = value.trim();

    if (trimmed.length < 10) {
        return 'Address must be at least 10 characters';
    }

    if (trimmed.length > 200) {
        return 'Address must not exceed 200 characters';
    }

    return null;
}

/**
 * Validate avatar URL
 */
export function validateAvatarUrl(value: string): string | null {
    if (!value || !value.trim()) {
        return null; // Avatar is optional
    }

    const trimmed = value.trim();

    try {
        const url = new URL(trimmed);

        // Check if it's HTTP or HTTPS
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return 'Avatar URL must use HTTP or HTTPS protocol';
        }

        // Check for common image hosting domains (optional, can be removed)
        const validDomains = ['cloudinary.com', 'imgur.com', 'amazonaws.com'];
        const isValidDomain = validDomains.some(domain => url.hostname.includes(domain));

        if (!isValidDomain) {
            // Still allow it, just warn
            console.warn('Avatar URL is from an uncommon domain:', url.hostname);
        }

        return null;
    } catch {
        return 'Avatar must be a valid URL';
    }
}

/**
 * Validate file for upload
 */
export interface FileValidationOptions {
    maxSizeInMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
}

export function validateFile(
    file: File,
    options: FileValidationOptions = {}
): string | null {
    const {
        maxSizeInMB = 5,
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'],
    } = options;

    // Check if file exists
    if (!file) {
        return 'No file selected';
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return `Invalid file type. Allowed types: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
        return `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`;
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        return `File size exceeds ${maxSizeInMB}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }

    // Check minimum file size (to avoid empty files)
    const minSizeInBytes = 1024; // 1KB
    if (file.size < minSizeInBytes) {
        return 'File is too small. Minimum size is 1KB';
    }

    return null;
}

/**
 * Validate profile update data
 */
export function validateProfileUpdate(data: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    ward?: string;
    zone?: string;
    address?: string;
}): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate first name if provided
    if (data.firstName !== undefined) {
        const error = validateFirstName(data.firstName);
        if (error) errors.firstName = error;
    }

    // Validate last name if provided
    if (data.lastName !== undefined) {
        const error = validateLastName(data.lastName);
        if (error) errors.lastName = error;
    }

    // Validate avatar if provided
    if (data.avatar !== undefined) {
        const error = validateAvatarUrl(data.avatar);
        if (error) errors.avatar = error;
    }

    // Validate ward if provided
    if (data.ward !== undefined) {
        const error = validateWard(data.ward);
        if (error) errors.ward = error;
    }

    // Validate zone if provided
    if (data.zone !== undefined) {
        const error = validateZone(data.zone);
        if (error) errors.zone = error;
    }

    // Validate address if provided
    if (data.address !== undefined) {
        const error = validateAddress(data.address);
        if (error) errors.address = error;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(value: string): string {
    if (!value) return '';

    return value
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
        .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Check if profile data has changes
 */
export function hasProfileChanges(
    current: Record<string, any>,
    updated: Record<string, any>
): boolean {
    const keys = Object.keys(updated);

    for (const key of keys) {
        const currentValue = current[key] ?? '';
        const updatedValue = updated[key] ?? '';

        if (currentValue !== updatedValue) {
            return true;
        }
    }

    return false;
}
