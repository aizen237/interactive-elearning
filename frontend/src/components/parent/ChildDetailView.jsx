import XPLevelDisplay from './XPLevelDisplay';
import BadgesSection from './BadgesSection';
import QuizStatistics from './QuizStatistics';
import RecentQuizAttempts from './RecentQuizAttempts';
import ModuleProgress from './ModuleProgress';

function ChildDetailView({ childData, onBack }) {
  return (
    <div className="space-y-6">
      {/* Header with child name and back button */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">
          {childData.student.full_name}
        </h2>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
        >
          <span>⬅️</span>
          <span>Back</span>
        </button>
      </div>

      {/* XP and Level Display */}
      <XPLevelDisplay 
        level={childData.xp.current_level} 
        totalXP={childData.xp.total_xp} 
      />

      {/* Badges Section */}
      <BadgesSection badges={childData.badges.earned} />

      {/* Quiz Statistics */}
      <QuizStatistics statistics={childData.quizzes.statistics} />

      {/* Recent Quiz Attempts */}
      <RecentQuizAttempts attempts={childData.quizzes.recent_attempts} />

      {/* Module Progress */}
      <ModuleProgress modules={childData.modules} />
    </div>
  );
}

export default ChildDetailView;
