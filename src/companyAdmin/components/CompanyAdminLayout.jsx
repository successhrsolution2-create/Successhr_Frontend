import { useEffect, useState } from 'react'
import { BriefcaseBusiness, Building2, ClipboardList, LayoutDashboard, LogOut, Menu, X, List, UserCircle, ChevronDown } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import LoadingScreen from '../../components/LoadingScreen'
import companyAdminApi from '../api'

const links = [
  { to: '/company-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/company-admin/interview-info', label: 'Candidate Forms', icon: ClipboardList },
  { to: '/company-admin/vacancies', label: 'Vacancies', icon: BriefcaseBusiness }
]

export default function CompanyAdminLayout() {
  const navigate = useNavigate()
  const [companyAdmin, setCompanyAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const loadCompanyAdmin = async () => {
    try {
      const { data } = await companyAdminApi.get('/auth/me')
      setCompanyAdmin(data.companyAdmin)
    } catch {
      navigate('/company', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    companyAdminApi
      .get('/auth/me')
      .then(({ data }) => {
        if (active) setCompanyAdmin(data.companyAdmin)
      })
      .catch(() => {
        if (active) navigate('/company', { replace: true })
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [navigate])

  const logout = async () => {
    await companyAdminApi.post('/auth/logout').catch(() => {})
    navigate('/company', { replace: true })
  }

  if (loading) return <LoadingScreen />
  if (!companyAdmin) return null

  return (
    <div className="admin-shell min-h-screen bg-slate-50 text-slate-900">
      {open ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <button
        type="button"
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
        className="fixed left-3 top-3 z-[60] flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-4 w-4" /> : <List className="h-4 w-4" />}
      </button>

      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] max-w-[88vw] transform flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--text-primary)] transition-transform duration-300 ease-out lg:max-w-none lg:w-64 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="admin-sidebar-brand relative flex items-center justify-center border-b border-white/10 px-4 py-3">
          <div className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 shadow-lg">
            <img src="/success-logo.jpg" alt="Success HR Solutions" className="h-12 w-auto max-w-[170px] object-contain" />
          </div>
        </div>

        <nav className="admin-sidebar-nav flex-1 space-y-2.5 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-2">
          <p className="px-3 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">Company Portal</p>
          <div className="mt-2 mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3 mx-2">
            <div className="flex items-center gap-2 text-slate-200">
              <Building2 className="h-4 w-4" />
              <p className="truncate text-sm font-bold text-white">{companyAdmin.companyName}</p>
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-slate-300">{companyAdmin.name}</p>
            <p className="truncate text-xs text-slate-400">{companyAdmin.email}</p>
          </div>
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex min-h-[46px] items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[15px] font-bold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[#5b4fe8] via-[#7048f2] to-[#8743f7] text-white shadow-[0_8px_24px_-4px_rgba(112,72,242,0.5)]'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer border-t border-white/10 p-3.5">
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

      <div 
        className="min-h-screen transition-[padding] duration-300"
        style={{ paddingLeft: open ? '16rem' : '0' }}
      >
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 pl-14 sm:pl-16">
          <div>
            <h1 className="text-base font-bold text-slate-950 sm:text-lg">Company Admin Portal</h1>
            <p className="text-xs text-slate-500">Manage candidate interviews and manpower vacancies</p>
          </div>

          <div className="relative min-w-0">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1 transition hover:bg-slate-50 sm:px-3"
            >
              <UserCircle className="h-7 w-7 text-sky-600" />
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="max-w-44 truncate text-[13px] font-bold leading-tight text-slate-900">
                  {companyAdmin?.name || 'Company User'}
                </span>
                <span className="max-w-44 truncate text-[10px] font-medium text-slate-500">
                  Company Admin
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition ${profileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{companyAdmin?.name}</p>
                  <p className="truncate text-xs text-slate-500">{companyAdmin?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 sm:py-6">
          <Outlet context={{ companyAdmin, reloadCompanyAdmin: loadCompanyAdmin }} />
        </main>
      </div>
    </div>
  )
}
