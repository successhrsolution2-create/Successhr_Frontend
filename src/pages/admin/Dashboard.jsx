import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  PhoneCall,
  UserCheck
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getSuperAdminDashboardSummary } from '../../api/superAdminDashboardApi'

const COLORS = {
  advisor: '#1377ef',
  crm: '#45a9f6',
  employee: '#19c78a',
  warning: '#e98d3b',
  danger: '#e33a3a'
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

const numberFormatter = new Intl.NumberFormat('en-IN')
const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
})

const formatNumber = (value) => numberFormatter.format(Number(value || 0))
const formatMoney = (value) => moneyFormatter.format(Number(value || 0))

const colorAlpha = (hex, opacity) => {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function Card({ children, className = '' }) {
  return (
    <section className={`rounded-[7px] border border-[#eeeeee] bg-white ${className}`}>
      {children}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-[14px]">
      <div className="grid gap-[14px] lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-[190px] animate-pulse rounded-[7px] border border-[#eeeeee] bg-white" />
        ))}
      </div>
      <div className="grid gap-[14px] md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[142px] animate-pulse rounded-[7px] border border-[#eeeeee] bg-white" />
        ))}
      </div>
      <div className="grid gap-[14px] xl:grid-cols-2">
        <div className="h-[260px] animate-pulse rounded-[7px] border border-[#eeeeee] bg-white" />
        <div className="h-[260px] animate-pulse rounded-[7px] border border-[#eeeeee] bg-white" />
      </div>
    </div>
  )
}

function ModuleCard({ title, subtitle, icon: Icon, color, route, stats }) {
  return (
    <Link
      to={route}
      className="group block min-h-[174px] rounded-[7px] border border-[#eeeeee] bg-white p-[18px] transition hover:border-[#d7dde6] hover:bg-[#fcfdfe]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[7px]"
            style={{ color, backgroundColor: colorAlpha(color, 0.1) }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-black">{title}</h2>
            <p className="mt-0.5 truncate text-xs font-medium text-[#717780]">{subtitle}</p>
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
          style={{ color, backgroundColor: colorAlpha(color, 0.12) }}
        >
          Open
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-[7px] border border-[#eeeeee]">
        {stats.map((item) => (
          <div key={item.label} className="border-r border-[#eeeeee] px-4 py-3 last:border-r-0">
            <p className="text-2xl font-bold leading-none text-black">{item.value}</p>
            <p className="mt-2 text-xs leading-4 text-[#717780]">{item.label}</p>
          </div>
        ))}
      </div>
    </Link>
  )
}

function QuickActionTiles() {
  const actions = [
    {
      title: 'Register Business Admin',
      label: 'Business Admin',
      to: '/admin/business-advisors?action=create',
      icon: BriefcaseBusiness,
      color: COLORS.advisor
    },
    {
      title: 'Add Candidate',
      label: 'Candidate',
      to: '/admin/cms/candidates/add',
      icon: UserCheck,
      color: COLORS.crm
    },
    {
      title: 'Add CRM Admin',
      label: 'CRM',
      to: '/ems/employees/add?role=crm_employee',
      icon: PhoneCall,
      color: COLORS.advisor
    },
    {
      title: 'Add Company',
      label: 'Company',
      to: '/admin/company-management?action=create',
      icon: Building2,
      color: COLORS.employee
    }
  ]

  return (
    <div className="grid gap-[14px] md:grid-cols-2 xl:grid-cols-4">
      {actions.map((item) => (
        <Link
          key={item.title}
          to={item.to}
          className="group flex min-h-[142px] flex-col justify-between rounded-[7px] border border-[#eeeeee] bg-white p-[18px] transition hover:border-[#d7dde6] hover:bg-[#fcfdfe]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: item.color }}>
                {item.label}
              </p>
              <h2 className="mt-2 text-lg font-bold leading-6 text-black">{item.title}</h2>
            </div>
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-[7px]"
              style={{ color: item.color, backgroundColor: colorAlpha(item.color, 0.1) }}
            >
              <item.icon className="h-5 w-5" />
            </span>
          </div>
          <span
            className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-[5px] text-sm font-semibold text-white transition group-hover:brightness-95"
            style={{ backgroundColor: item.color }}
          >
            {item.title}
          </span>
        </Link>
      ))}
    </div>
  )
}

function PanelHeader({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 items-center gap-2 text-lg font-bold text-black">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#1377ef]" />
        <span className="truncate">{title}</span>
      </h2>
      {action}
    </div>
  )
}

function ActivityFeed({ items }) {
  return (
    <Card className="p-[18px]">
      <PanelHeader
        title="Recent Activity"
        action={
          <Link to="/admin/references" className="rounded-lg border border-[#eeeeee] bg-white px-3 py-1.5 text-xs font-semibold text-[#4d5560] hover:bg-[#f7f8fa]">
            View All
          </Link>
        }
      />
      <div className="divide-y divide-[#eeeeee]">
        {items.slice(0, 6).map((item, index) => (
          <div key={`${item.module}-${index}-${item.text}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eaf3ff] text-[#1377ef]">
              <Activity className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-black">{item.text}</p>
              <p className="mt-0.5 text-xs text-[#8b929c]">{item.time}</p>
            </div>
            <span className="rounded-full bg-[#eaf3ff] px-2.5 py-1 text-[11px] font-bold text-[#1377ef]">
              {(item.module || 'Admin').toUpperCase()}
            </span>
          </div>
        ))}
        {!items.length ? (
          <p className="py-10 text-center text-sm font-semibold text-[#717780]">No recent activity</p>
        ) : null}
      </div>
    </Card>
  )
}

function TopAdvisors({ advisors }) {
  const maxEarnings = Math.max(...advisors.map((advisor) => Number(advisor.earnings || 0)), 1)

  return (
    <Card className="p-[18px]">
      <PanelHeader
        title="Top Success Advisors"
        action={
          <Link to="/admin/business-advisors" className="rounded-lg border border-[#eeeeee] bg-white px-3 py-1.5 text-xs font-semibold text-[#4d5560] hover:bg-[#f7f8fa]">
            View All
          </Link>
        }
      />
      {advisors.length ? (
        <div className="space-y-4">
          {advisors.slice(0, 5).map((advisor, index) => (
            <div key={`${advisor.name}-${index}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[7px] bg-[#eaf3ff] text-sm font-bold text-[#1377ef]">{index + 1}</span>
                  <p className="truncate text-sm font-semibold text-black">{advisor.name}</p>
                </div>
                <p className="text-sm font-bold text-black">{formatMoney(advisor.earnings)}</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#f1f2f4]">
                <div
                  className="h-2 rounded-full bg-[#1377ef]"
                  style={{ width: `${Math.max(6, (Number(advisor.earnings || 0) / maxEarnings) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-[7px] border border-dashed border-[#eeeeee] bg-[#fafafa] px-4 py-10 text-center text-sm font-semibold text-[#717780]">No advisor data yet</p>
      )}
    </Card>
  )
}

function EmployeeSnapshot({ stats }) {
  const attendanceTotal = Math.max(Number(stats.totalEmployees || 0), 1)
  const attendancePercent = Math.min(100, Math.round((Number(stats.presentToday || 0) / attendanceTotal) * 100))

  return (
    <Card className="p-[18px]">
      <PanelHeader
        title="Employee Snapshot"
        action={
          <Link to="/ems/leaves/pending" className="rounded-lg border border-[#eeeeee] bg-white px-3 py-1.5 text-xs font-semibold text-[#4d5560] hover:bg-[#f7f8fa]">
            Leaves
          </Link>
        }
      />
      <div className="flex items-center gap-4 rounded-[7px] border border-[#eeeeee] bg-[#fcfdfe] p-4">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(${COLORS.employee} ${attendancePercent * 3.6}deg, #e5e7eb 0deg)` }}
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-bold text-black">{attendancePercent}%</div>
        </div>
        <div>
          <p className="text-sm font-semibold text-black">Today Attendance</p>
          <p className="mt-1 text-xs text-[#717780]">{formatNumber(stats.presentToday)} present / {formatNumber(stats.totalEmployees)} total</p>
          <p className="mt-1 text-xs text-[#717780]">{formatNumber(stats.pendingLeaves)} pending leaves</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Absent" value={formatNumber(stats.absentToday)} />
        <MiniMetric label="On Leave" value={formatNumber(stats.onLeave)} />
        <MiniMetric label="Open Positions" value={formatNumber(stats.openPositions)} />
      </div>
    </Card>
  )
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-[7px] border border-[#eeeeee] bg-white px-3 py-3">
      <p className="text-[11px] text-[#8c929a]">{label}</p>
      <p className="mt-1 text-xl font-bold text-black">{value}</p>
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

  const { advisorStats, crmStats, employeeStats } = summary

  const moduleCards = useMemo(() => [
    {
      title: 'Success Advisor',
      subtitle: 'References, advisors, companies, and earnings',
      icon: BriefcaseBusiness,
      color: COLORS.advisor,
      route: '/admin/references',
      stats: [
        { label: 'Advisors', value: formatNumber(advisorStats.totalAdvisors) },
        { label: 'Companies', value: formatNumber(advisorStats.activeCompanies) },
        { label: 'Earnings', value: formatMoney(advisorStats.totalEarnings) }
      ]
    },
    {
      title: 'Telecalling CRM',
      subtitle: 'Employees, candidates, calls, and reports',
      icon: PhoneCall,
      color: COLORS.crm,
      route: '/admin/crm/dashboard',
      stats: [
        { label: 'Candidates', value: formatNumber(crmStats.totalCandidates) },
        { label: 'Employees', value: formatNumber(crmStats.successEmployees) },
        { label: 'Calls Today', value: formatNumber(crmStats.callsToday) }
      ]
    },
    {
      title: 'Success Employee',
      subtitle: 'Attendance, leaves, payroll, and documents',
      icon: Building2,
      color: COLORS.employee,
      route: '/ems',
      stats: [
        { label: 'Employees', value: formatNumber(employeeStats.totalEmployees) },
        { label: 'Present', value: formatNumber(employeeStats.presentToday) },
        { label: 'Leaves', value: formatNumber(employeeStats.pendingLeaves) }
      ]
    }
  ], [advisorStats, crmStats, employeeStats])

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-white">
      <div className="space-y-[14px]">
        {error ? (
          <div className="flex items-center gap-2 rounded-[7px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="grid gap-[14px] lg:grid-cols-3">
              {moduleCards.map((card) => <ModuleCard key={card.title} {...card} />)}
            </div>

            <QuickActionTiles />

            <div className="grid gap-[14px] xl:grid-cols-2">
              <ActivityFeed items={summary.recentActivity} />
              <EmployeeSnapshot stats={employeeStats} />
            </div>

            <TopAdvisors advisors={advisorStats.topAdvisors} />
          </>
        )}
      </div>
    </div>
  )
}
