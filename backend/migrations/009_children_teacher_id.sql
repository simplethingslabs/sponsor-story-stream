-- Migration 009: Teacher assignment on children
-- Adds a current-state teacher_id pointer to children so a student can be
-- assigned to (and later reassigned to a different) teacher. One teacher per
-- student; not a history of past assignments.

ALTER TABLE children ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_children_teacher_id ON children(teacher_id) WHERE deleted_at IS NULL;
