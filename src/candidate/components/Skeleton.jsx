export default function Skeleton({ rows = 5, label = 'Loading...' }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center py-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
            <span className="absolute h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            <span className="h-4 w-4 rounded-full bg-white shadow-inner" />
          </span>
          <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-200" />
      ))}
    </div>
  )
}
