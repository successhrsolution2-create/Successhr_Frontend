import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, KeyRound, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import { ConfirmDialog, PromptDialog } from '../../components/ActionDialogs'

const blankForm = {
  _id: '',
  name: '',
  companyName: '',
  email: '',
  mobileNo: '',
  password: '',
  isActive: true
}

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')

export default function CompanyManagement() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [admins, setAdmins] = useState([])
  const [summary, setSummary] = useState({ totalAdmins: 0, activeAdmins: 0, submittedInterviewInfo: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [deleteAdmin, setDeleteAdmin] = useState(null)
  const [resetAdmin, setResetAdmin] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    const [adminsResponse, summaryResponse] = await Promise.all([
      api.get('/company-management/admins'),
      api.get('/company-management/summary')
    ])
    setAdmins(adminsResponse.data.admins || [])
    setSummary(summaryResponse.data)
    setLoading(false)
  }

  useEffect(() => {
    let active = true

    Promise.all([
      api.get('/company-management/admins'),
      api.get('/company-management/summary')
    ])
      .then(([adminsResponse, summaryResponse]) => {
        if (!active) return
        setAdmins(adminsResponse.data.admins || [])
        setSummary(summaryResponse.data)
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || 'Could not load company admins')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return admins

    return admins.filter((admin) =>
      [admin.name, admin.companyName, admin.email, admin.mobileNo, admin.isActive ? 'active' : 'inactive']
        .some((value) => String(value || '').toLowerCase().includes(term))
    )
  }, [admins, search])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  useEffect(() => {
    if (searchParams.get('action') !== 'create') return
    queueMicrotask(() => {
      setForm({ ...blankForm })
      setModalMode('create')
    })
  }, [searchParams])

  const openCreate = () => {
    setForm({ ...blankForm })
    setModalMode('create')
    setSearchParams({ action: 'create' })
  }

  const openEdit = (admin) => {
    setForm({
      _id: admin._id,
      name: admin.name || '',
      companyName: admin.companyName || '',
      email: admin.email || '',
      mobileNo: admin.mobileNo || '',
      password: '',
      isActive: Boolean(admin.isActive)
    })
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setForm({ ...blankForm })
    if (searchParams.get('action') === 'create') {
      setSearchParams({}, { replace: true })
    }
  }

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        name: form.name,
        companyName: form.companyName,
        email: form.email,
        mobileNo: form.mobileNo,
        isActive: form.isActive
      }

      if (modalMode === 'create') {
        payload.password = form.password
        await api.post('/company-management/admins', payload)
      } else {
        await api.put(`/company-management/admins/${form._id}`, payload)
      }

      await load()
      closeModal()
      toast.success(modalMode === 'create' ? 'Company admin created' : 'Company admin updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save company admin')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (admin) => {
    try {
      await api.put(`/company-management/admins/${admin._id}`, { isActive: !admin.isActive })
      await load()
      toast.success(`Company admin ${admin.isActive ? 'deactivated' : 'activated'}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update company admin')
    }
  }

  const remove = async () => {
    if (!deleteAdmin) return

    try {
      await api.delete(`/company-management/admins/${deleteAdmin._id}`)
      await load()
      toast.success('Company admin removed')
      setDeleteAdmin(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove company admin')
    }
  }

  const resetPassword = async (newPassword) => {
    if (!resetAdmin) return

    try {
      await api.put(`/company-management/admins/${resetAdmin._id}/reset-password`, { newPassword })
      toast.success('Company admin password reset')
      setResetAdmin(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not reset company admin password')
    }
  }

  if (loading) return <Skeleton rows={8} />

  const cards = [
    { label: 'Company Admins', value: summary.totalAdmins, icon: Users },
    { label: 'Active Accounts', value: summary.activeAdmins, icon: CheckCircle2 },
    { label: 'Candidate Forms Submitted', value: summary.submittedInterviewInfo, icon: ClipboardList }
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Company Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create company-admin logins and monitor candidate interview forms.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          Create Company Admin
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <card.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">{card.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{card.value}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search company, admin, email, mobile..."
            className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
          />
        </div>
        <Link
          to="/admin/company-management/interview-info"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-700 hover:bg-sky-100"
        >
          <ClipboardList className="h-4 w-4" />
          View Candidate Forms
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-[13px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Admin Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Mobile</th>
                <th className="px-4 py-2.5">Candidate Forms</th>
                <th className="px-4 py-2.5">Created</th>
                <th className="px-4 py-2.5">Active</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((admin) => (
                <tr key={admin._id} className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40">
                  <td className="px-4 py-2 font-semibold text-slate-900">{admin.companyName}</td>
                  <td className="px-4 py-2 text-slate-600">{admin.name}</td>
                  <td className="px-4 py-2 text-slate-600">{admin.email}</td>
                  <td className="px-4 py-2 text-slate-600">{admin.mobileNo || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${admin.hasInterviewInfo ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {admin.hasInterviewInfo ? `${admin.interviewInfoCount || 1} Submitted` : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{formatDate(admin.createdAt)}</td>
                  <td className="px-4 py-2">
                    <label className="inline-flex cursor-pointer items-center">
                      <span className="sr-only">Active login for {admin.companyName}</span>
                      <input type="checkbox" checked={Boolean(admin.isActive)} onChange={() => toggleActive(admin)} className="sr-only" />
                      <span className={`h-5 w-9 rounded-full p-0.5 transition ${admin.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <span className={`block h-4 w-4 rounded-full bg-white transition ${admin.isActive ? 'translate-x-4' : ''}`} />
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      <ActionButton label="Update" onClick={() => openEdit(admin)} color="border-amber-200 text-amber-700 hover:bg-amber-50">
                        <Pencil className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton label="Reset" onClick={() => setResetAdmin(admin)} color="border-sky-200 text-sky-700 hover:bg-sky-50">
                        <KeyRound className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton label="Delete" onClick={() => setDeleteAdmin(admin)} color="border-rose-200 text-rose-700 hover:bg-rose-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500">No company admins found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          itemLabel="company admins"
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPage(1)
            setPageSize(value)
          }}
        />
      </div>

      {modalMode ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-3 py-4">
          <form onSubmit={save} className="w-full max-w-xl rounded-xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{modalMode === 'create' ? 'Create Company Admin' : 'Update Company Admin'}</h2>
                <p className="mt-1 text-sm text-slate-500">Enter simple login details for the company representative.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ModalField label="Company Name" required value={form.companyName} onChange={(value) => updateForm('companyName', value)} />
              <ModalField label="Admin Name" required value={form.name} onChange={(value) => updateForm('name', value)} />
              <ModalField label="Email" required type="email" value={form.email} onChange={(value) => updateForm('email', value)} />
              <ModalField label="Mobile No" value={form.mobileNo} onChange={(value) => updateForm('mobileNo', value.replace(/\D/g, '').slice(0, 10))} />
              {modalMode === 'create' ? (
                <ModalField label="Temporary Password" required type="password" value={form.password} onChange={(value) => updateForm('password', value)} />
              ) : null}
              <label className="flex min-h-10 items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm('isActive', event.target.checked)} className="h-4 w-4 rounded text-sky-600" />
                Active login
              </label>
            </div>

            <button type="submit" disabled={saving} className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70">
              {saving ? 'Saving...' : modalMode === 'create' ? 'Create Company Admin' : 'Save Changes'}
            </button>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteAdmin)}
        title="Remove Company Admin"
        message={`Remove ${deleteAdmin?.name || 'this company admin'}? Submitted interview information must be preserved, so accounts with records can only be deactivated.`}
        confirmText="Remove"
        danger
        onCancel={() => setDeleteAdmin(null)}
        onConfirm={remove}
      />
      <PromptDialog
        open={Boolean(resetAdmin)}
        title="Reset Company Admin Password"
        message={`Enter a new password for ${resetAdmin?.name || 'this company admin'}. Existing sessions will be signed out.`}
        placeholder="At least 6 characters"
        confirmText="Reset Password"
        onCancel={() => setResetAdmin(null)}
        onConfirm={resetPassword}
      />
    </div>
  )
}

function ActionButton({ label, color, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex min-h-8 items-center gap-1 rounded-md border bg-white px-2.5 text-xs font-semibold ${color}`}>
      {children}
      {label}
    </button>
  )
}

function ModalField({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required ? <span className="text-rose-500">*</span> : null}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100" />
    </label>
  )
}
