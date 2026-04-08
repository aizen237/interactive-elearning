function XPLevelDisplay({ level, totalXP }) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-purple-100 text-sm uppercase tracking-wide">Current Level</p>
          <p className="text-6xl font-black">{level}</p>
        </div>
        <div className="text-right">
          <p className="text-purple-100 text-sm uppercase tracking-wide">Total XP</p>
          <p className="text-4xl font-bold">{totalXP}</p>
        </div>
      </div>
    </div>
  );
}

export default XPLevelDisplay;
