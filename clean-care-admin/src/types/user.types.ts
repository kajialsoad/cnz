export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  address?: Address;
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  phoneVerified: boolean;
  preferences: UserPreferences;
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  lastLogin?: Date;
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    locationSharing: boolean;
  };
}

export interface UserFilters {
  search?: string;
  status?: string[];
  emailVerified?: boolean;
  phoneVerified?: boolean;
  registrationDateFrom?: Date;
  registrationDateTo?: Date;
  lastLoginFrom?: Date;
  lastLoginTo?: Date;
  city?: string;
  state?: string;
  sortBy?: 'name' | 'email' | 'registrationDate' | 'lastLogin' | 'totalComplaints';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Partial<Address>;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Partial<Address>;
  status?: 'active' | 'inactive' | 'suspended';
  preferences?: Partial<UserPreferences>;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  emailVerified: number;
  phoneVerified: number;
  newThisMonth: number;
  newThisWeek: number;
}