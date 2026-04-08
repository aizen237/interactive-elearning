function ErrorMessage({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-6xl mb-4">⚠️</div>
        <div className="text-xl font-semibold text-red-600 mb-4">{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            🔄 Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
