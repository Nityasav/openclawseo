export default function SandboxControlLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
