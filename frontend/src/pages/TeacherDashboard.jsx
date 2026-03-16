import { useNavigate } from 'react-router-dom';

function TeacherDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-xl">Welcome, {user.full_name}!</p>
          <p className="text-gray-600 mt-2">Role: {user.role}</p>
          <p className="text-gray-600">Username: {user.username}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/content-management')}
            className="bg-blue-600 text-white p-6 rounded-lg shadow hover:bg-blue-700 transition"
          >
            <h2 className="text-2xl font-semibold mb-2">📚 Manage Content</h2>
            <p className="text-blue-100">Create and manage quiz questions</p>
          </button>

          <button
  onClick={() => navigate('/analytics')}
  className="bg-green-600 text-white p-6 rounded-lg shadow hover:bg-green-700 transition"
>
  <h2 className="text-2xl font-semibold mb-2">📊 Analytics</h2>
  <p className="text-green-100">View dashboard statistics</p>
</button>

          <div className="bg-gray-300 text-gray-600 p-6 rounded-lg shadow cursor-not-allowed">
            <h2 className="text-2xl font-semibold mb-2">📊 Class Analytics</h2>
            <p className="text-gray-500">Coming soon...</p>
          </div>

          <div className="bg-gray-300 text-gray-600 p-6 rounded-lg shadow cursor-not-allowed">
            <h2 className="text-2xl font-semibold mb-2">🎯 Modules</h2>
            <p className="text-gray-500">Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;