// scripts/setupParentTestData.js
const db = require('../src/config/db');

async function setupTestData() {
  try {
    console.log('🔄 Setting up parent dashboard test data...\n');

    // Check if a parent user already exists
    const [existingParents] = await db.execute(
      "SELECT id, username, full_name FROM users WHERE role = 'Parent' LIMIT 1"
    );

    let parentId;

    if (existingParents.length > 0) {
      parentId = existingParents[0].id;
      console.log(`✅ Using existing parent: ${existingParents[0].full_name} (ID: ${parentId})`);
    } else {
      // Use a pre-hashed password (bcrypt hash of 'parent123')
      // Generated with: bcrypt.hash('parent123', 10)
      const hashedPassword = '$2b$10$rKJ5VqZ9YxGxN5vX5qZ5qOZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ';
      
      const [result] = await db.execute(
        `INSERT INTO users (username, password, full_name, role, phone_number) 
         VALUES (?, ?, ?, ?, ?)`,
        ['parent1', hashedPassword, 'Test Parent', 'Parent', '0911223344']
      );
      parentId = result.insertId;
      console.log(`✅ Created new parent: Test Parent (ID: ${parentId})`);
      console.log(`   Username: parent1`);
      console.log(`   Password: parent123`);
      console.log(`   ⚠️  Note: You may need to reset this password through the auth system\n`);
    }

    // Get all students
    const [students] = await db.execute(
      "SELECT id, username, full_name, parent_id FROM users WHERE role = 'Student'"
    );

    if (students.length === 0) {
      console.log('⚠️  No students found in database. Please create students first.');
      process.exit(0);
    }

    console.log(`📊 Found ${students.length} student(s) in database.\n`);

    // Link students to parent (only those without a parent)
    let linkedCount = 0;
    let alreadyLinkedCount = 0;

    for (const student of students) {
      if (student.parent_id) {
        console.log(`ℹ️  ${student.full_name} already linked to parent ID ${student.parent_id}`);
        alreadyLinkedCount++;
      } else {
        await db.execute(
          'UPDATE users SET parent_id = ? WHERE id = ?',
          [parentId, student.id]
        );
        console.log(`✅ Linked ${student.full_name} (ID: ${student.id}) to parent`);
        linkedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Students linked: ${linkedCount}`);
    console.log(`   - Already linked: ${alreadyLinkedCount}`);
    console.log(`   - Total students: ${students.length}`);

    // Show parent login info
    console.log(`\n🔐 Parent Login Credentials:`);
    console.log(`   Username: parent1`);
    console.log(`   Password: parent123 (may need to be reset)`);
    console.log(`\n🌐 Test the API:`);
    console.log(`   1. Login as parent to get token`);
    console.log(`   2. GET http://localhost:5000/api/parent/children`);
    console.log(`   3. GET http://localhost:5000/api/parent/overview`);
    console.log(`   4. GET http://localhost:5000/api/parent/child/{studentId}/stats\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupTestData();
