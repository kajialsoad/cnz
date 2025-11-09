import type { AppUser } from './user.types';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in-progress' | 'resolved' | 'cancelled';
  
  // Location information
  location: ComplaintLocation;
  
  // User information
  reporter: AppUser;
  
  // Assignment information
  assignedTo?: Staff;
  assignedAt?: Date;
  
  // Media attachments
  attachments: ComplaintAttachment[];
  
  // Timeline
  activities: ComplaintActivity[];
  
  // Metadata
  reportedAt: Date;
  expectedResolution?: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
  feedback?: ComplaintFeedback;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplaintCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  estimatedResolutionTime?: number; // in hours
}

export interface ComplaintLocation {
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  landmark?: string;
  area?: string;
  ward?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  avatar?: string;
  isAvailable: boolean;
  currentAssignments: number;
  maxAssignments: number;
}

export interface ComplaintAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  description?: string;
}

export interface ComplaintActivity {
  id: string;
  type: 'created' | 'assigned' | 'status_changed' | 'comment_added' | 'resolved' | 'cancelled';
  description: string;
  performedBy: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: Date;
}

export interface ComplaintFeedback {
  rating: number; // 1-5 stars
  comment?: string;
  wouldRecommend: boolean;
  submittedAt: Date;
}

export interface ComplaintFilters {
  search?: string;
  category?: string[];
  priority?: string[];
  status?: string[];
  assignedTo?: string[];
  reportedDateFrom?: Date;
  reportedDateTo?: Date;
  location?: {
    city?: string;
    state?: string;
    area?: string;
  };
  hasAttachments?: boolean;
  hasFeedback?: boolean;
  sortBy?: 'reportedAt' | 'priority' | 'status' | 'category' | 'assignedTo';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateComplaintRequest {
  title: string;
  description: string;
  categoryId: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location: Omit<ComplaintLocation, 'coordinates'> & {
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  attachments?: File[];
  reporterId?: string; // If creating on behalf of user
}

export interface UpdateComplaintRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'assigned' | 'in-progress' | 'resolved' | 'cancelled';
  assignedToId?: string;
  resolutionNotes?: string;
  expectedResolution?: Date;
}

export interface AssignComplaintRequest {
  complaintId: string;
  staffId: string;
  notes?: string;
  expectedResolution?: Date;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
  avgResolutionTime: number; // in hours
  satisfactionRating: number; // average rating
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
  }>;
  byPriority: Array<{
    priority: string;
    count: number;
  }>;
}