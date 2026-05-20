import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  UserCircle,
  LogOut,
  Menu,
  Settings,
  ChevronDown,
  BadgeCheck
} from 'lucide-react'
import { logout } from '../store/authSlice'
import api from '../api/axios'

export default function Topbar({ onMenuClick, showMenuButton = true }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)

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
    await api.post('/auth/logout').catch(() => {})
    dispatch(logout())
    navigate('/login')
  }

  const settingsPath = user?.role === 'businessAdvisor' ? '/ba/settings' : '/admin/settings'
  const isCandidateAdmin = user?.role === 'candidateAdmin'
  const candidateAdminTitle = location.pathname.startsWith('/admin/cms/interviews')
    ? 'Interviews'
    : location.pathname.startsWith('/admin/cms/companies')
      ? 'Companies'
      : location.pathname.startsWith('/admin/process-panel')
        ? 'Process Panel'
        : 'Candidates'

  if (isCandidateAdmin) {
    return (
      <header className="sticky top-0 z-30 border-b border-[#d4dde8] bg-white/95 backdrop-blur">
        <div className="flex min-h-20 flex-col gap-3 py-3 pl-4 pr-4 sm:flex-row sm:items-center sm:justify-between lg:pl-6 lg:pr-10">
          {showMenuButton ? (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open menu"
              className="mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#d4dde8] bg-white text-slate-700 hover:bg-slate-50"
            >
              <Menu size={20} />
            </button>
          ) : null}

          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#00427d]">{candidateAdminTitle}</h1>
            <p className="mt-2 text-sm text-slate-600">Candidate Management System</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#d4dde8] bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-[#0b65ac] hover:bg-[#eef6ff] hover:text-[#00427d]"
          >
            Logout
          </button>
        </div>
      </header>
    )
  }

  return (
    <div className="sticky top-0 z-30 flex h-14 min-w-0 items-center border-b bg-white px-3 shadow-sm sm:px-4">

      {showMenuButton ? (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      ) : null}

      {/* PROFILE */}
      <div className="relative ml-auto min-w-0" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-gray-100 sm:px-3"
        >
          <UserCircle className="h-7 w-7 text-gray-600" />
          <span className="hidden max-w-44 truncate text-sm font-medium text-gray-700 sm:block">
            {user?.name}
          </span>
          <ChevronDown
            size={16}
            className={`transition ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute right-0 z-50 mt-3 w-[calc(100vw-1rem)] max-w-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">

            {/* USER INFO */}
            <div className="px-4 py-3 bg-gray-50 border-b">
              <p className="text-sm font-semibold text-gray-800">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
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
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  <BadgeCheck size={16} />
                  BA Profile
                </button>
              ) : null}

              <button
                onClick={() => {
                  setOpen(false)
                  navigate(settingsPath)
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                <Settings size={16} />
                Account Settings
              </button>

              <div className="my-1 border-t" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={16} />
                Logout
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
