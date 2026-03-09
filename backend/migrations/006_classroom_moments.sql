-- Migration 006: Classroom Moments
-- Stores teacher-uploaded photos/videos that can be tagged with students and linked to events

CREATE TABLE IF NOT EXISTS classroom_moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    caption TEXT NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS moment_tags (
    moment_id UUID NOT NULL REFERENCES classroom_moments(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    PRIMARY KEY (moment_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_moments_teacher ON classroom_moments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classroom_moments_status ON classroom_moments(status);
CREATE INDEX IF NOT EXISTS idx_moment_tags_child ON moment_tags(child_id);
