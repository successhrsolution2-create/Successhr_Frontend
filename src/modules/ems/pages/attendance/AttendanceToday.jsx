import { RefreshCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import AttendanceTable from '../../components/AttendanceTable'
import { useAttendance } from '../../hooks/useAttendance'

export default function AttendanceToday() {
  const { items, loading, error, reload } = useAttendance('today')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Attendance Today</h1>
          <p className="mt-1 text-sm text-slate-600">Live present, absent, late, and half-day status.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={reload} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
          <Link to="/ems/attendance/report" className="inline-flex h-10 items-center rounded-md bg-[#00427d] px-4 text-sm font-semibold text-white hover:bg-[#063763]">
            Monthly Report
          </Link>
        </div>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading attendance...</div> : <AttendanceTable rows={items} />}
    </div>
  )
}
