import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  ArrowLeft,
  UserCircle,
  LogOut,
  Menu,
  Settings,
  ChevronDown,
  BadgeCheck,
  Search,
  Bell,
  List
} from 'lucide-react'
import { logout } from '../store/authSlice'
import { logout as crmLogout } from '../crm/store/authSlice'
import api from '../api/axios'

const CRM_ADMIN_LOGOUT_REDIRECT_KEY = 'crm_admin_logout_redirect'

const managerDefaultPath = (user = {}) => {
  const access = Array.isArray(user.managerAccess) ? user.managerAccess : []
  if (access.includes('candidateManagement')) return '/admin/cms/candidates'
  if (access.includes('crmManagement')) return '/admin/crm/dashboard'
  if (access.includes('employeeManagement')) return '/ems'
  return '/admin/settings'
}

export default function Topbar({ onMenuClick, showMenuButton = true }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const {
    role: crmRole,
    user: crmUser
  } = useSelector((state) => state.crmAuth)
  const isCrmAdminArea = location.pathname.startsWith('/admin/crm')
  const isCrmAdminSession = isCrmAdminArea && crmRole === 'crm_super_admin' && !['superAdmin', 'manager'].includes(user?.role)
  const displayUser = isCrmAdminSession ? crmUser : user
  const hasHistoryBack = typeof window !== 'undefined' && Number(window.history.state?.idx || 0) > 0

  const getBackFallback = () => {
    if (user?.role === 'manager') return managerDefaultPath(user)
    if (user?.role === 'businessAdvisor') return '/ba/dashboard'
    if (location.pathname.startsWith('/ems')) return '/ems'
    if (location.pathname.startsWith('/admin/crm')) return '/admin/crm/dashboard'
    if (location.pathname.startsWith('/admin/cms') || location.pathname.startsWith('/admin/process-panel')) {
      return '/admin/cms/candidates'
    }
    return '/admin/dashboard'
  }

  const handleBack = () => {
    if (hasHistoryBack) {
      navigate(-1)
      return
    }
    navigate(getBackFallback(), { replace: true })
  }

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    if (isCrmAdminArea && crmRole === 'crm_super_admin' && user?.role !== 'manager') {
      window.sessionStorage.setItem(CRM_ADMIN_LOGOUT_REDIRECT_KEY, '1')
      await dispatch(crmLogout())

      if (user) {
        await api.post('/auth/logout').catch(() => {})
        dispatch(logout())
      }

      navigate('/login', { replace: true })
      return
    }

    await api.post('/auth/logout').catch(() => {})
    dispatch(logout())
    navigate('/login')
  }

  const settingsPath = user?.role === 'businessAdvisor' ? '/ba/settings' : '/admin/settings'
  const isCandidateAdmin = user?.role === 'candidateAdmin'
  const isCandidateManagementArea = location.pathname.startsWith('/admin/cms') || location.pathname.startsWith('/admin/process-panel')
  const candidateAdminTitle = location.pathname.startsWith('/admin/settings')
    ? 'Settings'
    : location.pathname.startsWith('/admin/cms/dashboard')
      ? 'Dashboard'
    : location.pathname.startsWith('/admin/cms/interviews')
    ? 'Interviews'
    : location.pathname.startsWith('/admin/cms/companies')
      ? 'Companies'
      : location.pathname.startsWith('/admin/process-panel')
        ? 'Process Panel'
        : 'Candidates'
  const pageTitle = location.pathname.startsWith('/ba')
    ? 'Advisor Dashboard'
    : location.pathname.startsWith('/ems')
      ? 'Success Employee'
      : isCandidateManagementArea
        ? 'Candidate Management'
      : location.pathname.startsWith('/admin/crm')
        ? 'Telecalling CRM'
        : location.pathname.startsWith('/admin/settings')
          ? 'Settings'
          : 'Dashboard'
  const pageSubtitle = location.pathname.startsWith('/ba')
    ? 'Snapshot of submissions, placements, and earnings'
    : location.pathname.startsWith('/ems')
      ? 'Monitor attendance, payroll, and employee activity'
      : isCandidateManagementArea
        ? 'Manage candidate dashboard, records, and interviews'
      : location.pathname.startsWith('/admin/crm')
        ? 'Manage CRM candidates, calls, and reports'
        : location.pathname.startsWith('/admin/settings')
          ? 'Admin panel, roles, access, and account security'
          : 'Monitor and control your workspace'

  if (isCandidateAdmin) {
    return (
      <header className="admin-topbar sticky top-0 z-30 border-b border-[var(--border)] bg-white">
        <div className="flex min-h-14 flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between lg:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {showMenuButton ? (
              <button
                type="button"
                onClick={onMenuClick}
                aria-label="Open menu"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)]"
              >
                <Menu size={16} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              title="Back"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-6 text-[var(--text-primary)]">{candidateAdminTitle}</h1>
              <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--text-secondary)]">Candidate Management System</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-8 items-center justify-center rounded-full border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)]"
          >
            Logout
          </button>
        </div>
      </header>
    )
  }

  return (
    <header className="admin-topbar sticky top-0 z-30 border-b border-[var(--border)] bg-white">
      <div className="flex min-h-14 min-w-0 items-center gap-3 px-4 py-2 sm:px-5">

      {showMenuButton ? (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)]"
        >
          <Menu size={18} />
        </button>
      ) : null}

      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        title="Back"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold leading-6 text-[var(--text-primary)]">{pageTitle}</h1>
        <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--text-secondary)]">{pageSubtitle}</p>
      </div>

      <div className="admin-topbar-search ml-auto hidden h-9 w-full max-w-md items-center gap-2 rounded-full bg-[#F3F4F6] px-4 text-[var(--text-secondary)] md:flex">
        <Search className="h-4 w-4 shrink-0" />
        <input
          type="search"
          placeholder="Search Anything"
          className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <button
          type="button"
          aria-label="Open list view"
          className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)] sm:inline-flex"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)] sm:inline-flex"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--danger)]" />
        </button>

      {/* PROFILE */}
      <div className="relative min-w-0" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-2 py-1 transition hover:bg-[#F3F4F6] sm:px-3"
        >
          <UserCircle className="h-7 w-7 text-[var(--accent-blue)]" />
          <span className="hidden max-w-44 truncate text-[13px] font-semibold text-[var(--text-primary)] sm:block">
            {displayUser?.name}
          </span>
          <ChevronDown
            size={16}
            className={`text-[var(--text-secondary)] transition ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute right-0 z-50 mt-3 w-[calc(100vw-1rem)] max-w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.12)]">

            {/* USER INFO */}
            <div className="border-b border-[var(--border)] bg-[#F9FAFB] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {displayUser?.name}
              </p>
              <p className="truncate text-xs text-[var(--text-secondary)]">
                {displayUser?.email}
              </p>
            </div>

            {/* MENU */}
            <div className="py-1">

              {user?.role === 'businessAdvisor' ? (
                <button
                  onClick={() => {
                    setOpen(false)
                    navigate('/ba/profile')
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)]"
                >
                  <BadgeCheck size={16} />
                  BA Profile
                </button>
              ) : null}

              {isCrmAdminSession ? null : (
              <button
                onClick={() => {
                  setOpen(false)
                  navigate(settingsPath)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)]"
              >
                <Settings size={16} />
                Account Settings
              </button>
              )}

              <div className="my-1 border-t border-[var(--border)]" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--danger)] transition hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </button>

            </div>
          </div>
        )}
      </div>
      </div>
      </div>
    </header>
  )
}
