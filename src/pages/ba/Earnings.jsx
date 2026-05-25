import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Calendar, IndianRupee, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '../../api/axios'
import socket, { connectSocket, disconnectSocket } from '../../socket'
import Skeleton from '../../components/Skeleton'

const selectionStatusLabel = {
  not_viewed: 'Not Viewed',
  in_review: 'In Review',
  priority: 'Priority',
  done: 'Done',
  shortlisted: 'Shortlisted',
  selected: 'Selected',
  joined: 'Joined',
  rejected: 'Rejected',
  on_hold: 'On Hold'
}

const processStageLabel = {
  appointment_letter_pending: 'Appointment Letter Pending',
  appointment_letter_shared: 'Appointment Letter Shared',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  selected: 'Selected',
  joined: 'Joined',
  rejected: 'Rejected',
  on_hold: 'On Hold'
}

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

const placementCandidateId = (placement) =>
  String(placement.student?._id || placement.studentId?._id || placement.studentId || '')

const placementToEarningRow = (placement) => ({
  ...placement,
  recordType: 'placement',
  rowId: placement._id,
  studentName: placement.studentName || placement.student?.candidateName || 'Candidate',
  companyName: placement.companyName || placement.company?.companyName || 'Company',
  offeredSalaryPM: numeric(placement.offeredSalaryPM),
  earningPercent: numeric(placement.earningPercent || placement.commissionPercent),
  earningAmount: numeric(placement.earningAmount || placement.commissionAmount),
  earningStatus: placement.earningStatus || placement.commissionStatus || 'pending',
  earningPaidDate: placement.earningPaidDate || placement.commissionPaidDate,
  selectionStatus: placement.selectionStatus,
  processStage: placement.processStage
})

const candidateToEarningRow = (student) => {
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
    _id: `candidate-${student._id}`,
    rowId: `candidate-${student._id}`,
    recordType: 'candidate',
    studentName: student.candidateName || 'Candidate',
    companyName: 'Admin update',
    jobProfile: student.appliedFor || '',
    offeredSalaryPM: salary,
    earningPercent: percent,
    earningAmount: amount,
    earningStatus: commission.paymentStatus || 'pending',
    earningPaidDate: commission.paidAt,
    selectionStatus: student.selectionStatus || student.status,
    processStage: '',
    createdAt: student.updatedAt || student.createdAt
  }
}

export default function Earnings() {
  const token = useSelector((state) => state.auth.token)
  const [students, setStudents] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePlacement, setActivePlacement] = useState(null)

  const loadPlacements = async () => {
    const [placementRes, studentRes] = await Promise.all([api.get('/placements/my'), api.get('/students')])
    setPlacements(placementRes.data)
    setStudents(studentRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadPlacements().catch(() => {
      toast.error('Could not load earning records')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    localStorage.setItem('ba_earnings_last_visited', new Date().toISOString())
    window.dispatchEvent(new Event('ba-earnings-visited'))
  }, [placements.length])

  useEffect(() => {
    if (!token) return undefined
    connectSocket(token)

    const handlePlacement = async (payload) => {
      toast.success(`New earning - ${formatMoney(payload.earningAmount || payload.commissionAmount)} for ${payload.studentName || 'candidate'}!`)
      await loadPlacements()
    }

    const handlePlacementUpdated = async () => {
      await loadPlacements()
    }

    const handlePaid = async (payload) => {
      toast.success(
        `${formatMoney(payload.earningAmount || payload.commissionAmount)} for ${payload.studentName || 'candidate'} has been paid!`
      )
      await loadPlacements()
    }

    socket.on('my_placement', handlePlacement)
    socket.on('placement_updated', handlePlacementUpdated)
    socket.on('placement_deleted', handlePlacementUpdated)
    socket.on('earning_paid', handlePaid)
    socket.on('commission_paid', handlePaid)
    socket.on('student_updated', handlePlacementUpdated)
    socket.on('candidate_updated', handlePlacementUpdated)

    return () => {
      socket.off('my_placement', handlePlacement)
      socket.off('placement_updated', handlePlacementUpdated)
      socket.off('placement_deleted', handlePlacementUpdated)
      socket.off('earning_paid', handlePaid)
      socket.off('commission_paid', handlePaid)
      socket.off('student_updated', handlePlacementUpdated)
      socket.off('candidate_updated', handlePlacementUpdated)
      disconnectSocket()
    }
  }, [token])

  const earningRows = useMemo(() => {
    const placedCandidateIds = new Set(placements.map(placementCandidateId).filter(Boolean))
    const placementRows = placements.map(placementToEarningRow)
    const candidateRows = students
      .filter((student) => !placedCandidateIds.has(String(student._id)))
      .map(candidateToEarningRow)
      .filter(Boolean)

    return [...placementRows, ...candidateRows].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )
  }, [placements, students])

  const summary = useMemo(() => {
    const studentsPlaced = earningRows.length
    const totalIEarn = earningRows.reduce((sum, placement) => sum + numeric(placement.earningAmount), 0)
    const received = earningRows
      .filter((placement) => placement.earningStatus === 'paid')
      .reduce((sum, placement) => sum + numeric(placement.earningAmount), 0)
    const pending = totalIEarn - received

    return { studentsPlaced, totalIEarn, received, pending }
  }, [earningRows])

  if (loading) {
    return <Skeleton rows={10} />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">My Earnings</h1>
        <p className="mt-1 text-sm text-slate-500">Once candidates are placed, your earnings and payouts appear here live.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <SummaryCard label="Candidates Placed" value={summary.studentsPlaced} />
        <SummaryCard label="Total I Earn" value={formatMoney(summary.totalIEarn)} />
        <SummaryCard label="Received" value={formatMoney(summary.received)} />
        <SummaryCard label="Pending Payment" value={formatMoney(summary.pending)} />
      </div>

      <div className="space-y-3 md:hidden">
        {earningRows.map((placement) => {
          const earning = placement.earningAmount || 0
          const paymentStatus = placement.earningStatus
          const paidDate = placement.earningPaidDate

          return (
            <button
              key={placement.rowId || placement._id}
              type="button"
              onClick={() => setActivePlacement(placement)}
              className="w-full rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{placement.studentName || 'Candidate'}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{placement.companyName || 'Company'}</p>
                </div>
                <PaymentBadge status={paymentStatus} paidDate={paidDate} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2">
                <MobileField label="I Earn" value={formatMoney(earning)} strong />
                <MobileField label="Offered Salary" value={`${formatMoney(placement.offeredSalaryPM || 0)} PM`} />
                <MobileField label="My %" value={`${placement.earningPercent || 0}%`} />
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-[11px] font-bold uppercase text-slate-500">Selection</dt>
                  <dd className="mt-1"><SelectionBadge status={placement.selectionStatus} /></dd>
                </div>
              </dl>

              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-bold uppercase text-slate-500">Next Process</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{processStageLabel[placement.processStage] || placement.processStage || '-'}</p>
              </div>
            </button>
          )
        })}
        {!earningRows.length ? (
          <div className="rounded-xl bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No earnings yet. Once your referred candidates are placed by the admin, your earnings will appear here.
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Offered Salary</th>
                <th className="px-5 py-3">My %</th>
                <th className="px-5 py-3">I Earn</th>
                <th className="px-5 py-3">Selection Status</th>
                <th className="px-5 py-3">Next Process</th>
                <th className="px-5 py-3">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {earningRows.map((placement) => {
                const earning = placement.earningAmount || 0
                const paymentStatus = placement.earningStatus
                const paidDate = placement.earningPaidDate

                return (
                  <tr
                    key={placement.rowId || placement._id}
                    onClick={() => setActivePlacement(placement)}
                    className="cursor-pointer odd:bg-white even:bg-slate-50 hover:bg-indigo-50"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {placement.studentName || 'Candidate'}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {placement.companyName || 'Company'}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{formatMoney(placement.offeredSalaryPM || 0)} PM</td>
                    <td className="px-5 py-3 text-slate-700">{placement.earningPercent || 0}%</td>
                    <td className="px-5 py-3 font-semibold text-emerald-700">{formatMoney(earning)}</td>
                    <td className="px-5 py-3">
                      <SelectionBadge status={placement.selectionStatus} />
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {processStageLabel[placement.processStage] || placement.processStage || '-'}
                    </td>
                    <td className="px-5 py-3">
                      <PaymentBadge status={paymentStatus} paidDate={paidDate} />
                    </td>
                  </tr>
                )
              })}
              {earningRows.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    No earnings yet. Once your referred candidates are placed by the admin, your earnings will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activePlacement && (
        <EarningDetailModal placement={activePlacement} onClose={() => setActivePlacement(null)} />
      )}
    </div>
  )
}

function EarningDetailModal({ placement, onClose }) {
  const offered = Number(placement.offeredSalaryPM || 0)
  const percent = Number(placement.earningPercent || 0)
  const amount = Number(placement.earningAmount || 0)
  const paidDate = placement.earningPaidDate
  const paymentStatus = placement.earningStatus

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[94vw] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              {placement.studentName || 'Placement'}
            </h2>
            <p className="text-sm text-slate-500">{placement.companyName || 'Company'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5 sm:py-5">
          <Info label="Job Profile" value={placement.jobProfile} />
          <Info label="Offered Salary PM" value={`${formatMoney(offered)} PM`} />
          <Info
            label="Joining Date"
            value={placement.joiningDate ? format(new Date(placement.joiningDate), 'dd MMM yyyy') : 'Not set'}
            icon={Calendar}
          />
          <Info label="Selection Status" value={selectionStatusLabel[placement.selectionStatus]} />
          <Info label="Next Process" value={processStageLabel[placement.processStage] || placement.processStage} />
          <Info
            label="Appointment Letter Date"
            value={placement.appointmentLetterDate ? format(new Date(placement.appointmentLetterDate), 'dd MMM yyyy') : 'Not set'}
          />
          <Info label="Interview Mode" value={placement.interviewMode} />
          <Info
            label="Interview Date"
            value={placement.interviewDate ? format(new Date(placement.interviewDate), 'dd MMM yyyy') : 'Not set'}
          />
          <Info label="Earning %" value={`${percent}%`} icon={IndianRupee} />
          <Info label="I Earn" value={formatMoney(amount)} />
          <Info label="Formula" value={`${percent}% of ${formatMoney(offered)} = ${formatMoney(amount)}`} />
          <Info
            label="Payment"
            value={paymentStatus === 'paid' ? `Paid${paidDate ? ` on ${format(new Date(paidDate), 'dd MMM yyyy')}` : ''}` : 'Pending'}
          />
          <Info label="Process Notes" value={placement.processNotes} />
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <p className="text-xs font-semibold leading-5 text-slate-500 sm:text-sm">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 sm:mt-3 sm:text-2xl">{value}</p>
    </div>
  )
}

function MobileField({ label, value, strong = false }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-[11px] font-bold uppercase text-slate-500">{label}</dt>
      <dd className={`mt-1 break-words text-sm ${strong ? 'font-bold text-emerald-700' : 'font-medium text-slate-800'}`}>{value}</dd>
    </div>
  )
}

function SelectionBadge({ status }) {
  const color =
    status === 'joined'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'done'
        ? 'bg-emerald-100 text-emerald-700'
      : status === 'selected'
        ? 'bg-blue-100 text-blue-700'
        : status === 'in_review'
          ? 'bg-blue-100 text-blue-700'
        : status === 'rejected'
          ? 'bg-rose-100 text-rose-700'
          : status === 'on_hold' || status === 'priority'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-100 text-slate-700'

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${color}`}>{selectionStatusLabel[status] || status}</span>
}

function PaymentBadge({ status, paidDate }) {
  return (
    <div>
      <span
        className={`rounded-full px-2 py-1 text-xs font-semibold ${
          status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}
      >
        {status === 'paid' ? 'Paid' : 'Pending'}
      </span>
      {status === 'paid' && paidDate ? (
        <p className="mt-1 text-xs text-emerald-700">{format(new Date(paidDate), 'dd MMM yyyy')}</p>
      ) : null}
    </div>
  )
}

function Info({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">
        {Icon ? <Icon className="mr-1.5 inline h-4 w-4 text-slate-400" /> : null}
        {value || 'Not provided'}
      </p>
    </div>
  )
}
