import { Link } from 'react-router-dom'
import LeaveStatusBadge from '../../components/LeaveStatusBadge'
import { useLeaves } from '../../hooks/useLeaves'

const dateText = (value) => (value ? new Date(value).toLocaleDateString() : '-')

export default function LeaveList() {
  const { leaves, loading, error } = useLeaves()

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Leaves</h1>
          <p className="mt-1 text-sm text-slate-600">Applications, status, and balances.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/ems/leaves/pending" className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Pending</Link>
          <Link to="/ems/leaves/apply" className="inline-flex h-10 items-center rounded-md bg-[#00427d] px-4 text-sm font-semibold text-white hover:bg-[#063763]">Apply</Link>
        </div>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leaves.map((leave) => (
              <tr key={leave._id}>
                <td className="px-4 py-3 font-semibold text-slate-950">{leave.employee?.fullName || `${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}`}</td>
                <td className="px-4 py-3 text-slate-600">{leave.leaveType}</td>
                <td className="px-4 py-3 text-slate-600">{dateText(leave.startDate)} - {dateText(leave.endDate)}</td>
                <td className="px-4 py-3 text-slate-600">{leave.totalDays}</td>
                <td className="px-4 py-3"><LeaveStatusBadge status={leave.status} /></td>
              </tr>
            ))}
            {!leaves.length && !loading ? <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">No leave records found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
