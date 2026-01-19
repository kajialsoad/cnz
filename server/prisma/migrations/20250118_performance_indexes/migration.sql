-- Performance Optimization Indexes for 500K Users
-- This migration adds composite indexes to improve query performance

-- Complaint table indexes
-- For location-based filtering (cityCorporation + zone + ward)
CREATE INDEX IF NOT EXISTS idx_complaint_location 
  ON complaints(complaintCityCorporationCode, complaintZoneId, complaintWardId);

-- For status + date range queries (dashboard, analytics)
CREATE INDEX IF NOT EXISTS idx_complaint_status_date 
  ON complaints(status, createdAt);

-- For user activity queries
CREATE INDEX IF NOT EXISTS idx_complaint_user_date 
  ON complaints(userId, createdAt);

-- For assigned admin queries
CREATE INDEX IF NOT EXISTS idx_complaint_assigned_status 
  ON complaints(assignedAdminId, status);

-- User table indexes
-- For city corporation + role filtering
CREATE INDEX IF NOT EXISTS idx_user_city_role 
  ON users(cityCorporationCode, role);

-- For zone-based filtering
CREATE INDEX IF NOT EXISTS idx_user_zone_role 
  ON users(zoneId, role);

-- For ward-based filtering
CREATE INDEX IF NOT EXISTS idx_user_ward_role 
  ON users(wardId, role);

-- Activity log indexes
-- For user activity history
CREATE INDEX IF NOT EXISTS idx_activity_user_date 
  ON activity_logs(userId, createdAt);

-- For entity tracking
CREATE INDEX IF NOT EXISTS idx_activity_entity 
  ON activity_logs(entityType, entityId);

-- Chat message indexes
-- For conversation queries
CREATE INDEX IF NOT EXISTS idx_chat_complaint_date 
  ON chat_messages(complaintId, createdAt);

-- For sender queries
CREATE INDEX IF NOT EXISTS idx_chat_sender_date 
  ON chat_messages(senderId, createdAt);

-- Notification indexes
-- For user notifications
CREATE INDEX IF NOT EXISTS idx_notification_user_read 
  ON notifications(userId, isRead, createdAt);

-- Review indexes
-- For complaint reviews
CREATE INDEX IF NOT EXISTS idx_review_complaint 
  ON reviews(complaintId, createdAt);

-- For user reviews
CREATE INDEX IF NOT EXISTS idx_review_user 
  ON reviews(userId, createdAt);

-- Zone and Ward indexes
-- For city corporation filtering
CREATE INDEX IF NOT EXISTS idx_zone_city_status 
  ON zones(cityCorporationId, status);

CREATE INDEX IF NOT EXISTS idx_ward_city_status 
  ON wards(cityCorporationId, status);

-- For zone-ward relationship
CREATE INDEX IF NOT EXISTS idx_ward_zone 
  ON wards(zoneId, status);
