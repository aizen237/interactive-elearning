import { useState, useEffect } from 'react';
import axios from 'axios';

function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_URL}/analytics/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setStats(response.data.data);
        setLoading(false);
      } catch {
        setError('Failed to load analytics');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []); // Empty dependency array - runs once on mount

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Analytics Dashboard</h1>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Modules</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.overview.totalModules}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Content</p>
                <p className="text-3xl font-bold text-green-600">{stats?.overview.totalContent}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.overview.totalStudents}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Content w/ Media</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.overview.contentWithMedia}</p>
              </div>
              <div className="text-4xl">🎬</div>
            </div>
          </div>
        </div>

        {/* Content Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Lock Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Content Lock Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔓</span>
                  <span className="font-medium">Unlocked</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {stats?.lockStatus.unlocked || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  <span className="font-medium">Locked</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {stats?.lockStatus.locked || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Difficulty Breakdown</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">😊</span>
                  <span className="font-medium">Easy</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {stats?.difficultyBreakdown.Easy || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤔</span>
                  <span className="font-medium">Medium</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  {stats?.difficultyBreakdown.Medium || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">😰</span>
                  <span className="font-medium">Hard</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {stats?.difficultyBreakdown.Hard || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Content Items</h2>
          <div className="space-y-2">
            {stats?.recentContent.length === 0 ? (
              <p className="text-gray-500">No content created yet</p>
            ) : (
              stats?.recentContent.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium">{item.question_text}</p>
                    <p className="text-sm text-gray-500">Type: {item.item_type}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    item.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    item.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.difficulty}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;