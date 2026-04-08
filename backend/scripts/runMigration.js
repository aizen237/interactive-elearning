// scripts/runMigration.js
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...\n');

    // Check if column already exists
    const [columns] = await db.execute("SHOW COLUMNS FROM users LIKE 'parent_id'");
    
    if (columns.length > 0) {
      console.log('ℹ️  Column parent_id already exists. Skipping migration.');
      process.exit(0);
    }

    console.log('📝 Adding parent_id column to users table...');
    
    // Add parent_id column
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN parent_id INT NULL AFTER role
    `);
    console.log('✅ Column added successfully');

    console.log('🔗 Adding foreign key constraint...');
    
    // Add foreign key constraint
    await db.execute(`
      ALTER TABLE users
      ADD CONSTRAINT fk_parent_id 
      FOREIGN KEY (parent_id) REFERENCES users(id) 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);
    console.log('✅ Foreign key constraint added');

    console.log('📊 Adding index for performance...');
    
    // Add index
    await db.execute(`
      CREATE INDEX idx_parent_id ON users(parent_id)
    `);
    console.log('✅ Index added');

    // Verify the changes
    console.log('\n📋 Verifying table structure...');
    const [rows] = await db.execute('DESCRIBE users');
    console.table(rows);

    console.log('\n✅ Migration completed successfully!');
    console.log('📊 The users table now has a parent_id column.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
