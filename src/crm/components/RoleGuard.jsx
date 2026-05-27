import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CRM_BASE_PATH, redirectPathForRole } from '../utils/helpers.js'

const RoleGuard = ({ allowedRoles = [] }) => {
  const location = useLocation()
  const { role } = useSelector((state) => state.crmAuth)
  const mainUser = useSelector((state) => state.auth.user)
  const isEmployeeArea = location.pathname.startsWith(`${CRM_BASE_PATH}/employee`)
  const isMainCrmAdmin =
    mainUser?.role === 'superAdmin' ||
    (mainUser?.role === 'manager' && Array.isArray(mainUser.managerAccess) && mainUser.managerAccess.includes('crmManagement'))
  const effectiveRole =
    isEmployeeArea && role === 'crm_employee'
      ? 'crm_employee'
      : isMainCrmAdmin
        ? 'crm_super_admin'
        : role

  if (!allowedRoles.includes(effectiveRole)) {
    return <Navigate to={redirectPathForRole(effectiveRole)} replace />
  }

  return <Outlet />
}

export default RoleGuard
