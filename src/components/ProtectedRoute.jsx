import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoadingScreen from './LoadingScreen'

const defaultPath = (role) => {
  if (role === 'superAdmin') return '/admin/dashboard'
  if (role === 'candidateAdmin') return '/admin/cms/candidates'
  return '/ba/dashboard'
}

export default function ProtectedRoute({ roles, children, loginPath = '/login' }) {
  const { token, user, checking } = useSelector((state) => state.auth)

  if (checking) {
    return <LoadingScreen />
  }

  if (!token || !user) {
    return <Navigate to={loginPath} replace />
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to={defaultPath(user?.role)} replace />
  }

  return children
}
