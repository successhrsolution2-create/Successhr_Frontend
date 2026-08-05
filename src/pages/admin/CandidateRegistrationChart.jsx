import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { getSuperAdminCandidateChartData } from '../../api/superAdminDashboardApi'

const FILTERS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
]

export default function CandidateRegistrationChart() {
  const [filter, setFilter] = useState('daily')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getSuperAdminCandidateChartData(filter)
        if (isMounted) {
          setData(response.data)
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
    return () => { isMounted = false }
  }, [filter])

  return (
    <div className="flex h-full flex-col rounded-[7px] border border-[#eceef2] bg-white p-5 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-[#111111]">Candidate Registrations</h2>
          <p className="mt-1 text-xs font-medium text-[#6c727c]">Track new talent profiles</p>
        </div>
        <div className="flex overflow-hidden rounded-[5px] border border-[#eceef2] bg-[#f4f5f7] p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${
                filter === f.value
                  ? 'rounded-[4px] bg-white text-[#111111] shadow-sm'
                  : 'text-[#6c727c] hover:text-[#111111]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-[300px] flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f97316] border-t-transparent"></div>
          </div>
        )}
        {error ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-red-500">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef2" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#8c929b', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#8c929b', fontWeight: 600 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '6px',
                  border: '1px solid #eceef2',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                itemStyle={{ color: '#111111' }}
                cursor={{ fill: '#f4f5f7' }}
              />
              <Bar 
                dataKey="candidates" 
                name="Candidates"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
