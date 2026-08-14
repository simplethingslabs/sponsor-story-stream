-- Migration 008: Quarterly attendance percentage on reports
-- Replaces daily attendance tracking with a single manually-entered
-- attendance_percentage per progress report (per quarter).

-- Add attendance_percentage to progress_reports
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS attendance_percentage NUMERIC(5,2)
    CHECK (attendance_percentage IS NULL OR (attendance_percentage >= 0 AND attendance_percentage <= 100));

-- Fresh start: existing reports predate this field and are not being backfilled
TRUNCATE TABLE progress_reports CASCADE;

-- Drop daily attendance tracking entirely (superseded by attendance_percentage above)
DROP TRIGGER IF EXISTS trigger_attendance_updated_at ON attendance;
DROP FUNCTION IF EXISTS update_attendance_updated_at();
DROP TABLE IF EXISTS attendance;
