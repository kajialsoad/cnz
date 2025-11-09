export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  
  // Recipients
  recipients: NotificationRecipient[];
  
  // Delivery channels
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  
  // Scheduling
  scheduledAt?: Date;
  sentAt?: Date;
  
  // Template information
  templateId?: string;
  template?: NotificationTemplate;
  
  // Status tracking
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  deliveryStats: DeliveryStats;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRecipient {
  id: string;
  type: 'user' | 'admin' | 'staff' | 'all_users' | 'all_admins';
  identifier?: string; // user ID, admin ID, or email
  name?: string;
  email?: string;
  phone?: string;
  deliveryStatus: {
    email?: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
    sms?: 'pending' | 'sent' | 'delivered' | 'failed';
    push?: 'pending' | 'sent' | 'delivered' | 'failed';
    in_app?: 'pending' | 'sent' | 'read' | 'dismissed';
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  bodyTemplate: string;
  variables: TemplateVariable[];
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  category: 'system' | 'complaint' | 'user' | 'marketing' | 'emergency';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: string;
  example?: string;
}

export interface DeliveryStats {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  opened?: number;
  clicked?: number;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  recipients: {
    type: 'user' | 'admin' | 'staff' | 'all_users' | 'all_admins';
    identifiers?: string[]; // specific user/admin IDs or emails
    filters?: {
      userStatus?: string[];
      location?: string[];
      registeredAfter?: Date;
      lastLoginAfter?: Date;
    };
  };
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  templateId?: string;
  variables?: Record<string, string>;
  scheduledAt?: Date;
}

export interface BroadcastSettings {
  enableEmail: boolean;
  enableSMS: boolean;
  enablePush: boolean;
  enableInApp: boolean;
  
  // Rate limiting
  maxEmailsPerHour: number;
  maxSMSPerHour: number;
  maxPushPerHour: number;
  
  // Retry settings
  retryAttempts: number;
  retryDelay: number; // in minutes
  
  // Delivery preferences
  preferredSendTime: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  
  // Opt-out handling
  respectUserPreferences: boolean;
  autoUnsubscribeAfterBounce: boolean;
}

export interface NotificationFilters {
  search?: string;
  type?: string[];
  status?: string[];
  priority?: string[];
  channels?: string[];
  createdBy?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'sentAt' | 'title' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  
  byType: Record<string, number>;
  byChannel: Record<string, number>;
  byStatus: Record<string, number>;
  
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
}