import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import axios from 'axios'
import {
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  KeyRound,
  Search,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  X
} from 'lucide-react'
import api, { API_ROOT } from '../../api/axios'
import { employeeApi } from '../../modules/ems/api/employeeApi'
import { updateUser } from '../../store/authSlice'
import Skeleton from '../../components/Skeleton'

const panelOptions = [
  { value: 'candidate_management', label: 'Candidate Management' },
  { value: 'business_advisor', label: 'Business Advisor' },
  { value: 'crm', label: 'CRM Telecalling' }
]

const managerAccessOptions = [
  { value: 'candidateManagement', label: 'Candidate Management' },
  { value: 'crmManagement', label: 'CRM Management' },
  { value: 'employeeManagement', label: 'Success Employee Management' }
]

const managerAccessLabels = {
  candidateManagement: 'Candidate Management',
  crmManagement: 'CRM Management',
  employeeManagement: 'Success Employee Management'
}

const roleLabels = {
  superAdmin: 'Super Admin',
  candidateAdmin: 'Candidate Management',
  candidate_admin: 'Candidate Management',
  manager: 'Manager',
  businessAdvisor: 'Business Advisor',
  crm_employee: 'CRM Admin',
  employee: 'Employee',
  hr: 'HR',
  ems_super_admin: 'EMS Super Admin'
}

const accessLabels = {
  superAdmin: 'Full Access',
  candidateAdmin: 'Candidate Management',
  candidate_admin: 'Candidate Management',
  manager: 'Manager Module Access',
  businessAdvisor: 'Advisor Access',
  crm_employee: 'CRM Admin Access',
  employee: 'EMS Employee',
  hr: 'EMS HR Access',
  ems_super_admin: 'Success Employee'
}

const roleTabs = [
  { id: 'all', label: 'All' },
  { id: 'superAdmin', label: 'Super Admin' },
  { id: 'candidateAdmin', label: 'Candidate Management' },
  { id: 'manager', label: 'Manager' },
  { id: 'businessAdvisor', label: 'Business Advisor' },
  { id: 'crm_employee', label: 'CRM Admin' }
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

const compactId = (value) => {
  const id = String(value || '')
  if (!id) return '-'
  return id.length > 12 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id
}

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SH'

const fullEmployeeName = (employee = {}) =>
  employee.fullName ||
  `${employee.firstName || ''} ${employee.lastName || ''}`.trim() ||
  employee.name ||
  employee.email ||
  'Employee'

const accountKey = (account) => `${account.source}:${account.id || account.email}`

const normalizeCurrentUser = (user = {}) => ({
  id: user._id || user.id,
  name: user.name || 'Admin',
  email: user.email || '-',
  role: user.role || 'superAdmin',
  roleGroup: user.role || 'superAdmin',
  access: user.role === 'manager' ? formatManagerAccess(user.managerAccess) : accessLabels[user.role] || 'Limited Access',
  status: user.isActive === false ? 'Disabled' : 'Enabled',
  isActive: user.isActive !== false,
  source: user.role === 'manager' ? 'Manager Login' : 'Main Admin',
  managePath: null,
  canEditOwnAccount: true
})

const formatManagerAccess = (access = []) => {
  const labels = (Array.isArray(access) ? access : [])
    .map((item) => managerAccessLabels[item])
    .filter(Boolean)
  return labels.length ? labels.join(', ') : 'No module assigned'
}

const normalizeManager = (user = {}) => ({
  id: user._id || user.id,
  name: user.name || 'Manager',
  email: user.email || '-',
  role: 'manager',
  roleGroup: 'manager',
  access: formatManagerAccess(user.managerAccess),
  status: user.isActive === false ? 'Disabled' : 'Enabled',
  source: 'Manager Login',
  managePath: null,
  managerAccess: Array.isArray(user.managerAccess) ? user.managerAccess : [],
  isActive: user.isActive !== false
})

const normalizeAdvisor = (profile = {}) => {
  const user = profile.userId || {}
  return {
    id: user._id || profile.userId || profile._id,
    name: user.name || profile.fullName || 'Business Advisor',
    email: user.email || profile.email || '-',
    role: 'businessAdvisor',
    roleGroup: 'businessAdvisor',
    access: 'Advisor Access',
    status: user.isActive === false ? 'Disabled' : 'Enabled',
    isActive: user.isActive !== false,
    source: 'Business Advisor',
    managePath: '/admin/business-advisors'
  }
}

const normalizeEmsEmployee = (employee = {}) => {
  const role = employee.role || 'employee'
  const id = employee._id || employee.id
  return {
    id,
    name: fullEmployeeName(employee),
    email: employee.email || '-',
    role,
    roleGroup: role === 'candidate_admin' ? 'candidateAdmin' : role === 'crm_employee' ? 'crm_employee' : 'ems',
    access: role === 'manager' ? 'EMS Manager Access' : accessLabels[role] || 'EMS Employee',
    status: employee.status === 'active' ? 'Enabled' : 'Disabled',
    isActive: employee.status === 'active',
    employeeStatus: employee.status || 'inactive',
    source: 'Employee Management',
    managePath: '/ems/employees',
    updatePath: id ? `/ems/employees/${id}/edit` : '/ems/employees'
  }
}

export default function AdminSettings() {
  const dispatch = useDispatch()
  const authUser = useSelector((state) => state.auth.user)

  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [managerSaving, setManagerSaving] = useState(false)
  const [accountSaving, setAccountSaving] = useState(false)
  const [backupExporting, setBackupExporting] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [accounts, setAccounts] = useState([])
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
  const [managerForm, setManagerForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    isActive: true,
    managerAccess: ['candidateManagement', 'crmManagement', 'employeeManagement']
  })
  const [managerPassword, setManagerPassword] = useState('')
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    isActive: true
  })
  const [accountPassword, setAccountPassword] = useState('')
  const [backupToken, setBackupToken] = useState('')
  const [backupTokenExpiresAt, setBackupTokenExpiresAt] = useState(0)

  useEffect(() => {
    let mounted = true

    const loadSettings = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/auth/settings')
        const user = data.user || {}
        const baseAccount = normalizeCurrentUser(user)
        const nextAccounts = [baseAccount]

        setProfileForm({
          name: user.name || '',
          email: user.email || ''
        })
        dispatch(updateUser(user))

        if (user.role === 'superAdmin') {
          const [advisorResult, managerResult, emsResult] = await Promise.allSettled([
            api.get('/ba/all'),
            api.get('/users/managers'),
            employeeApi.list({ limit: 100, roles: 'candidate_admin,crm_employee' })
          ])

          if (advisorResult.status === 'fulfilled') {
            const advisors = Array.isArray(advisorResult.value.data) ? advisorResult.value.data : []
            nextAccounts.push(...advisors.map(normalizeAdvisor))
          }

          if (managerResult.status === 'fulfilled') {
            const managers = Array.isArray(managerResult.value.data?.managers) ? managerResult.value.data.managers : []
            nextAccounts.push(...managers.map(normalizeManager))
          }

          if (emsResult.status === 'fulfilled') {
            const employees = emsResult.value.data?.items || []
            nextAccounts.push(...employees.map(normalizeEmsEmployee))
          }
        }

        const seen = new Set()
        const uniqueAccounts = nextAccounts.filter((account) => {
          const key = accountKey(account)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        if (mounted) setAccounts(uniqueAccounts)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load settings')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadSettings()

    return () => {
      mounted = false
    }
  }, [dispatch, reloadKey])

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const sorted = accounts
      .filter((account) => roleFilter === 'all' || account.roleGroup === roleFilter)
      .filter((account) => {
        if (!term) return true
        return [account.name, account.email, account.role, account.access, account.source]
          .some((value) => String(value || '').toLowerCase().includes(term))
      })
      .sort((a, b) => String(a[sortBy] || '').localeCompare(String(b[sortBy] || ''), undefined, { sensitivity: 'base' }))

    return sorted
  }, [accounts, roleFilter, searchTerm, sortBy])

  const tabCount = (tabId) =>
    tabId === 'all' ? accounts.length : accounts.filter((account) => account.roleGroup === tabId).length

  const openManage = (account) => {
    setSelectedAccount(account)
    setActiveModal('manage')
  }

  const openManagerCreate = () => {
    setSelectedAccount(null)
    setManagerForm({
      id: '',
      name: '',
      email: '',
      password: '',
      isActive: true,
      managerAccess: ['candidateManagement', 'crmManagement', 'employeeManagement']
    })
    setActiveModal('managerForm')
  }

  const openManagerEdit = (account) => {
    setSelectedAccount(account)
    setManagerForm({
      id: account.id || '',
      name: account.name || '',
      email: account.email || '',
      password: '',
      isActive: account.status !== 'Disabled',
      managerAccess: Array.isArray(account.managerAccess) ? account.managerAccess : []
    })
    setActiveModal('managerForm')
  }

  const openManagerPassword = (account) => {
    setSelectedAccount(account)
    setManagerPassword('')
    setActiveModal('managerPassword')
  }

  const openAccountEdit = (account) => {
    if (account.roleGroup === 'manager') {
      openManagerEdit(account)
      return
    }

    if (account.canEditOwnAccount) {
      setActiveModal('profile')
      return
    }

    setSelectedAccount(account)
    setAccountForm({
      name: account.name || '',
      email: account.email || '',
      isActive: account.status !== 'Disabled'
    })
    setActiveModal('accountForm')
  }

  const openAccountPassword = (account) => {
    if (account.roleGroup === 'manager') {
      openManagerPassword(account)
      return
    }

    setSelectedAccount(account)
    setAccountPassword('')
    setActiveModal('accountPassword')
  }

  const toggleManagerAccess = (access, checked) => {
    setManagerForm((current) => ({
      ...current,
      managerAccess: checked
        ? [...new Set([...current.managerAccess, access])]
        : current.managerAccess.filter((item) => item !== access)
    }))
  }

  const saveManager = async (event) => {
    event.preventDefault()

    if (!managerForm.name.trim() || !managerForm.email.trim()) {
      toast.error('Manager name and email are required')
      return
    }

    if (!managerForm.id && managerForm.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!managerForm.managerAccess.length) {
      toast.error('Select at least one access module')
      return
    }

    setManagerSaving(true)
    try {
      const payload = {
        name: managerForm.name.trim(),
        email: managerForm.email.trim(),
        isActive: Boolean(managerForm.isActive),
        managerAccess: managerForm.managerAccess
      }

      if (managerForm.id) {
        await api.put(`/users/managers/${managerForm.id}`, payload)
        toast.success('Manager access updated')
      } else {
        await api.post('/users/managers', { ...payload, password: managerForm.password })
        toast.success('Manager created')
      }

      setActiveModal(null)
      setReloadKey((current) => current + 1)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save manager')
    } finally {
      setManagerSaving(false)
    }
  }

  const resetManagerPassword = async (event) => {
    event.preventDefault()

    if (!selectedAccount?.id) return
    if (managerPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setManagerSaving(true)
    try {
      await api.put(`/users/managers/${selectedAccount.id}/reset-password`, { newPassword: managerPassword })
      toast.success('Manager password reset')
      setActiveModal('manage')
      setManagerPassword('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not reset password')
    } finally {
      setManagerSaving(false)
    }
  }

  const deleteManager = async (account) => {
    if (!account?.id) return
    if (!window.confirm(`Remove manager ${account.name}?`)) return

    setManagerSaving(true)
    try {
      await api.delete(`/users/managers/${account.id}`)
      toast.success('Manager removed')
      setActiveModal(null)
      setReloadKey((current) => current + 1)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove manager')
    } finally {
      setManagerSaving(false)
    }
  }

  const saveManagedAccount = async (event) => {
    event.preventDefault()

    if (!selectedAccount?.id) return
    if (!accountForm.name.trim() || !accountForm.email.trim()) {
      toast.error('Name and email are required')
      return
    }

    setAccountSaving(true)
    try {
      const payload = {
        name: accountForm.name.trim(),
        email: accountForm.email.trim(),
        isActive: Boolean(accountForm.isActive)
      }

      if (selectedAccount.roleGroup === 'businessAdvisor') {
        await api.put(`/users/${selectedAccount.id}`, payload)
      } else if (['candidateAdmin', 'crm_employee', 'ems'].includes(selectedAccount.roleGroup)) {
        await employeeApi.update(selectedAccount.id, {
          ...payload,
          status: payload.isActive ? 'active' : 'inactive'
        })
      } else {
        toast.error('Use the module page to update this account')
        return
      }

      toast.success('Account updated')
      setActiveModal(null)
      setReloadKey((current) => current + 1)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update account')
    } finally {
      setAccountSaving(false)
    }
  }

  const resetManagedAccountPassword = async (event) => {
    event.preventDefault()

    if (!selectedAccount?.id) return
    const minLength = selectedAccount.roleGroup === 'crm_employee' ? 8 : 6
    if (accountPassword.length < minLength) {
      toast.error(`Password must be at least ${minLength} characters`)
      return
    }

    setAccountSaving(true)
    try {
      if (selectedAccount.roleGroup === 'businessAdvisor') {
        await api.put(`/users/${selectedAccount.id}/reset-password`, { newPassword: accountPassword })
      } else if (['candidateAdmin', 'crm_employee', 'ems'].includes(selectedAccount.roleGroup)) {
        await employeeApi.update(selectedAccount.id, { password: accountPassword })
      } else {
        toast.error('Password reset is not available for this account here')
        return
      }

      toast.success('Password reset')
      setAccountPassword('')
      setActiveModal('manage')
      setReloadKey((current) => current + 1)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not reset password')
    } finally {
      setAccountSaving(false)
    }
  }

  const toggleManagedAccountStatus = async (account) => {
    if (!account?.id || account.canEditOwnAccount) return

    const nextActive = account.status === 'Disabled'
    setAccountSaving(true)
    try {
      if (account.roleGroup === 'manager') {
        await api.put(`/users/managers/${account.id}`, { isActive: nextActive })
      } else if (account.roleGroup === 'businessAdvisor') {
        await api.put(`/users/${account.id}`, { isActive: nextActive })
      } else if (['candidateAdmin', 'crm_employee', 'ems'].includes(account.roleGroup)) {
        await employeeApi.update(account.id, { status: nextActive ? 'active' : 'inactive' })
      } else {
        toast.error('Status update is not available for this account')
        return
      }

      toast.success(`Account ${nextActive ? 'activated' : 'deactivated'}`)
      setActiveModal(null)
      setReloadKey((current) => current + 1)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update account status')
    } finally {
      setAccountSaving(false)
    }
  }

  const deleteManagedAccount = async (account) => {
    if (!account?.id || account.canEditOwnAccount) return

    if (account.roleGroup === 'manager') {
      await deleteManager(account)
      return
    }

    if (!window.confirm(`Delete ${account.name}?`)) return

    setAccountSaving(true)
    try {
      if (account.roleGroup === 'businessAdvisor') {
        await api.delete(`/users/${account.id}`)
      } else if (['candidateAdmin', 'crm_employee', 'ems'].includes(account.roleGroup)) {
        await employeeApi.remove(account.id)
      } else {
        toast.error('Delete is not available for this account')
        return
      }

      toast.success('Account deleted')
      setActiveModal(null)
      setReloadKey((current) => current + 1)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete account')
    } finally {
      setAccountSaving(false)
    }
  }

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
      setAccounts((current) =>
        current.map((account) =>
          account.canEditOwnAccount
            ? { ...account, name: data.user?.name || account.name, email: data.user?.email || account.email }
            : account
        )
      )
      toast.success(data.message || 'Profile updated')
      setActiveModal(null)
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
      setActiveModal(null)
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
      setActiveModal(null)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not download backup')
    } finally {
      setBackupExporting(false)
    }
  }

  if (loading) return <Skeleton rows={8} />

  return (
    <div className="mx-auto max-w-[1180px] space-y-4 text-[var(--text-primary)]">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
        <span>Settings</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Admin Panel</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--text-primary)]">Access Management</span>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_18px_45px_rgba(17,24,39,0.04)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-blue-lt)] text-[var(--accent-blue)]">
              <UserCog className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-base font-bold text-[var(--text-primary)]">Access Management</h1>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--text-secondary)]">
                View managers, administrators, business advisors, and all employee logins with their roles and status.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveModal('profile')} className="settings-action-button">
              <UserCog className="h-4 w-4" />
              Edit Profile
            </button>
            <button type="button" onClick={() => setActiveModal('password')} className="settings-action-button">
              <KeyRound className="h-4 w-4" />
              Change Password
            </button>
            {authUser?.role === 'superAdmin' ? (
              <button type="button" onClick={openManagerCreate} className="settings-action-button">
                <UserPlus className="h-4 w-4" />
                Create Manager
              </button>
            ) : null}
            {authUser?.role === 'superAdmin' ? (
              <button type="button" onClick={() => setActiveModal('backup')} className="settings-action-button settings-action-button-dark">
                <Database className="h-4 w-4" />
                Backup Export
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_18px_45px_rgba(17,24,39,0.04)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--accent-blue)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Administrator Accounts</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-9 min-w-[240px] items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 text-[var(--text-muted)]">
              <Search className="h-4 w-4" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search..."
                className="w-full border-0 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--text-secondary)] outline-none"
            >
              <option value="name">Sort by name</option>
              <option value="role">Sort by role</option>
              <option value="source">Sort by module</option>
              <option value="status">Sort by status</option>
            </select>
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[#F9FAFB]" aria-label="Filters">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-5 border-b border-[var(--border)] pb-3 text-xs font-semibold text-[var(--text-secondary)]">
          {roleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={roleFilter === tab.id ? 'text-[var(--text-primary)]' : 'hover:text-[var(--text-primary)]'}
            >
              {tab.label} ({tabCount(tab.id)})
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[820px] text-left text-xs">
            <thead className="rounded-lg bg-[#F3F4F6] text-[11px] font-semibold text-[var(--text-secondary)]">
              <tr>
                <th className="rounded-l-lg px-3 py-3">Account</th>
                <th className="px-3 py-3">Email Address</th>
                <th className="px-3 py-3">Module</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="rounded-r-lg px-3 py-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={accountKey(account)} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={account.name} />
                      <span className="font-semibold text-[var(--text-primary)]">{account.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[var(--text-secondary)]">{account.email}</td>
                  <td className="px-3 py-3 text-[var(--text-secondary)]">{account.source}</td>
                  <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{roleLabels[account.role] || account.role}</td>
                  <td className="px-3 py-3"><StatusPill status={account.status} /></td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openManage(account)}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)]"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredAccounts.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-xs font-semibold text-[var(--text-secondary)]">
                    No accounts match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {activeModal === 'profile' ? (
        <Modal title="Profile & Access" onClose={() => setActiveModal(null)} icon={UserCog}>
          <form onSubmit={saveProfile} className="grid gap-3 md:grid-cols-2">
            <Field label="Name" required value={profileForm.name} onChange={(value) => setProfileForm((current) => ({ ...current, name: value }))} />
            <Field label="Email" required type="email" value={profileForm.email} onChange={(value) => setProfileForm((current) => ({ ...current, email: value }))} />
            <Field label="Admin ID" value={authUser?._id || authUser?.id || '-'} readOnly />
            <Field label="Role" value={roleLabels[authUser?.role] || 'Super Admin'} readOnly />
            <Field label="Access" value={accessLabels[authUser?.role] || 'Limited Access'} readOnly />
            <Field label="Status" value={authUser?.isActive === false ? 'Disabled' : 'Enabled'} readOnly />
            <div className="md:col-span-2">
              <button type="submit" disabled={profileSaving} className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--accent-blue)] px-4 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-70 sm:w-auto">
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {activeModal === 'password' ? (
        <Modal title="Change Password" onClose={() => setActiveModal(null)} icon={KeyRound}>
          <form onSubmit={savePassword} className="grid gap-3">
            <Field label="Current Password" required type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))} />
            <Field label="New Password" required type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))} />
            <Field label="Confirm New Password" required type="password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))} />
            <button type="submit" disabled={passwordSaving} className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-70">
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </Modal>
      ) : null}

      {activeModal === 'managerForm' ? (
        <Modal title={managerForm.id ? 'Edit Manager Access' : 'Create Manager Login'} onClose={() => setActiveModal(null)} icon={UserPlus}>
          <form onSubmit={saveManager} className="grid gap-3 md:grid-cols-2">
            <Field label="Manager Name" required value={managerForm.name} onChange={(value) => setManagerForm((current) => ({ ...current, name: value }))} />
            <Field label="Manager ID / Email" required type="email" value={managerForm.email} onChange={(value) => setManagerForm((current) => ({ ...current, email: value }))} />
            {!managerForm.id ? (
              <Field label="Password" required type="password" value={managerForm.password} onChange={(value) => setManagerForm((current) => ({ ...current, password: value }))} />
            ) : null}
            <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-3 text-xs font-semibold text-[var(--text-secondary)] md:mt-5">
              <input
                type="checkbox"
                checked={managerForm.isActive}
                onChange={(event) => setManagerForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent-blue)]"
              />
              Account enabled
            </label>
            <div className="md:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Module Access</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {managerAccessOptions.map((item) => (
                  <label key={item.value} className="flex min-h-12 items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={managerForm.managerAccess.includes(item.value)}
                      onChange={(event) => toggleManagerAccess(item.value, event.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent-blue)]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={managerSaving} className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--accent-blue)] px-4 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-70 sm:w-auto">
                {managerSaving ? 'Saving...' : managerForm.id ? 'Save Manager Access' : 'Create Manager'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {activeModal === 'managerPassword' && selectedAccount ? (
        <Modal title="Reset Manager Password" onClose={() => setActiveModal('manage')} icon={KeyRound}>
          <form onSubmit={resetManagerPassword} className="grid gap-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Set a new password for <span className="font-semibold text-[var(--text-primary)]">{selectedAccount.name}</span>.
            </p>
            <Field label="New Password" required type="password" value={managerPassword} onChange={setManagerPassword} />
            <button type="submit" disabled={managerSaving} className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent-blue)] px-4 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-70">
              {managerSaving ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </Modal>
      ) : null}

      {activeModal === 'accountForm' && selectedAccount ? (
        <Modal title={`Update ${roleLabels[selectedAccount.role] || 'Account'}`} onClose={() => setActiveModal('manage')} icon={UserCog}>
          <form onSubmit={saveManagedAccount} className="grid gap-3 md:grid-cols-2">
            <Field label="Name" required value={accountForm.name} onChange={(value) => setAccountForm((current) => ({ ...current, name: value }))} />
            <Field label="Email" required type="email" value={accountForm.email} onChange={(value) => setAccountForm((current) => ({ ...current, email: value }))} />
            <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-3 text-xs font-semibold text-[var(--text-secondary)] md:col-span-2">
              <input
                type="checkbox"
                checked={accountForm.isActive}
                onChange={(event) => setAccountForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent-blue)]"
              />
              Account enabled
            </label>
            <div className="md:col-span-2">
              <button type="submit" disabled={accountSaving} className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--accent-blue)] px-4 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-70 sm:w-auto">
                {accountSaving ? 'Saving...' : 'Update Account'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {activeModal === 'accountPassword' && selectedAccount ? (
        <Modal title={`Reset ${roleLabels[selectedAccount.role] || 'Account'} Password`} onClose={() => setActiveModal('manage')} icon={KeyRound}>
          <form onSubmit={resetManagedAccountPassword} className="grid gap-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Set a new password for <span className="font-semibold text-[var(--text-primary)]">{selectedAccount.name}</span>.
            </p>
            <Field label="New Password" required type="password" value={accountPassword} onChange={setAccountPassword} />
            <button type="submit" disabled={accountSaving} className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent-blue)] px-4 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-70">
              {accountSaving ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </Modal>
      ) : null}

      {activeModal === 'backup' ? (
        <Modal title="Backup & Export" onClose={() => setActiveModal(null)} icon={Database} wide>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Date Range</h3>
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
                  <button key={label} type="button" onClick={() => setQuickRange(days)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[#F9FAFB]">
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-[var(--text-muted)]">Maximum range: 1 year. Export limit: 10 requests per hour.</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Panels</h3>
              <div className="mt-3 space-y-2">
                {panelOptions.map((panel) => (
                  <label key={panel.value} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                    <span>{panel.label}</span>
                    <input type="checkbox" checked={backupForm.panels.includes(panel.value)} onChange={(event) => toggleBackupPanel(panel.value, event.target.checked)} className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent-blue)]" />
                  </label>
                ))}
              </div>
              <button type="button" onClick={downloadBackup} disabled={backupExporting} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60">
                <Download className="h-4 w-4" />
                {backupExporting ? 'Generating Excel...' : 'Generate & Download Excel'}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {activeModal === 'manage' && selectedAccount ? (
        <Modal title="Manage Account" onClose={() => setActiveModal(null)} icon={SettingsIcon}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4">
              <Avatar name={selectedAccount.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--text-primary)]">{selectedAccount.name}</p>
                <p className="truncate text-xs text-[var(--text-secondary)]">{selectedAccount.email}</p>
              </div>
              <StatusPill status={selectedAccount.status} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCell label="User ID" value={compactId(selectedAccount.id)} />
              <InfoCell label="Module" value={selectedAccount.source} />
              <InfoCell label="Role" value={roleLabels[selectedAccount.role] || selectedAccount.role} />
              <InfoCell label="Status" value={selectedAccount.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedAccount.canEditOwnAccount ? (
                <>
                  <button type="button" onClick={() => setActiveModal('profile')} className="settings-action-button">Update Profile</button>
                  <button type="button" onClick={() => setActiveModal('password')} className="settings-action-button">Change Password</button>
                </>
              ) : null}
              {authUser?.role === 'superAdmin' && !selectedAccount.canEditOwnAccount ? (
                <>
                  {selectedAccount.updatePath ? (
                    <Link to={selectedAccount.updatePath} className="settings-action-button" onClick={() => setActiveModal(null)}>
                      Update
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  ) : (
                    <button type="button" onClick={() => openAccountEdit(selectedAccount)} className="settings-action-button">
                      Update
                    </button>
                  )}
                  <button type="button" onClick={() => toggleManagedAccountStatus(selectedAccount)} disabled={accountSaving || managerSaving} className="settings-action-button">
                    {selectedAccount.status === 'Disabled' ? 'Activate' : 'Deactivate'}
                  </button>
                  {['manager', 'businessAdvisor', 'candidateAdmin', 'crm_employee', 'ems'].includes(selectedAccount.roleGroup) ? (
                    <button type="button" onClick={() => openAccountPassword(selectedAccount)} className="settings-action-button">
                      Reset Password
                    </button>
                  ) : null}
                  <button type="button" onClick={() => deleteManagedAccount(selectedAccount)} disabled={accountSaving || managerSaving} className="settings-action-button text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </>
              ) : null}
              {selectedAccount.managePath ? (
                <Link to={selectedAccount.managePath} className="settings-action-button settings-action-button-dark" onClick={() => setActiveModal(null)}>
                  Open Module
                  <ExternalLink className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function Modal({ title, icon: Icon, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <button type="button" className="absolute inset-0 bg-slate-950/45" onClick={onClose} aria-label="Close modal" />
      <section className={`relative max-h-[92vh] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 text-[var(--accent-blue)]" /> : null}
            <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[#F3F4F6]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-4.5rem)] overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      </section>
    </div>
  )
}

function Avatar({ name }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue-lt)] text-xs font-bold text-[var(--accent-blue)]">
      {initials(name)}
    </span>
  )
}

function StatusPill({ status }) {
  const enabled = status !== 'Disabled'
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

function Field({ label, value, onChange = () => {}, required = false, type = 'text', readOnly = false }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--text-secondary)]">
      {label} {required && <span className="text-[var(--danger)]">*</span>}
      <input
        type={type}
        value={value || ''}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 h-9 w-full rounded-lg border border-[var(--border)] px-3 text-xs font-medium normal-case tracking-normal outline-none transition focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue-lt)] ${
          readOnly ? 'bg-[#F9FAFB] text-[var(--text-secondary)]' : 'bg-white text-[var(--text-primary)]'
        }`}
      />
    </label>
  )
}

function InfoCell({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[#F9FAFB] px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[var(--text-primary)]">{value || '-'}</p>
    </div>
  )
}
