import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/axiosInstance.js'
import Badge from '../../components/ui/Badge.jsx'
import { getErrorMessage, CRM_BASE_PATH } from '../../utils/helpers.js'
import { UserCheck, PhoneCall, FileText, PlusCircle, Users } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

const colorAlpha = (hex, opacity) => {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function ModuleCard({ code, title, subtitle, color, route, icon: Icon }) {
  return (
    <Link
      to={route}
      className="group block min-h-[120px] rounded-[7px] border border-[#e7e9ee] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.08)] transition hover:-translate-y-0.5 hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sm font-black"
            style={{ color, backgroundColor: colorAlpha(color, 0.1) }}
          >
            {Icon ? <Icon size={20} /> : code}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold leading-tight text-slate-900">{title}</h2>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, colorClass, bgClass }) {
  return (
    <div className="rounded-[7px] border border-[#e7e9ee] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.08)]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">{title}</h3>
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-full ${bgClass} ${colorClass}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-3xl font-black text-slate-900">{value}</p>
          <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6']

function StatusChart({ byStatus }) {
  const data = useMemo(() => {
    if (!byStatus) return []
    return Object.entries(byStatus).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: Number(count) || 0
    })).filter(item => item.count > 0)
  }, [byStatus])

  return (
    <div className="flex h-full flex-col rounded-[7px] border border-[#e7e9ee] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.08)]">
      <h2 className="mb-4 text-base font-extrabold uppercase tracking-wider text-slate-900">
        Candidates by Status
      </h2>
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="status" 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
              axisLine={{ stroke: '#94a3b8' }}
              tickLine={{ stroke: '#94a3b8' }}
              label={{ value: 'Candidate Status', position: 'insideBottom', offset: -15, fill: '#475569', fontSize: 13, fontWeight: 'bold' }}
            />
            <YAxis 
              allowDecimals={false}
              domain={[0, 'dataMax']}
              tick={{ fill: '#64748b', fontSize: 12 }} 
              axisLine={{ stroke: '#94a3b8' }}
              tickLine={{ stroke: '#94a3b8' }}
              tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} 
              label={{ value: 'Total Count', angle: -90, position: 'insideLeft', offset: 15, fill: '#475569', fontSize: 13, fontWeight: 'bold' }}
            />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                    <p className="text-xs font-bold text-slate-500 mb-1">{payload[0].payload.status}</p>
                    <p className="text-lg font-black text-slate-900">{payload[0].value} Candidates</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const AdminDashboard = () => {
  const [reports, setReports] = useState(null)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const [reportResponse, employeeResponse] = await Promise.all([
          api.get('/admin/reports'),
          api.get('/admin/employees?limit=8')
        ])

        setReports(reportResponse.data.data)
        setEmployees(employeeResponse.data.data?.employees || [])
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load admin dashboard'))
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[142px] animate-pulse rounded-[7px] border border-[#e7e9ee] bg-white" />
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[112px] animate-pulse rounded-[7px] border border-[#e7e9ee] bg-white" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.54fr)]">
          <div className="h-[320px] animate-pulse rounded-[7px] border border-[#e7e9ee] bg-white" />
          <div className="h-[320px] animate-pulse rounded-[7px] bg-[#111111]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-brand-blue-dark">CRM Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Overview of CRM operations, call logs, and candidate management.</p>
      </div>

      {/* Quick Actions (Module Cards) */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ModuleCard
          title="Add Candidate"
          subtitle="Create new candidate record"
          color="#10b981"
          icon={PlusCircle}
          route={`${CRM_BASE_PATH}/candidates/new`}
        />
        <ModuleCard
          title="View Reports"
          subtitle="Detailed analytics and candidates"
          color="#7c3aed"
          icon={FileText}
          route={`${CRM_BASE_PATH}/reports`}
        />
      </div>

      {/* Highlights */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Today's Activity"
          value={reports?.calls?.today || 0}
          subtitle="Calls Made Today"
          icon={PhoneCall}
          bgClass="bg-orange-50"
          colorClass="text-orange-600"
        />
        <StatCard
          title="Total Conversions"
          value={reports?.candidates?.sure || 0}
          subtitle="Sure Candidates"
          icon={UserCheck}
          bgClass="bg-emerald-50"
          colorClass="text-emerald-600"
        />
        <StatCard
          title="CRM Staff"
          value={reports?.employees?.total || 0}
          subtitle="Total Callers"
          icon={Users}
          bgClass="bg-blue-50"
          colorClass="text-blue-600"
        />
      </div>

      {/* Chart and Logs */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.54fr)]">
        <div className="min-h-[320px]">
          <StatusChart byStatus={reports?.candidates?.byStatus} />
        </div>

        {/* Recent Callers Logs */}
        <section className="flex flex-col rounded-[7px] border border-[#e7e9ee] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)]">
          <div className="border-b border-[#e7e9ee] px-5 py-4">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">Recent Caller Logs</h2>
          </div>
          <div className="flex-1 divide-y divide-[#e7e9ee] overflow-y-auto max-h-[400px]">
            {employees.length === 0 ? (
              <div className="p-8 text-center text-sm font-medium text-slate-500">No recent callers found.</div>
            ) : (
              employees.map((emp) => (
                <div key={emp._id || emp.id} className="flex items-center justify-between p-5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                      {emp.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{emp.name}</p>
                      <p className="text-xs font-medium text-slate-500">{emp.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned</p>
                      <p className="font-bold text-slate-700">{emp.candidateCount || 0}</p>
                    </div>
                    <Badge tone={emp.isActive ? 'emerald' : 'slate'}>{emp.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
