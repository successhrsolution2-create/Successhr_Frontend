import { useState, useEffect, useMemo } from 'react'
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
import { UserCheck, TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { getSuperAdminCandidateChartData } from '../../api/superAdminDashboardApi'

const FILTERS = [
  { value: 'daily', label: 'Daily', description: 'Last 14 Days' },
  { value: 'weekly', label: 'Weekly', description: 'Last 12 Weeks' },
  { value: 'monthly', label: 'Monthly', description: 'Last 12 Months' }
]

function CustomTooltip({ active, payload, label, totalInPeriod }) {
  if (!active || !payload || !payload.length) return null

  const dataPoint = payload[0].payload
  const count = Number(payload[0].value || 0)
  const percentage = totalInPeriod > 0 ? Math.round((count / totalInPeriod) * 100) : 0

  return (
    <div className="min-w-[170px] overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md transition-all">
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-[11px] font-semibold text-slate-500">
        <Calendar className="h-3.5 w-3.5 text-slate-400" />
        <span>{dataPoint.fullDate || label}</span>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
          <span className="text-xs font-bold text-slate-700">Registrations:</span>
        </div>
        <span className="text-base font-black text-slate-900">{count}</span>
      </div>
      {totalInPeriod > 0 && count > 0 ? (
        <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500">
          <span>Share of period</span>
          <span className="font-bold text-blue-600">{percentage}%</span>
        </div>
      ) : null}
    </div>
  )
}

export default function CandidateRegistrationChart() {
  const [filter, setFilter] = useState('daily')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getSuperAdminCandidateChartData(filter)
        if (isMounted) {
          setData(Array.isArray(response.data) ? response.data : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to fetch chart data')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchData()
    return () => {
      isMounted = false
    }
  }, [filter])

  const { totalCandidates, peakCount, averageCount } = useMemo(() => {
    if (!data.length) return { totalCandidates: 0, peakCount: 0, averageCount: 0 }
    const total = data.reduce((sum, item) => sum + (Number(item.candidates) || 0), 0)
    const peak = Math.max(...data.map((item) => Number(item.candidates) || 0), 0)
    const avg = data.length > 0 ? (total / data.length).toFixed(1) : 0
    return { totalCandidates: total, peakCount: peak, averageCount: avg }
  }, [data])

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
              Candidate Registrations
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              <UserCheck className="h-3.5 w-3.5" />
              {totalCandidates} Total
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Track talent registration volume across intake channels
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {FILTERS.map((f) => {
            const isActive = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                title={f.description}
                className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Summary Metrics */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5 border-b border-slate-100 pb-3 text-xs text-slate-600">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100/80 px-2.5 py-1">
          <span className="text-xs font-medium text-slate-500">Filter Range:</span>
          <span className="font-bold text-slate-800">
            {filter === 'daily' ? 'Last 14 Days' : filter === 'weekly' ? 'Last 12 Weeks' : 'Last 12 Months'}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100/80 px-2.5 py-1">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-slate-500">Peak:</span>
          <span className="font-bold text-slate-800">{peakCount}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100/80 px-2.5 py-1">
          <span className="text-xs font-medium text-slate-500">Avg / slot:</span>
          <span className="font-bold text-slate-800">{averageCount}</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative min-h-[280px] flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/75 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-xs font-semibold text-slate-500">Loading registrations...</span>
            </div>
          </div>
        )}

        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="h-6 w-6 text-rose-500" />
            <p className="text-xs font-bold text-rose-600">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex !== undefined) {
                  setActiveIndex(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <defs>
                <linearGradient id="candidateBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="candidateBarGradientHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#94a3b8' }}
                tickLine={{ stroke: '#94a3b8' }}
                label={{ value: 'Registration Period', position: 'insideBottom', offset: -15, fill: '#475569', fontSize: 13, fontWeight: 'bold' }}
              />

              <YAxis
                allowDecimals={false}
                domain={[0, 'dataMax']}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={{ stroke: '#94a3b8' }}
                tickLine={{ stroke: '#94a3b8' }}
                label={{ value: 'Total Registrations', angle: -90, position: 'insideLeft', offset: 15, fill: '#475569', fontSize: 13, fontWeight: 'bold' }}
              />

              <Tooltip
                content={<CustomTooltip totalInPeriod={totalCandidates} />}
                cursor={{ fill: 'rgba(241, 245, 249, 0.7)', radius: 6 }}
              />

              <Bar
                dataKey="candidates"
                name="Candidates"
                radius={[5, 5, 0, 0]}
                maxBarSize={44}
                animationDuration={600}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      activeIndex === index
                        ? 'url(#candidateBarGradientHover)'
                        : 'url(#candidateBarGradient)'
                    }
                    className="transition-all duration-200"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
