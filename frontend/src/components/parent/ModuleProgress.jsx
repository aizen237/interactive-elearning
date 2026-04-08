import EmptyState from '../EmptyState';

function ModuleProgress({ modules }) {
  // Show empty state when no modules started
  if (!modules || modules.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>📚</span>
          <span>Module Progress</span>
        </h3>
        <EmptyState 
          icon="📚"
          message="No modules started yet."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>📚</span>
        <span>Module Progress</span>
      </h3>
      
      {/* List of modules with progress bars */}
      <div className="space-y-6">
        {modules.map((module) => {
          const completionPercentage = parseFloat(module.completion_percentage) || 0;
          
          return (
            <div key={module.id} className="space-y-2">
              {/* Module name and completion percentage */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800">
                  {module.module_name}
                </h4>
                <span className="text-sm font-bold text-purple-600">
                  {completionPercentage.toFixed(0)}%
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              
              {/* Item counts */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  {module.completed_items} of {module.total_items} items completed
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ModuleProgress;
