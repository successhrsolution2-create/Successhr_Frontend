import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Building2,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  PanelsTopLeft,
  UserCircle,
  UserCheck,
  Users,
  X,
  Wallet
} from 'lucide-react'
import { connectSocket, disconnectSocket } from '../socket'
import BrandLogo from './BrandLogo'
import Topbar from './Topbar'

// Remove top four options from main links for super admin
const adminMainLinks = []

const baLinks = [
  { to: '/ba/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ba/students', label: 'My Candidates', icon: UserCheck },
  { to: '/ba/companies', label: 'My Companies', icon: Building2 },
  { to: '/ba/earnings', label: 'My Earnings', icon: Wallet }
]

const businessAdvisorAdminLinks = [
  { to: '/admin/references', label: 'Dashboard', icon: PanelsTopLeft },
  { to: '/admin/business-advisors', label: 'Advisors', icon: Users, end: true },
  { to: '/admin/students', label: 'Candidates', icon: UserCircle },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/commission', label: 'Earnings', icon: Wallet }
]

export default function Sidebar({ role, children }) {
  const [open, setOpen] = useState(false)
  const [baPanelOpen, setBaPanelOpen] = useState(true)
  const { token } = useSelector((state) => state.auth)
  const location = useLocation()

  const isSuperAdmin = role === 'superAdmin'
  const isCandidateAdmin = role === 'candidateAdmin'
  const links = useMemo(() => (isSuperAdmin || isCandidateAdmin ? adminMainLinks : baLinks), [isSuperAdmin, isCandidateAdmin])
  const isBusinessAdvisorPanelActive = businessAdvisorAdminLinks.some((item) =>
    item.to === '/admin/business-advisors'
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  )

  useEffect(() => {
    if (!token) return undefined
    connectSocket(token)
    return () => disconnectSocket()
  }, [token])

  useEffect(() => {
    if (isBusinessAdvisorPanelActive) {
      setBaPanelOpen(true)
    }
  }, [isBusinessAdvisorPanelActive])

  return (
    <div className="flex min-h-screen min-w-0 bg-slate-100">
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[86vw] transform overflow-y-auto bg-slate-800 text-white transition ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-700 p-3 sm:p-4">
          <BrandLogo className="max-h-24" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-200 hover:bg-slate-700 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 overflow-x-hidden p-2 sm:p-3" onClick={() => setOpen(false)}>
          {/* Only show main links for non-superAdmin */}
          {!isSuperAdmin && links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 whitespace-nowrap ${isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'}`
              }
            >
              <item.icon size={16} />
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}

          {isSuperAdmin ? (
            <>
              <div className="my-3 border-t border-slate-700" />
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">Projects</p>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setBaPanelOpen((current) => !current)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                    isBusinessAdvisorPanelActive ? 'bg-slate-700 text-white' : 'text-slate-100 hover:bg-slate-700'
                  }`}
                  aria-expanded={baPanelOpen}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Users size={16} />
                    <span className="min-w-0 truncate">Business Advisor</span>
                  </span>
                  {baPanelOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {baPanelOpen ? (
                  <div className="ml-2 mt-1 space-y-1 border-l border-slate-700 pl-3 sm:ml-4">
                    {businessAdvisorAdminLinks.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                            isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'
                          }`
                        }
                      >
                        <item.icon size={16} /> <span className="min-w-0 truncate">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>

            </>
          ) : null}

          {isCandidateAdmin ? (
            <>
              <div className="my-3 border-t border-slate-700" />
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">Candidate Management</p>
              <div className="ml-2 mt-1 space-y-1 sm:ml-6">
                <NavLink to="/admin/cms/candidates" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}>
                  <UserCheck size={16} /> <span className="min-w-0 truncate">Candidates</span>
                </NavLink>
                <NavLink to="/admin/cms/interviews" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}>
                  <PanelsTopLeft size={16} /> <span className="min-w-0 truncate">Interviews</span>
                </NavLink>
              </div>
            </>
          ) : null}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
