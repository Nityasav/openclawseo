export default function KeywordsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-white/[0.04]" />
      <div className="h-12 animate-pulse rounded bg-white/[0.04] mb-4" />
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
