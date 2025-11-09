-- User Sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(100) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Verification Tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(100) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login Audit Trail
CREATE TABLE login_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN,
    failure_reason VARCHAR(100),
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Events
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaints Table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    location POINT NOT NULL,
    address TEXT,
    area VARCHAR(100),
    ward_number VARCHAR(10),
    city VARCHAR(50),
    postal_code VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    estimated_cost DECIMAL(10,2) DEFAULT 0,
    actual_cost DECIMAL(10,2) DEFAULT 0,
    estimated_duration_hours INTEGER DEFAULT 24,
    actual_duration_hours INTEGER,
    scheduled_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    tags TEXT[],
    metadata JSONB,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaint Images
CREATE TABLE complaint_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(20) DEFAULT 'before' CHECK (image_type IN ('before', 'after', 'during')),
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaint Status History
CREATE TABLE complaint_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaint Comments
CREATE TABLE complaint_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    comment TEXT NOT NULL,
    parent_comment_id UUID REFERENCES complaint_comments(id),
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cleaner Assignments
CREATE TABLE cleaner_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    cleaner_id UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    assignment_type VARCHAR(20) DEFAULT 'direct' CHECK (assignment_type IN ('direct', 'bid', 'auto')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work Progress Tracking
CREATE TABLE work_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    cleaner_id UUID REFERENCES users(id),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status VARCHAR(50),
    description TEXT,
    images TEXT[],
    location POINT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Plans
CREATE TABLE payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BDT',
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    features JSONB,
    max_complaints INTEGER DEFAULT 10,
    max_storage_mb INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES payment_plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    subscription_id UUID REFERENCES user_subscriptions(id),
    complaint_id UUID REFERENCES complaints(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BDT',
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    gateway_response JSONB,
    failure_reason TEXT,
    refunded_amount DECIMAL(10,2) DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name VARCHAR(100),
    donor_email VARCHAR(255),
    donor_phone VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BDT',
    donation_type VARCHAR(50) DEFAULT 'general' CHECK (donation_type IN ('general', 'specific_complaint', 'area_development')),
    complaint_id UUID REFERENCES complaints(id),
    area VARCHAR(100),
    message TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    payment_status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet System
CREATE TABLE user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
    currency VARCHAR(3) DEFAULT 'BDT',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES user_wallets(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255),
    body_template TEXT NOT NULL,
    sms_template TEXT,
    push_template TEXT,
    variables TEXT[],
    channel VARCHAR(20) DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id),
    title VARCHAR(255),
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    read_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Queue
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    attachments JSONB,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Queue
CREATE TABLE sms_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    provider VARCHAR(50),
    priority INTEGER DEFAULT 5,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notices
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    notice_type VARCHAR(50) DEFAULT 'general' CHECK (notice_type IN ('general', 'emergency', 'maintenance', 'update', 'feature')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'citizens', 'cleaners', 'admins')),
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Government Calendar Events
CREATE TABLE government_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('holiday', 'maintenance_day', 'collection_day', 'special_event')),
    area VARCHAR(100),
    ward_number VARCHAR(10),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waste Collection Schedule
CREATE TABLE waste_collection_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area VARCHAR(100) NOT NULL,
    ward_number VARCHAR(10),
    collection_day VARCHAR(20) NOT NULL CHECK (collection_day IN ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')),
    collection_time_start TIME,
    collection_time_end TIME,
    waste_types TEXT[],
    special_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery Images
CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category VARCHAR(50) DEFAULT 'general',
    tags TEXT[],
    uploaded_by UUID REFERENCES users(id),
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_complaints_location ON complaints USING GIST(location);
CREATE INDEX idx_complaints_scheduled_date ON complaints(scheduled_date);

CREATE INDEX idx_complaint_images_complaint_id ON complaint_images(complaint_id);
CREATE INDEX idx_complaint_images_type ON complaint_images(image_type);

CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Full Text Search Indexes
CREATE INDEX idx_complaints_fts ON complaints USING GIN(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_notices_fts ON notices USING GIN(to_tsvector('english', title || ' ' || content));

-- Composite Indexes
CREATE INDEX idx_complaints_user_status ON complaints(user_id, status);
CREATE INDEX idx_complaints_area_status ON complaints(area, status);
CREATE INDEX idx_complaints_priority_status ON complaints(priority, status);
CREATE INDEX idx_payment_user_status ON payment_transactions(user_id, status);
CREATE INDEX idx_notification_user_status ON notifications(user_id, status);