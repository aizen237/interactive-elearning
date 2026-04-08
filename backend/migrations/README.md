# Database Migration Guide

## Parent Dashboard Migration

### Migration File: `add_parent_id_to_users.sql`

This migration adds parent-child relationship functionality to the users table.

### What It Does:
1. Adds `parent_id` column to `users` table
2. Creates foreign key constraint linking to `users.id`
3. Adds index for better query performance

### How to Run:

#### Option 1: MySQL Command Line
```bash
mysql -u root -p elearning_db < migrations/add_parent_id_to_users.sql
```

#### Option 2: MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database
3. Open the migration file
4. Execute the SQL

#### Option 3: Direct MySQL
```sql
USE elearning_db;
SOURCE /path/to/backend/migrations/add_parent_id_to_users.sql;
```

### Verify Migration:
```sql
DESCRIBE users;
```

You should see:
- `parent_id` column (INT, NULL, after `role`)
- Foreign key constraint `fk_parent_id`

### Link a Student to a Parent:
```sql
-- Example: Link student (ID 5) to parent (ID 3)
UPDATE users 
SET parent_id = 3 
WHERE id = 5 AND role = 'Student';
```

### Test Data (Optional):
```sql
-- Create a test parent
INSERT INTO users (username, password, full_name, role, phone_number)
VALUES ('parent1', '$2b$10$...', 'Test Parent', 'Parent', '1234567890');

-- Link existing student to parent
UPDATE users 
SET parent_id = LAST_INSERT_ID() 
WHERE username = 'student1';
```

### Rollback (if needed):
```sql
-- Remove foreign key
ALTER TABLE users DROP FOREIGN KEY fk_parent_id;

-- Remove index
DROP INDEX idx_parent_id ON users;

-- Remove column
ALTER TABLE users DROP COLUMN parent_id;
```
