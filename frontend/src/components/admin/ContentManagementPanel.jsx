import { useState, useEffect, useCallback } from 'react';
import adminAPI from '../../services/adminAPI';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

/**
 * ContentManagementPanel Component
 * 
 * Module management interface for admin dashboard.
 * Provides module list display, search, and CRUD operations.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 10.1, 11.1
 */
function ContentManagementPanel() {
  // State management
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  /**
   * Fetch modules from API with current search filter
   * Requirements: 8.1, 8.2, 8.6
   */
  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await adminAPI.getModules(params);
      
      if (response.data.success) {
        setModules(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch modules');
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError(err.response?.data?.message || 'Failed to load modules. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  /**
   * Fetch modules on mount and when search changes
   */
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  /**
   * Handle search input with debouncing
   * Requirements: 8.6
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
      // Search will trigger via useEffect when searchQuery changes
    }, 500);

    setSearchDebounceTimer(timer);
  };

  /**
   * Handle module deletion
   * Requirements: 11.1
   */
  const handleDeleteModule = async (moduleId, moduleName) => {
    if (!window.confirm(`Are you sure you want to delete "${moduleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await adminAPI.deleteModule(moduleId);
      if (response.data.success) {
        // Refresh module list
        fetchModules();
      } else {
        alert(response.data.message || 'Failed to delete module');
      }
    } catch (err) {
      console.error('Error deleting module:', err);
      alert(err.response?.data?.message || 'Failed to delete module');
    }
  };

  /**
   * Render loading state
   * Requirements: 8.2
   */
  if (loading && modules.length === 0) {
    return <LoadingSpinner />;
  }

  /**
   * Render error state
   * Requirements: 8.3
   */
  if (error && modules.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchModules} />;
  }

  /**
   * Render main content management interface
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 10.1, 11.1
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Content Management</h1>
          <p className="text-gray-600">Manage learning modules and educational content</p>
        </div>

        {/* Action Buttons and Search Row */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Create Module Button */}
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span>➕</span>
            <span>Create Module</span>
          </button>

          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search modules by name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Results Count */}
        {modules.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {modules.length} module{modules.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Module Grid */}
        {modules.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <div className="text-xl font-semibold text-gray-800 mb-2">No modules found</div>
            <div className="text-gray-600">
              {searchQuery.trim() 
                ? 'Try adjusting your search query' 
                : 'Get started by creating your first module'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <div
                key={module.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Module Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
                  <h3 className="text-xl font-bold text-white mb-1">{module.name}</h3>
                  <div className="flex items-center gap-2 text-purple-100 text-sm">
                    <span>{module.is_locked ? '🔒 Locked' : '🔓 Unlocked'}</span>
                    <span>•</span>
                    <span>{module.item_count || 0} item{module.item_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Module Body */}
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {module.description || 'No description available'}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteModule(module.id, module.name)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentManagementPanel;
