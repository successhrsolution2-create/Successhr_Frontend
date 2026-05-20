import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoadingScreen from '../../components/LoadingScreen'

const defaultPath = (role) => (role === 'superAdmin' ? '/candidate/admin/dashboard' : '/ba/dashboard')

export default function ProtectedRoute({ roles, children }) {
  const { token, user, checking } = useSelector((state) => state.auth)

  if (checking) {
    return <LoadingScreen />
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to={defaultPath(user?.role)} replace />
  }

  return children
}
