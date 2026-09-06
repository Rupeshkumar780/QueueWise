export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">Loading dashboard data...</p>
    </div>
  );
}

