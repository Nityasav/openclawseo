"use client";

import { Button } from "@/components/ui/button";

export default function OverviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-red-600">Something went wrong</h2>
        <p className="mt-1 text-sm text-gray-600">{error.message}</p>
      </div>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
