import { useEffect, useMemo, useState } from 'react'
import { Eye, FileText, Save, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const API_ROOT = import.meta.env.VITE_API_URL || `http://${defaultHost}:5000`
const feedbackOptions = ['Yes', 'No', 'Pending']

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')
const formatDateTime = (value) => (value ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')
const display = (value) => (Array.isArray(value) ? value.join(', ') || '-' : value ?? '-')
const money = (value) => (value === undefined || value === null || value === '' ? '-' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0)))
const fileHref = (file) => {
  const url = file?.fileUrl
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `${API_ROOT}${url}`
}

export default function CompanyInterviewInfo() {
  const [records, setRecords] = useState([])
  const [vacancies, setVacancies] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    let active = true

    Promise.all([
      api.get('/company-management/interview-info'),
      api.get('/company-management/vacancies')
    ])
      .then(([interviewResult, vacancyResult]) => {
        if (!active) return
        setRecords(interviewResult.data.interviewInfo || [])
        setVacancies(vacancyResult.data.vacancies || [])
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || 'Could not load candidate interview information')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records

    return records.filter((record) => {
      const candidate = record.candidateInterview || {}
      const vacancy = record.manpowerVacancy || {}
      const values = [
        record.companyName,
        record.companyAdminId?.name,
        record.companyAdminId?.email,
        candidate.candidateName,
        candidate.department,
        candidate.feedbackFromCompany,
        candidate.feedbackFromPlacement,
        candidate.interviewStatus,
        vacancy.jobProfile,
        vacancy.jobLocation
      ]
      return values.some((value) => String(value || '').toLowerCase().includes(term))
    })
  }, [records, search])

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

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const updateRecord = (record) => {
    setRecords((current) => current.map((item) => (item._id === record._id ? record : item)))
    setSelected(record)
  }

  if (loading) return <Skeleton rows={8} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Company Submissions</h1>
        <p className="mt-1 text-sm text-slate-500">Review candidate interview forms and separate manpower vacancies submitted by company admins.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search company, candidate, vacancy, status..."
            className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-bold text-slate-950">Candidate Interview Forms</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-[13px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Candidate</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Interview</th>
                <th className="px-4 py-2.5">Company Feedback</th>
                <th className="px-4 py-2.5">Placement Feedback</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((record) => {
                const candidate = record.candidateInterview || {}
                return (
                  <tr key={record._id} className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40">
                    <td className="px-4 py-2">
                      <p className="font-semibold text-slate-900">{record.companyName}</p>
                      <p className="text-xs text-slate-500">{record.companyAdminId?.name || '-'}</p>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{candidate.candidateName || '-'}</td>
                    <td className="px-4 py-2 text-slate-600">{candidate.department || '-'}</td>
                    <td className="px-4 py-2 text-slate-600">{formatDateTime(candidate.interviewDateTime)}</td>
                    <td className="px-4 py-2"><StatusBadge value={candidate.feedbackFromCompany || 'Pending'} /></td>
                    <td className="px-4 py-2"><StatusBadge value={candidate.feedbackFromPlacement || 'Pending'} blue /></td>
                    <td className="px-4 py-2"><StatusBadge value={candidate.interviewStatus || 'Pending'} neutral /></td>
                    <td className="px-4 py-2">
                      <button type="button" onClick={() => setSelected(record)} className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-sky-200 bg-white px-2.5 text-xs font-semibold text-sky-700 hover:bg-sky-50">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500">No candidate interview forms submitted yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          itemLabel="candidate forms"
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPage(1)
            setPageSize(value)
          }}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-bold text-slate-950">Manpower Vacancy Information</h2>
          <p className="mt-1 text-sm text-slate-500">Vacancies submitted through the company admin Add Vacancy page.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredVacancies.map((vacancy) => (
            <article key={vacancy._id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_1fr_1fr]">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{vacancy.jobProfile || 'Untitled Vacancy'}</p>
                <p className="mt-1 text-xs text-slate-500">{vacancy.companyName || '-'} | {vacancy.companyAdminId?.name || '-'}</p>
              </div>
              <div className="min-w-0 text-sm text-slate-600">
                <p className="truncate font-semibold">{vacancy.department || '-'}</p>
                <p className="truncate text-xs text-slate-500">Vacancy: {vacancy.numberOfVacancy ?? '-'} | {vacancy.jobLocation || '-'}</p>
              </div>
              <div className="min-w-0 text-sm text-slate-600">
                <p className="truncate font-semibold">{vacancy.salaryRange || '-'}</p>
                <p className="truncate text-xs text-slate-500">Updated: {formatDate(vacancy.updatedAt)}</p>
              </div>
            </article>
          ))}
          {!filteredVacancies.length ? (
            <p className="px-4 py-10 text-center text-sm font-semibold text-slate-500">No manpower vacancies submitted yet.</p>
          ) : null}
        </div>
      </section>

      {selected ? <InfoModal record={selected} onClose={() => setSelected(null)} onUpdate={updateRecord} /> : null}
    </div>
  )
}

function InfoModal({ record, onClose, onUpdate }) {
  const candidate = record.candidateInterview || {}
  const offer = candidate.offerDetails || {}
  const vacancy = record.manpowerVacancy || {}
  const [feedback, setFeedback] = useState(candidate.feedbackFromPlacement || 'Pending')
  const [saving, setSaving] = useState(false)

  const saveFeedback = async () => {
    setSaving(true)
    try {
      const { data } = await api.put(`/company-management/interview-info/${record._id}/placement-feedback`, {
        feedbackFromPlacement: feedback
      })
      onUpdate(data.interviewInfo)
      toast.success('Placement feedback updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update placement feedback')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-2 py-3 sm:px-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{candidate.candidateName || 'Candidate Form'}</h2>
            <p className="mt-1 text-sm text-slate-500">{record.companyName} | Submitted by {record.companyAdminId?.name || 'Company Admin'} on {formatDate(record.updatedAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <section className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block text-sm font-semibold text-slate-700">
                Feedback From Placement
                <select
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100 sm:w-64"
                >
                  {feedbackOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <button
                type="button"
                onClick={saveFeedback}
                disabled={saving}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Placement Feedback'}
              </button>
            </div>
          </section>

          <InfoSection title="Candidate Interview Information" items={[
            ['Resume', candidate.resume],
            ['Candidate Name', candidate.candidateName],
            ['Gender', candidate.gender],
            ['Education', candidate.education],
            ['Department', candidate.department],
            ['Interview Date And Time', formatDateTime(candidate.interviewDateTime)],
            ['Attend Interview', candidate.attendedInterview],
            ['Interested For Join', candidate.interestedForJoin],
            ['Reason / Remark', candidate.notInterestedReason],
            ['Feedback From Company', candidate.feedbackFromCompany],
            ['Feedback From Placement', candidate.feedbackFromPlacement],
            ['Interview Status', candidate.interviewStatus]
          ]} />

          {candidate.interviewStatus === 'Selected' ? (
            <InfoSection title="Offer Information" items={[
              ['Net Salary', money(offer.netSalary)],
              ['Gross Salary', money(offer.grossSalary)],
              ['CTC', money(offer.ctc)],
              ['Offer Department', offer.department],
              ['Expected DOJ', formatDate(offer.expectedDoj)],
              ['Offer Letter', offer.offerLetter],
              ['Appointment Letter', offer.appointmentLetter]
            ]} />
          ) : null}

          <InfoSection title="Manpower Vacancy Information" items={[
            ['Job Profile', vacancy.jobProfile],
            ['Department', vacancy.department],
            ['Number Of Vacancy', vacancy.numberOfVacancy],
            ['Education', vacancy.education],
            ['Experience', vacancy.experience],
            ['Salary Range', vacancy.salaryRange],
            ['Job Time', vacancy.jobTime],
            ['Shift', vacancy.shift],
            ['Job Location', vacancy.jobLocation],
            ['Required Key Skills', vacancy.requiredKeySkills],
            ['Roles And Responsibility', vacancy.rolesAndResponsibility],
            ['Facilities', vacancy.facilities],
            ['Weekly Off', vacancy.weeklyOff],
            ['Manpower', vacancy.manpower],
            ['Turnover', vacancy.turnover],
            ['Plant', vacancy.plant]
          ]} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ value, blue = false, neutral = false }) {
  const color = neutral
    ? 'bg-slate-100 text-slate-700'
    : blue
      ? 'bg-sky-50 text-sky-700'
      : value === 'Yes'
        ? 'bg-emerald-50 text-emerald-700'
        : value === 'No'
          ? 'bg-rose-50 text-rose-700'
          : 'bg-amber-50 text-amber-700'

  return <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${color}`}>{value}</span>
}

function InfoSection({ title, items }) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-bold uppercase text-slate-500">{title}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
            <div className="mt-1 break-words text-sm font-semibold text-slate-800">
              {value?.fileUrl ? <FileLink file={value} /> : display(value)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FileLink({ file }) {
  return (
    <a href={fileHref(file)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sky-700 hover:underline">
      <FileText className="h-3.5 w-3.5" />
      {file.fileName || 'View file'}
    </a>
  )
}
