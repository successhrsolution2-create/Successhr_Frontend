import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  ArrowDown,
  BriefcaseBusiness,
  Building2,
  PhoneCall,
  UserCheck
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getSuperAdminDashboardSummary } from '../../api/superAdminDashboardApi'
import CandidateRegistrationChart from './CandidateRegistrationChart'
import CandidateDistributionPieChart from './CandidateDistributionPieChart'

const COLORS = {
  advisor: '#2563eb',
  crm: '#7c3aed',
  employee: '#10b981',
  warning: '#e98d3b',
  danger: '#e33a3a',
  ink: '#111111'
}

const emptySummary = {
  advisorStats: {
    totalAdvisors: 0,
    activeCompanies: 0,
    totalEarnings: 0,
    earningsLastSixMonths: [],
    topAdvisors: []
  },
  crmStats: {
    totalCandidates: 0,
    successEmployees: 0,
    callsToday: 0,
    pipeline: []
  },
  employeeStats: {
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeave: 0,
    openPositions: 0,
    pendingLeaves: 0,
    weeklyAttendance: [],
    todayCheckins: [],
    birthdays: [],
    anniversaries: []
  },
  candidateManagementStats: {
    totalCandidates: 0,
    todayCandidates: 0,
    latestCandidates: [],
    recentCandidateLogs: []
  },
  pendingActions: [],
  recentActivity: []
}

const numberFormatter = new Intl.NumberFormat('en-IN')
const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
})

const formatNumber = (value) => numberFormatter.format(Number(value || 0))
const formatMoney = (value) => moneyFormatter.format(Number(value || 0))
const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : '-'

const colorAlpha = (hex, opacity) => {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function Card({ children, className = '' }) {
  return (
    <section className={`rounded-[7px] border border-[#e7e9ee] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)] ${className}`}>
      {children}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-[142px] animate-pulse rounded-[7px] border border-[#e7e9ee] bg-white" />
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[112px] animate-pulse rounded-[7px] border border-[#e7e9ee] bg-white" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.54fr)]">
        <div className="h-[254px] animate-pulse rounded-[7px] border border-[#e7e9ee] bg-white" />
        <div className="h-[254px] animate-pulse rounded-[7px] bg-[#111111]" />
      </div>
    </div>
  )
}

function ModuleCard({ code, title, subtitle, color, route, stats }) {
  return (
    <Link
      to={route}
      className="group block min-h-[148px] rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sm font-black"
            style={{ color, backgroundColor: colorAlpha(color, 0.1) }}
          >
            {code}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold leading-tight text-slate-900">{title}</h2>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
              <p className="mt-1.5 truncate text-2xl font-black leading-none text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}

function QuickActionTiles() {
  const actions = [
    {
      number: '01',
      title: 'Register Business Advisor',
      description: 'Onboard new administrative partner',
      label: 'Business Advisor',
      to: '/admin/business-advisors?action=create',
      icon: BriefcaseBusiness,
      color: COLORS.advisor,
      tint: '#eef4ff'
    },
    {
      number: '02',
      title: 'Add Candidate',
      description: 'Create new talent profile',
      label: 'Candidate',
      to: '/admin/cms/candidates/add',
      icon: UserCheck,
      color: '#525866',
      tint: '#f4f5f7'
    },
    {
      number: '03',
      title: 'Add CRM Admin',
      description: 'Configure system permissions',
      label: 'CRM',
      to: '/ems/employees/add?role=crm_employee',
      icon: PhoneCall,
      color: '#525866',
      tint: '#f4f5f7'
    },
    {
      number: '04',
      title: 'Add Company',
      description: 'Register corporate client',
      label: 'Company',
      to: '/admin/company-management?action=create',
      icon: Building2,
      color: COLORS.employee,
      tint: '#eafbf3'
    }
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((item) => (
        <Link
          key={item.title}
          to={item.to}
          className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
              style={{ color: item.color, backgroundColor: colorAlpha(item.color, 0.1) }}
            >
              <item.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600">{item.title}</h2>
              <p className="truncate text-xs font-medium text-slate-500">{item.label}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function PanelHeader({ title, action }) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-3">
      <h2 className="truncate text-xs font-black uppercase tracking-wider text-slate-500">{title}</h2>
      {action}
    </div>
  )
}

function RecentActivityLogs({ logs }) {
  const visibleLogs = Array.isArray(logs) ? logs.slice(0, 8) : []

  const moduleColors = {
    employee: COLORS.employee,
    crm: COLORS.crm,
    advisor: COLORS.advisor,
    company_admin: '#8b5cf6'
  }

  const moduleLabels = {
    employee: 'Employee',
    crm: 'CRM',
    advisor: 'Advisor',
    company_admin: 'Company'
  }

  return (
    <div className="space-y-3">
      <PanelHeader title="Recent Activity Logs" />
      <Card className={`${visibleLogs.length ? 'p-0' : 'border-dashed p-0'} overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm`}>
        {visibleLogs.length ? (
          <div className="divide-y divide-slate-100">
            {visibleLogs.map((log, i) => {
              const color = moduleColors[log.module] || COLORS.ink
              return (
                <div key={i} className="flex items-center gap-3.5 px-5 py-4 transition hover:bg-slate-50">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                    style={{ color, backgroundColor: colorAlpha(color, 0.1) }}
                  >
                    <Activity className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 leading-snug">{log.text}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ color, backgroundColor: colorAlpha(color, 0.12) }}
                      >
                        {moduleLabels[log.module] || 'System'}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{log.time}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm font-semibold text-slate-500">No recent activity</div>
        )}
      </Card>
    </div>
  )
}

const candidateLogColors = {
  cms: '#f97316',
  business_advisor: COLORS.advisor,
  candidate_apply: COLORS.employee,
  candidate_apply_ba: '#0ea5e9'
}

function RecentCandidateLogs({ logs }) {
  const visibleLogs = Array.isArray(logs) ? logs.slice(0, 8) : []

  return (
    <div className="space-y-3">
      <PanelHeader
        title="Recent Candidate Added Logs"
        action={
          <Link to="/admin/cms/candidates" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
            View All
          </Link>
        }
      />
      <Card className={`${visibleLogs.length ? 'p-0' : 'border-dashed p-0'} overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm`}>
        {visibleLogs.length ? (
          <div className="divide-y divide-slate-100">
            {visibleLogs.map((log) => {
              const color = candidateLogColors[log.sourceType] || COLORS.ink
              return (
                <Link
                  key={log.id || `${log.candidateId}-${log.createdAt}`}
                  to={log.route || '/admin/cms/candidates'}
                  className="grid gap-3 px-5 py-3.5 transition hover:bg-slate-50 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_auto]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                      style={{ color, backgroundColor: colorAlpha(color, 0.1) }}
                    >
                      <Activity className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{log.candidateName || 'Unnamed candidate'}</p>
                      <p className="truncate text-xs font-medium text-slate-500">
                        {[log.candidateCode, log.mobileNumber, log.emailId].filter(Boolean).join(' / ') || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 md:self-center">
                    <span
                      className="inline-flex rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
                      style={{ color, backgroundColor: colorAlpha(color, 0.12) }}
                    >
                      {log.sourceLabel || 'Candidate'}
                    </span>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                      Added by {log.addedBy || '-'}
                    </p>
                  </div>

                  <div className="min-w-0 md:text-right">
                    <p className="truncate text-xs font-bold text-slate-900">{log.time || '-'}</p>
                    <p className="mt-1 truncate text-xs font-medium text-slate-400">{formatDateTime(log.createdAt)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center px-5 py-8 text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                <Activity className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-bold text-slate-700">No candidate logs yet</p>
              <p className="mt-1 text-xs font-medium text-slate-400">New candidate additions will appear here</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}


function TopAdvisors({ advisors }) {
  const maxEarnings = Math.max(...advisors.map((advisor) => Number(advisor.earnings || 0)), 1)

  return (
    <div className="space-y-3">
      <PanelHeader
        title="Top Success Advisors"
        action={
          <Link to="/admin/business-advisors" className="text-[10px] font-black text-[#111111] underline-offset-2 hover:underline">
            View All
          </Link>
        }
      />
      <Card className="p-5">
        {advisors.length ? (
          <div className="grid gap-4 lg:grid-cols-5">
            {advisors.slice(0, 5).map((advisor, index) => (
              <div key={`${advisor.name}-${index}`} className="min-w-0 rounded-[7px] border border-[#eceef2] bg-[#fafbfc] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[5px] bg-white text-xs font-black text-[#2563eb] shadow-sm">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#111111]">{advisor.name}</p>
                    <p className="mt-0.5 truncate text-xs font-bold text-[#717780]">{formatMoney(advisor.earnings)}</p>
                  </div>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-[#e8ebf0]">
                  <div
                    className="h-1.5 rounded-full bg-[#2563eb]"
                    style={{ width: `${Math.max(6, (Number(advisor.earnings || 0) / maxEarnings) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-[7px] border border-dashed border-[#dfe3ea] bg-[#fafbfc] px-4 py-10 text-center text-sm font-bold text-[#717780]">No advisor data yet</p>
        )}
      </Card>
    </div>
  )
}

function EmployeeSnapshot({ stats }) {
  const attendanceTotal = Math.max(Number(stats.totalEmployees || 0), 1)
  const attendancePercent = Math.min(100, Math.round((Number(stats.presentToday || 0) / attendanceTotal) * 100))

  return (
    <div className="space-y-3">
      <PanelHeader
        title="Live Snapshot"
        action={
          <Link to="/ems/leaves/pending" className="text-[10px] font-black uppercase tracking-normal text-[#2563eb] hover:underline">
            Real-time
          </Link>
        }
      />
      <section className="min-h-[256px] rounded-[7px] bg-[#111111] p-5 text-white shadow-[0_10px_26px_rgba(17,24,39,0.18)]">
        <div className="flex items-center gap-5">
          <div
            className="grid h-[94px] w-[94px] shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(#2563eb ${attendancePercent * 3.6}deg, #2e3034 0deg)` }}
          >
            <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[#111111] text-2xl font-black text-white">{attendancePercent}%</div>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">Attendance Today</p>
            <p className="mt-2 truncate text-[11px] font-semibold text-[#c6c9cf]">
              {formatNumber(stats.presentToday)} present / {formatNumber(stats.totalEmployees)} total employees
            </p>
            <p className="mt-2 text-[11px] font-black text-[#60a5fa]">
              {formatNumber(stats.pendingLeaves)} pending leave requests
            </p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3">
          <MiniMetric dark label="Absent" value={formatNumber(stats.absentToday)} />
          <MiniMetric dark label="On Leave" value={formatNumber(stats.onLeave)} />
          <MiniMetric dark label="Open" value={formatNumber(stats.openPositions)} />
        </div>
      </section>
    </div>
  )
}

function MiniMetric({ label, value, dark = false }) {
  return (
    <div className={`${dark ? 'border-white/12 bg-white/[0.04] text-white' : 'border-[#eceef2] bg-white text-[#111111]'} rounded-[7px] border px-3 py-3 text-center`}>
      <p className={`${dark ? 'text-[#aeb3bd]' : 'text-[#8c929a]'} truncate text-[10px] font-black uppercase tracking-normal`}>{label}</p>
      <p className="mt-1 truncate text-xl font-black leading-none">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getSuperAdminDashboardSummary()
      setSummary({
        ...emptySummary,
        ...data,
        advisorStats: { ...emptySummary.advisorStats, ...(data.advisorStats || {}) },
        crmStats: { ...emptySummary.crmStats, ...(data.crmStats || {}) },
        employeeStats: { ...emptySummary.employeeStats, ...(data.employeeStats || {}) },
        candidateManagementStats: { ...emptySummary.candidateManagementStats, ...(data.candidateManagementStats || {}) },
        pendingActions: data.pendingActions || [],
        recentActivity: data.recentActivity || []
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load dashboard summary')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const { advisorStats, crmStats, employeeStats, candidateManagementStats } = summary

  const moduleCards = useMemo(() => [
    {
      code: 'SA',
      title: 'Success Advisor',
      subtitle: 'Operational units',
      color: COLORS.advisor,
      route: '/admin/business-advisors',
      stats: [
        { label: 'Advisors', value: formatNumber(advisorStats.totalAdvisors) },
        { label: 'Companies', value: formatNumber(advisorStats.activeCompanies) }
      ]
    },
    {
      code: 'CR',
      title: 'Telecalling CRM',
      subtitle: 'Lead performance',
      color: COLORS.crm,
      route: '/admin/crm/dashboard',
      stats: [
        { label: 'Candidates', value: formatNumber(crmStats.totalCandidates) },
        { label: 'Calls Today', value: formatNumber(crmStats.callsToday) }
      ]
    },
    {
      code: 'CM',
      title: 'Candidate Management',
      subtitle: 'Registrations',
      color: '#f97316', // using orange color for Candidate Management
      route: '/admin/cms/candidates',
      stats: [
        { label: 'Total Candidates', value: formatNumber(candidateManagementStats?.totalCandidates) },
        { label: 'Today', value: formatNumber(candidateManagementStats?.todayCandidates) }
      ]
    },
    {
      code: 'SE',
      title: 'Success Employee',
      subtitle: 'Workforce management',
      color: COLORS.employee,
      route: '/ems',
      stats: [
        { label: 'Total Employees', value: formatNumber(employeeStats?.totalEmployees) },
        { label: 'Present Today', value: formatNumber(employeeStats?.presentToday) }
      ]
    }
  ], [advisorStats, crmStats, candidateManagementStats, employeeStats])

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-white">
      <div className="space-y-7">
        {error ? (
          <div className="flex items-center gap-2 rounded-[7px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {moduleCards.map((card) => <ModuleCard key={card.title} {...card} />)}
            </div>

            {/* Charts Row: Bar Chart & Pie Chart */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
              <div className="h-full min-h-[360px]">
                <CandidateRegistrationChart />
              </div>
              <div className="h-full min-h-[360px]">
                <CandidateDistributionPieChart />
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="space-y-3">
              <PanelHeader title="Quick Actions" />
              <QuickActionTiles />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <RecentCandidateLogs logs={summary.candidateManagementStats?.recentCandidateLogs || []} />
              <RecentActivityLogs logs={summary.recentActivity || []} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
