import { useEffect, useState } from 'react'
import LeaveStatusBadge from '../../components/LeaveStatusBadge'
import { leaveApi } from '../../api/leaveApi'

const dateText = (value) => (value ? new Date(value).toLocaleDateString() : '-')

export default function LeavePending() {
  const [leaves, setLeaves] = useState([])
  const [error, setError] = useState('')

  const load = () => {
    leaveApi.pending().then(({ data }) => setLeaves(data.items || [])).catch((err) => {
      setError(err.response?.data?.message || 'Unable to load pending leaves')
    })
  }

  useEffect(() => {
    load()
  }, [])

  const act = async (id, action) => {
    setError('')
    try {
      if (action === 'approve') await leaveApi.approve(id, {})
      else await leaveApi.reject(id, { reason: 'Rejected from EMS panel' })
      load()
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${action} leave`)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Pending Leaves</h1>
        <p className="mt-1 text-sm text-slate-600">Manager and HR approval queue.</p>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <div className="space-y-3">
        {leaves.map((leave) => (
          <div key={leave._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-950">{leave.employee?.firstName} {leave.employee?.lastName}</p>
                <p className="mt-1 text-sm text-slate-600">{leave.leaveType} · {dateText(leave.startDate)} - {dateText(leave.endDate)} · {leave.totalDays} day(s)</p>
              </div>
              <LeaveStatusBadge status={leave.status} />
            </div>
            <p className="mt-3 text-sm text-slate-600">{leave.reason}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => act(leave._id, 'approve')} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Approve</button>
              <button type="button" onClick={() => act(leave._id, 'reject')} className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Reject</button>
            </div>
          </div>
        ))}
        {!leaves.length ? <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No pending leave requests.</div> : null}
      </div>
    </div>
  )
}
