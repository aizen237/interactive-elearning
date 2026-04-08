function EmptyState({ message, icon = "📭" }) {
  return (
    <div className="text-center p-8">
      <div className="text-6xl mb-4">{icon}</div>
      <div className="text-xl text-gray-600">{message}</div>
    </div>
  );
}

export default EmptyState;
