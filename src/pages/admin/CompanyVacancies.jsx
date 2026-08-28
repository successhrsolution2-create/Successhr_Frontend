import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Skeleton from '../../components/Skeleton'

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')

export default function CompanyVacancies() {
  const [vacancies, setVacancies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true

    api.get('/company-management/vacancies')
      .then((response) => {
        if (!active) return
        setVacancies(response.data.vacancies || [])
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || 'Could not load manpower vacancies')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredVacancies = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return vacancies

    return vacancies.filter((vacancy) => {
      const values = [
        vacancy.companyName,
        vacancy.companyAdminId?.name,
        vacancy.companyAdminId?.email,
        vacancy.jobProfile,
        vacancy.department,
        vacancy.education,
        vacancy.experience,
        vacancy.salaryRange,
        vacancy.jobLocation
      ]
      return values.some((value) => String(value || '').toLowerCase().includes(term))
    })
  }, [vacancies, search])

  if (loading) return <Skeleton rows={8} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Manpower Vacancies</h1>
        <p className="mt-1 text-sm text-slate-500">Vacancies submitted through the company admin Add Vacancy page.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, profile, location..."
            className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
          />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {filteredVacancies.map((vacancy) => (
          <article key={vacancy._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-950">{vacancy.jobProfile || 'Untitled Vacancy'}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{vacancy.companyName || '-'} <span className="mx-1 text-slate-300">|</span> {vacancy.companyAdminId?.name || '-'}</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                  Vacancy: {vacancy.numberOfVacancy ?? '-'}
                </span>
                <p className="mt-1.5 text-xs font-medium text-slate-500">Updated: {formatDate(vacancy.updatedAt)}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Department</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{vacancy.department || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Location</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{vacancy.jobLocation || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Salary Range</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{vacancy.salaryRange || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Experience</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{vacancy.experience || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Education</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{vacancy.education || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Job Time</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{vacancy.jobTime || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Shift</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{vacancy.shift || '-'}</p>
              </div>
            </div>

            {(vacancy.requiredKeySkills && vacancy.requiredKeySkills.length > 0) || vacancy.rolesAndResponsibility ? (
              <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                {vacancy.requiredKeySkills && vacancy.requiredKeySkills.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-slate-500">Key Skills</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {vacancy.requiredKeySkills.map((skill, idx) => (
                        <span key={idx} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {vacancy.rolesAndResponsibility ? (
                  <div>
                    <p className="text-xs font-medium text-slate-500">Roles & Responsibilities</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{vacancy.rolesAndResponsibility}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
        {!filteredVacancies.length ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">No manpower vacancies found.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
