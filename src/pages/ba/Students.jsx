import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Eye, UserRoundPlus } from 'lucide-react'
import api from '../../api/axios'
import socket, { connectSocket, disconnectSocket } from '../../socket'
import DetailDrawer from '../../components/DetailDrawer'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount || 0))

const numeric = (value) => {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const buildCandidateEarning = (student, placement) => {
  if (placement) {
    return {
      source: 'placement',
      earningAmount: numeric(placement.earningAmount),
      earningPercent: numeric(placement.earningPercent),
      offeredSalaryPM: numeric(placement.offeredSalaryPM),
      earningStatus: placement.earningStatus || 'pending',
      earningPaidDate: placement.earningPaidDate,
      interviewDate: placement.interviewDate,
      selectionStatus: placement.selectionStatus
    }
  }

  const commission = student.advisorCommission || {}
  const salary = numeric(commission.salary)
  const percent = numeric(commission.percentage)
  const amount =
    commission.amount !== undefined && commission.amount !== null
      ? numeric(commission.amount)
      : Math.round(salary * (percent / 100))
  const hasCommission =
    salary > 0 ||
    percent > 0 ||
    amount > 0 ||
    commission.paymentStatus === 'paid'

  if (!hasCommission) return null

  return {
    source: 'candidate',
    earningAmount: amount,
    earningPercent: percent,
    offeredSalaryPM: salary,
    earningStatus: commission.paymentStatus || 'pending',
    earningPaidDate: commission.paidAt,
    interviewDate: null,
    selectionStatus: student.selectionStatus || student.status
  }
}

export default function Students() {
  const token = useSelector((state) => state.auth.token)
  const [students, setStudents] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    earning: 'all'
  })

  const loadData = async () => {
    const [studentRes, placementRes] = await Promise.all([api.get('/students'), api.get('/placements/my')])
    setStudents(studentRes.data)
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
    socket.on('placement_deleted', refresh)
    socket.on('earning_paid', refresh)
    socket.on('commission_paid', refresh)
    socket.on('student_updated', refresh)
    socket.on('student_deleted', refresh)
    socket.on('new_student_received', (payload) => {
      toast.success(`New application received from ${payload?.candidateName || 'a candidate'} via your public form!`)
      refresh()
    })

    return () => {
      socket.off('my_placement', refresh)
      socket.off('placement_updated', refresh)
      socket.off('placement_deleted', refresh)
      socket.off('earning_paid', refresh)
      socket.off('commission_paid', refresh)
      socket.off('student_updated', refresh)
      socket.off('student_deleted', refresh)
      socket.off('new_student_received')
      disconnectSocket()
    }
  }, [token])

  const placementByStudentId = useMemo(
    () =>
      new Map(
        placements.map((placement) => [placement.student?._id || placement.studentId?._id || placement.studentId, placement])
      ),
    [placements]
  )

  const enriched = useMemo(
    () =>
      students.map((student) => {
        const placement = placementByStudentId.get(student._id)
        const earning = buildCandidateEarning(student, placement)
        return {
          ...student,
          placement,
          earning,
          effectiveStatus: placement?.selectionStatus || student.status
        }
      }),
    [students, placementByStudentId]
  )

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return enriched
      .filter((student) => {
        if (!search) return true
        const placement = student.placement || {}
        const text = [
          student.candidateName,
          student.mobileNumber,
          student.aadhaarNo,
          student.whatsappNo,
          student.emailId,
          student.appliedFor,
          student.interestedDepartment,
          student.preferredIndustry,
          student.preferredJobLocation,
          student.currentJobLocation,
          placement.companyName,
          placement.jobProfile
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return text.includes(search)
      })
      .filter((student) => (filters.status === 'all' ? true : student.effectiveStatus === filters.status))
      .filter((student) => {
        if (filters.earning === 'all') return true
        if (filters.earning === 'recorded') return Boolean(student.earning)
        if (filters.earning === 'paid') return student.earning?.earningStatus === 'paid'
        if (filters.earning === 'pending') return student.earning?.earningStatus === 'pending'
        return true
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [enriched, filters])

  const stats = useMemo(() => {
    const totalSubmitted = students.length
    const selectedJoined = enriched.filter(
      (student) => student.effectiveStatus === 'selected' || student.effectiveStatus === 'joined'
    ).length
    const totalEarned = enriched.reduce((sum, student) => sum + numeric(student.earning?.earningAmount), 0)
    const pending = enriched
      .filter((student) => student.earning?.earningStatus === 'pending')
      .reduce((sum, student) => sum + numeric(student.earning?.earningAmount), 0)
    return { totalSubmitted, selectedJoined, totalEarned, pending }
  }, [students.length, enriched])

  if (loading) return <Skeleton rows={10} />

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">My Candidates</h1>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {students.length}
          </span>
        </div>
        <Link
          to="/ba/students/new"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto"
        >
          <UserRoundPlus className="h-4 w-4" />
          Add Candidate
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Submitted" value={stats.totalSubmitted} />
        <StatCard label="Selected / Joined" value={stats.selectedJoined} />
        <StatCard label="Total Earned" value={formatMoney(stats.totalEarned)} />
        <StatCard label="Pending Payment" value={formatMoney(stats.pending)} />
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4 md:grid-cols-3">
        <input
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search by name, phone, aadhaar, email, job, company..."
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <select
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="not_viewed">Not Viewed</option>
          <option value="in_review">In Review</option>
          <option value="priority">Priority</option>
          <option value="done">Done</option>
          <option value="selected">Selected</option>
          <option value="joined">Joined</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={filters.earning}
          onChange={(event) => setFilters((current) => ({ ...current, earning: event.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Earnings</option>
          <option value="recorded">Earning recorded</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending payment</option>
        </select>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((student) => (
          <button
            key={student._id}
            type="button"
            onClick={() => setSelected(student)}
            className="w-full rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-950">{student.candidateName}</p>
                  {student.source === 'public_form' ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">Via form</span> : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">{student.mobileNumber || 'No phone'}</p>
              </div>
              <StatusBadge status={student.effectiveStatus} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2">
              <MobileField label="Applied For" value={student.appliedFor || 'Not provided'} />
              <MobileField label="Submitted" value={format(new Date(student.createdAt), 'dd MMM yyyy')} />
              <MobileField label="Documents" value={student.documents?.length ? `${student.documents.length} files` : 'No files'} />
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-[11px] font-bold uppercase text-slate-500">My Earning</dt>
                <dd className="mt-1 text-sm text-slate-800"><EarningCell earning={student.earning} /></dd>
              </div>
            </dl>

            <span className="mt-4 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white">
              <Eye className="h-3.5 w-3.5" />
              View Details
            </span>
          </button>
        ))}
        {!filtered.length ? (
          <div className="rounded-xl bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No candidates found for current filters.
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Applied For</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">My Earning</th>
                <th className="px-5 py-3">Documents</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((student) => (
                <tr
                  key={student._id}
                  onClick={() => setSelected(student)}
                  className="cursor-pointer odd:bg-white even:bg-slate-50 hover:bg-indigo-50/50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{student.candidateName}</p>
                      {student.source === 'public_form' ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">Via form</span> : null}
                    </div>
                    <p className="text-xs text-slate-500">{student.mobileNumber}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{student.appliedFor || 'Not provided'}</td>
                  <td className="px-5 py-3 text-slate-600">{format(new Date(student.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-5 py-3">
                    <EarningCell earning={student.earning} />
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {student.documents?.length ? (
                      <span className="font-semibold text-indigo-600">{student.documents.length} files</span>
                    ) : (
                      <span className="text-slate-500">No files</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelected(student)
                      }}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white hover:bg-sky-700"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                    No candidates found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailDrawer
        open={Boolean(selected)}
        item={selected}
        type="student"
        onClose={() => setSelected(null)}
        studentPanelView
      />
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <p className="text-xs font-semibold leading-5 text-slate-500 sm:text-sm">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 sm:mt-3 sm:text-2xl">{value}</p>
    </div>
  )
}

function MobileField({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-[11px] font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-800">{value}</dd>
    </div>
  )
}

function EarningCell({ earning }) {
  if (!earning) {
    return <span className="text-sm text-slate-500">Not placed yet</span>
  }

  if (earning.selectionStatus === 'rejected') {
    return <span className="text-sm text-slate-500">Not applicable</span>
  }

  return (
    <div>
      <p className="font-semibold text-emerald-700">{formatMoney(earning.earningAmount || 0)}</p>
      <p className="text-xs text-slate-500">
        {earning.earningPercent || 0}% of {formatMoney(earning.offeredSalaryPM || 0)}
      </p>
      {earning.source === 'candidate' ? (
        <p className="text-xs text-sky-700">Updated by admin</p>
      ) : null}
      {earning.interviewDate ? (
        <p className="text-xs text-slate-500">Interview: {format(new Date(earning.interviewDate), 'dd MMM yyyy')}</p>
      ) : null}
      {earning.earningStatus === 'paid' ? (
        <p className="text-xs text-emerald-700">
          Paid{earning.earningPaidDate ? ` on ${format(new Date(earning.earningPaidDate), 'dd MMM yyyy')}` : ''}
        </p>
      ) : (
        <p className="text-xs text-amber-700">Payment pending</p>
      )}
    </div>
  )
}
