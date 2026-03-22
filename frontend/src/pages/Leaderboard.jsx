import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setData(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading leaderboard...</div>
      </div>
    );
  }

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">🏆 Leaderboard</h1>
            <p className="text-gray-600 mt-1">Top students by XP</p>
          </div>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Current Student Rank Card */}
        {data?.currentStudent.rank && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
            <p className="text-blue-100 text-sm uppercase tracking-wide mb-2">Your Rank</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-5xl font-black">{getMedalEmoji(data.currentStudent.rank)}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">Rank {data.currentStudent.rank}</p>
                {data.currentStudent.data && (
                  <>
                    <p className="text-xl text-blue-100 mt-1">Level {data.currentStudent.data.current_level}</p>
                    <p className="text-lg text-blue-200">{data.currentStudent.data.total_xp} XP</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4">
            <h2 className="text-2xl font-bold text-gray-800">Top 20 Students</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {data?.leaderboard.map((student, index) => {
              const rank = index + 1;
              const isCurrentStudent = data.currentStudent.data?.id === student.id;

              return (
                <div
                  key={student.id}
                  className={`p-4 flex items-center justify-between transition ${
                    isCurrentStudent 
                      ? 'bg-blue-50 border-l-4 border-blue-600' 
                      : rank <= 3 
                      ? 'bg-yellow-50' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-16 text-center">
                    <span className="text-2xl font-bold">
                      {getMedalEmoji(rank)}
                    </span>
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 ml-4">
                    <p className="font-bold text-gray-800 text-lg">
                      {student.full_name}
                      {isCurrentStudent && (
                        <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-1 rounded">You</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      🏆 {student.badge_count} {student.badge_count === 1 ? 'badge' : 'badges'}
                    </p>
                  </div>

                  {/* Level & XP */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      Level {student.current_level}
                    </p>
                    <p className="text-sm text-gray-600">{student.total_xp} XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border-2 border-green-200">
          <p className="text-center text-gray-700">
            <span className="text-2xl mr-2">💪</span>
            Keep learning to climb the leaderboard!
          </p>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;