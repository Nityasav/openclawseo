export default function GeoLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}
