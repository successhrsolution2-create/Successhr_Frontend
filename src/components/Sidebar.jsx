import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowLeftRight,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  Menu,
  PanelsTopLeft,
  PhoneCall,
  UserCircle,
  UserCheck,
  Users,
  X,
  Wallet
} from 'lucide-react'
import { connectSocket, disconnectSocket } from '../socket'
import BrandLogo from './BrandLogo'
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
  { to: '/admin/students', label: 'Success Advisor Candidates', icon: UserCircle },
  { to: '/admin/companies', label: 'Success Advisor Companies', icon: Building2 },
  { to: '/admin/commission', label: 'Earnings', icon: Wallet }
]

const telecallingCrmLinks = [
  { to: '/admin/crm/employees', label: 'Success Employee', icon: Users },
  { to: '/admin/crm/candidates', label: 'CRM Candidates', icon: UserCheck }
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

const SIDEBAR_DEFAULT_WIDTH = 224
const CANDIDATE_SIDEBAR_DEFAULT_WIDTH = 224
const SIDEBAR_MIN_WIDTH = 204
const SIDEBAR_MAX_WIDTH = 340
const SIDEBAR_WIDTH_KEY = 'admin_sidebar_width_compact'
const CANDIDATE_SIDEBAR_WIDTH_KEY = 'candidate_admin_sidebar_width_compact'

const clampSidebarWidth = (value) => Math.min(Math.max(value, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH)

export default function Sidebar({ role, children, hideTopbar = false }) {
  const isSuperAdmin = role === 'superAdmin'
  const isCandidateAdmin = role === 'candidateAdmin'
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
  const [baPanelOpen, setBaPanelOpen] = useState(true)
  const [crmPanelOpen, setCrmPanelOpen] = useState(true)
  const [emsPanelOpen, setEmsPanelOpen] = useState(true)
  const { token } = useSelector((state) => state.auth)
  const location = useLocation()

  const links = useMemo(() => (isSuperAdmin ? adminMainLinks : isCandidateAdmin ? [] : baLinks), [isSuperAdmin, isCandidateAdmin])
  const isBusinessAdvisorPanelActive = businessAdvisorAdminLinks.some((item) =>
    item.to === '/admin/business-advisors'
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  )
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
    if (isBusinessAdvisorPanelActive) {
      setBaPanelOpen(true)
    }
  }, [isBusinessAdvisorPanelActive])

  useEffect(() => {
    if (isTelecallingCrmPanelActive) {
      setCrmPanelOpen(true)
    }
  }, [isTelecallingCrmPanelActive])

  useEffect(() => {
    if (isEmployeeManagementPanelActive) {
      setEmsPanelOpen(true)
    }
  }, [isEmployeeManagementPanelActive])

  return (
    <div className={`min-h-screen min-w-0 ${isCandidateAdmin ? 'bg-[#f7fafc]' : 'bg-slate-100'}`}>
      {open && <button type="button" aria-label="Close sidebar overlay" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(224px,86vw)] max-w-[86vw] transform overflow-y-auto overflow-x-hidden bg-[linear-gradient(180deg,#09264a_0%,#071f3d_42%,#06172c_100%)] text-white transition-transform duration-300 ease-out lg:max-w-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: isDesktop ? `${sidebarWidth}px` : 'min(224px, 86vw)' }}
      >
        <div className="border-b border-white/10 px-4 pb-5 pt-14">
          <BrandLogo className="mx-auto h-auto w-[168px] object-contain" />
        </div>

        <nav className="space-y-5 overflow-x-hidden px-3 py-5" onClick={() => !isDesktop && setOpen(false)}>
          {/* Only show main links for non-superAdmin */}
          {!isSuperAdmin && links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2f8dff] to-[#316dff] text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon size={15} />
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}

          {isSuperAdmin ? (
            <>
              <div className="border-t border-white/10" />
              <div className="space-y-1">
                {adminMainLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition ${
                        isActive
                          ? 'bg-gradient-to-r from-[#2f8dff] to-[#316dff] text-white'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={15} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </NavLink>
                ))}
              </div>

              <div className="border-t border-white/10" />
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Projects</p>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setBaPanelOpen((current) => !current)
                  }}
                  className={`flex h-9 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-[13px] font-medium transition ${
                    isBusinessAdvisorPanelActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-expanded={baPanelOpen}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Users size={15} />
                    <span className="min-w-0 truncate">Success Advisor</span>
                  </span>
                  {baPanelOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {baPanelOpen ? (
                  <div className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-2">
                    {businessAdvisorAdminLinks.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition ${
                            isActive
                              ? 'bg-gradient-to-r from-[#2f8dff] to-[#316dff] text-white'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        <item.icon size={14} /> <span className="min-w-0 truncate">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setCrmPanelOpen((current) => !current)
                  }}
                  className={`flex h-9 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-[13px] font-medium transition ${
                    isTelecallingCrmPanelActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-expanded={crmPanelOpen}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <PhoneCall size={15} />
                    <span className="min-w-0 truncate">Telecalling CRM</span>
                  </span>
                  {crmPanelOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {crmPanelOpen ? (
                  <div className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-2">
                    {telecallingCrmLinks.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition ${
                            isActive
                              ? 'bg-gradient-to-r from-[#2f8dff] to-[#316dff] text-white'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        <item.icon size={14} /> <span className="min-w-0 truncate">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setEmsPanelOpen((current) => !current)
                  }}
                  className={`flex h-9 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-[13px] font-medium transition ${
                    isEmployeeManagementPanelActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-expanded={emsPanelOpen}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Users size={15} />
                    <span className="min-w-0 truncate">Employee Management</span>
                  </span>
                  {emsPanelOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {emsPanelOpen ? (
                  <div className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-2">
                    {employeeManagementLinks.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition ${
                            isActive
                              ? 'bg-gradient-to-r from-[#2f8dff] to-[#316dff] text-white'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        <item.icon size={14} /> <span className="min-w-0 truncate">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>

            </>
          ) : null}

          {isCandidateAdmin ? (
            <>
              <div className="border-t border-white/10 pt-4">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Candidate Management</p>
              </div>
              <div className="space-y-1">
                <NavLink
                  to="/admin/cms/candidates"
                  className={({ isActive }) =>
                    `flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-gradient-to-r from-[#2f8dff] to-[#316dff] text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <UserCheck size={15} /> <span className="min-w-0 truncate">Candidates</span>
                </NavLink>
                <NavLink
                  to="/admin/cms/interviews"
                  className={({ isActive }) =>
                    `flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-gradient-to-r from-[#2f8dff] to-[#316dff] text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <PanelsTopLeft size={15} /> <span className="min-w-0 truncate">Interviews</span>
                </NavLink>
              </div>
            </>
          ) : null}
        </nav>

        {isDesktop && open ? (
          <button
            type="button"
            aria-label="Resize sidebar"
            title="Drag to resize sidebar"
            className={`absolute right-0 top-0 hidden h-full w-3 cursor-col-resize items-center justify-center border-r border-white/10 transition lg:flex ${
              isResizingSidebar ? 'bg-white/10' : 'bg-transparent hover:bg-white/10'
            }`}
            onPointerDown={(event) => {
              event.preventDefault()
              setIsResizingSidebar(true)
            }}
            onDoubleClick={() => setSidebarWidth(sidebarDefaultWidth)}
          >
            <span className="flex h-11 w-6 items-center justify-center rounded-full border border-white/20 bg-[#06172c] text-white">
              <ArrowLeftRight className="h-4 w-4" />
            </span>
          </button>
        ) : null}
      </aside>

      <button
        type="button"
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
        className="fixed left-3 top-3 z-[60] flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-[#06172c]/95 text-white transition hover:bg-[#0b2546] focus:outline-none focus:ring-2 focus:ring-white/25"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <div
        className="flex min-h-screen min-w-0 flex-col transition-[padding] duration-300"
        style={{ paddingLeft: isDesktop && open ? `${sidebarWidth}px` : !open ? '56px' : undefined }}
      >
        {hideTopbar ? null : <Topbar onMenuClick={() => setOpen((value) => !value)} showMenuButton={false} />}
        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto ${
            isCandidateAdmin
              ? hideTopbar
                ? 'px-3 py-3 sm:p-4 lg:p-5'
                : 'px-4 py-6 lg:px-10'
              : hideTopbar
                ? 'px-3 py-3 sm:p-4 lg:p-5'
                : 'px-3 py-4 sm:p-5 lg:p-6'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
