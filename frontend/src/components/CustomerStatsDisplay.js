export default function CustomerStatsDisplay({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{stats.countersActive}</span>
        <span className="text-sm text-gray-500 uppercase tracking-wide">Counters</span>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-blue-600">{stats.waiting}</span>
        <span className="text-sm text-gray-500 uppercase tracking-wide">Waiting</span>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{stats.avgWaitMins} min</span>
        <span className="text-sm text-gray-500 uppercase tracking-wide">Avg Wait</span>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-800">{stats.queueHealth || '🟢 Normal'}</span>
        <span className="text-sm text-gray-500 uppercase tracking-wide">Queue Health</span>
      </div>
    </div>
  );
}

