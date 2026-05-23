import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { payrollApi } from '../../api/payrollApi'

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

export default function PayrollGenerate() {
  const navigate = useNavigate()
  const now = new Date()
  const [form, setForm] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setResult(null)
    try {
      const { data } = await payrollApi.generate(form)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate payroll')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Generate Payroll</h1>
        <p className="mt-1 text-sm text-slate-600">Create or update draft payroll for active employees.</p>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {result ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{result.count} payroll record(s) generated.</div> : null}
      <form onSubmit={submit} className="grid max-w-2xl gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Month
          <input type="number" min="1" max="12" value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })} className={inputClass} required />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Year
          <input type="number" min="2000" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} className={inputClass} required />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={submitting} className="rounded-md bg-[#00427d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#063763] disabled:opacity-60">
            {submitting ? 'Generating...' : 'Generate'}
          </button>
          <button type="button" onClick={() => navigate('/ems/payroll')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            View Payroll
          </button>
        </div>
      </form>
    </div>
  )
}
