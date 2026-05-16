import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock3, Download, Eye, Filter, Pencil, Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../../api/axios'
import Pagination from '../../../components/Pagination'
import { ExportRangeDialog } from '../../../components/ActionDialogs'

const fallbackCode = (item) => {
  if (item?.candidateCode) return item.candidateCode
  const date = item?.createdAt ? new Date(item.createdAt) : new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const tail = String(item?._id || '').slice(-4).toUpperCase().padStart(4, '0')
  return `C${yy}${mm}${tail}`
}

const dateKey = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const displayDate = (value) => {
  const key = dateKey(value)
  if (!key) return ''
  const [year, month, day] = key.split('-')
  return `${day}-${month}-${year}`
}

const avatarPalette = [
  'bg-violet-100 text-violet-600',
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-fuchsia-100 text-fuchsia-600'
]

const visibleInterviews = (rows) =>
  (Array.isArray(rows) ? rows : []).filter((row) => {
    const hasContent = Boolean(
      String(row?.companyName || '').trim() ||
        String(row?.jobRole || '').trim() ||
        String(row?.referencePerson || row?.reference || '').trim() ||
        String(row?.selectionChances || '').trim() ||
        String(row?.remark || '').trim() ||
        String(row?.date || row?.interviewDate || '').trim()
    )
    const status = row?.status || row?.result || 'Pending'
    return hasContent || status !== 'Pending'
  })

const interviewDateValue = (row) => row?.date || row?.interviewDate || ''

const interviewTimeValue = (row) => {
  const value = interviewDateValue(row) || row?.updatedAt || row?.createdAt || ''
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
}

const educationText = (candidate = {}) => {
  const educationDetails = candidate.applicationDetails?.education || {}
  const parts = [
    candidate.education,
    educationDetails.highestEducation || educationDetails.educationSector,
    educationDetails.yearOfHigherEducation ? `Year: ${educationDetails.yearOfHigherEducation}` : '',
    educationDetails.branch || educationDetails.educationBranch,
    educationDetails.specialization || educationDetails.educationSpecialization
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  return parts.find(Boolean) || ''
}

const selectionChanceTone = {
  Selected: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  High: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  Low: 'bg-rose-50 text-rose-700 ring-rose-200',
  '-': 'bg-slate-50 text-slate-500 ring-slate-200'
}

function SelectionChanceBadge({ value }) {
  const displayValue = value || '-'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${selectionChanceTone[displayValue] || selectionChanceTone['-']}`}>
      {displayValue}
    </span>
  )
}

function StatTile({ icon: Icon, label, value, tone }) {
  const toneClass = {
    indigo: 'bg-indigo-50 text-indigo-600',
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  }[tone]

  return (
    <div className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="text-xl font-bold leading-tight text-slate-950">{value}</p>
      </div>
    </div>
  )
}

const toInterviewCandidate = (candidate, interviewsRaw = []) => {
  const interviews = visibleInterviews(interviewsRaw).sort((a, b) => interviewTimeValue(b) - interviewTimeValue(a))
  const latestInterview = interviews[0] || {}
  const interviewDates = interviews
    .map((row) => String(interviewDateValue(row)).slice(0, 10))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
  const latestJobRole = interviews.find((row) => String(row?.jobRole || '').trim())?.jobRole || ''
  const companyNames = [...new Set(interviews.map((row) => String(row?.companyName || '').trim()).filter(Boolean))]

  return {
    id: candidate._id,
    code: fallbackCode(candidate),
    fullName: candidate.fullName || '',
    mobile: candidate.mobileNumber || '',
    email: candidate.emailId || '',
    education: educationText(candidate),
    jobRole: latestJobRole || candidate.appliedFor || candidate.currentDesignation || '',
    latestCompanyName: latestInterview.companyName || companyNames[0] || '',
    companyNames,
    latestInterviewDate: interviewDateValue(latestInterview),
    referenceSource:
      candidate.referenceName ||
      candidate.advisor?.name ||
      (candidate.intakeType === 'advisor' ? 'Advisor' : candidate.intakeType === 'walkin' ? 'Walk-in' : 'Walk-in'),
    count: Number(candidate.interviewCount || interviews.length || 0),
    selectionChances: latestInterview.selectionChances || '-',
    interviewDates,
    createdAt: candidate.createdAt,
    registeredDate: dateKey(candidate.createdAt)
  }
}

export default function InterviewList() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/cms/candidates')
        const candidates = Array.isArray(data) ? data : []
        const enriched = await Promise.all(
          candidates.map(async (candidate) => {
            if (Array.isArray(candidate.interviews)) {
              return toInterviewCandidate(candidate, candidate.interviews)
            }

            try {
              const { data: interviewsRaw } = await api.get(`/cms/candidates/${candidate._id}/interviews`)
              return toInterviewCandidate(candidate, interviewsRaw)
            } catch (_error) {
              return toInterviewCandidate(candidate, [])
            }
          })
        )
        setItems(enriched)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load interview candidates')
      }
    }
    load()
  }, [])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items
      .filter((candidate) => {
        if (!query) return true
        const fields = [
          candidate.code,
          candidate.id,
          candidate.fullName,
          candidate.mobile,
          candidate.email,
          candidate.education,
          candidate.latestCompanyName,
          (candidate.companyNames || []).join(' '),
          candidate.jobRole,
          candidate.referenceSource,
          candidate.selectionChances
        ]
        return fields.some((value) => String(value || '').toLowerCase().includes(query))
      })
      .filter((candidate) => {
        if (!dateFilter) return true
        return (candidate.interviewDates || []).includes(dateFilter)
      })
  }, [items, search, dateFilter])

  const stats = useMemo(() => {
    const totalCandidates = items.length
    const totalInterviews = items.reduce((sum, item) => sum + (item.count || 0), 0)
    const completedInterviews = items.filter((item) => (item.count || 0) > 0).length
    const today = dateKey(new Date())
    const todaysInterviews = items.reduce((sum, item) => sum + (item.interviewDates || []).filter((d) => d === today).length, 0)
    return { totalCandidates, totalInterviews, completedInterviews, todaysInterviews }
  }, [items])

  useEffect(() => {
    setPage(1)
  }, [search, dateFilter, pageSize])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  const applyFilters = () => {
    setSearch(searchInput)
    setDateFilter(dateInput)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchInput('')
    setDateInput('')
    setSearch('')
    setDateFilter('')
    setPage(1)
  }

  const exportCsv = ({ fromDate = '', toDate = '' } = {}) => {
    try {
      const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
      const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null

      if (!fromDate || !toDate) {
        toast.error('Select From and To dates for export')
        return
      }
      if (from && Number.isNaN(from.getTime())) {
        toast.error('Invalid From date')
        return
      }
      if (to && Number.isNaN(to.getTime())) {
        toast.error('Invalid To date')
        return
      }
      if (from && to && from > to) {
      toast.error('From date must be before To date')
      return
    }

      const withinRange = (item) => {
        if (!from && !to) return true
        const created = item?.createdAt ? new Date(item.createdAt) : null
        if (!created || Number.isNaN(created.getTime())) return false
        if (from && created < from) return false
        if (to && created > to) return false
        return true
      }

      const headers = ['ID', 'Registered At', 'Name', 'Mobile', 'Email', 'Education', 'Latest Company', 'Latest Interview Date', 'Job Role/Department', 'Reference', 'Interview Count', 'Selection Chances', 'Interview Dates']
      const dataRows = items.filter(withinRange).map((item) => [
        item.code,
        item.createdAt ? String(item.createdAt).slice(0, 10) : '',
        item.fullName,
        item.mobile,
        item.email,
        item.education,
        item.latestCompanyName,
        dateKey(item.latestInterviewDate),
        item.jobRole,
        item.referenceSource,
        item.count,
        item.selectionChances,
        (item.interviewDates || []).join(' | ')
      ])
      const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const csv = [headers, ...dataRows].map((row) => row.map(csvCell).join(',')).join('\n')
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const suffix = `-${fromDate}_to_${toDate}`
      link.download = `interviews${suffix}-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
      setExportOpen(false)
      toast.success('CSV exported')
    } catch (_error) {
      toast.error('Could not export CSV')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Interviews</h1>
        <p className="mt-1 text-sm text-slate-500">Track and manage candidate interviews</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Users} label="Candidates" value={stats.totalCandidates} tone="indigo" />
        <StatTile icon={CalendarDays} label="Interviews" value={stats.totalInterviews} tone="sky" />
        <StatTile icon={CheckCircle2} label="Completed" value={stats.completedInterviews} tone="emerald" />
        <StatTile icon={Clock3} label="Today" value={stats.todaysInterviews} tone="amber" />
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,180px)_1fr_auto_auto_auto]">
          <input
            type="date"
            value={dateInput}
            onChange={(event) => setDateInput(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            aria-label="Filter by interview date"
          />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyFilters()
              }}
              placeholder="Search by id, name, mobile, email, company, education..."
              className="h-10 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 lg:w-auto"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
          {search || dateFilter ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 lg:w-auto"
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 lg:w-auto"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full table-fixed text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="w-24 px-3 py-3">ID</th>
                <th className="w-44 px-3 py-3">Name</th>
                <th className="w-28 px-3 py-3">Mobile</th>
                <th className="w-36 px-3 py-3">Latest Company</th>
                <th className="w-32 px-3 py-3">Interview Date</th>
                <th className="w-44 px-3 py-3">Job Role/Department</th>
                <th className="w-32 px-3 py-3">Selection Chances</th>
                <th className="w-40 px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.map((candidate) => (
                <tr key={candidate.id} className="odd:bg-white even:bg-slate-50 hover:bg-indigo-50/40">
                  <td className="truncate px-3 py-3 font-mono text-xs font-semibold text-slate-700" title={candidate.code}>{candidate.code}</td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarPalette[candidate.fullName.length % avatarPalette.length]}`}>
                        {(candidate.fullName || 'C').charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-900" title={candidate.fullName}>{candidate.fullName}</span>
                    </div>
                  </td>
                  <td className="truncate px-3 py-3 text-slate-800" title={candidate.mobile}>{candidate.mobile}</td>
                  <td className="px-3 py-3 text-slate-800">
                    <p className="truncate" title={candidate.latestCompanyName || '-'}>{candidate.latestCompanyName || '-'}</p>
                  </td>
                  <td className="truncate px-3 py-3 text-slate-800" title={displayDate(candidate.latestInterviewDate) || '-'}>
                    {displayDate(candidate.latestInterviewDate) || '-'}
                  </td>
                  <td className="px-3 py-3 text-slate-800">
                    <p className="truncate" title={candidate.jobRole || '-'}>{candidate.jobRole || '-'}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-800">
                    <SelectionChanceBadge value={candidate.selectionChances} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/interviews/${candidate.id}`)}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-600 hover:bg-violet-100"
                        aria-label="View interviews"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${candidate.id}/edit?panel=interviews`)}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#1890d8] px-3 text-xs font-semibold text-white hover:bg-[#0f82c8]"
                        aria-label="Update interviews"
                        title="Update"
                      >
                        <Pencil className="h-4 w-4" />
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No interviews found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={rows.length}
          itemLabel="interview candidates"
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
      <ExportRangeDialog
        open={exportOpen}
        title="Export Interviews"
        message="Select candidate registration date range for the interviews export."
        onCancel={() => setExportOpen(false)}
        onConfirm={exportCsv}
      />
    </div>
  )
}
