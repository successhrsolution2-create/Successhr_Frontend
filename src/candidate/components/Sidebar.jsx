import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowLeftRight,
  UserCheck,
  Menu,
  X,
  PanelsTopLeft
} from 'lucide-react'
import { connectSocket, disconnectSocket } from '../socket'
import BrandLogo from './BrandLogo'
import Topbar from './Topbar'

const SIDEBAR_DEFAULT_WIDTH = 224
const SIDEBAR_MIN_WIDTH = 204
const SIDEBAR_MAX_WIDTH = 340
const SIDEBAR_WIDTH_KEY = 'candidate_admin_sidebar_width_compact'

const clampSidebarWidth = (value) => Math.min(Math.max(value, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH)

export default function Sidebar({ role, children }) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches
  )
  const [open, setOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches
  )
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === 'undefined') return SIDEBAR_DEFAULT_WIDTH

    const savedWidth = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY))
    return Number.isFinite(savedWidth) ? clampSidebarWidth(savedWidth) : SIDEBAR_DEFAULT_WIDTH
  })
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const { token } = useSelector((state) => state.auth)

  const isSuperAdmin = role === 'superAdmin'

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
      window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth))
    }
  }, [sidebarWidth])

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

  return (
    <div className="min-h-screen min-w-0 bg-slate-100">
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
          {isSuperAdmin ? (
            <>
              <div className="border-t border-white/10" />
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Candidate Management</p>
              <div className="space-y-1">
                <div className="flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium text-slate-300">
                  <UserCheck size={15} /> <span className="min-w-0 truncate">Candidates</span>
                </div>
                <NavLink
                  to="/candidate/admin/cms/candidates"
                  className={({ isActive }) =>
                    `flex h-9 items-center rounded-md px-3 text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-gradient-to-r from-[#2f8dff] to-[#316dff] text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  Candidates List
                </NavLink>
                <NavLink
                  to="/candidate/admin/cms/companies"
                  className={({ isActive }) =>
                    `flex h-9 items-center rounded-md px-3 text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-gradient-to-r from-[#2f8dff] to-[#316dff] text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  Companies
                </NavLink>
                <NavLink
                  to="/candidate/admin/process-panel"
                  className={({ isActive }) =>
                    `flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-gradient-to-r from-[#2f8dff] to-[#316dff] text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <PanelsTopLeft size={15} /> <span className="min-w-0 truncate">Process Panel</span>
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
            onDoubleClick={() => setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)}
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
        <Topbar onMenuClick={() => setOpen((value) => !value)} showMenuButton={false} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
