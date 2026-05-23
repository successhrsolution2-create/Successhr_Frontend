import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import axios from 'axios'
import api, { API_ROOT } from '../../api/axios'
import { updateUser } from '../../store/authSlice'
import Skeleton from '../../components/Skeleton'

const panelOptions = [
  { value: 'candidate_management', label: 'Candidate Management' },
  { value: 'business_advisor', label: 'Business Advisor' },
  { value: 'crm', label: 'CRM Telecalling' }
]

const todayIso = () => new Date().toISOString().slice(0, 10)

const daysAgoIso = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

const dateRangeDays = (fromDate, toDate) => {
  const from = new Date(`${fromDate}T00:00:00`)
  const to = new Date(`${toDate}T00:00:00`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0
  return Math.floor((to - from) / (24 * 60 * 60 * 1000)) + 1
}

const formatAuditDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('en-IN')
}

const panelLabel = (value) => panelOptions.find((panel) => panel.value === value)?.label || value

export default function AdminSettings() {
  const dispatch = useDispatch()
  const authUser = useSelector((state) => state.auth.user)

  const [loading, setLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: authUser?.name || '',
    email: authUser?.email || ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [backupForm, setBackupForm] = useState({
    fromDate: daysAgoIso(30),
    toDate: todayIso(),
    panels: ['candidate_management', 'business_advisor', 'crm']
  })
  const [backupToken, setBackupToken] = useState('')
  const [backupTokenExpiresAt, setBackupTokenExpiresAt] = useState(0)
  const [backupExporting, setBackupExporting] = useState(false)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditRows, setAuditRows] = useState([])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await api.get('/auth/settings')
        const user = data.user || {}
        setProfileForm({
          name: user.name || '',
          email: user.email || ''
        })
        dispatch(updateUser(user))
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [dispatch])

  const saveProfile = async (event) => {
    event.preventDefault()

    if (!profileForm.name.trim()) {
      toast.error('Name is required')
      return
    }

    if (!profileForm.email.trim()) {
      toast.error('Email is required')
      return
    }

    setProfileSaving(true)
    try {
      const { data } = await api.put('/auth/settings/profile', {
        name: profileForm.name.trim(),
        email: profileForm.email.trim()
      })

      dispatch(updateUser(data.user))
      setProfileForm({
        name: data.user?.name || '',
        email: data.user?.email || ''
      })
      toast.success(data.message || 'Profile updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Current and new password are required')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }

    setPasswordSaving(true)
    try {
      const { data } = await api.put('/auth/settings/password', passwordForm)
      toast.success(data.message || 'Password updated')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update password')
    } finally {
      setPasswordSaving(false)
    }
  }

  async function getBackupToken() {
    if (backupToken && Date.now() < backupTokenExpiresAt - 15_000) return backupToken

    const { data } = await axios.post(`${API_ROOT}/backup/session`, {}, { withCredentials: true })
    const token = data?.backupToken
    if (!token) throw new Error('Backup session token missing')

    setBackupToken(token)
    setBackupTokenExpiresAt(Date.now() + Number(data.expiresIn || 300) * 1000)
    return token
  }

  async function loadBackupAudit() {
    setAuditLoading(true)
    try {
      const token = await getBackupToken()
      const { data } = await axios.get(`${API_ROOT}/backup/audit`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      })
      setAuditRows(Array.isArray(data?.data) ? data.data : [])
    } catch (error) {
      setAuditRows([])
      if (authUser?.role === 'superAdmin') {
        toast.error(error.response?.data?.message || 'Could not load backup history')
      }
    } finally {
      setAuditLoading(false)
    }
  }

  useEffect(() => {
    if (authUser?.role !== 'superAdmin') return
    loadBackupAudit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.role])

  const toggleBackupPanel = (panel, checked) => {
    setBackupForm((current) => ({
      ...current,
      panels: checked ? [...new Set([...current.panels, panel])] : current.panels.filter((item) => item !== panel)
    }))
  }

  const setQuickRange = (days) => {
    setBackupForm((current) => ({
      ...current,
      fromDate: daysAgoIso(days - 1),
      toDate: todayIso()
    }))
  }

  const downloadBackup = async () => {
    if (!backupForm.fromDate || !backupForm.toDate) {
      toast.error('Select backup date range')
      return
    }

    if (backupForm.toDate < backupForm.fromDate) {
      toast.error('To date must be after from date')
      return
    }

    if (dateRangeDays(backupForm.fromDate, backupForm.toDate) > 365) {
      toast.error('Maximum backup range is 1 year')
      return
    }

    if (!backupForm.panels.length) {
      toast.error('Select at least one panel')
      return
    }

    setBackupExporting(true)
    try {
      const token = await getBackupToken()
      const { data } = await axios.post(`${API_ROOT}/backup/request`, backupForm, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      })
      const downloadToken = data?.downloadToken
      if (!downloadToken) throw new Error('Download token missing')

      const response = await axios.get(`${API_ROOT}/backup/download`, {
        responseType: 'blob',
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
        params: { token: downloadToken }
      })

      const blobUrl = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `success-hr-backup-${backupForm.fromDate}-to-${backupForm.toDate}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)

      toast.success('Backup Excel downloaded')
      loadBackupAudit()
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not download backup')
    } finally {
      setBackupExporting(false)
    }
  }

  if (loading) return <Skeleton rows={8} />

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{authUser?.role === 'businessAdvisor' ? 'BA Settings' : 'Admin Settings'}</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account details, login email, and password.</p>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h2 className="text-lg font-bold text-slate-900">Profile & Email</h2>
        <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            required
            value={profileForm.name}
            onChange={(value) => setProfileForm((current) => ({ ...current, name: value }))}
          />
          <Field
            label="Email"
            required
            type="email"
            value={profileForm.email}
            onChange={(value) => setProfileForm((current) => ({ ...current, email: value }))}
          />
          <Field label="Role" value={authUser?.role === 'businessAdvisor' ? 'Business Advisor' : 'Super Admin'} readOnly />
          <Field label="Status" value={authUser?.isActive ? 'Active' : 'Inactive'} readOnly />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70 sm:w-auto"
            >
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
        <form onSubmit={savePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Current Password"
            required
            type="password"
            value={passwordForm.currentPassword}
            onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
          />
          <div />
          <Field
            label="New Password"
            required
            type="password"
            value={passwordForm.newPassword}
            onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
          />
          <Field
            label="Confirm New Password"
            required
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
          />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70 sm:w-auto"
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      {authUser?.role === 'superAdmin' ? (
        <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Backup & Export</h2>
              <p className="mt-1 text-sm text-slate-500">Download secure Excel backups for Candidate Management, Business Advisor, and CRM data.</p>
            </div>
            <button
              type="button"
              onClick={loadBackupAudit}
              disabled={auditLoading}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {auditLoading ? 'Refreshing...' : 'Refresh History'}
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Date Range</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="From" type="date" value={backupForm.fromDate} onChange={(value) => setBackupForm((current) => ({ ...current, fromDate: value }))} />
                <Field label="To" type="date" value={backupForm.toDate} onChange={(value) => setBackupForm((current) => ({ ...current, toDate: value }))} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ['Today', 1],
                  ['Last 7 Days', 7],
                  ['Last 30 Days', 30],
                  ['Last 90 Days', 90],
                  ['Last 180 Days', 180]
                ].map(([label, days]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setQuickRange(days)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">Maximum range: 1 year. Export limit: 10 requests per hour.</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Panels</h3>
              <div className="mt-3 space-y-2">
                {panelOptions.map((panel) => (
                  <label key={panel.value} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                    <span>{panel.label}</span>
                    <input
                      type="checkbox"
                      checked={backupForm.panels.includes(panel.value)}
                      onChange={(event) => toggleBackupPanel(panel.value, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={downloadBackup}
                disabled={backupExporting}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {backupExporting ? 'Generating Excel...' : 'Generate & Download Excel'}
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Panels</th>
                  <th className="px-3 py-2">Records</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditRows.map((row) => (
                  <tr key={row._id}>
                    <td className="px-3 py-2 text-slate-600">{formatAuditDate(row.createdAt)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{row.action}</td>
                    <td className="px-3 py-2 text-slate-600">{(row.panels || []).map(panelLabel).join(', ') || '-'}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {Number(row.recordCounts?.candidateManagement || 0) + Number(row.recordCounts?.businessAdvisor || 0) + Number(row.recordCounts?.crm || 0)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${row.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {row.status || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{row.durationMs ? `${row.durationMs}ms` : '-'}</td>
                  </tr>
                ))}
                {!auditRows.length ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      {auditLoading ? 'Loading export history...' : 'No backup exports yet.'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Field({ label, value, onChange = () => {}, required = false, type = 'text', readOnly = false }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
      <input
        type={type}
        value={value || ''}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
          readOnly ? 'bg-slate-100 text-slate-500' : 'bg-white'
        }`}
      />
    </label>
  )
}
