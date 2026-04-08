import EmptyState from '../EmptyState';

function BadgesSection({ badges }) {
  // Show empty state when no badges earned
  if (!badges || badges.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>🏆</span>
          <span>Badges Earned</span>
        </h3>
        <EmptyState 
          icon="🏆"
          message="No badges earned yet. Keep learning to unlock achievements!"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>🏆</span>
        <span>Badges Earned</span>
      </h3>
      
      {/* Grid layout for badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200"
          >
            {/* Badge icon */}
            <div className="text-4xl mb-2">{badge.icon_url || '🏆'}</div>
            
            {/* Badge name */}
            <h4 className="text-lg font-semibold text-gray-800 mb-1">
              {badge.name}
            </h4>
            
            {/* Badge description */}
            <p className="text-sm text-gray-600">
              {badge.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BadgesSection;
