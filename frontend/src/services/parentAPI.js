import api from './api';

/**
 * Parent API service for accessing parent-specific endpoints
 * All functions return promises that resolve to API response data
 */
export const parentAPI = {
  /**
   * Get overview of all children linked to the parent
   * @returns {Promise} Promise resolving to overview data with children array and total count
   */
  getChildrenOverview: () => api.get('/parent/overview'),
  
  /**
   * Get list of children (alternative endpoint)
   * @returns {Promise} Promise resolving to children list
   */
  getChildren: () => api.get('/parent/children'),
  
  /**
   * Get detailed statistics for a specific child
   * @param {number} studentId - The ID of the student/child
   * @returns {Promise} Promise resolving to detailed child statistics
   */
  getChildStats: (studentId) => api.get(`/parent/child/${studentId}/stats`)
};

export default parentAPI;
