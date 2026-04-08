function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    </div>
  );
}

export default LoadingSpinner;
