import { Button } from "@/components/ui/button";
import type { ApiError } from "@/types/api";

interface ErrorDisplayProps {
  error: ApiError;
  onRetry: () => void;
  onHome: () => void;
}

export function ErrorDisplay({ error, onRetry, onHome }: ErrorDisplayProps) {
  const getErrorConfig = (errorCode: string) => {
    switch (errorCode) {
      case "WEBSITE_INACCESSIBLE":
        return {
          title: "Website Not Accessible",
          description: "We couldn't access this website for analysis.",
          color: "yellow",
          icon: "⚠️"
        };
      case "RATE_LIMITED":
        return {
          title: "Rate Limit Reached",
          description: "You've hit the demo usage limit.",
          color: "orange",
          icon: "🚫"
        };
      default:
        return {
          title: "Analysis Failed",
          description: "An error occurred during analysis.",
          color: "red",
          icon: "❌"
        };
    }
  };

  const config = getErrorConfig(error.error_code);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className={`bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center border border-${config.color}-200`}>
        <div className="text-4xl mb-4">{config.icon}</div>
        <h2 className={`text-2xl font-bold text-${config.color}-600 mb-4`}>{config.title}</h2>
        <p className="text-gray-700 mb-4">{error.message}</p>
        {error.details?.suggestions && (
          <div className="text-sm text-gray-600 mb-6 text-left">
            <p className="font-medium mb-2">Suggestions:</p>
            <ul className="list-disc list-inside space-y-1">
              {error.details.suggestions.map((suggestion: string, idx: number) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-3">
          {error.retry_recommended && (
            <Button className="w-full" onClick={onRetry}>
              Try Again
            </Button>
          )}
          {error.error_code === "RATE_LIMITED" && (
            <Button className="w-full mb-3 bg-blue-600 hover:bg-blue-700" asChild>
              <a href="/signup">Sign Up for More Requests</a>
            </Button>
          )}
          <Button className="w-full" variant="outline" onClick={onHome}>
            Analyze Different Website
          </Button>
        </div>
      </div>
    </div>
  );
} 