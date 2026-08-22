import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Building2, Eye, EyeOff, Headphones, ShieldCheck } from 'lucide-react'
import { clearAuthError, loginUser } from '../store/authSlice'
import { login as loginCrm } from '../crm/store/authSlice'
import BrandLogo from '../components/BrandLogo'
import companyAdminApi from '../companyAdmin/api'

const schema = z.object({
  email: z.string().trim().min(1, 'Email or employee ID is required'),
  password: z.string().min(1, 'Password is required')
})

const accountTypes = [
  {
    id: 'companyAdmin',
    label: 'Company Admin',
    shortLabel: 'Company',
    eyebrow: 'Company workspace',
    title: 'Company admin login',
    description: 'Use this for company interview, candidate feedback, and vacancy information.',
    fieldLabel: 'Company Admin Email',
    placeholder: 'company.admin@example.com',
    icon: Building2
  }
]

const accountTypeIds = new Set(accountTypes.map((item) => item.id))

const InputIcon = ({ children }) => (
  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
    {children}
  </span>
)

const managerDefaultPath = (user = {}) => {
  const access = Array.isArray(user.managerAccess) ? user.managerAccess : []
  if (access.includes('candidateManagement')) return '/admin/cms/candidates'
  if (access.includes('crmManagement')) return '/admin/crm/dashboard'
  if (access.includes('employeeManagement')) return '/ems'
  return '/admin/settings'
}

const routeFor = (role, user = {}) => {
  if (role === 'superAdmin') return '/admin/dashboard'
  if (role === 'candidateAdmin') return '/admin/cms/candidates'
  if (role === 'manager') return managerDefaultPath(user)
  if (role === 'crm_super_admin') return '/admin/crm/dashboard'
  if (role === 'crm_employee') return '/admin/crm/employee/candidates'
  return '/ba/dashboard'
}

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [accountType, setAccountType] = useState('companyAdmin')
  const [companyAdminLoading, setCompanyAdminLoading] = useState(false)
  const { token, user, checking, loading } = useSelector((state) => state.auth)
  const {
    accessToken: crmAccessToken,
    role: crmRole,
    status: crmStatus
  } = useSelector((state) => state.crmAuth)
  const isLoggingIn = loading || crmStatus === 'loading' || companyAdminLoading
  const isManagerLogin = location.pathname.startsWith('/manager/login')
  const selectedAccount = accountTypes.find((item) => item.id === accountType) || accountTypes[0]
  const isManagerSuccessLogin = isManagerLogin && accountType === 'success'
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  useEffect(() => {


    if (!checking && token && user) {
      navigate(routeFor(user.role, user), { replace: true })
      return
    }

    if (!checking && crmAccessToken && crmRole) {
      navigate(routeFor(crmRole), { replace: true })
    }
  }, [checking, crmAccessToken, crmRole, token, user, navigate, location])

  useEffect(() => {
    dispatch(clearAuthError())
  }, [dispatch])

  const onSubmit = async (values) => {
    setLoginError('')
    dispatch(clearAuthError())

    if (accountType === 'companyAdmin') {
      setCompanyAdminLoading(true)
      try {
        await companyAdminApi.post('/auth/login', {
          email: values.email,
          password: values.password
        })
        navigate('/company-admin/dashboard', { replace: true })
      } catch (error) {
        setLoginError(error.response?.data?.message || 'Company admin login failed')
      } finally {
        setCompanyAdminLoading(false)
      }
      return
    }

    if (accountType === 'crm') {
      const crmResult = await dispatch(loginCrm(values))

      if (loginCrm.fulfilled.match(crmResult)) {
        dispatch(clearAuthError())
        navigate(routeFor(crmResult.payload.user?.role), { replace: true })
        return
      }

      setLoginError(crmResult.payload || 'Invalid CRM login details')
      return
    }

    const result = await dispatch(loginUser(values))

    if (loginUser.fulfilled.match(result)) {
      dispatch(clearAuthError())
      navigate(routeFor(result.payload.user.role, result.payload.user), { replace: true })
      return
    }

    setLoginError(result.payload || 'Invalid email or password')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      {/* Dynamic Light Background Elements */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] animate-pulse rounded-full bg-indigo-300/40 mix-blend-multiply blur-[100px]" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] animate-pulse rounded-full bg-cyan-300/40 mix-blend-multiply blur-[120px]" style={{ animationDuration: '10s' }} />
        <div className="absolute right-[20%] top-[20%] h-[300px] w-[300px] animate-pulse rounded-full bg-emerald-200/40 mix-blend-multiply blur-[80px]" style={{ animationDuration: '12s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl shadow-indigo-900/10">
        {/* Login Form */}
        <div className="relative flex flex-col justify-center p-8 sm:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-sm space-y-6">
            <div className="flex justify-center mb-6 mt-2">
              <img 
                src="/success-logo.jpg" 
                alt="Success HR Solutions" 
                style={{ height: '44px', width: 'auto', objectFit: 'contain' }} 
              />
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Please enter your credentials to access your portal
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  {isManagerSuccessLogin ? 'Manager ID / Email' : selectedAccount.fieldLabel}
                </label>
                <div className="group relative">
                  <InputIcon>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-600" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 7.5v9a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 16.5v-9A2.25 2.25 0 0 1 4.5 5.25h15A2.25 2.25 0 0 1 21.75 7.5Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
                    </svg>
                  </InputIcon>
                  <input
                    type="text"
                    {...register('email')}
                    className="block w-full rounded-xl border-0 bg-white/50 py-3.5 pl-11 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200/60 backdrop-blur-sm transition-all hover:bg-white focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder={selectedAccount.placeholder}
                    autoComplete="username"
                  />
                </div>
                {errors.email && <span className="block text-xs font-medium text-rose-500">{errors.email.message}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="group relative">
                  <InputIcon>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-600" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.875a4.125 4.125 0 1 0-8.25 0V10.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 10.5h10.5A1.875 1.875 0 0 1 19.125 12.375v6.375A1.875 1.875 0 0 1 17.25 20.625H6.75A1.875 1.875 0 0 1 4.875 18.75v-6.375A1.875 1.875 0 0 1 6.75 10.5Z" />
                    </svg>
                  </InputIcon>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="hide-password-toggle block w-full rounded-xl border-0 bg-white/50 py-3.5 pl-11 pr-12 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200/60 backdrop-blur-sm transition-all hover:bg-white focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition-colors hover:text-indigo-600 focus:outline-none"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <span className="block text-xs font-medium text-rose-500">{errors.password.message}</span>}
              </div>
            </div>

            {loginError && (
              <div className="rounded-xl border border-rose-200/50 bg-rose-50/50 p-4 backdrop-blur-sm">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-rose-500" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-rose-800">Login Failed</h3>
                    <div className="mt-1 text-sm text-rose-600">{loginError}</div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in to workspace'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
