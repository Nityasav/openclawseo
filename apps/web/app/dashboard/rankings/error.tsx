"use client";
import { Button } from "@/components/ui/button";
export default function RankingsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-lg font-semibold text-red-600">Failed to load rankings</h2>
      <p className="text-sm text-white/40">{error.message}</p>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  );
}
