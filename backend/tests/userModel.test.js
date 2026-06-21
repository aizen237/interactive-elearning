// tests/userModel.test.js
const User = require('../src/models/User');

describe('User Model Tests', () => {
  it('should find existing user by username', async () => {
    const user = await User.findByUsername('admin_test');
    expect(user).toBeDefined();
    if (user) {
      expect(user.username).toBe('admin_test');
    }
  });

  it('should check if username exists', async () => {
    const exists = await User.usernameExists('admin_test');
    expect(typeof exists).toBe('boolean');
  });

  it('should find users by role', async () => {
    const admins = await User.findByRole('admin');
    expect(Array.isArray(admins)).toBe(true);
  });
});