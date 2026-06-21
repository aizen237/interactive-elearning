import { useState, useEffect } from 'react';

/**
 * UserForm Component
 * 
 * Form component for creating and editing users in the admin dashboard.
 * Handles form validation, submission, and displays inline error messages.
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 * 
 * @param {Object} props
 * @param {string} props.mode - 'create' or 'edit' mode
 * @param {Object|null} props.initialData - Pre-populated data for edit mode
 * @param {Function} props.onSubmit - Callback with form data on submission
 * @param {Function} props.onCancel - Callback to close form
 */
function UserForm({ mode, initialData = null, onSubmit, onCancel }) {
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Student'
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Success/error messages
  const [message, setMessage] = useState({ type: '', text: '' });

  /**
   * Initialize form data in edit mode
   * Requirements: 5.2
   */
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        email: initialData.username || initialData.email || '',
        password: '', // Password not pre-populated in edit mode
        role: initialData.role || 'Student'
      });
    }
  }, [mode, initialData]);

  /**
   * Handle input field changes
   * @param {string} field - Field name
   * @param {string} value - Field value
   */
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Clear message when user makes changes
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  /**
   * Validate email format
   * Requirements: 4.3, 5.4
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate password length
   * Requirements: 4.4
   * @param {string} password - Password to validate
   * @returns {boolean} True if valid
   */
  const validatePassword = (password) => {
    return password.length >= 8;
  };

  /**
   * Validate entire form
   * Requirements: 4.3, 4.4, 5.4
   * @returns {boolean} True if form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Validate full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password (only required in create mode)
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (!validatePassword(formData.password)) {
        newErrors.password = 'Password must be at least 8 characters';
      }
    } else if (mode === 'edit' && formData.password && !validatePassword(formData.password)) {
      // In edit mode, password is optional, but if provided, must be valid
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Validate role
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * Requirements: 4.5, 4.6, 4.7, 5.5, 5.6, 5.7
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setMessage({ type: '', text: '' });

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Prepare submission data
    const submitData = {
      full_name: formData.full_name.trim(),
      username: formData.email.trim(), // Backend uses 'username' field for email
      role: formData.role
    };

    // Include password only if provided
    if (mode === 'create' || (mode === 'edit' && formData.password)) {
      submitData.password = formData.password;
    }

    try {
      setSubmitting(true);
      await onSubmit(submitData);
      
      // Success message
      setMessage({
        type: 'success',
        text: mode === 'create' ? 'User created successfully!' : 'User updated successfully!'
      });

      // Close form after short delay to show success message
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (error) {
      // Error message
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Render form
   * Requirements: 4.2, 4.7, 5.2, 5.3, 5.7
   */
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Success/Error Message */}
          {message.text && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Full Name Field */}
          <div className="mb-4">
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.full_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
              disabled={submitting}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="text"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
              disabled={submitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password {mode === 'create' && <span className="text-red-500">*</span>}
              {mode === 'edit' && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={mode === 'create' ? 'Enter password (min 8 characters)' : 'Enter new password (optional)'}
              disabled={submitting}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Role Field */}
          <div className="mb-6">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={submitting}
            >
              <option value="Student">Student</option>
              <option value="Parent">Parent</option>
              <option value="Teacher">Teacher</option>
              <option value="Admin">Admin</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span>{mode === 'create' ? 'Creating...' : 'Updating...'}</span>
                </span>
              ) : (
                <span>{mode === 'create' ? 'Create User' : 'Update User'}</span>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className={`flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserForm;
