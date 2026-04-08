function QuizStatistics({ statistics }) {
  // Handle missing or invalid statistics
  const totalAttempts = statistics?.total_attempts || 0;
  const correctAnswers = statistics?.correct_answers || 0;
  const successRate = parseFloat(statistics?.success_rate) || 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>📊</span>
        <span>Quiz Statistics</span>
      </h3>
      
      {/* Statistics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Attempts */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
            Total Attempts
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {totalAttempts}
          </div>
        </div>

        {/* Correct Answers */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
            Correct Answers
          </div>
          <div className="text-3xl font-bold text-green-600">
            {correctAnswers}
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
            Success Rate
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {successRate.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizStatistics;
