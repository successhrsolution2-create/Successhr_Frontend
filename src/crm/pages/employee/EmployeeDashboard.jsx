import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Badge from '../../components/ui/Badge.jsx'
import Table from '../../components/ui/Table.jsx'
import { fetchDashboardStats, fetchMyCandidates } from '../../store/candidateSlice.js'
import { CRM_BASE_PATH, callStatusTone, candidateClassTone, formatDate, formatDisplayText } from '../../utils/helpers.js'

const getRecruiterId = (candidate) => {
  const recruiter = candidate?.recruiterId || candidate?.recruiter
  if (!recruiter) return '-'
  if (typeof recruiter === 'string') return recruiter
  return recruiter._id || recruiter.id || '-'
}

const Stat = ({ label, value }) => (
  <div className="rounded-md border border-line bg-white p-4 shadow-sm">
    <p className="text-sm font-semibold text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-ink">{value ?? 0}</p>
  </div>
)

const EmployeeDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { stats, items, status, statsStatus } = useSelector((state) => state.crmCandidates)

  useEffect(() => {
    dispatch(fetchDashboardStats())
    dispatch(fetchMyCandidates({ limit: 8 }))
  }, [dispatch])

  const columns = [
    { key: 'candidateName', label: 'Candidate' },
    { key: 'mobileNumber', label: 'Mobile' },
    { key: 'jobProfile', label: 'Job Profile' },
    {
      key: 'candidateClass',
      label: 'Class',
      render: (row) => <Badge tone={candidateClassTone[row.candidateClass]}>{row.candidateClass}</Badge>
    },
    {
      key: 'callStatus',
      label: 'Status',
      render: (row) => <Badge tone={callStatusTone[row.callStatus]}>{row.callStatus}</Badge>
    },
    { key: 'interviewDate', label: 'Date', render: (row) => formatDate(row.interviewDate) },
    { key: 'interviewTime', label: 'Time', render: (row) => formatDisplayText(row.interviewTime, '-') },
    { key: 'recruiterId', label: 'Recruiter ID', render: (row) => getRecruiterId(row) }
  ]

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-brand-blue-dark">Employee Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Your candidate pipeline and call activity.</p>
          </div>
          <button type="button" className="crm-button-primary" onClick={() => navigate(`${CRM_BASE_PATH}/employee/candidates/new`)}>
            Quick Add
          </button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="My Total" value={stats?.total} />
        <Stat label="Called Today" value={stats?.calledToday} />
        <Stat label="Pending" value={stats?.pending} />
        <Stat label="Follow-ups" value={stats?.followup} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-brand-blue-dark">
            <h2>Recent Candidates</h2>
          </div>
          <span className="text-sm font-semibold text-slate-500">
            {statsStatus === 'loading' || status === 'loading' ? 'Loading...' : ''}
          </span>
        </div>
        <Table
          columns={columns}
          rows={items}
          emptyMessage="No candidates found"
          onRowClick={(row) => navigate(`${CRM_BASE_PATH}/employee/candidates/${row._id}`)}
        />
      </section>
    </div>
  )
}

export default EmployeeDashboard
