import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowLeftRight,
  Building2,
  CalendarClock,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Menu,
  PanelsTopLeft,
  PhoneCall,
  Settings,
  UserCircle,
  UserCheck,
  Users,
  X,
  Wallet
} from 'lucide-react'
import { connectSocket, disconnectSocket } from '../socket'
import Topbar from './Topbar'

const adminMainLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }
]

const baLinks = [
  { to: '/ba/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ba/students', label: 'My Candidates', icon: UserCheck },
  { to: '/ba/companies', label: 'My Companies', icon: Building2 },
  { to: '/ba/earnings', label: 'My Earnings', icon: Wallet }
]

const businessAdvisorAdminLinks = [
  { to: '/admin/references', label: 'Reference Board', icon: PanelsTopLeft },
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
  { to: '/ems/locations', label: 'Locations', icon: MapPin },
  { to: '/ems/schedules', label: 'Schedules', icon: CalendarClock },
  { to: '/ems/attendance', label: 'Attendance', icon: PanelsTopLeft },
  { to: '/ems/leaves', label: 'Leaves', icon: UserCheck },
  { to: '/ems/payroll', label: 'Payroll', icon: Wallet },
  { to: '/ems/reports', label: 'Reports', icon: Building2 }
]

const SIDEBAR_DEFAULT_WIDTH = 232
const CANDIDATE_SIDEBAR_DEFAULT_WIDTH = 216
const SIDEBAR_MIN_WIDTH = 208
const SIDEBAR_MAX_WIDTH = 300
const SIDEBAR_WIDTH_KEY = 'admin_sidebar_width_compact'
const CANDIDATE_SIDEBAR_WIDTH_KEY = 'candidate_admin_sidebar_width_compact'

const clampSidebarWidth = (value) => Math.min(Math.max(value, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH)

export default function Sidebar({ role, children, hideTopbar = false }) {
  const isSuperAdmin = role === 'superAdmin'
  const isCandidateAdmin = role === 'candidateAdmin'
  const isCrmAdmin = role === 'crmAdmin'
  const isManager = role === 'manager'
  const isAdminShell = isSuperAdmin || isCandidateAdmin || isCrmAdmin || isManager
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
        <div className="admin-sidebar-brand border-b border-[var(--border)] px-4 py-4">
          <div className="flex items-center justify-center">
            <img
              src="/success-logo.svg"
              alt="Success HR Solutions"
              className="h-12 w-full max-w-[178px] object-contain"
            />
          </div>

          <div className="admin-profile mt-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-3 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue-lt)] text-xs font-bold text-[var(--accent-blue)]">
              SH
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-[var(--text-primary)]">
                {isSuperAdmin ? 'Super Admin' : isCandidateAdmin ? 'Candidate Admin' : isCrmAdmin ? 'CRM Admin' : isManager ? 'Manager' : 'Business Advisor'}
              </p>
              <p className="truncate text-[11px] text-[var(--text-secondary)]">workspace@successhr.com</p>
            </div>
            <button type="button" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[#F3F4F6]">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <nav className="admin-sidebar-nav flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 py-4" onClick={() => !isDesktop && setOpen(false)}>
          {!isSuperAdmin && !isCrmAdmin && !isManager ? (
            <div className="space-y-2">
              <p className="px-3 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Main Menu</p>
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex min-h-9 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] transition ${
                      isActive
                        ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]'
                        : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ) : null}

          {isSuperAdmin || isCrmAdmin || isManager ? (
            <>
              {isSuperAdmin ? (
                <div className="space-y-2">
                  <p className="px-3 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Main Menu</p>
                  {adminMainLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex min-h-9 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] transition ${
                          isActive
                            ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]'
                            : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                        }`
                      }
                    >
                      <item.icon size={18} />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="px-3 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Integrations</p>

                {canUseCandidateManagement ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setCandidatePanelOpen((current) => !current)
                    }}
                    className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition ${
                      isCandidateManagementPanelActive ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                    }`}
                    aria-expanded={candidatePanelOpen}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-3.5 w-3.5 rounded-full bg-[#7c3aed]" />
                      <span className="min-w-0 truncate">Candidate Management</span>
                    </span>
                    {candidatePanelOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>

                  {candidatePanelOpen ? (
                    <div className="ml-5 mt-1 space-y-1 border-l border-[var(--border)] pl-3">
                      {candidateManagementLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex min-h-8 items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition ${
                              isActive
                                ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]'
                                : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                            }`
                          }
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#7c3aed]" />
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
                    className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition ${
                      isTelecallingCrmPanelActive ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                    }`}
                    aria-expanded={crmPanelOpen}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-3.5 w-3.5 rounded-full bg-[var(--accent-blue)]" />
                      <span className="min-w-0 truncate">Telecalling CRM</span>
                    </span>
                    {crmPanelOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>

                  {crmPanelOpen ? (
                    <div className="ml-5 mt-1 space-y-1 border-l border-[var(--border)] pl-3">
                      {telecallingCrmLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            `flex min-h-8 items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition ${
                              isActive
                                ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]'
                                : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                            }`
                          }
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-blue)]" />
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
                    className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition ${
                      isEmployeeManagementPanelActive ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                    }`}
                    aria-expanded={emsPanelOpen}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-3.5 w-3.5 rounded-full bg-[var(--text-muted)]" />
                      <span className="min-w-0 truncate">Success Employee</span>
                    </span>
                    {emsPanelOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>

                  {emsPanelOpen ? (
                    <div className="ml-5 mt-1 space-y-1 border-l border-[var(--border)] pl-3">
                      {employeeManagementLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex min-h-8 items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition ${
                              isActive
                                ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]'
                                : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                            }`
                          }
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--text-muted)]" />
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
                    className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition ${
                      isCompanyManagementPanelActive ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                    }`}
                    aria-expanded={companyPanelOpen}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-3.5 w-3.5 rounded-full bg-[#f97316]" />
                      <span className="min-w-0 truncate">Company Management</span>
                    </span>
                    {companyPanelOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>

                  {companyPanelOpen ? (
                    <div className="ml-5 mt-1 space-y-1 border-l border-[var(--border)] pl-3">
                      {companyManagementLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex min-h-8 items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition ${
                              isActive
                                ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]'
                                : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
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
                    className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition ${
                      isBusinessAdvisorPanelActive ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                    }`}
                    aria-expanded={baPanelOpen}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-3.5 w-3.5 rounded-full bg-[var(--success)]" />
                      <span className="min-w-0 truncate">Success Advisor</span>
                    </span>
                    {baPanelOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>

                  {baPanelOpen ? (
                    <div className="ml-5 mt-1 space-y-1 border-l border-[var(--border)] pl-3">
                      {businessAdvisorAdminLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex min-h-8 items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition ${
                              isActive
                                ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]'
                                : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                            }`
                          }
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--success)]" />
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
            <div className="space-y-2">
              <p className="px-3 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Candidate Management</p>
              <NavLink
                to="/admin/cms/candidates"
                className={({ isActive }) =>
                  `flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition ${
                    isActive
                      ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]'
                      : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                  }`
                }
              >
                <UserCheck size={18} /> <span className="min-w-0 truncate">Candidates</span>
              </NavLink>
              <NavLink
                to="/admin/cms/interviews"
                className={({ isActive }) =>
                  `flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition ${
                    isActive
                      ? 'bg-[var(--sidebar-active)] font-semibold text-[var(--accent-blue)]'
                      : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                  }`
                }
              >
                <PanelsTopLeft size={18} /> <span className="min-w-0 truncate">Interviews</span>
              </NavLink>
            </div>
          ) : null}
        </nav>

        {settingsPath ? (
          <div className="admin-sidebar-footer border-t border-[var(--border)] px-3 py-3">
            <p className="px-3 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Others</p>
            <div className="mt-2 space-y-1">
              <NavLink
                to={settingsPath}
                onClick={() => !isDesktop && setOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition ${
                    isActive
                      ? 'bg-[var(--accent-blue)] font-semibold text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]'
                  }`
                }
              >
                <Settings className="h-4 w-4" />
                <span className="min-w-0 truncate">Settings</span>
              </NavLink>
              <button
                type="button"
                className="flex min-h-9 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-[var(--text-secondary)] transition hover:bg-[#F3F4F6] hover:text-[var(--text-primary)]"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="min-w-0 truncate">Support</span>
              </button>
            </div>
          </div>
        ) : null}

        {isDesktop && open ? (
          <button
            type="button"
            aria-label="Resize sidebar"
            title="Drag to resize sidebar"
            className={`absolute right-0 top-0 hidden h-full w-2 cursor-col-resize items-center justify-center border-r border-[var(--border)] transition ${
              isResizingSidebar ? 'bg-[var(--accent-blue-lt)]' : 'bg-transparent hover:bg-[#F3F4F6]'
            }`}
            onPointerDown={(event) => {
              event.preventDefault()
              setIsResizingSidebar(true)
            }}
            onDoubleClick={() => setSidebarWidth(sidebarDefaultWidth)}
          >
            <span className="flex h-10 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--text-secondary)] shadow-sm">
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ) : null}
      </aside>

      <button
        type="button"
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
        className="fixed left-3 top-3 z-[60] flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue-lt)] lg:hidden"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <div
        className="admin-content-column flex min-h-screen min-w-0 flex-col bg-[var(--bg-main)] transition-[padding] duration-300"
        style={{ paddingLeft: isDesktop && open ? `${sidebarWidth}px` : isDesktop && !open ? '0px' : undefined }}
      >
        {hideTopbar ? null : <Topbar onMenuClick={() => setOpen((value) => !value)} showMenuButton={false} />}
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
