"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("SiloGuard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        <p className="text-4xl">⚠️</p>
        <h2 className="text-red-400 font-bold text-lg">System Error</h2>
        <p className="text-slate-500 text-sm font-mono break-words">
          {error.message}
        </p>
        <button
          onClick={reset}
          className="mt-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
