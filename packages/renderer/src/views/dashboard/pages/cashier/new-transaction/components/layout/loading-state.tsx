/**
 * Loading state component
 */

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="text-center">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-slate-400 mx-auto mb-3 sm:mb-4" />
        <p className="text-slate-600 text-sm sm:text-base">{message}</p>
      </div>
    </div>
  );
}

