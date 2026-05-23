import { useMemo, useState } from 'react'
import AttendanceTable from '../../components/AttendanceTable'
import { useAttendance } from '../../hooks/useAttendance'

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

export default function AttendanceReport() {
  const [filters, setFilters] = useState({ from: '', to: '', status: '' })
  const params = useMemo(() => filters, [filters])
  const { items, summary, loading, error } = useAttendance('report', params)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Attendance Report</h1>
        <p className="mt-1 text-sm text-slate-600">Filter attendance by date range and status.</p>
      </div>
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} className={inputClass} />
        <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} className={inputClass} />
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className={inputClass}>
          <option value="">All status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="half_day">Half Day</option>
          <option value="leave">Leave</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summary.map((item) => (
          <div key={item._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item._id}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{item.total}</p>
          </div>
        ))}
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading report...</div> : <AttendanceTable rows={items} />}
    </div>
  )
}
