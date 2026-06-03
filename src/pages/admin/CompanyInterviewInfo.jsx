import { useEffect, useMemo, useState } from 'react'
import { Eye, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')
const display = (value) => (Array.isArray(value) ? value.join(', ') || '-' : value || '-')

export default function CompanyInterviewInfo() {
  const [records, setRecords] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    api
      .get('/company-management/interview-info')
      .then(({ data }) => setRecords(data.interviewInfo || []))
      .catch((error) => toast.error(error.response?.data?.message || 'Could not load company interview information'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records

    return records.filter((record) => {
      const job = record.jobRequirements || {}
      const values = [
        record.companyName,
        record.contactPersonName,
        record.mobileNo,
        record.emailId,
        record.companyAdminId?.name,
        record.companyAdminId?.email,
        job.jobProfile,
        job.jobLocation
      ]
      return values.some((value) => String(value || '').toLowerCase().includes(term))
    })
  }, [records, search])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  if (loading) return <Skeleton rows={8} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Company Interview Info</h1>
        <p className="mt-1 text-sm text-slate-500">Review interview requirements submitted through company-admin logins.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, contact, job profile..."
            className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-[13px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Company Admin</th>
                <th className="px-4 py-2.5">Contact Person</th>
                <th className="px-4 py-2.5">Job Profile</th>
                <th className="px-4 py-2.5">Vacancies</th>
                <th className="px-4 py-2.5">Updated</th>
                <th className="px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((record) => (
                <tr key={record._id} className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40">
                  <td className="px-4 py-2 font-semibold text-slate-900">{record.companyName}</td>
                  <td className="px-4 py-2 text-slate-600">{record.companyAdminId?.name || '-'}</td>
                  <td className="px-4 py-2 text-slate-600">{record.contactPersonName || '-'}</td>
                  <td className="px-4 py-2 text-slate-600">{record.jobRequirements?.jobProfile || '-'}</td>
                  <td className="px-4 py-2 text-slate-600">{record.jobRequirements?.numberOfVacancy ?? '-'}</td>
                  <td className="px-4 py-2 text-slate-600">{formatDate(record.updatedAt)}</td>
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => setSelected(record)} className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-sky-200 bg-white px-2.5 text-xs font-semibold text-sky-700 hover:bg-sky-50">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-500">No company interview information submitted yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={filtered.length} itemLabel="company submissions" onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

      {selected ? <InfoModal record={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  )
}

function InfoModal({ record, onClose }) {
  const job = record.jobRequirements || {}
  const about = record.aboutCompany || {}
  const interview = about.availabilityForInterview || {}

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-2 py-3 sm:px-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{record.companyName}</h2>
            <p className="mt-1 text-sm text-slate-500">Submitted by {record.companyAdminId?.name || 'Company Admin'} on {formatDate(record.updatedAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <InfoSection title="Company Details" items={[
            ['Company Name', record.companyName],
            ['Company Address', record.companyAddress],
            ['Contact Person', record.contactPersonName],
            ['Designation', record.contactPersonDesignation],
            ['Mobile No', record.mobileNo],
            ['Email Id', record.emailId]
          ]} />
          <InfoSection title="Job Requirements" items={[
            ['Job Profile', job.jobProfile],
            ['Education', job.education],
            ['Experience', job.experience],
            ['Salary Range', job.salaryRange],
            ['Number of Vacancy', job.numberOfVacancy],
            ['Job Time', job.jobTime],
            ['Shift', job.shift],
            ['Job Location', job.jobLocation],
            ['Age Criteria', job.ageCriteria],
            ['Caste Criteria', job.castCriteria],
            ['Required Key Skills', job.requiredKeySkills],
            ['Roles & Responsibility', job.rolesAndResponsibility],
            ['Gender', job.gender],
            ['Marriage Criteria', job.marriageCriteria],
            ['Facilities', job.facilities]
          ]} />
          <InfoSection title="About Company" items={[
            ['Manpower', about.manpower],
            ['Turnover', about.turnover],
            ['Plant', about.plant],
            ['Interview Date', formatDate(interview.date)],
            ['Interview Time', interview.time],
            ['Interview Mode', about.interviewMode],
            ['Weekly Off', about.weeklyOff]
          ]} />
        </div>
      </div>
    </div>
  )
}

function InfoSection({ title, items }) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-bold uppercase text-slate-500">{title}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-800">{display(value)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
