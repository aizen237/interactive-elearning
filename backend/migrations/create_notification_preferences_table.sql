-- Migration: Create notification_preferences table
-- This table stores user preferences for which notification types they want to receive

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    badge_earned BOOLEAN DEFAULT TRUE,
    level_up BOOLEAN DEFAULT TRUE,
    streak_reminder BOOLEAN DEFAULT TRUE,
    child_quiz_complete BOOLEAN DEFAULT TRUE,
    child_milestone BOOLEAN DEFAULT TRUE,
    admin_operation BOOLEAN DEFAULT TRUE,
    admin_security BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_preference_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Add index for faster user preference lookups
CREATE INDEX idx_preference_user ON notification_preferences(user_id);

-- Verify the table creation
DESCRIBE notification_preferences;
