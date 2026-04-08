function DashboardHeader({ parentName, onLogout }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-800">Parent Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {parentName}!</p>
      </div>
      <button
        onClick={onLogout}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
  );
}

export default DashboardHeader;
