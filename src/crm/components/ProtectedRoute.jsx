import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ProtectedRoute = () => {
  const location = useLocation()
  const { accessToken } = useSelector((state) => state.crmAuth)
  const mainUser = useSelector((state) => state.auth.user)
  const isMainCrmAdmin =
    mainUser?.role === 'superAdmin' ||
    (mainUser?.role === 'manager' && Array.isArray(mainUser.managerAccess) && mainUser.managerAccess.includes('crmManagement'))

  if (!accessToken && !isMainCrmAdmin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute
