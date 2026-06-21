import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import adminAPI from '../../services/adminAPI';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

/**
 * UserDetailView Component
 * 
 * Displays detailed information about a specific user.
 * For students: shows XP, level, badges, quiz attempts, and module progress
 * For parents: shows linked children
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
function UserDetailView({ userId, onBack }) {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch detailed user data on mount
   * Requirements: 3.1
   */
  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  /**
   * Fetch user details from API
   * Requirements: 3.1
   */
  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.getUserById(userId);

      if (response.data.success) {
        setUserDetails(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch user details');
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err.response?.data?.message || 'Failed to load user details. Please try again.');
    } finally {
      setLoading(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Format date without time
   */
  const formatDateShort = (dateString) => {
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
   */
  if (loading) {
    return <LoadingSpinner />;
  }

  /**
   * Render error state
   */
  if (error) {
    return <ErrorMessage message={error} onRetry={fetchUserDetails} />;
  }

  /**
   * Render user not found state
   */
  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition"
          >
            <span>←</span>
            <span>Back to User List</span>
          </button>
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-4xl mb-4">❌</div>
            <div className="text-xl font-semibold text-gray-800 mb-2">User Not Found</div>
            <div className="text-gray-600">The requested user could not be found.</div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render main user detail view
   * Requirements: 3.2, 3.3, 3.4, 3.5
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button - Requirement 3.5 */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition"
        >
          <span>←</span>
          <span>Back to User List</span>
        </button>

        {/* User Profile Section - Requirement 3.2 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{userDetails.full_name}</h1>
              <p className="text-gray-600">{userDetails.username}</p>
            </div>
            <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${getRoleBadgeColor(userDetails.role)}`}>
              {userDetails.role}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Phone Number</div>
              <div className="font-medium text-gray-800">{userDetails.phone_number || 'Not provided'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <div className="font-medium">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                  userDetails.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {userDetails.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Registration Date</div>
              <div className="font-medium text-gray-800">{formatDateShort(userDetails.created_at)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">User ID</div>
              <div className="font-medium text-gray-800">#{userDetails.id}</div>
            </div>
          </div>
        </div>

        {/* Student-Specific Data - Requirement 3.3 */}
        {userDetails.role === 'Student' && userDetails.studentData && (
          <>
            {/* XP and Level Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Progress Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-6">
                  <div className="text-sm text-purple-600 font-semibold mb-1">Current Level</div>
                  <div className="text-4xl font-bold text-purple-700">{userDetails.studentData.currentLevel}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-6">
                  <div className="text-sm text-blue-600 font-semibold mb-1">Total XP</div>
                  <div className="text-4xl font-bold text-blue-700">{userDetails.studentData.totalXP}</div>
                </div>
              </div>
            </div>

            {/* Quiz Attempts Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Activity</h2>
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-6">
                <div className="text-sm text-green-600 font-semibold mb-1">Total Quiz Attempts</div>
                <div className="text-4xl font-bold text-green-700">{userDetails.studentData.quizAttempts}</div>
              </div>
            </div>

            {/* Badges Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Badges Earned ({userDetails.studentData.badges.length})
              </h2>
              {userDetails.studentData.badges.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🏆</div>
                  <div>No badges earned yet</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userDetails.studentData.badges.map((badge) => (
                    <div key={badge.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{badge.icon_url || '🏆'}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{badge.name}</div>
                          <div className="text-sm text-gray-600 mb-2">{badge.description}</div>
                          <div className="text-xs text-gray-500">
                            Earned: {formatDateShort(badge.awarded_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Module Progress Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Module Progress</h2>
              {userDetails.studentData.moduleProgress.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📚</div>
                  <div>No module progress yet</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {userDetails.studentData.moduleProgress.map((module) => (
                    <div key={module.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{module.name}</div>
                        {module.completed && module.completed_at && (
                          <div className="text-sm text-gray-600 mt-1">
                            Completed: {formatDateShort(module.completed_at)}
                          </div>
                        )}
                      </div>
                      <div>
                        {module.completed ? (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            ✓ Completed
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Parent-Specific Data - Requirement 3.4 */}
        {userDetails.role === 'Parent' && userDetails.children && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Linked Children ({userDetails.children.length})
            </h2>
            {userDetails.children.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
                <div>No children linked to this account</div>
              </div>
            ) : (
              <div className="space-y-3">
                {userDetails.children.map((child) => (
                  <div key={child.id} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">{child.full_name}</div>
                        <div className="text-sm text-gray-600">{child.username}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">User ID: #{child.id}</div>
                        <div className="text-xs text-gray-500">
                          Registered: {formatDateShort(child.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin/Teacher - No additional data */}
        {(userDetails.role === 'Admin' || userDetails.role === 'Teacher') && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👤</div>
              <div>No additional information available for {userDetails.role} users</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

UserDetailView.propTypes = {
  userId: PropTypes.number.isRequired,
  onBack: PropTypes.func.isRequired
};

export default UserDetailView;
