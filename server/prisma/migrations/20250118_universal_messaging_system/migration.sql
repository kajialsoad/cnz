-- Universal Messaging System Migration
-- Created: 2025-01-18
-- Purpose: Add tables for direct user-to-user messaging with role-based organization

-- 1. Conversations Table (for efficient contact list and last message tracking)
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_id INTEGER,
  last_message_at TIMESTAMP,
  unread_count_user1 INTEGER DEFAULT 0,
  unread_count_user2 INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_conversation UNIQUE(user1_id, user2_id)
);

-- 2. Messages Table (for direct user-to-user messages)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  image_url TEXT,
  voice_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. First Message Confirmations Table (safety feature)
CREATE TABLE IF NOT EXISTS first_message_confirmations (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_confirmation UNIQUE(sender_id, receiver_id)
);

-- 4. Blocked Users Table (privacy feature)
CREATE TABLE IF NOT EXISTS blocked_users (
  id SERIAL PRIMARY KEY,
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_block UNIQUE(blocker_id, blocked_id)
);

-- Add foreign key for last_message_id after messages table is created
ALTER TABLE conversations 
ADD CONSTRAINT fk_last_message 
FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Indexes for Performance Optimization

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- First message confirmations indexes
CREATE INDEX IF NOT EXISTS idx_confirmations_sender ON first_message_confirmations(sender_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_receiver ON first_message_confirmations(receiver_id);

-- Blocked users indexes
CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_blocked ON blocked_users(blocked_id);

-- Add is_online and last_seen to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='is_online') THEN
    ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='last_seen') THEN
    ALTER TABLE users ADD COLUMN last_seen TIMESTAMP;
  END IF;
END $$;

-- Create index for online status
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);
