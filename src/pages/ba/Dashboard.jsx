import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Building2, BriefcaseBusiness, IndianRupee, UserRoundPlus, Users } from 'lucide-react'
import { format } from 'date-fns'
import { useSelector } from 'react-redux'
import api from '../../api/axios'
import socket, { connectSocket, disconnectSocket } from '../../socket'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount || 0))

export default function Dashboard() {
  const token = useSelector((state) => state.auth.token)
  const [profile, setProfile] = useState(null)
  const [students, setStudents] = useState([])
  const [companies, setCompanies] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const [profileRes, studentRes, companyRes, placementRes] = await Promise.all([
      api.get('/ba/profile'),
      api.get('/students'),
      api.get('/companies'),
      api.get('/placements/my')
    ])

    setProfile(profileRes.data)
    setStudents(studentRes.data)
    setCompanies(companyRes.data)
    setPlacements(placementRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData().catch(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!token) return undefined
    connectSocket(token)

    const refresh = () => {
      loadData().catch(() => {})
    }

    socket.on('my_placement', refresh)
    socket.on('placement_updated', refresh)
    socket.on('earning_paid', refresh)
    socket.on('commission_paid', refresh)

    return () => {
      socket.off('my_placement', refresh)
      socket.off('placement_updated', refresh)
      socket.off('earning_paid', refresh)
      socket.off('commission_paid', refresh)
      disconnectSocket()
    }
  }, [token])

  const stats = useMemo(() => {
    const totalStudentsSubmitted = students.length
    const totalCompaniesSubmitted = companies.length
    const studentsPlaced = placements.length
    const totalEarned = placements.reduce((sum, placement) => sum + Number(placement.earningAmount || placement.commissionAmount || 0), 0)
    return { totalStudentsSubmitted, totalCompaniesSubmitted, studentsPlaced, totalEarned }
  }, [students.length, companies.length, placements])

  const recentStudents = useMemo(
    () => [...students].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [students]
  )

  const recentCompanies = useMemo(
    () => [...companies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [companies]
  )

  if (loading) {
    return <Skeleton rows={8} />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Hello, {profile?.fullName || 'Business Advisor'}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Snapshot of your submissions, placements, and earnings.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Link
            to="/ba/students/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent-blue)] px-3 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700 sm:px-4 sm:text-sm"
          >
            <UserRoundPlus className="h-4 w-4" />
            Add Candidate
          </Link>
          <Link
            to="/ba/companies/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 text-[13px] font-semibold text-[var(--text-secondary)] shadow-sm hover:bg-[var(--accent-blue-lt)] hover:text-[var(--accent-blue)] sm:px-4 sm:text-sm"
          >
            <Building2 className="h-4 w-4" />
            Add Company
          </Link>
        </div>
      </div>

      {!profile?.isProfileComplete && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Complete your profile</p>
              <p className="text-sm text-amber-800">Upload documents and bank details to finish onboarding.</p>
            </div>
          </div>
          <Link
            to="/ba/profile"
            className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[var(--warning)] px-4 text-sm font-semibold text-white hover:bg-amber-600 sm:w-auto"
          >
            Go to Profile
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Candidates Submitted" value={stats.totalStudentsSubmitted} icon={Users} />
        <StatCard label="Total Companies Submitted" value={stats.totalCompaniesSubmitted} icon={Building2} />
        <StatCard label="Candidates Placed" value={stats.studentsPlaced} icon={BriefcaseBusiness} />
        <StatCard label="Total Earned" value={formatMoney(stats.totalEarned)} icon={IndianRupee} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-[0.95rem] font-bold text-[var(--text-primary)]">Recent Candidates</h2>
          </div>
          <Table
            headers={['Name', 'Applied For', 'Status']}
            rows={recentStudents.map((student) => [
              <div key={student._id}>
                <p className="font-semibold text-[var(--text-primary)]">{student.candidateName}</p>
                <p className="text-xs text-[var(--text-muted)]">{format(new Date(student.createdAt), 'dd MMM yyyy')}</p>
              </div>,
              student.appliedFor || 'Not provided',
              <StatusBadge key="status" status={student.status} />
            ])}
            mobileRows={recentStudents.map((student) => ({
              title: student.candidateName || 'Candidate',
              subtitle: format(new Date(student.createdAt), 'dd MMM yyyy'),
              status: <StatusBadge status={student.status} />,
              details: [
                ['Applied For', student.appliedFor || 'Not provided']
              ]
            }))}
            empty="No candidate submissions yet."
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-[0.95rem] font-bold text-[var(--text-primary)]">Recent Companies</h2>
          </div>
          <Table
            headers={['Company', 'Job Profile', 'Status']}
            rows={recentCompanies.map((company) => [
              <div key={company._id}>
                <p className="font-semibold text-[var(--text-primary)]">{company.companyName}</p>
                <p className="text-xs text-[var(--text-muted)]">{format(new Date(company.createdAt), 'dd MMM yyyy')}</p>
              </div>,
              company.jobRequirements?.jobProfile || 'Not provided',
              <StatusBadge key="status" status={company.status} />
            ])}
            mobileRows={recentCompanies.map((company) => ({
              title: company.companyName || 'Company',
              subtitle: format(new Date(company.createdAt), 'dd MMM yyyy'),
              status: <StatusBadge status={company.status} />,
              details: [
                ['Job Profile', company.jobRequirements?.jobProfile || 'Not provided']
              ]
            }))}
            empty="No company submissions yet."
          />
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="flex min-h-36 flex-col gap-2 rounded-xl border border-[var(--border)] bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.8rem] font-semibold leading-5 text-[var(--text-secondary)]">{label}</p>
        <Icon className="h-[18px] w-[18px] text-[var(--accent-blue)]" />
      </div>
      <p className="text-[2rem] font-bold leading-tight text-[var(--text-primary)]">{value}</p>
      <span className="inline-flex w-fit rounded-full bg-[var(--accent-blue-lt)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-blue)]">Live snapshot</span>
    </div>
  )
}

function Table({ headers, rows, mobileRows = [], empty }) {
  return (
    <>
    <div className="divide-y divide-[var(--border)] md:hidden">
      {mobileRows.map((row, index) => (
        <article key={`${row.title}-${index}`} className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--text-primary)]">{row.title}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{row.subtitle}</p>
            </div>
            {row.status ? <div className="shrink-0">{row.status}</div> : null}
          </div>
          {row.details?.length ? (
            <dl className="mt-3 grid gap-2">
              {row.details.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-[#F9FAFB] px-3 py-2">
                  <dt className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">{label}</dt>
                  <dd className="mt-1 text-sm font-medium text-[var(--text-primary)]">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </article>
      ))}
      {!mobileRows.length ? <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">{empty}</div> : null}
    </div>

    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-[var(--border)] text-sm">
        <thead className="bg-[#F9FAFB] text-left text-xs uppercase text-[var(--text-secondary)]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-5 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="odd:bg-white even:bg-[#F9FAFB]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-5 py-3 text-[var(--text-secondary)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={headers.length} className="px-5 py-10 text-center text-[var(--text-secondary)]">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </>
  )
}
