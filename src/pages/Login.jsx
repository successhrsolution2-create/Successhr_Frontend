import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Building2, Eye, EyeOff, Headphones, ShieldCheck, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    id: 'success',
    label: 'Admin / Advisor',
    shortLabel: 'Admin',
    eyebrow: 'Success HR workspace',
    title: 'Welcome back',
    description: 'Use this for Super Admin, Manager, and Candidate Management accounts.',
    fieldLabel: 'Email or Employee ID',
    placeholder: 'admin@consultancy.com or EMP001',
    icon: ShieldCheck
  },
  {
    id: 'crm',
    label: 'Telecalling CRM',
    shortLabel: 'CRM',
    eyebrow: 'Lead performance workspace',
    title: 'CRM login',
    description: 'Use this for CRM super admin and CRM employee calling accounts.',
    fieldLabel: 'CRM Email or Employee ID',
    placeholder: 'crm@consultancy.com or CRM001',
    icon: Headphones
  }
]

const accountTypeIds = new Set(accountTypes.map((item) => item.id))

const InputIcon = ({ children }) => (
  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
    {children}
  </span>
)

const accountTypeFromLocation = (location) => {
  const search = new URLSearchParams(location.search)
  const requested = search.get('role') || search.get('account')

  if (accountTypeIds.has(requested)) return requested
  if (location.pathname.startsWith('/company-admin')) return 'companyAdmin'
  return 'success'
}

const hasAccountHint = (location) => {
  const search = new URLSearchParams(location.search)
  return search.has('role') || search.has('account') || location.pathname.startsWith('/company-admin')
}

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
  const [accountType, setAccountType] = useState(() => accountTypeFromLocation(location))
  const { token, user, checking, loading } = useSelector((state) => state.auth)
  const {
    accessToken: crmAccessToken,
    role: crmRole,
    status: crmStatus
  } = useSelector((state) => state.crmAuth)
  const isLoggingIn = loading || crmStatus === 'loading'
  const isManagerLogin = location.pathname.startsWith('/manager/login')
  const isAdvisorLogin = location.pathname.startsWith('/advisor')
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
    if (hasAccountHint(location)) return

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
    <div className="flex min-h-screen bg-white">
      {/* Left Panel: Branding / Abstract */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:overflow-hidden lg:bg-slate-900 lg:px-12 lg:py-16">
        {/* Abstract Background Elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative z-10"
        >
          <BrandLogo className="max-w-[240px] brightness-0 invert" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative z-10 max-w-lg"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300 backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            {isManagerSuccessLogin ? 'Manager workspace' : isAdvisorLogin ? 'Business Advisor workspace' : selectedAccount.eyebrow}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:leading-[1.1]">
            {isManagerSuccessLogin ? 'Manager Portal' : isAdvisorLogin ? 'Advisor Portal' : selectedAccount.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-300">
            {isManagerSuccessLogin
              ? 'Use your manager ID and password to access assigned Candidate, CRM, and Success Employee modules.'
              : isAdvisorLogin
                ? 'Use your advisor credentials to log into your dedicated portal and manage your candidates.'
                : selectedAccount.description}
          </p>
        </motion.div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 lg:bg-white">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[440px] space-y-8 rounded-2xl bg-white p-8 shadow-2xl shadow-slate-200/50 lg:shadow-none lg:bg-transparent lg:p-0"
        >
          <div className="lg:hidden mb-8">
            <BrandLogo className="mx-auto max-w-[200px]" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your credentials to securely access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!isAdvisorLogin && (
              <div>
                <label className="text-sm font-semibold text-slate-700">Account Type</label>
                <div className="mt-2 grid grid-cols-2 gap-3" role="tablist">
                  {accountTypes.map((item) => {
                    const Icon = item.icon
                    const selected = item.id === accountType
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => {
                          setAccountType(item.id)
                          setLoginError('')
                        }}
                        className={`relative flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all focus:outline-none ${
                          selected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${selected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {item.shortLabel}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {isManagerSuccessLogin ? 'Manager ID / Email' : isAdvisorLogin ? 'Advisor Email or ID' : selectedAccount.fieldLabel}
                </label>
                <div className="relative mt-2">
                  <InputIcon>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 7.5v9a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 16.5v-9A2.25 2.25 0 0 1 4.5 5.25h15A2.25 2.25 0 0 1 21.75 7.5Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
                    </svg>
                  </InputIcon>
                  <input
                    type="text"
                    {...register('email')}
                    className="block w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 sm:text-sm"
                    placeholder={selectedAccount.placeholder}
                    autoComplete="username"
                  />
                </div>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs font-medium text-red-500">
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative mt-2">
                  <InputIcon>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.875a4.125 4.125 0 1 0-8.25 0V10.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 10.5h10.5A1.875 1.875 0 0 1 19.125 12.375v6.375A1.875 1.875 0 0 1 17.25 20.625H6.75A1.875 1.875 0 0 1 4.875 18.75v-6.375A1.875 1.875 0 0 1 6.75 10.5Z" />
                    </svg>
                  </InputIcon>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="hide-password-toggle block w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 sm:text-sm"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-indigo-600 focus:outline-none"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs font-medium text-red-500">
                    {errors.password.message}
                  </motion.p>
                )}
              </div>
            </div>

            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-red-50 p-4"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ShieldCheck className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Authentication Failed</h3>
                      <div className="mt-1 text-sm text-red-700">
                        {loginError}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-4 focus:ring-indigo-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoggingIn ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
