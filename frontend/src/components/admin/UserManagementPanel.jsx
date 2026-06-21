import { useState, useEffect, useCallback } from 'react';
import adminAPI from '../../services/adminAPI';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

/**
 * UserManagementPanel Component
 * 
 * Comprehensive user management interface for admin dashboard.
 * Provides user list display, search, filtering, pagination, and CRUD operations.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 5.1, 6.1, 6.5, 7.1, 19.1
 */
function UserManagementPanel() {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  const USERS_PER_PAGE = 20;

  /**
   * Fetch users from API with current filters and pagination
   * Requirements: 2.1, 2.2, 2.5, 2.6, 2.7
   */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: USERS_PER_PAGE,
      };

      if (roleFilter) {
        params.role = roleFilter;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await adminAPI.getUsers(params);
      
      if (response.data.success) {
        setUsers(response.data.data.users || []);
        setTotalPages(response.data.data.totalPages || 1);
        setTotalUsers(response.data.data.total || 0);
      } else {
        setError(response.data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, searchQuery]);

  /**
   * Fetch users on mount and when filters change
   */
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Handle search input with debouncing
   * Requirements: 2.6
   */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    setSearchDebounceTimer(timer);
  };

  /**
   * Handle role filter change
   * Requirements: 2.5
   */
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  /**
   * Handle pagination - go to specific page
   * Requirements: 2.7
   */
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Handle user deactivation
   * Requirements: 6.1
   */
  const handleDeactivateUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${userName}?`)) {
      return;
    }

    try {
      const response = await adminAPI.deactivateUser(userId);
      if (response.data.success) {
        // Refresh user list
        fetchUsers();
      } else {
        alert(response.data.message || 'Failed to deactivate user');
      }
    } catch (err) {
      console.error('Error deactivating user:', err);
      alert(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  /**
   * Handle user activation
   * Requirements: 6.5
   */
  const handleActivateUser = async (userId, userName) => {
    try {
      const response = await adminAPI.activateUser(userId);
      if (response.data.success) {
        // Refresh user list
        fetchUsers();
      } else {
        alert(response.data.message || 'Failed to activate user');
      }
    } catch (err) {
      console.error('Error activating user:', err);
      alert(err.response?.data?.message || 'Failed to activate user');
    }
  };

  /**
   * Handle user export
   * Requirements: 19.1
   */
  const handleExportUsers = async () => {
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await adminAPI.exportUsers(params);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting users:', err);
      alert(err.response?.data?.message || 'Failed to export users');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Get role badge color
   */
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Teacher':
        return 'bg-blue-100 text-blue-800';
      case 'Parent':
        return 'bg-green-100 text-green-800';
      case 'Student':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Render loading state
   * Requirements: 2.2
   */
  if (loading && users.length === 0) {
    return <LoadingSpinner />;
  }

  /**
   * Render error state
   * Requirements: 2.3
   */
  if (error && users.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchUsers} />;
  }

  /**
   * Render main user management interface
   * Requirements: 2.1, 2.4, 2.5, 2.6, 2.7, 4.1, 5.1, 6.1, 6.5, 7.1, 19.1
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
          <p className="text-gray-600">Manage all platform users, roles, and permissions</p>
        </div>

        {/* Action Buttons Row */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2"
          >
            <span>➕</span>
            <span>Create User</span>
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2"
          >
            <span>📤</span>
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={handleExportUsers}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2"
          >
            <span>📥</span>
            <span>Export Users</span>
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={handleRoleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="Student">Student</option>
                <option value="Parent">Parent</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {users.length} of {totalUsers} users
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Registration Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-2">👥</div>
                      <div className="text-lg">No users found</div>
                      <div className="text-sm">Try adjusting your search or filters</div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600">{user.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600 text-sm">{formatDate(user.created_at)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                          >
                            Edit
                          </button>
                          {user.is_active ? (
                            <button
                              onClick={() => handleDeactivateUser(user.id, user.full_name)}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user.id, user.full_name)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagementPanel;
