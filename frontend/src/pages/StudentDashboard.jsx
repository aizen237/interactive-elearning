function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Student Dashboard
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xl">Welcome, {user.full_name}!</p>
          <p className="text-gray-600 mt-2">Role: {user.role}</p>
          <p className="text-gray-600">Username: {user.username}</p>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;