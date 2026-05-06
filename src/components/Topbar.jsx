import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  UserCircle,
  LogOut,
  Menu,
  Settings,
  ChevronDown
} from 'lucide-react'
import { logout } from '../store/authSlice'

export default function Topbar({ onMenuClick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const dispatch = useDispatch()
  const navigate = useNavigate()
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

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="h-14 bg-white border-b flex items-center px-4 shadow-sm">

      {/* MOBILE MENU */}
      <button
        onClick={onMenuClick}
        className="lg:hidden mr-2 p-2 rounded-lg hover:bg-gray-100"
      >
        <Menu size={20} />
      </button>

      {/* PROFILE */}
      <div className="ml-auto relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          <UserCircle className="h-7 w-7 text-gray-600" />
          <span className="text-sm font-medium hidden sm:block text-gray-700">
            {user?.name}
          </span>
          <ChevronDown
            size={16}
            className={`transition ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">

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

              <button
                onClick={() => navigate('/admin/settings')}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                <Settings size={16} />
                Profile Settings
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