// scripts/runNotificationMigrations.js
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function tableExists(tableName) {
  try {
    const [tables] = await db.execute(
      `SHOW TABLES LIKE '${tableName}'`
    );
    return tables.length > 0;
  } catch (error) {
    return false;
  }
}

async function runMigration(migrationName, sqlFile) {
  console.log(`\n📝 Running migration: ${migrationName}...`);
  
  const sqlPath = path.join(__dirname, '..', 'migrations', sqlFile);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Remove comments and split by semicolons
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.toUpperCase().startsWith('DESCRIBE'));
  
  for (const statement of statements) {
    try {
      await db.execute(statement);
      console.log(`  ✓ Executed statement`);
    } catch (error) {
      // Ignore "already exists" errors
      if (!error.message.includes('already exists') && !error.message.includes('Duplicate')) {
        console.error(`  ✗ Failed to execute statement:`, statement.substring(0, 100));
        throw error;
      } else {
        console.log(`  ℹ️  Skipped (already exists)`);
      }
    }
  }
  
  console.log(`✅ ${migrationName} completed`);
}

async function runNotificationMigrations() {
  try {
    console.log('🔄 Starting notification system migrations...\n');

    // Migration 1: Create student_streaks table
    const streaksExists = await tableExists('student_streaks');
    if (streaksExists) {
      console.log('ℹ️  Table student_streaks already exists. Skipping...');
    } else {
      await runMigration('Create student_streaks table', 'create_student_streaks_table.sql');
    }

    // Migration 2: Create notification_preferences table
    const preferencesExists = await tableExists('notification_preferences');
    if (preferencesExists) {
      console.log('ℹ️  Table notification_preferences already exists. Skipping...');
    } else {
      await runMigration('Create notification_preferences table', 'create_notification_preferences_table.sql');
    }

    // Migration 3: Create notifications table
    const notificationsExists = await tableExists('notifications');
    if (notificationsExists) {
      console.log('ℹ️  Table notifications already exists. Skipping...');
    } else {
      await runMigration('Create notifications table', 'create_notifications_table.sql');
    }

    // Verify all tables
    console.log('\n📋 Verifying table structures...\n');
    
    console.log('--- student_streaks ---');
    const [streaks] = await db.execute('DESCRIBE student_streaks');
    console.table(streaks);
    
    console.log('\n--- notification_preferences ---');
    const [prefs] = await db.execute('DESCRIBE notification_preferences');
    console.table(prefs);
    
    console.log('\n--- notifications ---');
    const [notifs] = await db.execute('DESCRIBE notifications');
    console.table(notifs);

    console.log('\n✅ All notification system migrations completed successfully!');
    console.log('📊 Created tables: student_streaks, notification_preferences, notifications\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runNotificationMigrations();
