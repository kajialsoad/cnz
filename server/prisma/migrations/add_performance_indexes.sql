-- Performance Optimization Indexes Migration
-- This migration adds indexes for all filtered fields to improve query performance

-- User table indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_role_citycorp ON users(role, cityCorporationCode);
CREATE INDEX IF NOT EXISTS idx_users_lastlogin ON users(lastLoginAt);
CREATE INDEX IF NOT EXISTS idx_users_createdat_role ON users(createdAt, role);

-- Complaint table indexes for statistics and filtering
CREATE INDEX IF NOT EXISTS idx_complaints_userid_createdat ON Complaint(userId, createdAt);
CREATE INDEX IF NOT EXISTS idx_complaints_status_createdat ON Complaint(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_complaints_wardid_status ON Complaint(wardId, status);
CREATE INDEX IF NOT EXISTS idx_complaints_assignedadmin_status ON Complaint(assignedAdminId, status);

-- ActivityLog indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_activitylogs_userid_action ON activity_logs(userId, action);
CREATE INDEX IF NOT EXISTS idx_activitylogs_entitytype_timestamp ON activity_logs(entityType, timestamp);
CREATE INDEX IF NOT EXISTS idx_activitylogs_action_timestamp ON activity_logs(action, timestamp);

-- ChatMessage indexes for conversation queries
CREATE INDEX IF NOT EXISTS idx_chatmessages_sender_receiver ON ChatMessage(senderId, receiverId);
CREATE INDEX IF NOT EXISTS idx_chatmessages_receiver_isread ON ChatMessage(receiverId, isRead);
CREATE INDEX IF NOT EXISTS idx_chatmessages_createdat_desc ON ChatMessage(createdAt DESC);

-- ComplaintChatMessage indexes for complaint conversations
CREATE INDEX IF NOT EXISTS idx_complaint_chat_complaintid_createdat ON complaint_chat_messages(complaintId, createdAt);
CREATE INDEX IF NOT EXISTS idx_complaint_chat_read ON complaint_chat_messages(read, createdAt);

-- Session indexes for active session queries
CREATE INDEX IF NOT EXISTS idx_sessions_userid_expiresat ON sessions(userId, expiresAt);
CREATE INDEX IF NOT EXISTS idx_sessions_expiresat ON sessions(expiresAt);

-- Notification indexes for user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_userid_isread_createdat ON Notification(userId, isRead, createdAt);

-- Zone and Ward indexes for cascading filters
CREATE INDEX IF NOT EXISTS idx_zones_citycorp_status ON zones(cityCorporationId, status);
CREATE INDEX IF NOT EXISTS idx_wards_zoneid_citycorp ON wards(zoneId, cityCorporationId);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_users_role_citycorp_zone_ward ON users(role, cityCorporationCode, zoneId, wardId);
CREATE INDEX IF NOT EXISTS idx_complaints_userid_status_createdat ON Complaint(userId, status, createdAt);
