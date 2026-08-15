import { useState, useEffect, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { PieChart as PieIcon, AlertCircle, Info } from 'lucide-react'
import { getSuperAdminCandidateDistribution } from '../../api/superAdminDashboardApi'

function CustomTooltip({ active, payload, total }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  if (data.isEmpty) return null

  const count = Number(data.value || 0)
  const percent = total > 0 ? Math.round((count / total) * 100) : 100

  return (
    <div className="pointer-events-none z-50 min-w-[170px] overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xl transition-all">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <span
          className="h-2.5 w-2.5 rounded-full shadow-sm"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-xs font-bold text-slate-800">{data.name}</span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-slate-500">Registrations:</span>
        <span className="text-sm font-black text-slate-900">{count}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>Share:</span>
        <span className="font-bold text-blue-600">{percent}%</span>
      </div>
      {data.description ? (
        <p className="mt-1.5 border-t border-slate-50 pt-1 text-[10px] text-slate-400">
          {data.description}
        </p>
      ) : null}
    </div>
  )
}

export default function CandidateDistributionPieChart() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getSuperAdminCandidateDistribution('daily')
        if (isMounted) {
          const distribution = Array.isArray(response.data?.distribution) ? response.data.distribution : []
          const totalCount = Number(response.data?.total || 0)
          setData(distribution)
          setTotal(totalCount)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load distribution')
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
  }, [])

  const chartData = useMemo(() => {
    if (!data.length || total === 0) {
      return [{ name: 'No Registrations', value: 1, color: '#e2e8f0', isEmpty: true }]
    }
    return data.filter((item) => Number(item.value) > 0)
  }, [data, total])

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Registration Sources
            </h2>
          </div>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Today's candidate intake
          </p>
        </div>

        {/* Today Badge */}
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
          Today
        </span>
      </div>

      {/* Main Content */}
      <div className="relative flex min-h-[260px] flex-1 flex-col justify-between">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-[11px] font-semibold text-slate-500">Loading sources...</span>
            </div>
          </div>
        )}

        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            <p className="text-xs font-bold text-rose-600">{error}</p>
          </div>
        ) : (
          <>
            {/* Pie Chart with Center Stats */}
            <div className="relative h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={<CustomTooltip total={total} />}
                    offset={20}
                    wrapperStyle={{ zIndex: 100 }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={total > 0 ? 3 : 0}
                    cornerRadius={total > 0 ? 4 : 0}
                    dataKey="value"
                    animationDuration={600}
                    onMouseEnter={(_, index) => total > 0 && setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="transition-all duration-200"
                        style={{
                          transform: activeIndex === index && !entry.isEmpty ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: 'center center',
                          cursor: entry.isEmpty ? 'default' : 'pointer'
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Counter - Smoothly fades when hovering a slice to prevent visual overlap */}
              <div
                className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-200 ${
                  activeIndex !== null ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <span className="text-2xl font-black leading-none text-slate-900">
                  {total}
                </span>
                <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Today
                </span>
              </div>
            </div>

            {/* Breakdown List / Legend */}
            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2.5">
              {data.map((item, idx) => {
                const count = Number(item.value || 0)
                const percent = total > 0 ? Math.round((count / total) * 100) : 0
                const isHovered = activeIndex === idx

                return (
                  <div
                    key={item.key || item.name}
                    onMouseEnter={() => total > 0 && setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all ${
                      isHovered ? 'bg-slate-100 shadow-sm' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-xs font-bold text-slate-800">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-900">
                        {count}
                      </span>
                      <span className="w-9 text-right text-xs font-semibold text-slate-400">
                        {percent}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
