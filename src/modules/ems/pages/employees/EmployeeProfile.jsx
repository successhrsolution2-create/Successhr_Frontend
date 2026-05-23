import { useEffect, useState } from 'react'
import { Edit, FileText } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import LeaveStatusBadge from '../../components/LeaveStatusBadge'
import { employeeApi } from '../../api/employeeApi'

const dateText = (value) => (value ? new Date(value).toLocaleDateString() : '-')

export default function EmployeeProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    employeeApi.get(id).then(({ data }) => setProfile(data)).catch((err) => {
      setError(err.response?.data?.message || 'Unable to load employee profile')
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading profile...</div>
  if (error) return <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
  if (!profile?.employee) return null

  const { employee, activity } = profile
  const name = employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim()

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{employee.employeeId}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">{name}</h1>
            <p className="mt-1 text-sm text-slate-600">{employee.designation || 'Employee'} · {employee.department?.name || 'No department'}</p>
          </div>
          <Link to={`/ems/employees/${employee._id}/edit`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#00427d] px-4 text-sm font-semibold text-white hover:bg-[#063763]">
            <Edit className="h-4 w-4" /> Edit
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['overview', 'attendance', 'leaves', 'payroll', 'documents'].map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${activeTab === tab ? 'bg-[#00427d] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <InfoPanel title="Personal" rows={[
            ['Email', employee.email],
            ['Phone', employee.phone],
            ['Date of Birth', dateText(employee.dateOfBirth)],
            ['Gender', employee.gender || '-']
          ]} />
          <InfoPanel title="Job" rows={[
            ['Status', employee.status],
            ['Employment Type', employee.employmentType],
            ['Joining Date', dateText(employee.joiningDate)],
            ['Manager', employee.manager?.fullName || employee.manager?.firstName || '-']
          ]} />
        </div>
      ) : null}

      {activeTab === 'attendance' ? <SimpleList rows={activity.attendance} render={(item) => `${dateText(item.date)} · ${item.status} · ${item.minutesWorked || 0} min`} /> : null}
      {activeTab === 'leaves' ? <SimpleList rows={activity.leaves} render={(item) => <span>{item.leaveType} · {dateText(item.startDate)} - {dateText(item.endDate)} · <LeaveStatusBadge status={item.status} /></span>} /> : null}
      {activeTab === 'payroll' ? <SimpleList rows={activity.payroll} render={(item) => `${item.month}/${item.year} · ${item.status} · Net ${item.netPay || 0}`} /> : null}
      {activeTab === 'documents' ? <SimpleList rows={activity.documents} render={(item) => <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" /> {item.title}</span>} /> : null}
    </div>
  )
}

function InfoPanel({ title, rows }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-950">{title}</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[130px_1fr] gap-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-900">{value || '-'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function SimpleList({ rows = [], render }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {rows.map((item) => (
        <div key={item._id} className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700 last:border-0">{render(item)}</div>
      ))}
      {!rows.length ? <div className="px-4 py-10 text-center text-sm text-slate-500">No records found.</div> : null}
    </div>
  )
}
