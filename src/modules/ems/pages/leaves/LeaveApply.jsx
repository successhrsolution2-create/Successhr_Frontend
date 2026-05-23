import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeeApi } from '../../api/employeeApi'
import { leaveApi } from '../../api/leaveApi'

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

export default function LeaveApply() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ employeeId: '', leaveType: 'Casual', startDate: '', endDate: '', reason: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    employeeApi.list({ limit: 100 }).then(({ data }) => setEmployees(data.items || [])).catch(() => setEmployees([]))
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await leaveApi.apply(form)
      navigate('/ems/leaves')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to apply leave')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Apply Leave</h1>
        <p className="mt-1 text-sm text-slate-600">Create a leave request for approval.</p>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <form onSubmit={submit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Employee
          <select value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} className={inputClass} required>
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>{employee.employeeId} · {employee.firstName} {employee.lastName}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Type
          <select value={form.leaveType} onChange={(event) => setForm({ ...form, leaveType: event.target.value })} className={inputClass}>
            <option>Casual</option>
            <option>Sick</option>
            <option>Earned</option>
            <option>Maternity</option>
            <option>Unpaid</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">Start Date<input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className={inputClass} required /></label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">End Date<input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={inputClass} required /></label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
          Reason
          <textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" required />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={submitting} className="rounded-md bg-[#00427d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#063763] disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit Leave'}
          </button>
        </div>
      </form>
    </div>
  )
}
