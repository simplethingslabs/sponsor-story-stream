-- Migration: Add missing columns used by controllers

-- Add password_hash to pending_registrations
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add deleted_by to soft-delete tables
ALTER TABLE children ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

-- Add review workflow columns to progress_reports
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Add updated_at to sponsorships if not exists
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add trigger for sponsorships updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_sponsorships_updated_at ON sponsorships;
CREATE TRIGGER update_sponsorships_updated_at
    BEFORE UPDATE ON sponsorships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fix notifications: add read_at column (keep is_read for backward compatibility)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing is_read to read_at
UPDATE notifications 
SET read_at = CURRENT_TIMESTAMP 
WHERE is_read = true AND read_at IS NULL;

-- Update progress_reports status to include new statuses
-- First check if constraint exists and drop it
ALTER TABLE progress_reports DROP CONSTRAINT IF EXISTS progress_reports_status_check;

-- Add updated constraint with all statuses
ALTER TABLE progress_reports ADD CONSTRAINT progress_reports_status_check 
    CHECK (status IN ('draft', 'pending_review', 'needs_revision', 'approved', 'published'));
