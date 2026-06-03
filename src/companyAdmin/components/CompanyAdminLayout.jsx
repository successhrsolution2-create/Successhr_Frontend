import { useEffect, useState } from 'react'
import { Building2, ClipboardList, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import LoadingScreen from '../../components/LoadingScreen'
import companyAdminApi from '../api'

const links = [
  { to: '/company-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/company-admin/interview-info', label: 'Company Interview Info', icon: ClipboardList }
]

export default function CompanyAdminLayout() {
  const navigate = useNavigate()
  const [companyAdmin, setCompanyAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const loadCompanyAdmin = async () => {
    try {
      const { data } = await companyAdminApi.get('/auth/me')
      setCompanyAdmin(data.companyAdmin)
    } catch (_error) {
      navigate('/company-admin/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanyAdmin()
  }, [])

  const logout = async () => {
    await companyAdminApi.post('/auth/logout').catch(() => {})
    navigate('/company-admin/login', { replace: true })
  }

  if (loading) return <LoadingScreen />
  if (!companyAdmin) return null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {open ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:w-64 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="border-b border-slate-200 px-5 py-5">
          <img src="/success-logo.svg" alt="Success HR Solutions" className="h-12 w-full object-contain object-left" />
          <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 px-3 py-3">
            <div className="flex items-center gap-2 text-sky-800">
              <Building2 className="h-4 w-4" />
              <p className="truncate text-sm font-bold">{companyAdmin.companyName}</p>
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-slate-600">{companyAdmin.name}</p>
            <p className="truncate text-xs text-slate-500">{companyAdmin.email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" onClick={() => setOpen(false)}>
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Company Portal</p>
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-950 sm:text-lg">Company Admin Portal</h1>
            <p className="text-xs text-slate-500">Manage your company interview information</p>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 sm:py-6">
          <Outlet context={{ companyAdmin, reloadCompanyAdmin: loadCompanyAdmin }} />
        </main>
      </div>
    </div>
  )
}
