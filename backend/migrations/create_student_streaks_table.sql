-- Migration: Create student_streaks table
-- This table tracks student practice streaks for gamification

-- Create student_streaks table
CREATE TABLE IF NOT EXISTS student_streaks (
    student_id INT PRIMARY KEY,
    current_streak INT DEFAULT 0,
    last_activity_date DATE,
    longest_streak INT DEFAULT 0,
    CONSTRAINT fk_streak_student 
        FOREIGN KEY (student_id) REFERENCES users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Add index for querying students with active streaks
CREATE INDEX idx_current_streak ON student_streaks(current_streak);

-- Add index for querying by last activity date (useful for streak reminders)
CREATE INDEX idx_last_activity ON student_streaks(last_activity_date);

-- Verify the table creation
DESCRIBE student_streaks;
