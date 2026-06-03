import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo'
import companyAdminApi from '../api'

export default function CompanyAdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    companyAdminApi
      .get('/auth/me')
      .then(() => navigate('/company-admin/dashboard', { replace: true }))
      .catch(() => {})
  }, [navigate])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await companyAdminApi.post('/auth/login', { email, password })
      navigate('/company-admin/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="brand-page-bg relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-6 sm:px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-300/35 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-2xl shadow-sky-900/10 backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-slate-200 bg-white/70 px-5 py-7 sm:px-9 lg:border-b-0 lg:border-r">
          <BrandLogo className="max-w-sm" />
          <p className="mt-8 text-sm font-bold uppercase tracking-wide text-sky-700">Company workspace</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Company Admin Login</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in to submit and maintain your company interview requirements securely.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5 px-5 py-7 sm:px-9 sm:py-10">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Use the login details provided by Success HR.</p>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-cyan-100"
              placeholder="company.admin@example.com"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-12 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-cyan-100"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-sky-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="brand-button flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-lg shadow-sky-700/20 disabled:opacity-70"
          >
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
