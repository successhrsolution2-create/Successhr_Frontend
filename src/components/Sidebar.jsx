import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Building2,
  LayoutDashboard,
  PanelsTopLeft,
  IndianRupee,
  UserCircle,
  UserCheck,
  ClipboardList,
  Users,
  X
} from 'lucide-react'
import { connectAdminSocket, disconnectSocket } from '../socket'
import BrandLogo from './BrandLogo'
import Topbar from './Topbar'

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/business-advisors', label: 'Business Advisors', icon: Users },
  { to: '/admin/references', label: 'Reference Board', icon: PanelsTopLeft },
  { to: '/admin/students', label: 'Students', icon: UserCircle },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },

  {
    label: 'Candidate Management',
    icon: UserCheck,
    children: [
      { to: '/admin/candidates', label: 'Candidates' },
      { to: '/admin/interviews', label: 'Interviews' }
    ]
  },

  { to: '/admin/commission-process', label: 'Process Panel', icon: PanelsTopLeft },
  { to: '/admin/commission', label: 'Commission', icon: IndianRupee }
]

export default function Sidebar({ role, children }) {
  const [open, setOpen] = useState(false)
  const [showCandidates, setShowCandidates] = useState(false)

  const { token } = useSelector((state) => state.auth)

  useEffect(() => {
    if (role !== 'superAdmin' || !token) return
    connectAdminSocket(token)
    return () => disconnectSocket()
  }, [role, token])

  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* MOBILE OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed z-50 inset-y-0 left-0 w-72 bg-slate-800 text-white transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        } transition lg:translate-x-0 lg:static`}
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <BrandLogo />
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X />
          </button>
        </div>

        {/* NAV */}
        <nav className="p-3 space-y-1">
          {adminLinks.map((item, index) => {
            if (item.children) {
              return (
                <div key={index}>
                  <button
                    onClick={() => setShowCandidates(!showCandidates)}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>

                  {showCandidates && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          className={({ isActive }) =>
                            `block px-3 py-2 rounded-lg text-sm ${
                              isActive
                                ? 'bg-indigo-600'
                                : 'hover:bg-slate-700'
                            }`
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col">

        {/* ✅ ONLY THIS */}
        <Topbar onMenuClick={() => setOpen(true)} />

        {/* CONTENT */}
        <main className="p-6 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}