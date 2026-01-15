/**
 * Profile-related type definitions
 */

export interface UserProfile {
    id: number;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'MASTER_ADMIN';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
    emailVerified: boolean;
    phoneVerified: boolean;
    ward?: string;
    zone?: string;
    address?: string;
    cityCorporationCode?: string;
    cityCorporation?: {
        code: string;
        name: string;
    };
    thanaId?: number;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    assignedZones?: {
        id: number;
        zone: {
            id: number;
            name: string;
            zoneNumber?: number;
        };
    }[];
    assignedWards?: {
        id: number;
        wardNumber?: number;
        number?: number;
        cityCorporationId?: number;
    }[];
}

export interface ProfileUpdateData {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    ward?: string;
    zone?: string;
    address?: string;
    email?: string;
    phone?: string;
}

export interface ProfileContextValue {
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
    updateProfile: (data: ProfileUpdateData) => Promise<void>;
    uploadAvatar: (file: File) => Promise<string>;
    clearError: () => void;
}

export interface ProfileUpdateResponse {
    success: boolean;
    message: string;
    data: UserProfile;
}

export interface AvatarUploadResponse {
    success: boolean;
    data: {
        url: string;
        publicId?: string;
        filename?: string;
    };
    message?: string;
}
