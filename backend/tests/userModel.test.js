// tests/userModel.test.js
const User = require('../src/models/User');

async function testUserModel() {
  console.log('🧪 Testing User Model...\n');

  try {
    // Test 1: Find existing user
    console.log('Test 1: Find existing user by username...');
    const user = await User.findByUsername('admin_test');
    console.log('✅ Found user:', user ? user.username : 'None');

    // Test 2: Check if username exists
    console.log('\nTest 2: Check username existence...');
    const exists = await User.usernameExists('admin_test');
    console.log(`✅ Username 'admin' exists: ${exists}`);

    // Test 3: Find users by role
    console.log('\nTest 3: Find all admins...');
    const admins = await User.findByRole('admin');
    console.log(`✅ Found ${admins.length} admin(s)`);

    console.log('\n✨ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  process.exit(0);
}

testUserModel();