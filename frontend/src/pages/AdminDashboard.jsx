import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState('users');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Role verification and initialization
  useEffect(() => {
    // Get user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Verify authentication
    if (!storedUser.role || !localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    
    // Verify admin role
    if (storedUser.role !== 'Admin' && storedUser.role !== 'Teacher') {
      // Redirect to appropriate dashboard based on role
      const dashboardMap = {
        'Student': '/student-dashboard',
        'Parent': '/parent-dashboard'
      };
      navigate(dashboardMap[storedUser.role] || '/login');
      return;
    }

    // User is authorized, set user state
    setUser(storedUser);

    // Restore active tab from sessionStorage
    const savedTab = sessionStorage.getItem('adminActiveTab');
    if (savedTab && ['users', 'content', 'analytics'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, [navigate]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Persist active tab to sessionStorage
    sessionStorage.setItem('adminActiveTab', tab);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('adminActiveTab');
    sessionStorage.removeItem('adminUserFilters');
    sessionStorage.removeItem('adminSearchQuery');
    navigate('/login');
  };

  // Don't render until user is verified
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.full_name}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => handleTabChange('users')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              👥 Users
            </button>
            <button
              onClick={() => handleTabChange('content')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                activeTab === 'content'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              📚 Content
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              📊 Analytics
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">User Management</h2>
              <p className="text-gray-600">User management panel coming soon...</p>
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Content Management</h2>
              <p className="text-gray-600">Content management panel coming soon...</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics</h2>
              <p className="text-gray-600">Analytics panel coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
