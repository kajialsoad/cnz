-- Add indexes for chat system performance optimization
-- This will significantly improve query speed for 500K+ users

-- Chat message indexes
CREATE INDEX IF NOT EXISTS idx_chat_complaint_id ON ComplaintChatMessage(complaintId);
CREATE INDEX IF NOT EXISTS idx_chat_sender_id ON ComplaintChatMessage(senderId);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON ComplaintChatMessage(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_chat_read_status ON ComplaintChatMessage(read, senderType);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_chat_complaint_unread ON ComplaintChatMessage(complaintId, read, senderType);
CREATE INDEX IF NOT EXISTS idx_chat_complaint_created ON ComplaintChatMessage(complaintId, createdAt DESC);

-- Complaint indexes
CREATE INDEX IF NOT EXISTS idx_complaint_user_id ON Complaint(userId);
CREATE INDEX IF NOT EXISTS idx_complaint_status ON Complaint(status);
CREATE INDEX IF NOT EXISTS idx_complaint_created_at ON Complaint(createdAt DESC);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_city_corporation ON User(cityCorporationId);
CREATE INDEX IF NOT EXISTS idx_user_thana ON User(thanaId);
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_user_phone ON User(phone);

-- Composite indexes for filtering
CREATE INDEX IF NOT EXISTS idx_complaint_status_created ON Complaint(status, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_user_status ON Complaint(userId, status);
