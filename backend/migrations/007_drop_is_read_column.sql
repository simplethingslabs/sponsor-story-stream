-- Migration 007: Remove orphaned is_read column from notifications
--
-- Background:
--   Migration 001 created notifications.is_read (BOOLEAN NOT NULL DEFAULT false).
--   Migration 003 added read_at (TIMESTAMP) and backfilled it from is_read.
--   Since migration 003 the entire backend uses read_at exclusively;
--   is_read is never updated and permanently reads false for every row.
--
-- This migration:
--   1. Drops the stale index that references is_read.
--   2. Drops the is_read column.
--   3. Adds a lean partial index on read_at IS NULL (fast unread-count queries).

-- Step 1: Drop the stale index (uses the orphaned column)
DROP INDEX IF EXISTS idx_notifications_read;

-- Step 2: Drop the orphaned column
ALTER TABLE notifications DROP COLUMN IF EXISTS is_read;

-- Step 3: Add partial index for unread notifications
--         Covers the two most common query patterns:
--           WHERE user_id = $1 AND read_at IS NULL   (unread list / count)
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON notifications (user_id, created_at DESC)
    WHERE read_at IS NULL;
