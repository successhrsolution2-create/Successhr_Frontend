export default function LoadingScreen({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-7 py-6 shadow-sm ring-1 ring-slate-200">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
          <span className="absolute h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <span className="h-6 w-6 rounded-full bg-white shadow-inner" />
        </span>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
    </div>
  )
}
