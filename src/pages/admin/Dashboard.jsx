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
      className="group block min-h-[142px] rounded-[7px] border border-[#e6e8ed] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.09)] transition hover:-translate-y-0.5 hover:border-[#cfd6e4] hover:shadow-[0_8px_24px_rgba(16,24,40,0.10)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] text-[13px] font-black"
            style={{ color, backgroundColor: colorAlpha(color, 0.1) }}
          >
            {code}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black leading-5 text-[#111111]">{title}</h2>
            <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-normal text-[#777d86]">{subtitle}</p>
          </div>
        </div>
        <span
          className="shrink-0 rounded-[4px] px-2 py-1 text-[10px] font-black uppercase tracking-normal"
          style={{ color, backgroundColor: colorAlpha(color, 0.12) }}
        >
          Active
        </span>
      </div>

      <div className="mt-5 border-t border-[#eceef2] pt-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-normal text-[#777d86]">{item.label}</p>
              <p className="mt-1 truncate text-xl font-black leading-none text-[#111111]">{item.value}</p>
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
      title: 'Register Business Admin',
      description: 'Onboard new administrative partner',
      label: 'Business Admin',
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {actions.map((item) => (
        <Link
          key={item.title}
          to={item.to}
          className="group flex min-h-[112px] flex-col justify-between rounded-[7px] border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(16,24,40,0.09)]"
          style={{ borderColor: colorAlpha(item.color, item.number === '02' || item.number === '03' ? 0.18 : 0.34), backgroundColor: item.tint }}
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[5px] text-[11px] font-black"
              style={{ color: item.color, backgroundColor: colorAlpha(item.color, 0.1) }}
            >
              {item.number}
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80 text-[#777d86] opacity-0 transition group-hover:opacity-100">
              <item.icon className="h-4 w-4" />
            </span>
          </div>

          <div className="min-w-0 pt-4">
            <p className="truncate text-[10px] font-black uppercase tracking-normal" style={{ color: item.color }}>{item.label}</p>
            <h2 className="mt-1 truncate text-sm font-black text-[#111111]">{item.title}</h2>
            <p className="mt-1 truncate text-[11px] font-medium text-[#6f7680]">{item.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function PanelHeader({ title, action }) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-3">
      <h2 className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-[#6c727c]">{title}</h2>
      {action}
    </div>
  )
}

function ActivityFeed({ items }) {
  return (
    <div className="space-y-3">
      <PanelHeader
        title="Recent Activity"
        action={
          <Link to="/admin/references" className="text-[10px] font-black text-[#111111] underline-offset-2 hover:underline">
            View Log
          </Link>
        }
      />
      <Card className={`${items.length ? 'p-4' : 'border-dashed p-0'} min-h-[256px]`}>
        {items.length ? (
          <div className="divide-y divide-[#eceef2]">
            {items.slice(0, 6).map((item, index) => (
              <div key={`${item.module}-${index}-${item.text}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-[#eef4ff] text-[#2563eb]">
                  <Activity className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#111111]">{item.text}</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-[#8c929b]">{item.time}</p>
                </div>
                <span className="shrink-0 rounded-[4px] bg-[#f4f5f7] px-2 py-1 text-[10px] font-black uppercase text-[#59616d]">
                  {(item.module || 'Admin').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative flex min-h-[254px] items-center justify-center px-5 py-10">
            <div className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f7f8fa] text-[#8c929b]">
                <Activity className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-bold text-[#7c838d]">No activity records found for this period</p>
              <p className="mt-1 text-[11px] font-medium text-[#a1a7b0]">System is awaiting initial telemetry</p>
            </div>
            <Link
              to="/admin/references"
              aria-label="Open activity log"
              className="absolute bottom-[-18px] left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-[#202124] text-white shadow-[0_6px_18px_rgba(17,24,39,0.18)] transition hover:bg-[#111111]"
            >
              <ArrowDown className="h-5 w-5" />
            </Link>
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
      code: 'SA',
      title: 'Success Advisor',
      subtitle: 'Operational units',
      color: COLORS.advisor,
      route: '/admin/references',
      stats: [
        { label: 'Advisors', value: formatNumber(advisorStats.totalAdvisors) },
        { label: 'Companies', value: formatNumber(advisorStats.activeCompanies) },
        { label: 'Revenue', value: formatMoney(advisorStats.totalEarnings) }
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
        { label: 'Employees', value: formatNumber(crmStats.successEmployees) },
        { label: 'Calls Today', value: formatNumber(crmStats.callsToday) }
      ]
    },
    {
      code: 'SE',
      title: 'Success Employee',
      subtitle: 'Force tracking',
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
            <div className="grid gap-5 lg:grid-cols-3">
              {moduleCards.map((card) => <ModuleCard key={card.title} {...card} />)}
            </div>

            <div className="space-y-3">
              <PanelHeader title="Quick Actions" />
              <QuickActionTiles />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.54fr)]">
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
