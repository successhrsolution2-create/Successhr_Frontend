import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingScreen from '../components/LoadingScreen'
import { fetchMe } from './store/authSlice'

const Login = lazy(() => import('./pages/Login'))
const CandidatesList = lazy(() => import('./pages/admin/Candidates/CandidatesList'))
const CandidateForm = lazy(() => import('./pages/admin/Candidates/CandidateForm'))
const CandidateDetails = lazy(() => import('./pages/admin/Candidates/CandidateDetails'))
const CmsCompaniesList = lazy(() => import('./pages/admin/Candidates/CompaniesList'))
const CmsCompanyForm = lazy(() => import('./pages/admin/Candidates/CompanyForm'))
const AdminCommissionProcessPanel = lazy(() => import('./pages/admin/CommissionProcessPanel'))

function HomeRedirect() {
  const { token, user, checking } = useSelector((state) => state.auth)

  if (checking) return <LoadingScreen />
  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'superAdmin' ? '/candidate/admin/cms/candidates' : '/login'} replace />
}

function AppShell({ role, children }) {
  return <Sidebar role={role}>{children}</Sidebar>
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-sky-700">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600">The page you opened does not exist.</p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Go home
        </a>
      </div>
    </div>
  )
}

export default function App() {
  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth.token)

  useEffect(() => {
    if (token) {
      dispatch(fetchMe())
    }
  }, [dispatch, token])

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/candidate/admin/cms/candidates"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CandidatesList />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/companies"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CmsCompaniesList />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/candidates/new"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CandidateForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/candidates/:id"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CandidateDetails />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/candidates/:id/edit"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CandidateForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/process-panel"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <AdminCommissionProcessPanel />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/companies/new"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CmsCompanyForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/companies/:id/edit"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CmsCompanyForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/candidate/admin/candidates" element={<Navigate to="/candidate/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/candidates/new" element={<Navigate to="/candidate/admin/cms/candidates/new" replace />} />
        <Route path="/candidate/admin/candidates/:id" element={<Navigate to="/candidate/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/companies/new" element={<Navigate to="/candidate/admin/cms/companies/new" replace />} />
        <Route path="/candidate/admin/process" element={<Navigate to="/candidate/admin/process-panel" replace />} />
        <Route path="/candidate/admin/commission-process" element={<Navigate to="/candidate/admin/process-panel" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
