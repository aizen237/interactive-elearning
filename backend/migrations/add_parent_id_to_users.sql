-- Migration: Add parent_id column to users table
-- This allows linking students to their parents

-- Add parent_id column
ALTER TABLE users 
ADD COLUMN parent_id INT NULL AFTER role;

-- Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_parent_id 
FOREIGN KEY (parent_id) REFERENCES users(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_parent_id ON users(parent_id);

-- Verify the changes
DESCRIBE users;
