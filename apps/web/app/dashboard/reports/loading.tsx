export default function ReportsLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-white/[0.04]" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-white/[0.04]" />
      ))}
    </div>
  );
}
