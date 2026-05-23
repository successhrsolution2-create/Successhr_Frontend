import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Activity,
  AlertCircle,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  IndianRupee,
  PhoneCall,
  RefreshCw,
  UserCheck,
  Users
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { getSuperAdminDashboardSummary } from '../../api/superAdminDashboardApi'

const COLORS = {
  advisor: '#6366F1',
  crm: '#0EA5E9',
  employee: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444'
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
  pendingActions: [],
  recentActivity: []
}

const pipelineStages = ['New Lead', 'Contacted', 'In Progress', 'Success', 'Not Interested']
const numberFormatter = new Intl.NumberFormat('en-IN')
const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
})

const formatNumber = (value) => numberFormatter.format(Number(value || 0))
const formatMoney = (value) => moneyFormatter.format(Number(value || 0))
const hasChartData = (rows, keys) => rows.some((row) => keys.some((key) => Number(row[key] || 0) > 0))

const moduleMeta = {
  advisor: { label: 'Advisor', color: COLORS.advisor, className: 'bg-indigo-50 text-indigo-700 ring-indigo-100' },
  crm: { label: 'CRM', color: COLORS.crm, className: 'bg-sky-50 text-sky-700 ring-sky-100' },
  employee: { label: 'Employee', color: COLORS.employee, className: 'bg-emerald-50 text-emerald-700 ring-emerald-100' }
}

const pendingActionLabels = {
  leave_approval: { label: 'Leave Approvals', action: 'Review', color: COLORS.warning },
  advisor_candidates: { label: 'New Success Advisor Candidates', action: 'Review', color: COLORS.advisor },
  crm_followups: { label: 'CRM Follow-ups', action: 'Review', color: COLORS.crm },
  payroll_pending: { label: 'Payroll Not Generated', action: 'Generate', color: COLORS.employee }
}

function Card({ children, className = '' }) {
  return <section className={`rounded-xl border border-[#E5E7EB] bg-white shadow-sm ${className}`}>{children}</section>
}

function Badge({ children, className = '' }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>{children}</span>
}

function Button({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm ${className}`} />
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
      <div>
        <BarChart3 className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm font-semibold text-slate-500">{message}</p>
      </div>
    </div>
  )
}

function SectionHeader({ title, to, action = 'View All' }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {to ? <Link to={to} className="text-xs font-semibold text-slate-500 hover:text-slate-900">{action}</Link> : null}
    </div>
  )
}

function QuickAccessCard({ title, icon: Icon, color, route, stats }) {
  return (
    <Link
      to={route}
      className="group block rounded-xl border border-[#E5E7EB] border-l-4 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50" style={{ color }}>
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="truncate text-base font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {stats.map((item) => (
              <div key={item.label}>
                <p className="text-lg font-bold text-gray-900">{item.value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-slate-500 group-hover:text-slate-900">Open Module -&gt;</span>
      </div>
    </Link>
  )
}

function KpiCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-2 text-xs text-gray-500">{subtext}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50" style={{ color }}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-32" />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <SkeletonBlock className="h-96" />
        <SkeletonBlock className="h-96" />
      </div>
    </div>
  )
}

function ActivityFeed({ items }) {
  return (
    <Card className="p-5">
      <SectionHeader title="Recent Activity" to="/admin/references" />
      <div className="divide-y divide-slate-100">
        {items.slice(0, 8).map((item, index) => {
          const meta = moduleMeta[item.module] || moduleMeta.advisor
          return (
            <div key={`${item.module}-${index}-${item.text}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50" style={{ color: meta.color }}>
                <Activity className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700">{item.text}</p>
                <p className="mt-1 text-xs text-gray-500">{item.time}</p>
              </div>
              <Badge className={meta.className}>{meta.label}</Badge>
            </div>
          )
        })}
        {!items.length ? <p className="py-12 text-center text-sm font-semibold text-slate-500">No recent activity</p> : null}
      </div>
    </Card>
  )
}

function PendingActions({ items, onGo }) {
  const visibleItems = items.filter((item) => Number(item.count || 0) > 0)

  return (
    <Card className="p-5">
      <SectionHeader title="Needs Attention" />
      {visibleItems.length ? (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
          {visibleItems.map((item) => {
            const meta = pendingActionLabels[item.type] || { label: item.type, action: 'Open', color: COLORS.warning }
            return (
              <div key={item.type} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      <p className="truncate text-sm font-semibold text-gray-800">{meta.label}</p>
                    </div>
                    <p className="mt-1 pl-4 text-xs text-gray-500">{formatNumber(item.count)} pending</p>
                  </div>
                  <Button onClick={() => onGo(item.route)}>{meta.action} -&gt;</Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
          <div>
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-2 text-sm font-semibold text-slate-600">All caught up! Nothing needs attention.</p>
          </div>
        </div>
      )}
    </Card>
  )
}

function ChartLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />Present</span>
      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />Absent</span>
      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />Late</span>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(emptySummary)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const { data } = await getSuperAdminDashboardSummary()
      setSummary({
        ...emptySummary,
        ...data,
        advisorStats: { ...emptySummary.advisorStats, ...(data.advisorStats || {}) },
        crmStats: { ...emptySummary.crmStats, ...(data.crmStats || {}) },
        employeeStats: { ...emptySummary.employeeStats, ...(data.employeeStats || {}) },
        pendingActions: data.pendingActions || [],
        recentActivity: data.recentActivity || []
      })
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load dashboard summary')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const { advisorStats, crmStats, employeeStats } = summary
  const pipeline = useMemo(() => {
    const map = new Map((crmStats.pipeline || []).map((item) => [item.stage, item.count]))
    return pipelineStages.map((stage) => ({ stage, count: map.get(stage) || 0 }))
  }, [crmStats.pipeline])
  const maxAdvisorEarnings = Math.max(...advisorStats.topAdvisors.map((advisor) => Number(advisor.earnings || 0)), 1)
  const attendanceTotal = Math.max(Number(employeeStats.totalEmployees || 0), 1)
  const attendancePercent = Math.min(100, Math.round((Number(employeeStats.presentToday || 0) / attendanceTotal) * 100))
  const updatedText = lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }).replace('less than a minute ago', 'just now') : 'just now'

  const quickAccessCards = [
    {
      title: 'Success Advisor',
      icon: BriefcaseBusiness,
      color: COLORS.advisor,
      route: '/admin/references',
      stats: [
        { label: 'Total Success Advisors', value: formatNumber(advisorStats.totalAdvisors) },
        { label: 'Active Companies', value: formatNumber(advisorStats.activeCompanies) },
        { label: 'Total Earnings', value: formatMoney(advisorStats.totalEarnings) }
      ]
    },
    {
      title: 'Telecalling CRM',
      icon: PhoneCall,
      color: COLORS.crm,
      route: '/admin/crm/employees',
      stats: [
        { label: 'CRM Candidates', value: formatNumber(crmStats.totalCandidates) },
        { label: 'Success Employees', value: formatNumber(crmStats.successEmployees) },
        { label: 'Calls Today', value: formatNumber(crmStats.callsToday) }
      ]
    },
    {
      title: 'Employee Management',
      icon: Users,
      color: COLORS.employee,
      route: '/ems',
      stats: [
        { label: 'Total Employees', value: formatNumber(employeeStats.totalEmployees) },
        { label: 'Present Today', value: formatNumber(employeeStats.presentToday) },
        { label: 'Pending Leaves', value: formatNumber(employeeStats.pendingLeaves) }
      ]
    }
  ]

  const kpis = [
    { label: 'Total Success Advisors', value: formatNumber(advisorStats.totalAdvisors), subtext: '+3 this month', icon: Users, color: COLORS.advisor },
    { label: 'Success Advisor Companies', value: formatNumber(advisorStats.activeCompanies), subtext: `${formatNumber(advisorStats.activeCompanies)} active`, icon: Building2, color: COLORS.advisor },
    { label: 'Total CRM Candidates', value: formatNumber(crmStats.totalCandidates), subtext: '+12 this week', icon: UserCheck, color: COLORS.crm },
    { label: 'Total Employees', value: formatNumber(employeeStats.totalEmployees), subtext: `${formatNumber(employeeStats.onLeave)} on leave`, icon: Users, color: COLORS.employee },
    {
      label: 'Present Today',
      value: `${formatNumber(employeeStats.presentToday)} / ${formatNumber(employeeStats.totalEmployees)}`,
      subtext: `${formatNumber(employeeStats.absentToday)} absent`,
      icon: Clock3,
      color: COLORS.employee
    },
    { label: 'Open Positions', value: formatNumber(employeeStats.openPositions), subtext: '+2 this month', icon: BriefcaseBusiness, color: COLORS.employee }
  ]

  return (
    <div className="-m-3 min-h-[calc(100vh-4rem)] bg-[#F4F6F9] p-3 sm:-m-5 sm:p-5 lg:-m-6 lg:p-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">{format(new Date(), 'EEEE, dd MMM yyyy')}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-500">Last updated: {updatedText}</p>
            <Button onClick={() => loadDashboard({ silent: true })} disabled={refreshing} className="h-10 w-10 px-0" aria-label="Refresh dashboard">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              {quickAccessCards.map((card) => <QuickAccessCard key={card.title} {...card} />)}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
            </div>

            <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
              <ActivityFeed items={summary.recentActivity} />
              <PendingActions items={summary.pendingActions} onGo={(route) => navigate(route)} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="p-5">
                <SectionHeader title="Advisor Earnings - Last 6 Months" />
                {hasChartData(advisorStats.earningsLastSixMonths, ['amount']) ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={advisorStats.earningsLastSixMonths}>
                        <defs>
                          <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.advisor} stopOpacity={0.28} />
                            <stop offset="95%" stopColor={COLORS.advisor} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                        <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ borderRadius: 12, borderColor: '#E5E7EB' }} />
                        <Area type="monotone" dataKey="amount" stroke={COLORS.advisor} strokeWidth={3} fill="url(#earningsFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No data yet" />
                )}
              </Card>

              <Card className="p-5">
                <SectionHeader title="Attendance Overview - This Week" />
                {hasChartData(employeeStats.weeklyAttendance, ['present', 'absent', 'late']) ? (
                  <>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={employeeStats.weeklyAttendance} barGap={5}>
                          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#E5E7EB' }} />
                          <Bar dataKey="present" name="Present" fill={COLORS.employee} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="absent" name="Absent" fill={COLORS.danger} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="late" name="Late" fill={COLORS.warning} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <ChartLegend />
                  </>
                ) : (
                  <EmptyState message="No data yet" />
                )}
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="p-5">
                <SectionHeader title="Top Success Advisors" to="/admin/business-advisors" />
                {advisorStats.topAdvisors.length ? (
                  <div className="space-y-4">
                    {advisorStats.topAdvisors.slice(0, 5).map((advisor, index) => (
                      <div key={`${advisor.name}-${index}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-700">{index + 1}</span>
                            <p className="truncate text-sm font-semibold text-gray-800">{advisor.name}</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{formatMoney(advisor.earnings)}</p>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.max(6, (Number(advisor.earnings || 0) / maxAdvisorEarnings) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm font-semibold text-slate-500">No advisor data yet</p>
                )}
              </Card>

              <Card className="p-5">
                <SectionHeader title="CRM Pipeline" />
                <div className="space-y-3">
                  {pipeline.map((item, index) => (
                    <div key={item.stage} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                      <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-700">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: [COLORS.crm, COLORS.advisor, COLORS.warning, COLORS.employee, COLORS.danger][index] }} />
                        <span className="truncate">{item.stage}</span>
                      </span>
                      <span className="text-sm font-bold text-gray-900">{formatNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeader title="Today" to="/ems/leaves/pending" action="Leaves" />
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `conic-gradient(${COLORS.employee} ${attendancePercent * 3.6}deg, #E5E7EB 0deg)` }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-900">{attendancePercent}%</div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Attendance</p>
                    <p className="mt-1 text-xs text-gray-500">{formatNumber(employeeStats.presentToday)} present / {formatNumber(employeeStats.totalEmployees)} total</p>
                    <p className="mt-1 text-xs text-gray-500">{formatNumber(employeeStats.pendingLeaves)} pending leaves</p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recent Check-ins</p>
                    <div className="mt-2 space-y-2">
                      {employeeStats.todayCheckins.length ? employeeStats.todayCheckins.slice(0, 3).map((item) => (
                        <div key={`${item.name}-${item.time}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <span className="font-semibold text-gray-700">{item.name}</span>
                          <span className="text-xs font-semibold text-gray-500">{item.time}</span>
                        </div>
                      )) : <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500">No check-ins yet today</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Birthdays</p>
                    <p className="mt-2 text-sm text-gray-700">{employeeStats.birthdays.length ? employeeStats.birthdays.join(', ') : 'No birthdays today'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Work Anniversaries</p>
                    <p className="mt-2 text-sm text-gray-700">{employeeStats.anniversaries.length ? employeeStats.anniversaries.join(', ') : 'No anniversaries today'}</p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
