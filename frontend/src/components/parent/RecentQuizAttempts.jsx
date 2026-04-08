import EmptyState from '../EmptyState';

function RecentQuizAttempts({ attempts }) {
  // Show empty state when no quiz attempts
  if (!attempts || attempts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>🎯</span>
          <span>Recent Quiz Attempts</span>
        </h3>
        <EmptyState 
          icon="🎯"
          message="No quiz attempts yet."
        />
      </div>
    );
  }

  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>🎯</span>
        <span>Recent Quiz Attempts</span>
      </h3>
      
      {/* List of quiz attempts */}
      <div className="space-y-4">
        {attempts.slice(0, 5).map((attempt) => (
          <div
            key={attempt.id}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200"
          >
            {/* Question text */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <p className="text-base font-semibold text-gray-800 flex-1">
                {attempt.question_text}
              </p>
              
              {/* Score indicator */}
              <span className="text-2xl flex-shrink-0">
                {attempt.score_obtained > 0 ? '✅' : '❌'}
              </span>
            </div>
            
            {/* Module name and timestamp */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span>📚</span>
                <span>{attempt.module_name}</span>
              </span>
              <span className="text-gray-500">
                {formatTimestamp(attempt.attempted_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentQuizAttempts;
