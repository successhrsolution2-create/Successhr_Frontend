import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge.jsx'
import { fetchDashboardStats, fetchMyCandidates } from '../../store/candidateSlice.js'
import { CRM_BASE_PATH, callStatusTone, candidateClassTone } from '../../utils/helpers.js'
import { PhoneCall, Users, AlertCircle, Clock, PlusCircle } from 'lucide-react'

function ModuleCard({ code, title, subtitle, color, route, icon: Icon, onClick }) {
  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sm font-black"
          style={{ color, backgroundColor: `${color}1A` }}
        >
          {Icon ? <Icon size={20} /> : code}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-extrabold leading-tight text-slate-900">{title}</h2>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  )

  const className = "group block rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md cursor-pointer text-left"

  if (route) {
    return <Link to={route} className={className}>{content}</Link>
  }
  return <button onClick={onClick} className={`${className} w-full`}>{content}</button>
}

const EmployeeDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { stats, items, status, statsStatus } = useSelector((state) => state.crmCandidates)

  useEffect(() => {
    dispatch(fetchDashboardStats())
    dispatch(fetchMyCandidates({ limit: 8 }))
  }, [dispatch])

  if (statsStatus === 'loading') {
    return (
      <div className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-[90px] animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-[90px] animate-pulse rounded-xl bg-white shadow-sm" />
        </div>
        <div className="grid gap-5 lg:grid-cols-4">
          <div className="h-[120px] animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-[120px] animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-[120px] animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-[120px] animate-pulse rounded-xl bg-white shadow-sm" />
        </div>
        <div className="h-[320px] animate-pulse rounded-xl bg-white shadow-sm" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-semibold text-brand-blue-dark">My Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Your candidate pipeline and call activity.</p>
      </div>

      {/* Quick Actions */}
      <section className="grid gap-4 sm:grid-cols-2">
        <ModuleCard
          title="Add Candidate"
          subtitle="Create new candidate record"
          color="#10b981"
          icon={PlusCircle}
          route={`${CRM_BASE_PATH}/employee/candidates/new`}
        />
        <ModuleCard
          title="My Candidates"
          subtitle="View all assigned candidates"
          color="#2563eb"
          icon={Users}
          route={`${CRM_BASE_PATH}/employee/candidates`}
        />
      </section>

      {/* Highlights */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Total Candidates</h3>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Called Today</h3>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-orange/10 text-brand-orange">
              <PhoneCall size={24} />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">{stats?.calledToday || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Pending</h3>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">{stats?.pending || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Follow-ups</h3>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">{stats?.followup || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Candidates List */}
      <section className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex justify-between items-center">
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">Recent Candidates</h2>
          <span className="text-xs font-semibold text-slate-400">
            {status === 'loading' ? 'Loading...' : ''}
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {!items || items.length === 0 ? (
            <div className="p-8 text-center text-sm font-medium text-slate-500">No candidates found.</div>
          ) : (
            items.map((row) => (
              <div 
                key={row._id} 
                onClick={() => navigate(`${CRM_BASE_PATH}/employee/candidates/${row._id}`)}
                className="flex items-center justify-between p-5 transition hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {row.candidateName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{row.candidateName || 'Unnamed'}</p>
                    <p className="text-xs font-semibold text-slate-500">{row.mobileNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Class</p>
                    <Badge tone={candidateClassTone[row.candidateClass]}>{row.candidateClass}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Status</p>
                    <Badge tone={callStatusTone[row.callStatus]}>{row.callStatus}</Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default EmployeeDashboard
