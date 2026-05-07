import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Building2,
  LayoutDashboard,
  PanelsTopLeft,
  UserCircle,
  UserCheck,
  Users,
  // X,
  Wallet
} from 'lucide-react'
import { connectSocket, disconnectSocket } from '../socket'
import BrandLogo from './BrandLogo'
import Topbar from './Topbar'

const adminMainLinks = [
  { to: '/admin/references', label: 'Reference Board', icon: PanelsTopLeft },
  { to: '/admin/students', label: 'Candidates', icon: UserCircle },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/process-panel', label: 'Process Panel', icon: PanelsTopLeft }
]

const baLinks = [
  { to: '/ba/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ba/profile', label: 'My Profile', icon: UserCircle },
  { to: '/ba/students', label: 'My Candidates', icon: UserCheck },
  { to: '/ba/companies', label: 'My Companies', icon: Building2 },
  { to: '/ba/earnings', label: 'My Earnings', icon: Wallet }
]

export default function Sidebar({ role, children }) {
  const [open, setOpen] = useState(false)
  const [showBusinessAdvisors, setShowBusinessAdvisors] = useState(false)
  const [showCandidates, setShowCandidates] = useState(false)
  const { token } = useSelector((state) => state.auth)
  const location = useLocation()

  const isSuperAdmin = role === 'superAdmin'
  const links = useMemo(() => (isSuperAdmin ? adminMainLinks : baLinks), [isSuperAdmin])

  useEffect(() => {
    if (!token) return undefined
    connectSocket(token)
    return () => disconnectSocket()
  }, [token])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (location.pathname.startsWith('/admin/business-advisors')) {
      setShowBusinessAdvisors(true)
    }
    if (location.pathname.startsWith('/admin/cms/')) {
      setShowCandidates(true)
    }
  }, [location.pathname, isSuperAdmin])

  return (
    <div className="flex min-h-screen bg-slate-100">
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-slate-800 text-white transition ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <BrandLogo />
          {/* <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu">
            <X />
          </button> */}
        </div>

        <nav className="space-y-1 p-3">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 ${isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'}`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}

          {isSuperAdmin ? (
            <>
              <div className="my-3 border-t border-slate-700" />
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">Business Advisor Management</p>
              <button
                type="button"
                onClick={() => setShowBusinessAdvisors((v) => !v)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-700"
              >
                <Users size={16} />
                Business Advisors
              </button>
              {showBusinessAdvisors ? (
                <div className="ml-6 mt-1 space-y-1">
                  <NavLink
                    to="/admin/business-advisors"
                    end
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      location.pathname === '/admin/business-advisors' && location.search !== '?action=create'
                        ? 'bg-indigo-600'
                        : 'hover:bg-slate-700'
                    }`}
                  >
                    Advisor List
                  </NavLink>
                  <NavLink
                    to="/admin/business-advisors?action=create"
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      location.pathname === '/admin/business-advisors' && location.search === '?action=create'
                        ? 'bg-indigo-600'
                        : 'hover:bg-slate-700'
                    }`}
                  >
                    Add Advisor
                  </NavLink>
                </div>
              ) : null}

              <div className="my-3 border-t border-slate-700" />
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">Candidate Management</p>
              <button
                type="button"
                onClick={() => setShowCandidates((v) => !v)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-700"
              >
                <UserCheck size={16} />
                Candidates
              </button>
              {showCandidates ? (
                <div className="ml-6 mt-1 space-y-1">
                  <NavLink
                    to="/admin/cms/candidates"
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'}`
                    }
                  >
                    Candidates List
                  </NavLink>
                  <NavLink
                    to="/admin/cms/candidates/new"
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'}`
                    }
                  >
                    Add Candidate
                  </NavLink>
                </div>
              ) : null}
            </>
          ) : null}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
