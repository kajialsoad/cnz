# Migration: Add Live Chat Fields to ChatMessage

**Date**: January 20, 2025  
**Task**: 1.1 - Update ChatMessage Schema  
**Feature**: Dual Chat System

## Overview

This migration adds support for the new Live Chat system by extending the existing `ChatMessage` table with additional fields needed to distinguish it from the Complaint Chat system.

## Changes Made

### 1. Added `voiceUrl` Field
- **Type**: VARCHAR(500)
- **Nullable**: Yes
- **Purpose**: Store URLs for voice message recordings in Live Chat

### 2. Added `senderType` Field
- **Type**: ENUM('ADMIN', 'CITIZEN')
- **Default**: 'CITIZEN'
- **Purpose**: Identify whether the message sender is an admin or a citizen

### 3. Added Index
- **Name**: `idx_receiver_unread`
- **Columns**: (`receiverId`, `isRead`)
- **Purpose**: Optimize queries for fetching unread messages for a specific user

## Database Impact

- **Table Modified**: `ChatMessage`
- **New Columns**: 2 (`voiceUrl`, `senderType`)
- **New Indexes**: 1 (`idx_receiver_unread`)
- **Breaking Changes**: None (all new fields are nullable or have defaults)

## Rollback

To rollback this migration:

```sql
-- Remove index
ALTER TABLE `ChatMessage` DROP INDEX `idx_receiver_unread`;

-- Remove columns
ALTER TABLE `ChatMessage` DROP COLUMN `senderType`;
ALTER TABLE `ChatMessage` DROP COLUMN `voiceUrl`;
```

## Testing

After applying this migration:

1. Verify the schema:
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

2. Test that existing ChatMessage records still work
3. Test creating new messages with the new fields

## Related Files

- `server/prisma/schema.prisma` - Updated Prisma schema
- `.kiro/specs/dual-chat-system/design.md` - Design document
- `.kiro/specs/dual-chat-system/requirements.md` - Requirements document

## Notes

- The `ChatMessage` table is being repurposed for the Live Chat system
- The existing `ComplaintChatMessage` table remains unchanged for complaint-specific chats
- This maintains complete separation between the two chat systems
