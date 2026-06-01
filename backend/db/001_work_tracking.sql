-- Migration: Add work tracking and progress updates to complaints

-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'CITIZEN';

-- Add progress tracking columns to complaints table
ALTER TABLE complaints ADD COLUMN progress_percentage INTEGER DEFAULT 0;
ALTER TABLE complaints ADD COLUMN assigned_contractor_id UUID;

-- Create work_updates table
CREATE TABLE work_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    updated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    progress_percentage INTEGER NOT NULL,
    update_note TEXT,
    before_image_url VARCHAR(500),
    after_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_work_updates_complaint ON work_updates(complaint_id);
CREATE INDEX idx_work_updates_user ON work_updates(updated_by_user_id);
CREATE INDEX idx_complaints_progress ON complaints(progress_percentage);
CREATE INDEX idx_users_role ON users(role);
