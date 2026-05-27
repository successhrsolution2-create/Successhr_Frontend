import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingScreen from './components/LoadingScreen'
import { fetchMe } from './store/authSlice'

const Login = lazy(() => import('./pages/Login'))
const SuperAdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const BusinessAdvisors = lazy(() => import('./pages/admin/BusinessAdvisors'))
const AdminReferenceBoard = lazy(() => import('./pages/admin/ReferenceBoard'))
const AdminStudents = lazy(() => import('./pages/admin/Students'))
const AdminCompanies = lazy(() => import('./pages/admin/Companies'))
const AdminCommissionPanel = lazy(() => import('./pages/admin/CommissionPanel'))
const CrmRoutes = lazy(() => import('./crm/CrmRoutes'))
const CrmAdminDashboard = lazy(() => import('./pages/admin/Crm/AdminDashboard'))
const CrmAdminReports = lazy(() => import('./pages/admin/Crm/AdminReports'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const BADashboard = lazy(() => import('./pages/ba/Dashboard'))
const BAProfile = lazy(() => import('./pages/ba/Profile'))
const StudentForm = lazy(() => import('./pages/ba/StudentForm'))
const CompanyForm = lazy(() => import('./pages/ba/CompanyForm'))
const BAStudents = lazy(() => import('./pages/ba/Students'))
const BACompanies = lazy(() => import('./pages/ba/Companies'))
const BAEarnings = lazy(() => import('./pages/ba/Earnings'))

const InterviewList = lazy(() => import('./pages/admin/Interviews/InterviewList'))
const ApplyPage = lazy(() => import('./pages/public/ApplyPage'))
const CmsDashboard = lazy(() => import('./candidate/pages/admin/Dashboard'))
const CmsCandidatesList = lazy(() => import('./candidate/pages/admin/Candidates/CandidatesList'))
const CmsAddCandidate = lazy(() => import('./candidate/pages/admin/Candidates/AddCandidate'))
const CmsCandidateDetail = lazy(() => import('./candidate/pages/admin/Candidates/CandidateDetail'))
const CmsCompaniesList = lazy(() => import('./candidate/pages/admin/Candidates/CompaniesList'))
const CmsCompanyForm = lazy(() => import('./candidate/pages/admin/Candidates/CompanyForm'))
const CmsProcessPanel = lazy(() => import('./candidate/pages/admin/CommissionProcessPanel'))
const CmsInterviewList = lazy(() => import('./candidate/pages/admin/Interviews/InterviewList'))
const CmsInterviewDetails = lazy(() => import('./candidate/pages/admin/Interviews/InterviewDetails'))
const EMSDashboard = lazy(() => import('./modules/ems/pages/EMSDashboard'))
const EMSEmployeeList = lazy(() => import('./modules/ems/pages/employees/EmployeeList'))
const EMSEmployeeAdd = lazy(() => import('./modules/ems/pages/employees/EmployeeAdd'))
const EMSEmployeeEdit = lazy(() => import('./modules/ems/pages/employees/EmployeeEdit'))
const EMSEmployeeProfile = lazy(() => import('./modules/ems/pages/employees/EmployeeProfile'))
const EMSDepartmentList = lazy(() => import('./modules/ems/pages/departments/DepartmentList'))
const EMSLocationList = lazy(() => import('./modules/ems/pages/locations/LocationList'))
const EMSScheduleList = lazy(() => import('./modules/ems/pages/schedules/ScheduleList'))
const EMSAttendanceToday = lazy(() => import('./modules/ems/pages/attendance/AttendanceToday'))
const EMSAttendanceReport = lazy(() => import('./modules/ems/pages/attendance/AttendanceReport'))
const EMSLeaveList = lazy(() => import('./modules/ems/pages/leaves/LeaveList'))
const EMSLeaveApply = lazy(() => import('./modules/ems/pages/leaves/LeaveApply'))
const EMSLeavePending = lazy(() => import('./modules/ems/pages/leaves/LeavePending'))
const EMSPayrollList = lazy(() => import('./modules/ems/pages/payroll/PayrollList'))
const EMSPayrollGenerate = lazy(() => import('./modules/ems/pages/payroll/PayrollGenerate'))
const EMSPayslipView = lazy(() => import('./modules/ems/pages/payroll/PayslipView'))
const EMSDocumentManager = lazy(() => import('./modules/ems/pages/documents/DocumentManager'))
const EMSReportsPage = lazy(() => import('./modules/ems/pages/reports/ReportsPage'))

const cmsRoles = ['superAdmin', 'candidateAdmin', 'manager']
const crmAdminRoles = ['superAdmin', 'crm_super_admin', 'manager']
const employeeManagementRoles = ['superAdmin', 'manager']
const adminSettingsRoles = ['superAdmin', 'candidateAdmin', 'manager']

const managerDefaultPath = (user = {}) => {
  const access = Array.isArray(user.managerAccess) ? user.managerAccess : []
  if (access.includes('candidateManagement')) return '/admin/cms/candidates'
  if (access.includes('crmManagement')) return '/admin/crm/dashboard'
  if (access.includes('employeeManagement')) return '/ems'
  return '/admin/settings'
}

const crmDefaultPath = (role) => {
  if (role === 'crm_super_admin') return '/admin/crm/dashboard'
  if (role === 'crm_employee') return '/admin/crm/employee/candidates'
  return '/login'
}

function HomeRedirect() {
  const { token, user, checking } = useSelector((state) => state.auth)
  const { accessToken: crmAccessToken, role: crmRole } = useSelector((state) => state.crmAuth)

  if (checking) return <LoadingScreen />
  if (user?.role === 'superAdmin') return <Navigate to="/admin/dashboard" replace />
  if (user?.role === 'candidateAdmin') return <Navigate to="/admin/cms/candidates" replace />
  if (user?.role === 'manager') return <Navigate to={managerDefaultPath(user)} replace />
  if (token && user) return <Navigate to="/ba/dashboard" replace />
  if (crmAccessToken && crmRole) return <Navigate to={crmDefaultPath(crmRole)} replace />
  return <Navigate to="/login" replace />
}

function AppShell({ role, children, hideTopbar = false }) {
  return <Sidebar role={role} hideTopbar={hideTopbar}>{children}</Sidebar>
}

function SettingsShell() {
  const role = useSelector((state) => state.auth.user?.role)
  const sidebarRole = role === 'candidateAdmin' ? 'candidateAdmin' : role === 'manager' ? 'manager' : 'superAdmin'
  return (
    <AppShell role={sidebarRole}>
      <AdminSettings />
    </AppShell>
  )
}

function CrmAdminShell({ children }) {
  const role = useSelector((state) => state.auth.user?.role)
  return <AppShell role={role === 'superAdmin' ? 'superAdmin' : role === 'manager' ? 'manager' : 'crmAdmin'}>{children}</AppShell>
}

function CandidateManagementShell({ children, hideTopbar = false }) {
  const role = useSelector((state) => state.auth.user?.role)
  return (
    <AppShell role={role === 'superAdmin' ? 'superAdmin' : role === 'manager' ? 'manager' : 'candidateAdmin'} hideTopbar={hideTopbar}>
      {children}
    </AppShell>
  )
}

function EmployeeManagementShell({ children }) {
  const role = useSelector((state) => state.auth.user?.role)
  return <AppShell role={role === 'manager' ? 'manager' : 'superAdmin'}>{children}</AppShell>
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
  const routeFallback = <LoadingScreen />

  useEffect(() => {
    if (token) {
      dispatch(fetchMe())
    }
  }, [dispatch, token])

  if (import.meta.env.VITE_PUBLIC_APPLY_ONLY === 'true') {
    return (
      <Suspense fallback={routeFallback}>
        <Routes>
          <Route path="/" element={<ApplyPage />} />
          <Route path="/:code" element={<ApplyPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/apply/:code" element={<ApplyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={routeFallback}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/manager/login" element={<Login />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/apply/:code" element={<ApplyPage />} />

        <Route
          path="/admin/references"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <AdminReferenceBoard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <SuperAdminDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/business-advisors"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <BusinessAdvisors />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <AdminStudents />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms"
          element={<Navigate to="/admin/cms/dashboard" replace />}
        />
        <Route
          path="/admin/cms/dashboard"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell>
                <CmsDashboard />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/candidates"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell>
                <CmsCandidatesList />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/companies"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell>
                <CmsCompaniesList />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/candidates/new"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell hideTopbar>
                <CmsAddCandidate />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/candidates/add"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell hideTopbar>
                <CmsAddCandidate />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/candidates/:id"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell hideTopbar>
                <CmsCandidateDetail />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/candidates/:id/edit"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell hideTopbar>
                <CmsAddCandidate />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/process-panel"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell>
                <CmsProcessPanel />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/companies/new"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell>
                <CmsCompanyForm />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/companies/:id/edit"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell>
                <CmsCompanyForm />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/interviews"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell>
                <CmsInterviewList />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/interviews/:id"
          element={
            <ProtectedRoute roles={cmsRoles} managerAccess="candidateManagement">
              <CandidateManagementShell>
                <CmsInterviewDetails />
              </CandidateManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/interviews"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <InterviewList />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/commission"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <AdminCommissionPanel />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/crm"
          element={<Navigate to="/admin/crm/dashboard" replace />}
        />
        <Route
          path="/admin/crm/dashboard"
          element={
            <ProtectedRoute roles={crmAdminRoles} managerAccess="crmManagement">
              <CrmAdminShell>
                <CrmAdminDashboard />
              </CrmAdminShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/crm/employees"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <Navigate to="/ems/employees" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/crm/candidates"
          element={
            <ProtectedRoute roles={crmAdminRoles} managerAccess="crmManagement">
              <CrmAdminShell>
                <CrmAdminReports initialView="candidates" />
              </CrmAdminShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/crm/reports"
          element={
            <ProtectedRoute roles={crmAdminRoles} managerAccess="crmManagement">
              <CrmAdminShell>
                <CrmAdminReports initialView="reports" />
              </CrmAdminShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/crm/*"
          element={<CrmRoutes />}
        />
        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <AdminCompanies />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute roles={adminSettingsRoles}>
              <SettingsShell />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ems"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSDashboard />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/employees"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSEmployeeList />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/employees/add"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSEmployeeAdd />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/employees/:id"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSEmployeeProfile />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/employees/:id/edit"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSEmployeeEdit />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/departments"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSDepartmentList />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/locations"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSLocationList />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/schedules"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSScheduleList />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/attendance"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSAttendanceToday />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/attendance/report"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSAttendanceReport />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/leaves"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSLeaveList />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/leaves/apply"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSLeaveApply />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/leaves/pending"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSLeavePending />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/payroll"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSPayrollList />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/payroll/generate"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSPayrollGenerate />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/payroll/:id/payslip"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSPayslipView />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/documents"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSDocumentManager />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ems/reports"
          element={
            <ProtectedRoute roles={employeeManagementRoles} managerAccess="employeeManagement">
              <EmployeeManagementShell>
                <EMSReportsPage />
              </EmployeeManagementShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ba/dashboard"
          element={
            <ProtectedRoute roles={['businessAdvisor']}>
              <AppShell role="businessAdvisor">
                <BADashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/profile"
          element={
            <ProtectedRoute roles={['businessAdvisor']}>
              <AppShell role="businessAdvisor">
                <BAProfile />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/students/new"
          element={
            <ProtectedRoute roles={['businessAdvisor']}>
              <AppShell role="businessAdvisor">
                <StudentForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/companies/new"
          element={
            <ProtectedRoute roles={['businessAdvisor']}>
              <AppShell role="businessAdvisor">
                <CompanyForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/students"
          element={
            <ProtectedRoute roles={['businessAdvisor']}>
              <AppShell role="businessAdvisor">
                <BAStudents />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/companies"
          element={
            <ProtectedRoute roles={['businessAdvisor']}>
              <AppShell role="businessAdvisor">
                <BACompanies />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/earnings"
          element={
            <ProtectedRoute roles={['businessAdvisor']}>
              <AppShell role="businessAdvisor">
                <BAEarnings />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/settings"
          element={
            <ProtectedRoute roles={['businessAdvisor']}>
              <AppShell role="businessAdvisor">
                <AdminSettings />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route path="/ba/student/new" element={<Navigate to="/ba/students/new" replace />} />
        <Route path="/ba/company/new" element={<Navigate to="/ba/companies/new" replace />} />
        <Route path="/ba/my-references" element={<Navigate to="/ba/students" replace />} />
        <Route path="/ba/my-commission" element={<Navigate to="/ba/earnings" replace />} />
        <Route path="/admin/process" element={<Navigate to="/admin/process-panel" replace />} />
        <Route path="/admin/commission-process" element={<Navigate to="/admin/process-panel" replace />} />
        <Route path="/admin/candidates" element={<Navigate to="/admin/references" replace />} />
        <Route path="/admin/candidates/new" element={<Navigate to="/admin/references" replace />} />
        <Route path="/admin/candidates/:id" element={<Navigate to="/admin/references" replace />} />
        <Route path="/admin/companies/new" element={<Navigate to="/admin/cms/companies/new" replace />} />
        <Route path="/candidate" element={<Navigate to="/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/dashboard" element={<Navigate to="/admin/cms/dashboard" replace />} />
        <Route path="/candidate/admin/cms/candidates" element={<Navigate to="/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/cms/companies" element={<Navigate to="/admin/cms/companies" replace />} />
        <Route path="/candidate/admin/process" element={<Navigate to="/admin/process-panel" replace />} />
        <Route path="/candidate/admin/commission-process" element={<Navigate to="/admin/process-panel" replace />} />
        <Route path="/candidate/admin/candidates" element={<Navigate to="/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/candidates/new" element={<Navigate to="/admin/cms/candidates/add" replace />} />
        <Route path="/candidate/admin/candidates/:id" element={<Navigate to="/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/companies/new" element={<Navigate to="/admin/cms/companies/new" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
  
}

