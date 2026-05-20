import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Download, PhoneCall, Plus, RefreshCw, Search, UserCheck, Users } from 'lucide-react'
import crmApi from '../../api/crmAxios'

const emptyFilters = {
  employeeId: '',
  candidateClass: '',
  callStatus: '',
  interested: '',
  search: '',
  startDate: '',
  endDate: ''
}

const emptyEmployeeForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
}

const statusTone = {
  pending: 'bg-slate-100 text-slate-700',
  called: 'bg-sky-100 text-sky-700',
  followup: 'bg-amber-100 text-amber-800',
  converted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700'
}

const classTone = {
  '1st': 'bg-rose-100 text-rose-700',
  '2nd': 'bg-amber-100 text-amber-800',
  '3rd': 'bg-slate-100 text-slate-700'
}

const errorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

const queryString = (params) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.append(key, value)
  })
  const value = search.toString()
  return value ? `?${value}` : ''
}

const Badge = ({ children, tone = 'bg-slate-100 text-slate-700' }) => (
  <span className={`inline-flex min-w-12 justify-center rounded-md px-2.5 py-1 text-xs font-semibold ${tone}`}>{children}</span>
)

const SummaryCard = ({ icon: Icon, label, value, tone = 'text-slate-700 bg-slate-50' }) => (
  <div className="rounded-md border border-slate-200 bg-white p-4">
    <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md ${tone}`}>
      <Icon className="h-4 w-4" />
    </div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
  </div>
)

const tabPaths = {
  employees: '/admin/crm/employees',
  candidates: '/admin/crm/candidates'
}

const tabLabels = {
  employees: 'Success Employee',
  candidates: 'CRM Candidates'
}

const CrmManagement = ({ initialTab = 'employees' }) => {
  const navigate = useNavigate()
  const [tab, setTab] = useState(initialTab)
  const [employees, setEmployees] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [employeePagination, setEmployeePagination] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState(emptyFilters)
  const [activeFilters, setActiveFilters] = useState(emptyFilters)
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm)
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingEmployee, setSavingEmployee] = useState(false)
  const [page, setPage] = useState(1)
  const [employeePage, setEmployeePage] = useState(1)

  const candidateQuery = useMemo(() => queryString({ ...activeFilters, page, limit: 25 }), [activeFilters, page])
  const employeeQuery = useMemo(() => queryString({ page: employeePage, limit: 10 }), [employeePage])
  const allEmployeeRows = useMemo(() => (employeeOptions.length ? employeeOptions : employees), [employeeOptions, employees])
  const crmSummary = useMemo(() => {
    const totalEmployees = employeePagination?.total || allEmployeeRows.length
    const activeEmployees = allEmployeeRows.filter((employee) => employee.isActive).length
    const assignedCandidates = allEmployeeRows.reduce((sum, employee) => sum + Number(employee.candidateCount || 0), 0)

    return {
      totalEmployees,
      activeEmployees,
      assignedCandidates,
      crmCandidates: pagination?.total || assignedCandidates || candidates.length
    }
  }, [allEmployeeRows, candidates.length, employeePagination, pagination])

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const selectTab = (nextTab) => {
    setTab(nextTab)
    navigate(tabPaths[nextTab])
  }

  const loadEmployees = async () => {
    const { data } = await crmApi.get(`/admin/employees${employeeQuery}`)
    setEmployees(data.data?.employees || [])
    setEmployeePagination(data.data?.pagination || null)
  }

  const loadEmployeeOptions = async () => {
    const { data } = await crmApi.get('/admin/employees?limit=100')
    setEmployeeOptions(data.data?.employees || [])
  }

  const loadCandidates = async () => {
    const { data } = await crmApi.get(`/admin/candidates${candidateQuery}`)
    setCandidates(data.data?.candidates || [])
    setPagination(data.data?.pagination || null)
  }

  const loadAll = async () => {
    try {
      setLoading(true)
      await Promise.all([loadEmployees(), loadEmployeeOptions(), loadCandidates()])
    } catch (error) {
      toast.error(errorMessage(error, 'Could not load CRM management data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [candidateQuery, employeeQuery])

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setActiveFilters(filters)
    }, 350)

    return () => window.clearTimeout(debounceTimer)
  }, [filters])

  const updateFilter = (field, value) => {
    setPage(1)
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const resetFilters = () => {
    setFilters(emptyFilters)
    setActiveFilters(emptyFilters)
    setPage(1)
  }

  const createEmployee = async (event) => {
    event.preventDefault()

    if (employeeForm.password !== employeeForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setSavingEmployee(true)
      await crmApi.post('/admin/employees', employeeForm)
      toast.success('Success Employee created')
      setEmployeeForm(emptyEmployeeForm)
      setShowEmployeeForm(false)
      setEmployeePage(1)
      await loadAll()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not create Success Employee'))
    } finally {
      setSavingEmployee(false)
    }
  }

  const toggleEmployee = async (employee) => {
    try {
      await crmApi.patch(`/admin/employees/${employee._id}/toggle`, { isActive: !employee.isActive })
      toast.success(`Success Employee ${employee.isActive ? 'deactivated' : 'activated'}`)
      await Promise.all([loadEmployees(), loadEmployeeOptions()])
    } catch (error) {
      toast.error(errorMessage(error, 'Could not update Success Employee status'))
    }
  }

  const exportCsv = async () => {
    try {
      const { data } = await crmApi.get(`/admin/export${queryString(filters)}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `crm-candidates-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(errorMessage(error, 'Could not export CRM candidates'))
    }
  }

  const viewEmployeeCandidates = (employee) => {
    const nextFilters = { ...emptyFilters, employeeId: employee._id }
    setFilters(nextFilters)
    setActiveFilters(nextFilters)
    setPage(1)
    selectTab('candidates')
  }

  return (
    <div className="-m-3 min-h-[calc(100vh-4rem)] bg-white px-4 py-5 text-slate-900 sm:-m-5 sm:px-6 lg:-m-6 lg:px-8">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Telecalling CRM</h1>
            <p className="mt-2 text-sm text-slate-600">Manage Success Employee records and CRM candidates.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadAll}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            {tab === 'employees' ? (
              <button
                type="button"
                onClick={() => setShowEmployeeForm((current) => !current)}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800"
              >
                <Plus className="h-4 w-4" />
                New Success Employee
              </button>
            ) : null}
            {tab === 'candidates' ? (
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 text-sm">
          {['employees', 'candidates'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => selectTab(item)}
              className={`border-b-2 px-1 pb-3 font-medium ${
                tab === item ? 'border-cyan-600 text-slate-950' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tabLabels[item]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading CRM...</div>
      ) : null}

      <div className="grid gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Users} label="Success Employees" value={crmSummary.totalEmployees} tone="bg-sky-50 text-sky-700" />
        <SummaryCard icon={UserCheck} label="Active Employees" value={crmSummary.activeEmployees} tone="bg-emerald-50 text-emerald-700" />
        <SummaryCard icon={PhoneCall} label="CRM Candidates" value={crmSummary.crmCandidates} tone="bg-indigo-50 text-indigo-700" />
        <SummaryCard icon={Download} label="Assigned Candidates" value={crmSummary.assignedCandidates} tone="bg-amber-50 text-amber-700" />
      </div>

      {tab === 'employees' ? (
        <section className="space-y-4 py-6">
          {showEmployeeForm ? (
            <form className="rounded-md border border-slate-200 bg-sky-50/60 p-4" onSubmit={createEmployee}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <input
                  className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  placeholder="Name"
                  value={employeeForm.name}
                  onChange={(event) => setEmployeeForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
                <input
                  className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  type="email"
                  placeholder="Email"
                  value={employeeForm.email}
                  onChange={(event) => setEmployeeForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
                <input
                  className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  type="password"
                  placeholder="Password"
                  minLength={8}
                  value={employeeForm.password}
                  onChange={(event) => setEmployeeForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
                <input
                  className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  type="password"
                  placeholder="Confirm Password"
                  minLength={8}
                  value={employeeForm.confirmPassword}
                  onChange={(event) => setEmployeeForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  required
                />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
                  onClick={() => setShowEmployeeForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEmployee}
                  className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingEmployee ? 'Saving...' : 'Create Success Employee'}
                </button>
              </div>
            </form>
          ) : null}

          <div className="flex items-center gap-2 text-lg font-bold text-emerald-700">
            <ChevronDown className="h-5 w-5" />
            <span>Success Employee</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{employees.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] border-collapse rounded-md border border-slate-200 bg-white text-left text-sm shadow-[inset_5px_0_0_#059669]">
              <thead>
                <tr className="h-11 border-b border-slate-200">
                  <th className="border-r border-slate-200 px-4 font-medium">Name</th>
                  <th className="border-r border-slate-200 px-4 font-medium">Email</th>
                  <th className="border-r border-slate-200 px-4 font-medium">Candidates</th>
                  <th className="border-r border-slate-200 px-4 font-medium">Status</th>
                  <th className="border-r border-slate-200 px-4 font-medium">Last Active</th>
                  <th className="px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.map((employee) => (
                  <tr key={employee._id} className="h-11 hover:bg-slate-50">
                    <td className="border-r border-slate-200 px-4 font-semibold text-slate-900">{employee.name}</td>
                    <td className="border-r border-slate-200 px-4 text-blue-600">{employee.email}</td>
                    <td className="border-r border-slate-200 px-4">{employee.candidateCount || 0}</td>
                    <td className="border-r border-slate-200 px-4">
                      <Badge tone={employee.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="border-r border-slate-200 px-4 text-slate-600">{formatDateTime(employee.lastActiveAt || employee.updatedAt)}</td>
                    <td className="px-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-100"
                          onClick={() => viewEmployeeCandidates(employee)}
                        >
                          View candidates
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-100"
                          onClick={() => toggleEmployee(employee)}
                        >
                          {employee.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!employees.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                      No Success Employee created yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {employeePagination && employeePagination.totalPages > 1 ? (
            <div className="flex items-center justify-end gap-2">
              <button
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                type="button"
                disabled={employeePage <= 1}
                onClick={() => setEmployeePage(employeePage - 1)}
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-slate-600">
                Page {employeePagination.page} of {employeePagination.totalPages}
              </span>
              <button
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                type="button"
                disabled={employeePage >= employeePagination.totalPages}
                onClick={() => setEmployeePage(employeePage + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'candidates' ? (
        <section className="space-y-4 py-6">
          <form className="rounded-md border border-slate-200 bg-white p-3 shadow-sm" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
              <select className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={filters.employeeId} onChange={(event) => updateFilter('employeeId', event.target.value)}>
                <option value="">All Success Employee</option>
                {employeeOptions.map((employee) => (
                  <option key={employee._id} value={employee._id}>{employee.name}</option>
                ))}
              </select>
              <select className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={filters.candidateClass} onChange={(event) => updateFilter('candidateClass', event.target.value)}>
                <option value="">All classes</option>
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
              </select>
              <select className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={filters.callStatus} onChange={(event) => updateFilter('callStatus', event.target.value)}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="called">Called</option>
                <option value="followup">Follow-up</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
              <select className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={filters.interested} onChange={(event) => updateFilter('interested', event.target.value)}>
                <option value="">Interested</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} />
              <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} />
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-300 px-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="Search name, mobile, education, job"
                  value={filters.search}
                  onChange={(event) => updateFilter('search', event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold" onClick={resetFilters}>Reset</button>
              </div>
            </div>
          </form>

          <div className="flex items-center gap-2 text-lg font-bold text-emerald-700">
            <ChevronDown className="h-5 w-5" />
            <span>CRM Candidates</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{candidates.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1200px] border-collapse rounded-md border border-slate-200 bg-white text-left text-sm shadow-[inset_5px_0_0_#059669]">
              <thead>
                <tr className="h-11 border-b border-slate-200">
                  <th className="border-r border-slate-200 px-4 font-medium">CRM Candidate</th>
                  <th className="border-r border-slate-200 px-4 font-medium">Mobile</th>
                  <th className="border-r border-slate-200 px-4 font-medium">Job Profile</th>
                  <th className="border-r border-slate-200 px-4 font-medium">Success Employee</th>
                  <th className="border-r border-slate-200 px-4 font-medium">Interested</th>
                  <th className="border-r border-slate-200 px-4 font-medium">Class</th>
                  <th className="border-r border-slate-200 px-4 font-medium">Status</th>
                  <th className="px-4 font-medium">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {candidates.map((candidate) => (
                  <tr key={candidate._id} className="h-11 hover:bg-slate-50">
                    <td className="border-r border-slate-200 px-4 font-semibold text-slate-900">{candidate.candidateName}</td>
                    <td className="border-r border-slate-200 px-4 text-blue-600">{candidate.mobileNumber}</td>
                    <td className="border-r border-slate-200 px-4 text-slate-600">{candidate.jobProfile}</td>
                    <td className="border-r border-slate-200 px-4 text-slate-600">{candidate.recruiter?.name || '-'}</td>
                    <td className="border-r border-slate-200 px-4">
                      <Badge tone={candidate.interested?.status === 'yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                        {candidate.interested?.status || '-'}
                      </Badge>
                    </td>
                    <td className="border-r border-slate-200 px-4"><Badge tone={classTone[candidate.candidateClass]}>{candidate.candidateClass}</Badge></td>
                    <td className="border-r border-slate-200 px-4"><Badge tone={statusTone[candidate.callStatus]}>{candidate.callStatus}</Badge></td>
                    <td className="px-4 text-slate-600">{formatDateTime(candidate.updatedAt)}</td>
                  </tr>
                ))}
                {!candidates.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                      No CRM candidates found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex items-center justify-end gap-2">
              <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="text-sm font-semibold text-slate-600">Page {pagination.page} of {pagination.totalPages}</span>
              <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50" type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

export default CrmManagement
