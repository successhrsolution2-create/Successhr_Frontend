import { useEffect, useState } from 'react'
import { Building2, CalendarClock, CheckCircle2, ClipboardList } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import companyAdminApi from '../api'

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not provided')

export default function CompanyAdminDashboard() {
  const { companyAdmin } = useOutletContext()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    companyAdminApi
      .get('/dashboard')
      .then(({ data }) => setDashboard(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm font-semibold text-slate-500">Loading dashboard...</p>

  const info = dashboard?.interviewInfo
  const cards = [
    { label: 'Company', value: companyAdmin.companyName, icon: Building2 },
    { label: 'Interview Info', value: dashboard?.hasInterviewInfo ? 'Submitted' : 'Pending', icon: ClipboardList },
    { label: 'Job Profile', value: info?.jobRequirements?.jobProfile || 'Not added', icon: CheckCircle2 },
    { label: 'Last Updated', value: formatDate(info?.updatedAt), icon: CalendarClock }
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-sky-700">Overview</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Welcome, {companyAdmin.name}</h2>
          <p className="mt-1 text-sm text-slate-500">Review your company submission status and keep interview details current.</p>
        </div>
        <Link
          to="/company-admin/interview-info"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
        >
          {dashboard?.hasInterviewInfo ? 'Update Interview Info' : 'Add Interview Info'}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <card.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-slate-400">{card.label}</p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">{card.value}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Company Interview Information</h3>
        <p className="mt-1 text-sm text-slate-500">
          {dashboard?.hasInterviewInfo
            ? 'Your information is available to the Success HR super admin. Update it whenever requirements change.'
            : 'No interview information has been submitted yet. Complete the form to share your requirements.'}
        </p>
      </section>
    </div>
  )
}
