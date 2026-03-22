import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setStats(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.full_name}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Level & XP Progress */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-8 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm uppercase tracking-wide">Current Level</p>
              <p className="text-6xl font-black">{stats?.profile.currentLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-purple-100 text-sm uppercase tracking-wide">Total XP</p>
              <p className="text-4xl font-bold">{stats?.profile.totalXP}</p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress to Level {stats?.profile.currentLevel + 1}</span>
              <span>{stats?.profile.xpProgress} / {stats?.profile.xpForNextLevel} XP</span>
            </div>
            <div className="w-full bg-purple-800 rounded-full h-4">
              <div
                className="bg-yellow-400 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(stats?.profile.xpProgress / stats?.profile.xpForNextLevel) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-purple-200 mt-2">
              {stats?.profile.xpNeeded} XP needed for next level
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🎯</div>
              <div>
                <p className="text-gray-500 text-sm">Quizzes Attempted</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.stats.quizzesAttempted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">✅</div>
              <div>
                <p className="text-gray-500 text-sm">Quizzes Passed</p>
                <p className="text-3xl font-bold text-green-600">{stats?.stats.quizzesPassed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">📊</div>
              <div>
                <p className="text-gray-500 text-sm">Completion Rate</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.stats.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 My Badges</h2>
          {stats?.badges.length === 0 ? (
            <p className="text-gray-500">No badges earned yet. Keep learning to unlock achievements!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats?.badges.map((badge) => (
                <div key={badge.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 text-center border-2 border-yellow-200 hover:scale-105 transition">
                  <div className="text-5xl mb-2">{badge.icon_url}</div>
                  <p className="font-bold text-gray-800 text-sm">{badge.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/lessons')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            <h2 className="text-3xl font-semibold mb-2">📚 My Lessons</h2>
            <p className="text-blue-100">Continue your learning journey</p>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            <h2 className="text-3xl font-semibold mb-2">🏆 Leaderboard</h2>
            <p className="text-yellow-100">See how you rank!</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;