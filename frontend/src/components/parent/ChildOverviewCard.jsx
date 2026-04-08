function ChildOverviewCard({ child, onClick }) {
  return (
    <div
      onClick={() => onClick(child.id)}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition transform cursor-pointer overflow-hidden"
    >
      {/* Gradient accent for level/XP section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">{child.full_name}</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">Level</div>
            <div className="text-3xl font-bold">{child.current_level}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Total XP</div>
            <div className="text-3xl font-bold">{child.total_xp}</div>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <span>🏆</span>
            <span>Badges Earned</span>
          </span>
          <span className="text-xl font-semibold text-gray-800">
            {child.badges_earned}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <span>🎯</span>
            <span>Quizzes Attempted</span>
          </span>
          <span className="text-xl font-semibold text-gray-800">
            {child.quizzes_attempted}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <span>✅</span>
            <span>Quizzes Passed</span>
          </span>
          <span className="text-xl font-semibold text-gray-800">
            {child.quizzes_passed}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ChildOverviewCard;
