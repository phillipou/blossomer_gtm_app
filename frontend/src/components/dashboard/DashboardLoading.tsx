import { Progress } from "@/components/ui/progress";

interface DashboardLoadingProps {
  loading: boolean;
  progressPercent: number;
}

function getStatusLabel(percent: number) {
  if (percent < 30) return "Loading website...";
  if (percent < 60) return "Analyzing company...";
  if (percent < 90) return "Researching market...";
  if (percent < 100) return "Finalizing...";
  return "Done!";
}

export default function DashboardLoading({ loading, progressPercent }: DashboardLoadingProps) {
  if (!loading) return null;
  return (
    <div className="flex flex-col relative">
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <div className="h-6 w-40 bg-gray-200 rounded mb-2 shimmer" />
          <div className="h-4 w-24 bg-gray-100 rounded shimmer" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-8 w-24 bg-gray-200 rounded shimmer" />
          <div className="h-8 w-28 bg-gray-100 rounded shimmer" />
        </div>
      </div>
      <div className="bg-white border-b border-gray-200 px-8 h-14 flex items-center">
        <div className="h-6 w-32 bg-gray-200 rounded shimmer" />
      </div>
      <div className="flex-1 p-8 space-y-8">
        {/* Loading card with progress bar and status */}
        <div className="max-w-md w-full mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border-0">
            <Progress
              value={progressPercent}
              className="mb-6 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:via-blue-400 [&>div]:to-blue-600 [&>div]:rounded-l-full"
            />
            <div className="text-lg font-medium text-blue-700 flex items-center gap-2 min-h-[2.5rem]">
              <span className="animate-pulse">{getStatusLabel(progressPercent)}</span>
            </div>
          </div>
        </div>
        <div className="h-32 w-full bg-gray-200 rounded-xl shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-24 bg-gray-100 rounded-xl shimmer" />
          <div className="h-24 bg-gray-100 rounded-xl shimmer" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-24 bg-gray-100 rounded-xl shimmer" />
          <div className="h-24 bg-gray-100 rounded-xl shimmer" />
        </div>
      </div>
      <style>{`
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0; height: 100%; width: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: translateX(-100%);
          animation: shimmer-move 1.5s infinite;
        }
        @keyframes shimmer-move {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
} 