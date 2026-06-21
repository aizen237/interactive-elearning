-- Migration: Create notifications table
-- This table stores all notifications for Students, Parents, and Admins

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_type ENUM(
        'badge_earned',
        'level_up',
        'streak_reminder',
        'child_quiz_complete',
        'child_milestone',
        'admin_operation',
        'admin_security'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_notification_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Add index for user notifications ordered by creation time (most recent first)
CREATE INDEX idx_user_created ON notifications(user_id, created_at DESC);

-- Add index for querying unread notifications efficiently
CREATE INDEX idx_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Verify the table creation
DESCRIBE notifications;
