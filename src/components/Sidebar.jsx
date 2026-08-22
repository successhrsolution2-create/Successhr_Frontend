import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  ArrowLeftRight,
  Building2,
  CalendarClock,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  List,
  PanelsTopLeft,
  PhoneCall,
  UserCircle,
  UserCheck,
  Users,
  X,
  Wallet
} from 'lucide-react'
import { connectSocket, disconnectSocket } from '../socket'
import Topbar from './Topbar'
import api from '../api/axios'
import { logout } from '../store/authSlice'

const adminMainLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users }
]

const baLinks = [
  { to: '/ba/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ba/students', label: 'My Candidates', icon: UserCheck },
  { to: '/ba/companies', label: 'My Companies', icon: Building2 },
  { to: '/ba/earnings', label: 'My Earnings', icon: Wallet }
]

const businessAdvisorAdminLinks = [
  { to: '/admin/business-advisors', label: 'Success Advisors', icon: Users, end: true },
  { to: '/admin/students', label: 'Advisor Candidates', icon: UserCircle },
  { to: '/admin/companies', label: 'Advisor Companies', icon: Building2 },
  { to: '/admin/commission', label: 'Earnings', icon: Wallet }
]

const telecallingCrmLinks = [
  { to: '/admin/crm/dashboard', label: 'CRM Dashboard', icon: LayoutDashboard },
  { to: '/admin/crm/candidates', label: 'CRM Candidates', icon: UserCheck },
  { to: '/admin/crm/reports', label: 'CRM Reports', icon: Building2 }
]

const candidateManagementLinks = [
  { to: '/admin/cms/candidates', label: 'Candidates', icon: UserCheck },
  { to: '/admin/cms/interviews', label: 'Interviews', icon: PanelsTopLeft }
]

const companyManagementLinks = [
  { to: '/admin/company-management', label: 'Company Admins', icon: Users, end: true },
  { to: '/admin/company-management/interview-info', label: 'Interview Info', icon: ClipboardList }
]

const employeeManagementLinks = [
  { to: '/ems', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ems/employees', label: 'Employees', icon: Users },
  { to: '/ems/locations', label: 'Locations & Schedules', icon: MapPin },
  { to: '/ems/attendance', label: 'Attendance', icon: PanelsTopLeft }
]

const SIDEBAR_DEFAULT_WIDTH = 248
const CANDIDATE_SIDEBAR_DEFAULT_WIDTH = 224
const SIDEBAR_MIN_WIDTH = 210
const SIDEBAR_MAX_WIDTH = 340
const SIDEBAR_WIDTH_KEY = 'admin_sidebar_width_compact'
const CANDIDATE_SIDEBAR_WIDTH_KEY = 'candidate_admin_sidebar_width_compact'

const clampSidebarWidth = (value) => Math.min(Math.max(value, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH)

export default function Sidebar({ role, children, hideTopbar = false }) {
  const isSuperAdmin = role === 'superAdmin'
  const isCandidateAdmin = role === 'candidateAdmin'
  const isCrmAdmin = role === 'crmAdmin'
  const isManager = role === 'manager'
  const isBusinessAdvisor = role === 'businessAdvisor'
  const isAdminShell = isSuperAdmin || isCandidateAdmin || isCrmAdmin || isManager || isBusinessAdvisor
  const sidebarDefaultWidth = isCandidateAdmin ? CANDIDATE_SIDEBAR_DEFAULT_WIDTH : SIDEBAR_DEFAULT_WIDTH
  const sidebarWidthKey = isCandidateAdmin ? CANDIDATE_SIDEBAR_WIDTH_KEY : SIDEBAR_WIDTH_KEY
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches
  )
  const [open, setOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches
  )
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === 'undefined') return sidebarDefaultWidth

    const savedWidth = Number(window.localStorage.getItem(sidebarWidthKey))
    return Number.isFinite(savedWidth) ? clampSidebarWidth(savedWidth) : sidebarDefaultWidth
  })
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const [baPanelOpen, setBaPanelOpen] = useState(false)
  const [candidatePanelOpen, setCandidatePanelOpen] = useState(false)
  const [companyPanelOpen, setCompanyPanelOpen] = useState(false)
  const [crmPanelOpen, setCrmPanelOpen] = useState(false)
  const [emsPanelOpen, setEmsPanelOpen] = useState(false)
  const { token, user } = useSelector((state) => state.auth)
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (_error) {
      // Proceed regardless of API failure
    }
    dispatch(logout())
    try {
      localStorage.removeItem('crm_auth')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch (_e) {}
    navigate('/login')
  }

  const managerAccess = Array.isArray(user?.managerAccess) ? user.managerAccess : []
  const canUseCandidateManagement = isSuperAdmin || (isManager && managerAccess.includes('candidateManagement'))
  const canUseCrmManagement = isSuperAdmin || isCrmAdmin || (isManager && managerAccess.includes('crmManagement'))
  const canUseEmployeeManagement = isSuperAdmin || (isManager && managerAccess.includes('employeeManagement'))
  const settingsPath = isSuperAdmin || isCandidateAdmin || isManager ? '/admin/settings' : isCrmAdmin ? '' : '/ba/settings'

  const links = useMemo(() => (isSuperAdmin ? adminMainLinks : isCandidateAdmin || isCrmAdmin || isManager ? [] : baLinks), [isSuperAdmin, isCandidateAdmin, isCrmAdmin, isManager])
  const isBusinessAdvisorPanelActive = businessAdvisorAdminLinks.some((item) =>
    item.to === '/admin/business-advisors'
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  )
  const isCandidateManagementPanelActive = location.pathname.startsWith('/admin/cms') || location.pathname.startsWith('/admin/process-panel')
  const isCompanyManagementPanelActive = location.pathname.startsWith('/admin/company-management')
  const isTelecallingCrmPanelActive = location.pathname.startsWith('/admin/crm')
  const isEmployeeManagementPanelActive = location.pathname.startsWith('/ems')

  useEffect(() => {
    if (!token) return undefined
    connectSocket(token)
    return () => disconnectSocket()
  }, [token])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleViewportChange = (event) => {
      setIsDesktop(event.matches)
      setOpen(event.matches)
    }

    handleViewportChange(mediaQuery)
    mediaQuery.addEventListener('change', handleViewportChange)
    return () => mediaQuery.removeEventListener('change', handleViewportChange)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(sidebarWidthKey, String(sidebarWidth))
    }
  }, [sidebarWidth, sidebarWidthKey])

  useEffect(() => {
    if (!isResizingSidebar) return undefined

    const handlePointerMove = (event) => {
      setSidebarWidth(clampSidebarWidth(event.clientX))
    }

    const handlePointerUp = () => {
      setIsResizingSidebar(false)
    }

    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isResizingSidebar])

  useEffect(() => {
    setBaPanelOpen(isBusinessAdvisorPanelActive)
    setCandidatePanelOpen(isCandidateManagementPanelActive)
    setCompanyPanelOpen(isCompanyManagementPanelActive)
    setCrmPanelOpen(isTelecallingCrmPanelActive)
    setEmsPanelOpen(isEmployeeManagementPanelActive)
  }, [isBusinessAdvisorPanelActive, isCandidateManagementPanelActive, isCompanyManagementPanelActive, isTelecallingCrmPanelActive, isEmployeeManagementPanelActive])

  return (
    <div className={`${isAdminShell ? 'admin-shell' : ''} min-h-screen min-w-0 bg-[var(--bg-main)] text-[var(--text-primary)]`}>
      {open && <button type="button" aria-label="Close sidebar overlay" className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] max-w-[88vw] transform flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--text-primary)] transition-transform duration-300 ease-out lg:max-w-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: isDesktop ? `${sidebarWidth}px` : 'min(280px, 88vw)' }}
      >
        <div className="admin-sidebar-brand relative flex items-center justify-center border-b border-white/10 px-4 py-3">
          <div className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 shadow-lg">
            <img
              src="/success-logo.jpg"
              alt="Success HR Solutions"
              className="h-12 w-auto max-w-[170px] object-contain"
            />
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            title="Close sidebar"
            onClick={() => setOpen(false)}
            className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="admin-sidebar-nav flex-1 space-y-2.5 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-2" onClick={() => !isDesktop && setOpen(false)}>
          {!isSuperAdmin && !isCrmAdmin && !isManager ? (
            <div className="space-y-1.5">
              <p className="px-3 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">Main Menu</p>
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex min-h-[46px] items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[15px] font-bold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-[#5b4fe8] via-[#7048f2] to-[#8743f7] text-white shadow-[0_8px_24px_-4px_rgba(112,72,242,0.5)]'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ) : null}

          {isSuperAdmin || isCrmAdmin || isManager ? (
            <>
              {isSuperAdmin ? (
                <div className="space-y-1.5">
                  <p className="px-3 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">Main Menu</p>
                  {adminMainLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex min-h-[46px] items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[15px] font-bold transition ${
                          isActive
                            ? 'bg-gradient-to-r from-[#5b4fe8] via-[#7048f2] to-[#8743f7] text-white shadow-[0_8px_24px_-4px_rgba(112,72,242,0.5)]'
                            : 'text-slate-200 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      <item.icon size={20} />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <p className="px-3 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">Integrations</p>

                {canUseCandidateManagement ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setCandidatePanelOpen((current) => !current)
                    }}
                    className={`flex min-h-[48px] w-full items-center justify-between gap-2.5 rounded-xl px-3.5 py-2 text-left transition ${
                      isCandidateManagementPanelActive
                        ? 'bg-gradient-to-r from-[#5b4fe8] via-[#7048f2] to-[#8743f7] text-white shadow-[0_8px_24px_-4px_rgba(112,72,242,0.5)]'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-expanded={candidatePanelOpen}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#a855f7]" />
                      <span className="flex flex-col text-left leading-[1.2]">
                        <span className="text-[15px] font-bold text-white">Candidate</span>
                        <span className="text-[13px] font-semibold text-slate-300">Management</span>
                      </span>
                    </span>
                    {candidatePanelOpen ? <ChevronDown size={16} className="text-white" /> : <ChevronRight size={16} className="text-slate-400" />}
                  </button>

                  {candidatePanelOpen ? (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/15 pl-2.5">
                      {candidateManagementLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex min-h-[38px] items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition ${
                              isActive
                                ? 'bg-gradient-to-r from-[#5b4fe8] to-[#8743f7] text-white shadow-md'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#a855f7]" />
                          <span className="min-w-0 truncate">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
                ) : null}

                {canUseCrmManagement ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setCrmPanelOpen((current) => !current)
                    }}
                    className={`flex min-h-[48px] w-full items-center justify-between gap-2.5 rounded-xl px-3.5 py-2 text-left transition ${
                      isTelecallingCrmPanelActive
                        ? 'bg-gradient-to-r from-[#5b4fe8] via-[#7048f2] to-[#8743f7] text-white shadow-[0_8px_24px_-4px_rgba(112,72,242,0.5)]'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-expanded={crmPanelOpen}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#6366f1]" />
                      <span className="flex flex-col text-left leading-[1.2]">
                        <span className="text-[15px] font-bold text-white">Telecalling</span>
                        <span className="text-[13px] font-semibold text-slate-300">CRM</span>
                      </span>
                    </span>
                    {crmPanelOpen ? <ChevronDown size={16} className="text-white" /> : <ChevronRight size={16} className="text-slate-400" />}
                  </button>

                  {crmPanelOpen ? (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/15 pl-2.5">
                      {telecallingCrmLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            `flex min-h-[38px] items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition ${
                              isActive
                                ? 'bg-gradient-to-r from-[#5b4fe8] to-[#8743f7] text-white shadow-md'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#6366f1]" />
                          <span className="min-w-0 truncate">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
                ) : null}

                {canUseEmployeeManagement ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setEmsPanelOpen((current) => !current)
                    }}
                    className={`flex min-h-[48px] w-full items-center justify-between gap-2.5 rounded-xl px-3.5 py-2 text-left transition ${
                      isEmployeeManagementPanelActive
                        ? 'bg-gradient-to-r from-[#5b4fe8] via-[#7048f2] to-[#8743f7] text-white shadow-[0_8px_24px_-4px_rgba(112,72,242,0.5)]'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-expanded={emsPanelOpen}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#94a3b8]" />
                      <span className="flex flex-col text-left leading-[1.2]">
                        <span className="text-[15px] font-bold text-white">Success</span>
                        <span className="text-[13px] font-semibold text-slate-300">Employee</span>
                      </span>
                    </span>
                    {emsPanelOpen ? <ChevronDown size={16} className="text-white" /> : <ChevronRight size={16} className="text-slate-400" />}
                  </button>

                  {emsPanelOpen ? (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/15 pl-2.5">
                      {employeeManagementLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex min-h-[38px] items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition ${
                              isActive
                                ? 'bg-gradient-to-r from-[#5b4fe8] to-[#8743f7] text-white shadow-md'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#94a3b8]" />
                          <span className="min-w-0 truncate">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
                ) : null}

                {isSuperAdmin ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setCompanyPanelOpen((current) => !current)
                    }}
                    className={`flex min-h-[48px] w-full items-center justify-between gap-2.5 rounded-xl px-3.5 py-2 text-left transition ${
                      isCompanyManagementPanelActive
                        ? 'bg-gradient-to-r from-[#5b4fe8] via-[#7048f2] to-[#8743f7] text-white shadow-[0_8px_24px_-4px_rgba(112,72,242,0.5)]'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-expanded={companyPanelOpen}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#f97316]" />
                      <span className="flex flex-col text-left leading-[1.2]">
                        <span className="text-[15px] font-bold text-white">Company</span>
                        <span className="text-[13px] font-semibold text-slate-300">Management</span>
                      </span>
                    </span>
                    {companyPanelOpen ? <ChevronDown size={16} className="text-white" /> : <ChevronRight size={16} className="text-slate-400" />}
                  </button>

                  {companyPanelOpen ? (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/15 pl-2.5">
                      {companyManagementLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex min-h-[38px] items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition ${
                              isActive
                                ? 'bg-gradient-to-r from-[#5b4fe8] to-[#8743f7] text-white shadow-md'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#f97316]" />
                          <span className="min-w-0 truncate">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
                ) : null}

                {isSuperAdmin ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setBaPanelOpen((current) => !current)
                    }}
                    className={`flex min-h-[48px] w-full items-center justify-between gap-2.5 rounded-xl px-3.5 py-2 text-left transition ${
                      isBusinessAdvisorPanelActive
                        ? 'bg-gradient-to-r from-[#5b4fe8] via-[#7048f2] to-[#8743f7] text-white shadow-[0_8px_24px_-4px_rgba(112,72,242,0.5)]'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-expanded={baPanelOpen}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#10b981]" />
                      <span className="flex flex-col text-left leading-[1.2]">
                        <span className="text-[15px] font-bold text-white">Success</span>
                        <span className="text-[13px] font-semibold text-slate-300">Advisor</span>
                      </span>
                    </span>
                    {baPanelOpen ? <ChevronDown size={16} className="text-white" /> : <ChevronRight size={16} className="text-slate-400" />}
                  </button>

                  {baPanelOpen ? (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/15 pl-2.5">
                      {businessAdvisorAdminLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex min-h-[38px] items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition ${
                              isActive
                                ? 'bg-gradient-to-r from-[#5b4fe8] to-[#8743f7] text-white shadow-md'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#10b981]" />
                          <span className="min-w-0 truncate">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
                ) : null}
              </div>
            </>
          ) : null}

          {isCandidateAdmin ? (
            <div className="space-y-1.5">
              <p className="px-3 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">Candidate Management</p>
              <NavLink
                to="/admin/cms/candidates"
                className={({ isActive }) =>
                  `flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-bold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-[#5b4fe8] via-[#7048f2] to-[#8743f7] text-white shadow-[0_8px_24px_-4px_rgba(112,72,242,0.5)]'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <UserCheck size={20} /> <span className="min-w-0 truncate">Candidates</span>
              </NavLink>
              <NavLink
                to="/admin/cms/interviews"
                className={({ isActive }) =>
                  `flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-bold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-[#5b4fe8] via-[#7048f2] to-[#8743f7] text-white shadow-[0_8px_24px_-4px_rgba(112,72,242,0.5)]'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <PanelsTopLeft size={20} /> <span className="min-w-0 truncate">Interviews</span>
              </NavLink>
            </div>
          ) : null}
        </nav>

        <div className="admin-sidebar-footer border-t border-white/10 p-3.5">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-2xl border border-red-500/30 bg-[#25131b] px-4 py-2.5 text-center text-[15px] font-bold text-red-300 shadow-sm transition hover:border-red-500/60 hover:bg-red-950/60 hover:text-white active:scale-[0.98]"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0 text-red-400" />
            <span className="font-bold">Logout</span>
          </button>
        </div>

        {isDesktop && open ? (
          <button
            type="button"
            aria-label="Resize sidebar"
            title="Drag to resize sidebar"
            className={`absolute right-0 top-0 flex h-full w-2 cursor-col-resize items-center justify-center border-r border-slate-800 transition ${
              isResizingSidebar ? 'bg-purple-600/30' : 'bg-transparent hover:bg-white/10'
            }`}
            onPointerDown={(event) => {
              event.preventDefault()
              setIsResizingSidebar(true)
            }}
            onDoubleClick={() => setSidebarWidth(sidebarDefaultWidth)}
          >
            <span className="flex h-10 w-5 items-center justify-center rounded-full border border-slate-700 bg-[#0f172a] text-slate-300 shadow-sm">
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ) : null}
      </aside>

      <div
        className="admin-content-column flex min-h-screen min-w-0 flex-col bg-[var(--bg-main)] transition-[padding] duration-300"
        style={{ paddingLeft: isDesktop && open ? `${sidebarWidth}px` : isDesktop && !open ? '0px' : undefined }}
      >
        {hideTopbar ? null : <Topbar onMenuClick={() => setOpen((value) => !value)} />}
        <main
          className={`admin-content flex-1 overflow-x-hidden overflow-y-auto bg-[var(--bg-main)] ${
            isCandidateAdmin
              ? hideTopbar
                ? 'px-4 py-4 sm:p-6'
                : 'px-4 py-4 sm:p-6'
              : hideTopbar
                ? 'px-4 py-4 sm:p-6'
                : 'px-4 py-4 sm:p-6'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
