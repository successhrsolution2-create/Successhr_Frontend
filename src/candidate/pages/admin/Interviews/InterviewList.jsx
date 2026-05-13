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
        String(row?.remark || '').trim() ||
        String(row?.date || row?.interviewDate || '').trim()
    )
    const status = row?.status || row?.result || 'Pending'
    return hasContent || status !== 'Pending'
  })

const interviewStatus = (row) => row?.status || row?.result || 'Pending'

const aggregateSelectionStatus = (interviews) => {
  const statuses = (Array.isArray(interviews) ? interviews : []).map(interviewStatus)
  if (!statuses.length) return '-'
  if (statuses.includes('Selected')) return 'Selected'
  if (statuses.every((status) => status === 'Rejected')) return 'Rejected'
  if (statuses.includes('On Hold')) return 'On Hold'
  return 'In Process'
}

const selectionStatusTone = {
  Selected: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  'On Hold': 'bg-slate-50 text-slate-700 ring-slate-200',
  'In Process': 'bg-amber-50 text-amber-700 ring-amber-200',
  '-': 'bg-slate-50 text-slate-500 ring-slate-200'
}

function SelectionStatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${selectionStatusTone[status] || selectionStatusTone['In Process']}`}>
      {status}
    </span>
  )
}

const toInterviewCandidate = (candidate, interviewsRaw = []) => {
  const interviews = visibleInterviews(interviewsRaw)
  const interviewDates = interviews
    .map((row) => String(row?.date || row?.interviewDate || '').slice(0, 10))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
  const latestJobRole = interviews.find((row) => String(row?.jobRole || '').trim())?.jobRole || ''

  return {
    id: candidate._id,
    code: fallbackCode(candidate),
    fullName: candidate.fullName || '',
    mobile: candidate.mobileNumber || '',
    email: candidate.emailId || '',
    jobRole: latestJobRole || candidate.appliedFor || candidate.currentDesignation || '',
    referenceSource:
      candidate.referenceName ||
      candidate.advisor?.name ||
      (candidate.intakeType === 'advisor' ? 'Advisor' : candidate.intakeType === 'walkin' ? 'Walk-in' : 'Walk-in'),
    count: Number(candidate.interviewCount || interviews.length || 0),
    selectionStatus: aggregateSelectionStatus(interviews),
    interviewDates,
    createdAt: candidate.createdAt,
    registeredDate: dateKey(candidate.createdAt)
  }
}

export default function InterviewList() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
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
        const fields = [candidate.code, candidate.id, candidate.fullName, candidate.mobile, candidate.email, candidate.jobRole, candidate.referenceSource, candidate.selectionStatus]
        return fields.some((value) => String(value || '').toLowerCase().includes(query))
      })
      .filter((candidate) => {
        if (!dateFilter) return true
        return candidate.registeredDate === dateFilter
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

      const headers = ['ID', 'Registered At', 'Name', 'Mobile', 'Email', 'Job Role', 'Reference', 'Interview Count', 'Selection Status', 'Interview Dates']
      const dataRows = items.filter(withinRange).map((item) => [
        item.code,
        item.createdAt ? String(item.createdAt).slice(0, 10) : '',
        item.fullName,
        item.mobile,
        item.email,
        item.jobRole,
        item.referenceSource,
        item.count,
        item.selectionStatus,
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-full bg-indigo-50 p-2 text-indigo-600"><Users className="h-4 w-4" /></div>
          <p className="text-xs text-slate-500">Total Candidates</p><p className="text-2xl font-bold text-slate-900 sm:text-3xl">{stats.totalCandidates}</p>
          <p className="mt-1 text-xs text-emerald-600">↑ 12.5% from last month</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-full bg-sky-50 p-2 text-sky-600"><CalendarDays className="h-4 w-4" /></div>
          <p className="text-xs text-slate-500">Total Interviews</p><p className="text-2xl font-bold text-slate-900 sm:text-3xl">{stats.totalInterviews}</p>
          <p className="mt-1 text-xs text-emerald-600">↑ 8.4% from last month</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-full bg-emerald-50 p-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div>
          <p className="text-xs text-slate-500">Completed Interviews</p><p className="text-2xl font-bold text-slate-900 sm:text-3xl">{stats.completedInterviews}</p>
          <p className="mt-1 text-xs text-emerald-600">↑ 15.7% from last month</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-full bg-amber-50 p-2 text-amber-600"><Clock3 className="h-4 w-4" /></div>
          <p className="text-xs text-slate-500">Today&apos;s Interviews</p><p className="text-2xl font-bold text-slate-900 sm:text-3xl">{stats.todaysInterviews}</p>
          <p className="mt-1 text-xs font-medium text-indigo-600">View today&apos;s schedule</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,180px)_1fr_auto_auto]">
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            aria-label="Filter registered candidates by date"
          />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by id, name, mobile, email..."
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
          <table className="min-w-[1140px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Job Role</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Selection Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.map((candidate) => (
                <tr key={candidate.id} className="odd:bg-white even:bg-slate-50 hover:bg-indigo-50/40">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{candidate.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${avatarPalette[candidate.fullName.length % avatarPalette.length]}`}>
                        {(candidate.fullName || 'C').charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{candidate.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-800">{candidate.mobile}</td>
                  <td className="px-4 py-3 text-slate-800">{candidate.jobRole || '-'}</td>
                  <td className="px-4 py-3 text-slate-800">{candidate.referenceSource || 'Walk-in'}</td>
                  <td className="px-4 py-3 text-slate-800">
                    <SelectionStatusBadge status={candidate.selectionStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/interviews/${candidate.id}`)}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-600 hover:bg-violet-100"
                        aria-label="View interviews"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${candidate.id}/edit?panel=interviews`)}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[#1890d8] px-3 text-xs font-semibold text-white hover:bg-[#0f82c8]"
                        aria-label="Update interviews"
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
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
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
