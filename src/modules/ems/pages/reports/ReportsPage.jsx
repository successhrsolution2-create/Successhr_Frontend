import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { reportApi } from '../../api/reportApi'

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

export default function ReportsPage() {
  const [filters, setFilters] = useState({ from: '', to: '' })
  const [reports, setReports] = useState({ headcount: [], attendance: [], leaves: [], payroll: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    Promise.allSettled([
      reportApi.headcount(filters),
      reportApi.attendanceSummary(filters),
      reportApi.leaveSummary(filters),
      reportApi.payrollSummary(filters)
    ]).then((results) => {
      if (!mounted) return
      setReports({
        headcount: results[0].value?.data?.departments || [],
        attendance: results[1].value?.data?.byStatus || [],
        leaves: results[2].value?.data?.byType || [],
        payroll: results[3].value?.data?.summary || []
      })
      const rejected = results.find((result) => result.status === 'rejected')
      setError(rejected?.reason?.response?.data?.message || '')
    })
    return () => {
      mounted = false
    }
  }, [filters])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">EMS Reports</h1>
          <p className="mt-1 text-sm text-slate-600">Headcount, attendance, leave, and payroll summaries.</p>
        </div>
        <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Download className="h-4 w-4" /> PDF
        </button>
      </div>
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} className={inputClass} />
        <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} className={inputClass} />
      </div>
      {error ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportPanel title="Headcount" rows={reports.headcount.map((item) => ({ label: item.department?.name, value: item.total }))} />
        <ReportPanel title="Attendance" rows={reports.attendance.map((item) => ({ label: item._id, value: item.total }))} />
        <ReportPanel title="Leaves" rows={reports.leaves.map((item) => ({ label: item._id, value: `${item.days || 0} days` }))} />
        <ReportPanel title="Payroll" rows={reports.payroll.map((item) => ({ label: item._id, value: item.netPay || 0 }))} />
      </div>
    </div>
  )
}

function ReportPanel({ title, rows }) {
  const max = Math.max(...rows.map((row) => Number(row.value) || 0), 1)
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const numeric = Number(row.value) || 0
          return (
            <div key={row.label} className="grid grid-cols-[130px_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate text-slate-600">{row.label || 'Unknown'}</span>
              <span className="h-2 rounded-full bg-slate-100"><span className="block h-2 rounded-full bg-[#2f8dff]" style={{ width: `${Math.max(6, (numeric / max) * 100)}%` }} /></span>
              <span className="font-semibold text-slate-950">{row.value}</span>
            </div>
          )
        })}
        {!rows.length ? <p className="py-8 text-center text-sm text-slate-500">No data available.</p> : null}
      </div>
    </section>
  )
}
