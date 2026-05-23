import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  Cake,
  CheckCircle,
  Gift,
  Plus,
  PlusCircle,
  Users,
  XCircle
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { leaveApi } from '../api/leaveApi'
import { reportApi } from '../api/reportApi'

const CHART_COLORS = {
  present: '#22C55E',
  absent: '#EF4444',
  late: '#F59E0B',
  leave: '#3B82F6'
}

const PIE_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316']

const emptyDashboard = {
  kpi: {
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeave: 0,
    openPositions: 0
  },
  kpiChange: {
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeave: 0,
    openPositions: 0
  },
  weeklyAttendance: [],
  departmentHeadcount: [],
  todayAttendance: [],
  pendingLeaves: [],
  recentJoins: [],
  birthdays: [],
  anniversaries: [],
  monthlyTrend: []
}

const numberFormatter = new Intl.NumberFormat('en-IN')

const normalizeDashboard = (payload = {}) => ({
  ...emptyDashboard,
  ...payload,
  kpi: { ...emptyDashboard.kpi, ...(payload.kpi || {}) },
  kpiChange: { ...emptyDashboard.kpiChange, ...(payload.kpiChange || {}) },
  weeklyAttendance: payload.weeklyAttendance || [],
  departmentHeadcount: payload.departmentHeadcount || [],
  todayAttendance: payload.todayAttendance || [],
  pendingLeaves: payload.pendingLeaves || [],
  recentJoins: payload.recentJoins || [],
  birthdays: payload.birthdays || [],
  anniversaries: payload.anniversaries || [],
  monthlyTrend: payload.monthlyTrend || []
})

const hasChartData = (rows, keys) => rows.some((row) => keys.some((key) => Number(row[key] || 0) > 0))

function Card({ children, className = '' }) {
  return <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
}

function EmptyChart({ message = 'No data yet' }) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
      <div>
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
          <BarChart3 className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-600">{message}</p>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
        ))}
      </div>
    </div>
  )
}

function KpiCard({ label, value, change, icon: Icon, tone }) {
  const numericChange = Number(change || 0)
  const changeText = `${numericChange > 0 ? '+' : ''}${numericChange}% vs last month`

  return (
    <Card className={`overflow-hidden border-l-4 ${tone.border} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{numberFormatter.format(Number(value || 0))}</p>
          <p className={`mt-2 text-xs font-semibold ${numericChange < 0 ? 'text-rose-600' : numericChange > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {changeText}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  )
}

function ChartHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-slate-950">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  )
}

function ChartLegend({ items }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    present: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    late: 'bg-amber-50 text-amber-700 ring-amber-100',
    absent: 'bg-rose-50 text-rose-700 ring-rose-100',
    on_leave: 'bg-blue-50 text-blue-700 ring-blue-100'
  }
  const labels = {
    present: 'Present',
    late: 'Late',
    absent: 'Absent',
    on_leave: 'On Leave'
  }

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ring-1 ${styles[status] || styles.absent}`}>
      {labels[status] || 'Absent'}
    </span>
  )
}

function InitialsAvatar({ name }) {
  const initials = String(name || 'Employee')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B2341] text-xs font-bold text-white">{initials || 'EM'}</span>
}

export default function EMSDashboard() {
  const [data, setData] = useState(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState('')

  const loadDashboard = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const response = await reportApi.dashboard()
      setData(normalizeDashboard(response.data))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load EMS dashboard')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleLeaveAction = async (leaveId, action) => {
    setActionId(`${action}-${leaveId}`)
    setError('')
    try {
      if (action === 'approve') await leaveApi.approve(leaveId, {})
      else await leaveApi.reject(leaveId, { reason: 'Rejected from dashboard' })
      await loadDashboard({ silent: true })
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${action} leave request`)
    } finally {
      setActionId('')
    }
  }

  const kpis = [
    {
      label: 'Total Employees',
      value: data.kpi.totalEmployees,
      change: data.kpiChange.totalEmployees,
      icon: Users,
      tone: { border: 'border-sky-500', icon: 'bg-sky-50 text-sky-700' }
    },
    {
      label: 'Present Today',
      value: data.kpi.presentToday,
      change: data.kpiChange.presentToday,
      icon: CheckCircle,
      tone: { border: 'border-emerald-500', icon: 'bg-emerald-50 text-emerald-700' }
    },
    {
      label: 'Absent Today',
      value: data.kpi.absentToday,
      change: data.kpiChange.absentToday,
      icon: XCircle,
      tone: { border: 'border-rose-500', icon: 'bg-rose-50 text-rose-700' }
    },
    {
      label: 'On Leave',
      value: data.kpi.onLeave,
      change: data.kpiChange.onLeave,
      icon: Briefcase,
      tone: { border: 'border-amber-500', icon: 'bg-amber-50 text-amber-700' }
    },
    {
      label: 'Open Positions',
      value: data.kpi.openPositions,
      change: data.kpiChange.openPositions,
      icon: PlusCircle,
      tone: { border: 'border-blue-500', icon: 'bg-blue-50 text-blue-700' }
    }
  ]

  const weeklyHasData = hasChartData(data.weeklyAttendance, ['present', 'absent', 'late'])
  const monthlyHasData = hasChartData(data.monthlyTrend, ['present', 'absent', 'leave'])
  const departmentHasData = data.departmentHeadcount.some((item) => Number(item.count || 0) > 0)

  return (
    <div className="-m-3 min-h-[calc(100vh-4rem)] bg-[#F4F6F9] p-3 sm:-m-5 sm:p-5 lg:-m-6 lg:p-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Employee Management</h1>
            <p className="mt-1 text-sm text-slate-600">Workforce health, attendance, approvals, and payroll readiness in one view.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/ems/employees/add" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#00427d] px-4 text-sm font-semibold text-white hover:bg-[#063763]">
              <Plus className="h-4 w-4" /> Employee
            </Link>
            <Link to="/ems/payroll/generate" className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Generate Payroll
            </Link>
          </div>
        </div>

        {error ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{error}</div> : null}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
            </div>

            <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
              <Card className="p-4">
                <ChartHeader title="Attendance Overview" subtitle="This week, Monday to Friday" />
                {weeklyHasData ? (
                  <>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.weeklyAttendance} barGap={5}>
                          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                          <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }} />
                          <Bar dataKey="present" name="Present" fill={CHART_COLORS.present} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="absent" name="Absent" fill={CHART_COLORS.absent} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="late" name="Late" fill={CHART_COLORS.late} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <ChartLegend
                      items={[
                        { label: 'Present', color: CHART_COLORS.present },
                        { label: 'Absent', color: CHART_COLORS.absent },
                        { label: 'Late', color: CHART_COLORS.late }
                      ]}
                    />
                  </>
                ) : (
                  <EmptyChart />
                )}
              </Card>

              <Card className="p-4">
                <ChartHeader title="Department Headcount" subtitle="Active employees by department" />
                {departmentHasData ? (
                  <div className="grid min-h-72 items-center gap-4 sm:grid-cols-[1fr_160px] xl:grid-cols-1 2xl:grid-cols-[1fr_180px]">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.departmentHeadcount} dataKey="count" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2}>
                            {data.departmentHeadcount.map((entry, index) => (
                              <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {data.departmentHeadcount.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                          <span className="inline-flex min-w-0 items-center gap-2 text-slate-600">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="font-bold text-slate-950">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyChart />
                )}
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="flex min-h-80 flex-col p-4">
                <div className="mb-3 flex items-center justify-between">
                  <ChartHeader title="Today's Attendance Live" />
                  <Link to="/ems/attendance" className="text-xs font-bold text-[#00427d] hover:text-[#063763]">View All</Link>
                </div>
                {data.todayAttendance.length ? (
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-3 font-bold">Employee Name</th>
                          <th className="px-3 py-3 font-bold">Check-in</th>
                          <th className="px-3 py-3 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.todayAttendance.slice(0, 5).map((row) => (
                          <tr key={row.id || row.name}>
                            <td className="px-3 py-3 font-semibold text-slate-900">{row.name}</td>
                            <td className="px-3 py-3 text-slate-600">{row.checkIn || '-'}</td>
                            <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
                    No records today
                  </div>
                )}
              </Card>

              <Card className="flex min-h-80 flex-col p-4">
                <div className="mb-3 flex items-center justify-between">
                  <ChartHeader title="Pending Approvals" />
                  <Link to="/ems/leaves/pending" className="text-xs font-bold text-[#00427d] hover:text-[#063763]">View All</Link>
                </div>
                {data.pendingLeaves.length ? (
                  <div className="space-y-3">
                    {data.pendingLeaves.slice(0, 4).map((leave) => (
                      <div key={leave.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3">
                        <InitialsAvatar name={leave.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-950">{leave.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{leave.type} • {leave.days} day{Number(leave.days) === 1 ? '' : 's'} • {leave.from}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={Boolean(actionId)}
                            onClick={() => handleLeaveAction(leave.id, 'approve')}
                            className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            {actionId === `approve-${leave.id}` ? '...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(actionId)}
                            onClick={() => handleLeaveAction(leave.id, 'reject')}
                            className="rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            {actionId === `reject-${leave.id}` ? '...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-500">
                    All caught up! No pending approvals
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <ChartHeader title="Today Panel" subtitle="Milestones and people updates" />
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recent Joins</p>
                    <div className="mt-2 space-y-2">
                      {data.recentJoins.length ? data.recentJoins.map((employee) => (
                        <Link key={employee.id} to={`/ems/employees/${employee.id}`} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-slate-900">{employee.name}</span>
                            <span className="block truncate text-xs text-slate-500">{employee.designation}</span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">{employee.joinedOn}</span>
                        </Link>
                      )) : <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">No recent joins</p>}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Cake className="h-3.5 w-3.5 text-rose-500" /> Birthdays</p>
                    <div className="mt-2 space-y-1.5">
                      {data.birthdays.length ? data.birthdays.map((employee) => (
                        <p key={employee.id} className="text-sm font-semibold text-slate-800">{employee.name}</p>
                      )) : <p className="text-sm text-slate-500">No birthdays today</p>}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Gift className="h-3.5 w-3.5 text-blue-500" /> Work Anniversary</p>
                    <div className="mt-2 space-y-1.5">
                      {data.anniversaries.length ? data.anniversaries.map((employee) => (
                        <p key={employee.id} className="text-sm font-semibold text-slate-800">{employee.name} <span className="font-medium text-slate-500">({employee.years} yr)</span></p>
                      )) : <p className="text-sm text-slate-500">No anniversaries today</p>}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <ChartHeader title="Monthly Attendance Trend" subtitle="Last 6 months" />
              {monthlyHasData ? (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.monthlyTrend}>
                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }} />
                        <Line type="monotone" dataKey="present" name="Present" stroke={CHART_COLORS.present} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="absent" name="Absent" stroke={CHART_COLORS.absent} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="leave" name="Leave" stroke={CHART_COLORS.leave} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartLegend
                    items={[
                      { label: 'Present', color: CHART_COLORS.present },
                      { label: 'Absent', color: CHART_COLORS.absent },
                      { label: 'Leave', color: CHART_COLORS.leave }
                    ]}
                  />
                </>
              ) : (
                <EmptyChart />
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
