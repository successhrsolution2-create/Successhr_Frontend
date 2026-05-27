import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoadingScreen from './LoadingScreen'

const managerDefaultPath = (user = {}) => {
  const access = Array.isArray(user.managerAccess) ? user.managerAccess : []
  if (access.includes('candidateManagement')) return '/admin/cms/candidates'
  if (access.includes('crmManagement')) return '/admin/crm/dashboard'
  if (access.includes('employeeManagement')) return '/ems'
  return '/admin/settings'
}

const defaultPath = (role, user) => {
  if (role === 'superAdmin') return '/admin/dashboard'
  if (role === 'candidateAdmin') return '/admin/cms/candidates'
  if (role === 'manager') return managerDefaultPath(user)
  if (role === 'crm_super_admin') return '/admin/crm/dashboard'
  if (role === 'crm_employee') return '/admin/crm/employee/candidates'
  return '/ba/dashboard'
}

export default function ProtectedRoute({ roles, managerAccess, children, loginPath = '/login' }) {
  const { token, user, checking } = useSelector((state) => state.auth)
  const { accessToken: crmAccessToken, role: crmRole } = useSelector((state) => state.crmAuth)
  const mainRole = user?.role
  const hasMainSession = Boolean(token && user)
  const hasCrmSession = Boolean(crmAccessToken && crmRole)

  if (checking) {
    return <LoadingScreen />
  }

  if (!hasMainSession && !hasCrmSession) {
    return <Navigate to={loginPath} replace />
  }

  if (roles?.length) {
    let mainAllowed = hasMainSession && roles.includes(mainRole)
    if (mainAllowed && mainRole === 'manager' && managerAccess) {
      mainAllowed = Array.isArray(user.managerAccess) && user.managerAccess.includes(managerAccess)
    }
    const crmAllowed = hasCrmSession && roles.includes(crmRole)

    if (!mainAllowed && !crmAllowed) {
      return <Navigate to={defaultPath(mainRole || crmRole, user)} replace />
    }
  }

  return children
}
