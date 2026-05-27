import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import DepartmentSelect from '../../components/DepartmentSelect'
import EmployeeCard from '../../components/EmployeeCard'
import { employeeApi } from '../../api/employeeApi'
import { useEmployees } from '../../hooks/useEmployees'

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
const managedRoleFilter = 'candidate_admin,manager,crm_employee'

export default function EmployeeList() {
  const [filters, setFilters] = useState({ search: '', department: '', status: '', role: '', roles: managedRoleFilter, type: '', limit: 24 })
  const [actionError, setActionError] = useState('')
  const params = useMemo(() => filters, [filters])
  const { employees, pagination, loading, error, setParams, reload } = useEmployees(params)

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value, page: 1 }
    if (key === 'role') next.roles = value ? '' : managedRoleFilter
    setFilters(next)
    setParams(next)
  }

  const changePage = (page) => {
    const next = { ...filters, page }
    setFilters(next)
    setParams(next)
  }

  const removeEmployee = async (employee) => {
    const name = employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employeeId
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return

    try {
      setActionError('')
      await employeeApi.remove(employee._id)
      reload()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Unable to delete employee')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Role Accounts</h1>
          <p className="mt-1 text-sm text-slate-600">{pagination?.total || 0} managed login records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={employeeApi.exportUrl({ ...filters, format: 'xlsx' })} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </a>
          <Link to="/ems/employees/add" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#00427d] px-4 text-sm font-semibold text-white hover:bg-[#063763]">
            <Plus className="h-4 w-4" /> Add
          </Link>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_150px_160px_160px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search role accounts" className={`${inputClass} w-full pl-9`} />
        </label>
        <DepartmentSelect value={filters.department} onChange={(value) => updateFilter('department', value)} className={inputClass} />
        <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className={inputClass}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="onboarding">Onboarding</option>
          <option value="terminated">Terminated</option>
        </select>
        <select value={filters.role} onChange={(event) => updateFilter('role', event.target.value)} className={inputClass}>
          <option value="">All login roles</option>
          <option value="candidate_admin">Candidate Management</option>
          <option value="manager">Manager</option>
          <option value="crm_employee">CRM Admin</option>
        </select>
        <select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} className={inputClass}>
          <option value="">All types</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
          <option>Intern</option>
          <option>Consultant</option>
        </select>
      </div>

      {error || actionError ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError || error}</div> : null}
      {loading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading role accounts...</div> : null}
      {!loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => <EmployeeCard key={employee._id} employee={employee} onDelete={removeEmployee} />)}
        </div>
      ) : null}
      {!loading && !employees.length ? <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No role accounts match these filters.</div> : null}
      {!loading && pagination?.pages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => changePage(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              type="button"
              onClick={() => changePage(Math.min(pagination.pages, pagination.page + 1))}
              disabled={pagination.page >= pagination.pages}
              className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
