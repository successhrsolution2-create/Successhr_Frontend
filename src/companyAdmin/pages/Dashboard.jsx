import { useEffect, useState } from 'react'
import { BriefcaseBusiness, Building2, CalendarClock, CheckCircle2, ClipboardList, Plus } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import companyAdminApi from '../api'

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
  const vacancy = dashboard?.latestVacancy
  const cards = [
    { label: 'Company', value: companyAdmin.companyName, icon: Building2 },
    { label: 'Candidate Forms', value: dashboard?.submissionCount || 0, icon: ClipboardList },
    { label: 'Vacancies', value: dashboard?.vacancyCount || 0, icon: BriefcaseBusiness },
    { label: 'Latest Candidate', value: info?.candidateInterview?.candidateName || 'Not added', icon: CheckCircle2 },
    { label: 'Latest Vacancy', value: vacancy?.jobProfile || 'Not added', icon: CalendarClock }
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-sky-700">Overview</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Welcome, {companyAdmin.name}</h2>
          <p className="mt-1 text-sm text-slate-500">Review your company submission status and keep interview details current.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/company-admin/interview-info?action=create"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-700 hover:bg-sky-100"
          >
            <Plus className="h-4 w-4" />
            New Candidate Form
          </Link>
          <Link
            to="/company-admin/vacancies?action=create"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Add Vacancy
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Candidate Interview Information</h3>
          <p className="mt-1 text-sm text-slate-500">
            {dashboard?.hasInterviewInfo
              ? 'Your candidate-wise forms are available to the Success HR super admin.'
              : 'No candidate interview form has been submitted yet. Complete the form to share candidate details.'}
          </p>
          <Link to="/company-admin/interview-info" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-700 hover:bg-sky-100">
            Candidate Forms
          </Link>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Manpower Vacancy Information</h3>
          <p className="mt-1 text-sm text-slate-500">
            {dashboard?.hasVacancies
              ? 'Your manpower vacancies are submitted separately for Success HR review.'
              : 'No vacancy has been submitted yet. Add a vacancy to share open requirements.'}
          </p>
          <Link to="/company-admin/vacancies?action=create" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700">
            Add Vacancy
          </Link>
        </section>
      </div>
    </div>
  )
}
