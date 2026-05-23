import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { departmentApi } from '../../api/departmentApi'

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

export default function DepartmentList() {
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ name: '', code: '', openPositions: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    departmentApi.list({ limit: 100 }).then(({ data }) => setDepartments(data.items || [])).catch((err) => {
      setError(err.response?.data?.message || 'Unable to load departments')
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await departmentApi.create(form)
      setForm({ name: '', code: '', openPositions: 0 })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create department')
    }
  }

  const remove = async (id) => {
    setError('')
    try {
      await departmentApi.remove(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete department')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Departments</h1>
        <p className="mt-1 text-sm text-slate-600">Manage department master data and open positions.</p>
      </div>

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <form onSubmit={create} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_160px_160px_auto]">
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Department name" className={inputClass} required />
        <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="Code" className={inputClass} required />
        <input type="number" value={form.openPositions} onChange={(event) => setForm({ ...form, openPositions: event.target.value })} placeholder="Open positions" className={inputClass} />
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#00427d] px-4 text-sm font-semibold text-white hover:bg-[#063763]">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Headcount</th>
              <th className="px-4 py-3">Open</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((department) => (
              <tr key={department._id}>
                <td className="px-4 py-3 font-semibold text-slate-950">{department.name}</td>
                <td className="px-4 py-3 text-slate-600">{department.code}</td>
                <td className="px-4 py-3 text-slate-600">{department.headcount || 0}</td>
                <td className="px-4 py-3 text-slate-600">{department.openPositions || 0}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => remove(department._id)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Delete department">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!departments.length && !loading ? <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">No departments found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
