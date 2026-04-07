import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Progress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/progress`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setData(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load progress:', error);
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">My Progress</h1>
            <p className="text-gray-600 mt-1">Track your learning journey</p>
          </div>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Overall Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-blue-100 text-sm uppercase tracking-wide">Total XP</p>
              <p className="text-5xl font-black">{data?.profile.total_xp || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-sm uppercase tracking-wide">Current Level</p>
              <p className="text-5xl font-black">{data?.profile.current_level || 1}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-sm uppercase tracking-wide">Modules</p>
              <p className="text-5xl font-black">{data?.moduleProgress.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Module Progress Cards */}
        <div className="space-y-6">
          {data?.moduleProgress.map((module) => (
            <div key={module.moduleId} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">{module.moduleName}</h2>
                  <p className="text-gray-600 mt-1">{module.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-purple-600">{module.completionPercentage}%</p>
                  <p className="text-sm text-gray-500">Complete</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${module.completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {module.completedContent}/{module.totalContent}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">XP Earned</p>
                  <p className="text-2xl font-bold text-green-600">{module.xpEarned}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {module.totalContent - module.completedContent}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Motivational Message */}
        {data?.moduleProgress.every(m => m.completionPercentage === 100) ? (
          <div className="mt-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-8 text-center text-white">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-2xl font-bold">Congratulations!</p>
            <p className="text-lg mt-2">You've completed all available content!</p>
          </div>
        ) : (
          <div className="mt-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 text-center text-white">
            <p className="text-4xl mb-4">💪</p>
            <p className="text-2xl font-bold">Keep Going!</p>
            <p className="text-lg mt-2">Continue learning to unlock more achievements!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Progress;