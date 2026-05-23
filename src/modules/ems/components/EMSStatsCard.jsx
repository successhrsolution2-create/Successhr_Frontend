export default function EMSStatsCard({ label, value, icon: Icon, accent = 'bg-sky-50 text-sky-700', helper }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        {Icon ? (
          <span className={`flex h-10 w-10 items-center justify-center rounded-md ${accent}`}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {helper ? <p className="mt-3 text-xs text-slate-500">{helper}</p> : null}
    </div>
  )
}
