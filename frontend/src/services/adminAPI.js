import axios from 'axios';

/**
 * Admin API Service
 * Provides methods for all admin dashboard API operations
 * All endpoints require authentication and admin/teacher role
 */

const API_URL = 'http://localhost:5000/api';

/**
 * Get authorization header with JWT token from localStorage
 * @returns {Object} Headers object with Authorization bearer token
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

/**
 * User Management API Methods
 */

/**
 * Get paginated list of users with optional filtering and search
 * @param {Object} params - Query parameters (page, limit, role, status, search)
 * @returns {Promise} Axios response with user list data
 */
export const getUsers = (params = {}) => {
  return axios.get(`${API_URL}/admin/users`, {
    ...getAuthHeader(),
    params
  });
};

/**
 * Get detailed information for a specific user
 * @param {number} userId - User ID
 * @returns {Promise} Axios response with user details
 */
export const getUserById = (userId) => {
  return axios.get(`${API_URL}/admin/users/${userId}`, getAuthHeader());
};

/**
 * Create a new user
 * @param {Object} userData - User data (username, password, full_name, role, phone_number)
 * @returns {Promise} Axios response with created user data
 */
export const createUser = (userData) => {
  return axios.post(`${API_URL}/admin/users`, userData, getAuthHeader());
};

/**
 * Update an existing user
 * @param {number} userId - User ID
 * @param {Object} userData - Updated user data (full_name, username, role, phone_number)
 * @returns {Promise} Axios response with updated user data
 */
export const updateUser = (userId, userData) => {
  return axios.put(`${API_URL}/admin/users/${userId}`, userData, getAuthHeader());
};

/**
 * Deactivate a user account
 * @param {number} userId - User ID
 * @returns {Promise} Axios response with deactivation confirmation
 */
export const deactivateUser = (userId) => {
  return axios.post(`${API_URL}/admin/users/${userId}/deactivate`, {}, getAuthHeader());
};

/**
 * Activate a user account
 * @param {number} userId - User ID
 * @returns {Promise} Axios response with activation confirmation
 */
export const activateUser = (userId) => {
  return axios.post(`${API_URL}/admin/users/${userId}/activate`, {}, getAuthHeader());
};

/**
 * Bulk create users from CSV file
 * @param {FormData} formData - FormData object containing CSV file
 * @returns {Promise} Axios response with bulk creation results
 */
export const bulkCreateUsers = (formData) => {
  return axios.post(`${API_URL}/admin/users/bulk`, formData, {
    ...getAuthHeader(),
    headers: {
      ...getAuthHeader().headers,
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * Export users as CSV file
 * @param {Object} params - Query parameters (role, status, search)
 * @returns {Promise} Axios response with CSV blob data
 */
export const exportUsers = (params = {}) => {
  return axios.get(`${API_URL}/admin/users/export`, {
    ...getAuthHeader(),
    params,
    responseType: 'blob'
  });
};

/**
 * Content Management API Methods
 */

/**
 * Get list of all modules with optional search
 * @param {Object} params - Query parameters (search)
 * @returns {Promise} Axios response with module list data
 */
export const getModules = (params = {}) => {
  return axios.get(`${API_URL}/admin/modules`, {
    ...getAuthHeader(),
    params
  });
};

/**
 * Create a new module
 * @param {Object} moduleData - Module data (name, description, level_requirement)
 * @returns {Promise} Axios response with created module data
 */
export const createModule = (moduleData) => {
  return axios.post(`${API_URL}/admin/modules`, moduleData, getAuthHeader());
};

/**
 * Update an existing module
 * @param {number} moduleId - Module ID
 * @param {Object} moduleData - Updated module data (name, description, level_requirement)
 * @returns {Promise} Axios response with updated module data
 */
export const updateModule = (moduleId, moduleData) => {
  return axios.put(`${API_URL}/admin/modules/${moduleId}`, moduleData, getAuthHeader());
};

/**
 * Delete a module
 * @param {number} moduleId - Module ID
 * @returns {Promise} Axios response with deletion confirmation
 */
export const deleteModule = (moduleId) => {
  return axios.delete(`${API_URL}/admin/modules/${moduleId}`, getAuthHeader());
};

/**
 * Analytics API Methods
 */

/**
 * Get platform analytics and statistics
 * @returns {Promise} Axios response with analytics data
 */
export const getAnalytics = () => {
  return axios.get(`${API_URL}/admin/analytics`, getAuthHeader());
};

/**
 * Export analytics data as CSV file
 * @returns {Promise} Axios response with CSV blob data
 */
export const exportAnalytics = () => {
  return axios.get(`${API_URL}/admin/analytics/export`, {
    ...getAuthHeader(),
    responseType: 'blob'
  });
};

/**
 * Get recent platform activity timeline
 * @returns {Promise} Axios response with activity data
 */
export const getActivity = () => {
  return axios.get(`${API_URL}/admin/activity`, getAuthHeader());
};

/**
 * Default export with all API methods
 */
export default {
  // User Management
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  bulkCreateUsers,
  exportUsers,
  
  // Content Management
  getModules,
  createModule,
  updateModule,
  deleteModule,
  
  // Analytics
  getAnalytics,
  exportAnalytics,
  getActivity
};
