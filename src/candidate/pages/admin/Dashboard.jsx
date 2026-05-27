import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CalendarDays, CheckCircle2, ClipboardList, RefreshCw, UserCheck, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Skeleton from '../../components/Skeleton'

const emptyStats = {
  total: 0,
  newToday: 0,
  selected: 0,
  activeInterviews: 0
}

const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const initials = (name = '') =>
  String(name || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'C'

function StatCard({ label, value, detail, icon: Icon, tone }) {
  return (
    <div className="rounded-[7px] border border-[#eeeeee] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-[#717780]">{label}</p>
          <p className="mt-3 text-3xl font-bold leading-none text-black">{value}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[7px] ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 truncate text-xs font-medium text-[#717780]">{detail}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState({
    candidates: [],
    stats: emptyStats,
    totalCandidates: 0,
    totalCompanies: 0
  })

  const loadDashboard = useCallback(async (quiet = false) => {
    if (quiet) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [candidateRes, companyRes] = await Promise.all([
        api.get('/cms/candidates', {
          params: {
            paginated: 'true',
            page: 1,
            pageSize: 6
          }
        }),
        api.get('/cms/companies').catch(() => ({ data: [] }))
      ])

      const candidateData = candidateRes.data || {}
      const candidates = Array.isArray(candidateData.items) ? candidateData.items : Array.isArray(candidateData) ? candidateData : []
      const companies = Array.isArray(companyRes.data) ? companyRes.data : []

      setSummary({
        candidates,
        stats: candidateData.stats || emptyStats,
        totalCandidates: Number(candidateData.total ?? candidates.length),
        totalCompanies: companies.length
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load candidate dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const stats = useMemo(
    () => [
      {
        label: 'Total Candidates',
        value: formatNumber(summary.totalCandidates || summary.stats.total),
        detail: 'All candidate records',
        icon: Users,
        tone: 'bg-blue-50 text-blue-700'
      },
      {
        label: 'New Today',
        value: formatNumber(summary.stats.newToday),
        detail: 'Fresh registrations today',
        icon: CalendarDays,
        tone: 'bg-cyan-50 text-cyan-700'
      },
      {
        label: 'Selected',
        value: formatNumber(summary.stats.selected),
        detail: 'Marked as selected',
        icon: CheckCircle2,
        tone: 'bg-emerald-50 text-emerald-700'
      },
      {
        label: 'Active Interviews',
        value: formatNumber(summary.stats.activeInterviews),
        detail: `${formatNumber(summary.totalCompanies)} company records`,
        icon: ClipboardList,
        tone: 'bg-violet-50 text-violet-700'
      }
    ],
    [summary]
  )

  if (loading) return <Skeleton rows={8} />

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[7px] border border-[#eeeeee] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#eeeeee] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1377ef]">Candidate Management</p>
            <h1 className="mt-1 text-2xl font-bold text-black">Candidate dashboard</h1>
            <p className="mt-1 text-sm text-[#717780]">Track candidate records, selections, and interview activity.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[5px] border border-[#eeeeee] bg-white px-4 text-sm font-semibold text-[#4d5560] transition hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              to="/admin/cms/candidates/add"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[5px] bg-[#1377ef] px-4 text-sm font-semibold text-white transition hover:bg-[#0d68d4]"
            >
              Add Candidate
            </Link>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <section className="overflow-hidden rounded-[7px] border border-[#eeeeee] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#eeeeee] px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-black">Recent Candidates</h2>
              <p className="mt-0.5 text-xs text-[#717780]">Latest records from candidate management.</p>
            </div>
            <Link to="/admin/cms/candidates" className="text-sm font-semibold text-[#1377ef] hover:text-[#0d68d4]">
              View all
            </Link>
          </div>

          <div className="divide-y divide-[#eeeeee]">
            {summary.candidates.map((candidate) => (
              <button
                key={candidate._id}
                type="button"
                onClick={() => navigate(`/admin/cms/candidates/${candidate._id}`)}
                className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-[#f7f8fa] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eef6ff] text-sm font-bold text-[#1377ef]">
                    {initials(candidate.fullName)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-black">{candidate.fullName || 'Candidate'}</span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-[#717780]">
                      {candidate.candidateCode || 'No ID'} | {candidate.mobileNumber || 'No mobile'}
                    </span>
                  </span>
                </div>
                <span className="shrink-0 text-xs font-semibold text-[#717780]">{formatDate(candidate.createdAt)}</span>
              </button>
            ))}

            {summary.candidates.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <UserCheck className="mx-auto h-9 w-9 text-[#a0a7b1]" />
                <p className="mt-3 text-sm font-semibold text-[#4d5560]">No candidate records yet.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[7px] border border-[#eeeeee] bg-white p-5">
          <h2 className="text-lg font-bold text-black">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            <Link
              to="/admin/cms/candidates"
              className="flex items-center justify-between rounded-[7px] border border-[#eeeeee] px-4 py-3 text-sm font-semibold text-black transition hover:border-[#d7dde6] hover:bg-[#f7f8fa]"
            >
              Candidate List
              <span className="text-[#1377ef]">Open</span>
            </Link>
            <Link
              to="/admin/cms/interviews"
              className="flex items-center justify-between rounded-[7px] border border-[#eeeeee] px-4 py-3 text-sm font-semibold text-black transition hover:border-[#d7dde6] hover:bg-[#f7f8fa]"
            >
              Interviews
              <span className="text-[#1377ef]">Open</span>
            </Link>
            <Link
              to="/admin/cms/companies"
              className="flex items-center justify-between rounded-[7px] border border-[#eeeeee] px-4 py-3 text-sm font-semibold text-black transition hover:border-[#d7dde6] hover:bg-[#f7f8fa]"
            >
              Companies
              <span className="text-[#1377ef]">Open</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
