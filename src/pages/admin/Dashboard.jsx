import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { BriefcaseBusiness, Building2, Clock3, IndianRupee, Users } from 'lucide-react'
import api from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'

const displayName = (item) => item.candidateName || item.companyName
const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount || 0))

export default function Dashboard() {
  const [bas, setBas] = useState([])
  const [students, setStudents] = useState([])
  const [companies, setCompanies] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [baRes, studentRes, companyRes, placementRes] = await Promise.all([
        api.get('/ba/all'),
        api.get('/students'),
        api.get('/companies'),
        api.get('/placements')
      ])
      setBas(baRes.data)
      setStudents(studentRes.data)
      setCompanies(companyRes.data)
      setPlacements(placementRes.data)
      setLoading(false)
    }

    load()
  }, [])

  const recent = useMemo(
    () =>
      [
        ...students.map((item) => ({ ...item, type: 'Student' })),
        ...companies.map((item) => ({ ...item, type: 'Company' }))
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10),
    [students, companies]
  )

  const pending =
    students.filter((item) => item.status === 'not_viewed').length +
    companies.filter((item) => item.status === 'not_viewed').length

  const totalEarnings = placements.reduce((sum, placement) => sum + Number(placement.earningAmount || 0), 0)
  const totalPaid = placements
    .filter((placement) => placement.earningStatus === 'paid')
    .reduce((sum, placement) => sum + Number(placement.earningAmount || 0), 0)
  const totalPendingEarnings = totalEarnings - totalPaid

  const stats = [
    { label: 'Total BAs', value: bas.length, icon: Users, color: 'text-sky-600' },
    { label: 'Student References', value: students.length, icon: BriefcaseBusiness, color: 'text-blue-600' },
    { label: 'Company References', value: companies.length, icon: Building2, color: 'text-purple-600' },
    { label: 'Pending', value: pending, icon: Clock3, color: 'text-amber-600' },
    { label: 'Earnings Generated', value: formatMoney(totalEarnings), icon: IndianRupee, color: 'text-emerald-600' },
    { label: 'Paid Out', value: formatMoney(totalPaid), icon: IndianRupee, color: 'text-indigo-600' },
    { label: 'Earnings Pending', value: formatMoney(totalPendingEarnings), icon: IndianRupee, color: 'text-orange-600' }
  ]

  if (loading) return <Skeleton rows={8} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of advisors and incoming references.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-950">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recent.map((item) => (
            <div
              key={`${item.type}-${item._id}`}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.type === 'Student' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {item.type}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="truncate font-semibold text-slate-900">{displayName(item)}</p>
                <p className="text-sm text-slate-500">
                  By {item.submittedBy?.name || 'BA'} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {recent.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">No submissions yet.</p>}
        </div>
      </section>
    </div>
  )
}
