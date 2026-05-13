import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Eye, Trash2, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import socket from '../../socket'
import DetailDrawer from '../../components/DetailDrawer'
import StatusBadge, { statusLabel } from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'
import { PromptDialog } from '../../components/ActionDialogs'
import Pagination from '../../components/Pagination'

const selectionStatusColors = {
  shortlisted: 'bg-slate-100 text-slate-700',
  selected: 'bg-emerald-100 text-emerald-700',
  joined: 'bg-emerald-200 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-700',
  on_hold: 'bg-amber-100 text-amber-700'
}

const selectionStatusLabel = {
  shortlisted: 'Not Selected',
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

const candidateStatusOptions = [
  { value: 'not_viewed', label: 'Not Viewed' },
  { value: 'in_review', label: 'In Review' },
  { value: 'priority', label: 'Priority' },
  { value: 'done', label: 'Done' }
]

const earningStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' }
]

const safeDate = (value, formatStr = 'yyyy-MM-dd') => {
  if (!value) return ''

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? ''
    : format(date, formatStr)
}

const csvCell = (value) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`

const numeric = (value) => {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

const buildCandidateSearchText = (candidate) => {
  const placement = candidate.placement || {}

  return [
    candidate.candidateName,
    candidate.mobileNumber,
    candidate.aadhaarNo,
    candidate.whatsappNo,
    candidate.emailId,
    candidate.appliedFor,
    candidate.interestedDepartment,
    candidate.preferredIndustry,
    candidate.preferredJobLocation,
    candidate.education,
    candidate.currentCompany,
    candidate.currentJobLocation,
    candidate.careerSummary,
    candidate.reasonForJobChange,
    candidate.status,
    candidate.adminNotes,
    candidate.submittedBy?.name,
    candidate.submittedBy?.email,
    placement.companyId?.companyName,
    placement.jobProfile,
    placement.processStage,
    placement.selectionStatus,
    placement.earningStatus
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function Students() {
  const [searchParams] = useSearchParams()

  const [students, setStudents] = useState([])
  const [placements, setPlacements] = useState([])
  const [bas, setBas] = useState([])

  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    ba: searchParams.get('ba') || 'all'
  }))

  const [selected, setSelected] = useState(null)

  // NEW STATE
  const [drawerMode, setDrawerMode] = useState('view')
  const [statusUpdate, setStatusUpdate] = useState({
    open: false,
    student: null,
    placement: null,
    values: {
      status: 'not_viewed',
      salary: '',
      percent: '',
      earningStatus: 'pending'
    },
    saving: false
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

const [deletePrompt, setDeletePrompt] = useState({
  open: false,
  student: null
})

  const load = async () => {
    const [studentRes, baRes, placementRes] = await Promise.all([
      api.get('/students'),
      api.get('/ba/all'),
      api.get('/placements')
    ])

    setStudents(studentRes.data)
    setPlacements(placementRes.data)
    setBas(baRes.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const refresh = () => {
      load().catch(() => {})
    }

    socket.on('placement_created', refresh)
    socket.on('placement_updated', refresh)
    socket.on('placement_paid', refresh)
    socket.on('placement_deleted', refresh)
    socket.on('new_student', refresh)
    socket.on('student_updated', refresh)
    socket.on('student_deleted', refresh)

    return () => {
      socket.off('placement_created', refresh)
      socket.off('placement_updated', refresh)
      socket.off('placement_paid', refresh)
      socket.off('placement_deleted', refresh)
      socket.off('new_student', refresh)
      socket.off('student_updated', refresh)
      socket.off('student_deleted', refresh)
    }
  }, [])

  const placementCandidateId = (placement) =>
    placement.studentId?._id || placement.studentId || placement.candidateId?._id || placement.candidateId

  const placementByStudentId = useMemo(
    () =>
      new Map(
        placements
          .map((placement) => [
            String(placementCandidateId(placement) || ''),
            placement
          ])
          .filter(([studentId]) => studentId)
      ),
    [placements]
  )

  const openStatusUpdate = (student) => {
    const placement = placementByStudentId.get(student._id)
    const commission = student.advisorCommission || {}

    setStatusUpdate({
      open: true,
      student,
      placement,
      values: {
        status: student.status || 'not_viewed',
        salary:
          placement?.offeredSalaryPM !== undefined &&
          placement?.offeredSalaryPM !== null
            ? String(placement.offeredSalaryPM)
            : commission.salary !== undefined &&
                commission.salary !== null
              ? String(commission.salary)
              : '',
        percent:
          placement?.earningPercent !== undefined &&
          placement?.earningPercent !== null
            ? String(placement.earningPercent)
            : commission.percentage !== undefined &&
                commission.percentage !== null
              ? String(commission.percentage)
              : '',
        earningStatus:
          (placement?.earningStatus || commission.paymentStatus) === 'paid'
            ? 'paid'
            : 'pending'
      },
      saving: false
    })
  }

  const closeStatusUpdate = () => {
    setStatusUpdate((current) => ({
      ...current,
      open: false,
      student: null,
      placement: null,
      saving: false
    }))
  }

  const setStatusUpdateValue = (field, value) => {
    setStatusUpdate((current) => ({
      ...current,
      values: {
        ...current.values,
        [field]: value
      }
    }))
  }

  const saveStatusUpdate = async () => {
    const { student, placement, values } = statusUpdate
    if (!student) return

    const salary = values.salary === '' ? 0 : numeric(values.salary)
    const percent = values.percent === '' ? 0 : numeric(values.percent)

    if (salary < 0) {
      toast.error('Salary must be zero or more')
      return
    }

    if (percent < 0 || percent > 100) {
      toast.error('Advisor percentage must be between 0 and 100')
      return
    }

    setStatusUpdate((current) => ({
      ...current,
      saving: true
    }))

    try {
      const { data: updatedStudent } = await api.patch(
        `/students/${student._id}/status`,
        {
          status: values.status,
          advisorCommission: {
            salary,
            percentage: percent,
            paymentStatus:
              values.earningStatus === 'paid' ? 'paid' : 'pending'
          }
        }
      )

      let updatedPlacement = null

      if (placement?._id) {
        const { data } = await api.put(`/placements/${placement._id}`, {
          offeredSalaryPM: salary,
          earningPercent: percent,
          earningStatus:
            values.earningStatus === 'paid' ? 'paid' : 'pending'
        })

        updatedPlacement = data
      }

      setStudents((current) =>
        current.map((item) =>
          item._id === updatedStudent._id ? updatedStudent : item
        )
      )

      if (updatedPlacement) {
        setPlacements((current) =>
          current.map((item) =>
            item._id === updatedPlacement._id ? updatedPlacement : item
          )
        )
      }

      closeStatusUpdate()
      toast.success('Status update saved')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not save status update'
      )
      setStatusUpdate((current) => ({
        ...current,
        saving: false
      }))
    }
  }

  const commissionByStudentId = useMemo(
    () =>
      students.reduce((acc, student) => {
        const placement = placementByStudentId.get(student._id)
        const placementId = placement?._id
        const commission = student.advisorCommission || {}
        const hasCommission =
          Boolean(placementId) ||
          numeric(commission.salary) > 0 ||
          numeric(commission.percentage) > 0 ||
          numeric(commission.amount) > 0 ||
          commission.paymentStatus === 'paid'

        const salary =
          placement?.offeredSalaryPM !== undefined &&
          placement?.offeredSalaryPM !== null
            ? numeric(placement.offeredSalaryPM)
            : commission.salary !== undefined &&
                commission.salary !== null
              ? numeric(commission.salary)
              : numeric(student.currentSalary)

        const percent =
          placement?.earningPercent !== undefined &&
          placement?.earningPercent !== null
            ? numeric(placement.earningPercent)
            : commission.percentage !== undefined &&
                commission.percentage !== null
              ? numeric(commission.percentage)
              : 0

        const status =
          placement?.earningStatus || commission.paymentStatus || 'pending'

        acc[student._id] = {
          salary,
          percent,
          status,
          amount:
            placement?.earningAmount !== undefined &&
            placement?.earningAmount !== null
              ? numeric(placement.earningAmount)
              : commission.amount !== undefined &&
                  commission.amount !== null
                ? numeric(commission.amount)
                : Number(((salary * percent) / 100).toFixed(2)),
          hasCommission,
          placementId
        }
        return acc
      }, {}),
    [students, placementByStudentId]
  )

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase().trim()

    return students
      .map((student) => {
        const placement = placementByStudentId.get(student._id)

        return {
          ...student,
          placement,
          effectiveStatus:
            placement?.selectionStatus || student.selectionStatus || student.status
        }
      })
      .filter((student) =>
        search
          ? `${student.candidateName} ${student.mobileNumber}`
              .toLowerCase()
              .includes(search)
          : true
      )
      .filter((student) =>
        filters.status === 'all'
          ? true
          : student.effectiveStatus === filters.status
      )
      .filter((student) =>
        filters.ba === 'all'
          ? true
          : student.submittedBy?._id === filters.ba
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
      )
  }, [students, filters, placementByStudentId])

  useEffect(() => {
    setPage(1)
  }, [filters, pageSize])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const deleteStudent = async (student) => {
    if (!window.confirm(`Delete ${student.candidateName}?`))
      return

    try {
      await api.delete(`/students/${student._id}`)

      setStudents((current) =>
        current.filter((item) => item._id !== student._id)
      )

      toast.success('Student deleted')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not delete student'
      )
    }
  }

  const exportCsv = () => {
    try {
      const headers = [
        'Candidate Name',
        'Mobile',
        'WhatsApp',
        'Email',
        'Aadhaar',
        'Applied For',
        'Interested Department',
        'Preferred Industry',
        'Preferred Job Location',
        'Education',
        'Current Company',
        'Total Experience',
        'Current Salary',
        'Expected Salary',
        'Notice Period',
        'Current Job Location',
        'Marriage Status',
        'Submitted By',
        'Submitted Date',
        'Reference Status',
        'Selection Status',
        'Process Stage',
        'Company',
        'Job Profile',
        'Offered Salary PM',
        'Earning %',
        'Earning Amount',
        'Earning Status',
        'Joining Date',
        'Interview Date',
        'Interview Mode',
        'Admin Notes'
      ]

      const rows = filtered.map((student) => {
        const placement = student.placement || {}
        const commission = student.advisorCommission || {}

        return [
          student.candidateName,
          student.mobileNumber,
          student.whatsappNo,
          student.emailId,
          student.aadhaarNo,
          student.appliedFor,
          student.interestedDepartment,
          student.preferredIndustry,
          student.preferredJobLocation,
          student.education,
          student.currentCompany,
          student.totalExperience,
          student.currentSalary,
          student.expectedSalary,
          student.noticePeriod,
          student.currentJobLocation,
          student.marriageStatus,
          student.submittedBy?.name || 'BA',
          safeDate(student.createdAt),
          statusLabel(student.status),
          placement.selectionStatus
            ? selectionStatusLabel[
                placement.selectionStatus
              ] || placement.selectionStatus
            : '',
          placement.processStage
            ? processStageLabel[
                placement.processStage
              ] || placement.processStage
            : '',
          placement.companyId?.companyName || '',
          placement.jobProfile || '',
          placement.offeredSalaryPM ?? commission.salary ?? '',
          placement.earningPercent ?? commission.percentage ?? '',
          placement.earningAmount ?? commission.amount ?? '',
          placement.earningStatus || commission.paymentStatus || '',
          safeDate(placement.joiningDate),
          safeDate(placement.interviewDate),
          placement.interviewMode || '',
          student.adminNotes || ''
        ]
      })

      const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(','))
        .join('\n')

      const blob = new Blob([`\uFEFF${csv}`], {
        type: 'text/csv;charset=utf-8;'
      })

      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)

      link.download = `student-references-${
        safeDate(new Date()) || 'export'
      }.csv`

      link.click()

      URL.revokeObjectURL(link.href)

      toast.success('Student export downloaded')
    } catch (_error) {
      toast.error('Could not export candidate data')
    }
  }

  if (loading) return <Skeleton rows={9} />

  return (
    <div className="space-y-4 sm:space-y-6">
      <Header
        title="Students"
        subtitle="Search, filter, view, update status, export, and delete student references."
        onExport={exportCsv}
      />

      <Filters
        filters={filters}
        setFilters={setFilters}
        bas={bas}
        searchPlaceholder="Search by name or mobile"
      />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Applied For</th>
                <th className="px-5 py-3">Submitted By</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Commission</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginated.map((student) => (
                <tr
                  key={student._id}
                  className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40"
                >
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {student.candidateName}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {student.mobileNumber}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {student.appliedFor || 'Not provided'}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {student.submittedBy?.name || 'BA'}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {format(
                      new Date(student.createdAt),
                      'dd MMM yyyy'
                    )}
                  </td>

                  <td className="px-5 py-3">
                    {student.placement?.selectionStatus || student.selectionStatus ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          selectionStatusColors[
                            student.placement?.selectionStatus || student.selectionStatus
                          ] ||
                          selectionStatusColors.shortlisted
                        }`}
                      >
                        {selectionStatusLabel[
                          student.placement?.selectionStatus || student.selectionStatus
                        ] ||
                          (student.placement?.selectionStatus || student.selectionStatus)}
                      </span>
                    ) : (
                      <StatusBadge status={student.status} />
                    )}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {commissionByStudentId[student._id]?.hasCommission ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900">
                          ₹{commissionByStudentId[student._id].amount}
                        </div>
                        <div className="text-xs text-slate-500">
                          {commissionByStudentId[student._id].percent}% /{' '}
                          {commissionByStudentId[student._id].status === 'paid'
                            ? 'Paid'
                            : 'Pending'}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">

                      {/* VIEW BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerMode('view')
                          setSelected(student)
                        }}
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                        aria-label="View student"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>

                      {/* EDIT BUTTON */}
                      <button
                        type="button"
                        onClick={() => openStatusUpdate(student)}
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                        aria-label="Update status and advisor payment"
                      >
                        <Pencil className="h-4 w-4" />
                        Update
                      </button>

                      {/* DELETE BUTTON */}
                      <button
                        type="button"
                       onClick={() =>
  setDeletePrompt({
    open: true,
    student
  })
}
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                        aria-label="Delete student"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>

                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No matching student references.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={filtered.length} itemLabel="candidates" onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

     <DetailDrawer
  open={Boolean(selected)}
  item={selected}
  type="student"
  mode="view"
  onClose={() => setSelected(null)}
  adminControls={false}
  fullEdit={false}
  studentPanelView
/>
      <StatusUpdateDialog
        open={statusUpdate.open}
        student={statusUpdate.student}
        placement={statusUpdate.placement}
        values={statusUpdate.values}
        saving={statusUpdate.saving}
        onChange={setStatusUpdateValue}
        onCancel={closeStatusUpdate}
        onConfirm={saveStatusUpdate}
      />
      <PromptDialog
        open={deletePrompt.open}
        title="Delete Candidate"
        message={`Type DELETE to confirm deleting ${deletePrompt.student?.candidateName || 'this candidate'}. Linked process-panel data will also be removed.`}
        placeholder="Type DELETE"
        confirmText="Delete"
        inputType="text"
        onCancel={() => setDeletePrompt({ open: false, student: null })}
        onConfirm={async (value) => {
          if (String(value || '').trim().toUpperCase() !== 'DELETE') {
            toast.error('Please type DELETE to confirm')
            return
          }
          const student = deletePrompt.student
          setDeletePrompt({ open: false, student: null })
          if (student) {
            await deleteStudent(student)
          }
        }}
      />
    </div>
  )
}

function StatusUpdateDialog({
  open,
  student,
  placement,
  values,
  saving,
  onChange,
  onCancel,
  onConfirm
}) {
  if (!open || !student) return null

  const salary = numeric(values.salary)
  const percent = numeric(values.percent)
  const amount = Number(((salary * percent) / 100).toFixed(2))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-2 sm:p-4">
      <div className="max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">
            Update Status
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {student.candidateName} - {student.mobileNumber}
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Candidate Status
            </span>
            <select
              value={values.status}
              onChange={(event) =>
                onChange('status', event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            >
              {candidateStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Salary
            </span>
            <input
              type="number"
              min="0"
              value={values.salary}
              onChange={(event) =>
                onChange('salary', event.target.value)
              }
              placeholder="Monthly salary"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Advisor Percentage
            </span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={values.percent}
              onChange={(event) =>
                onChange('percent', event.target.value)
              }
              placeholder="0 to 100"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Payment Status
            </span>
            <select
              value={values.earningStatus}
              onChange={(event) =>
                onChange('earningStatus', event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            >
              {earningStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 sm:col-span-2">
            <div className="text-xs font-semibold uppercase text-slate-500">
              Advisor Amount
            </div>
            <div className="mt-1 text-xl font-bold text-slate-950">
              ₹{amount}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Update'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Header({ title, subtitle, onExport }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 sm:w-auto"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </button>
    </div>
  )
}

function Filters({
  filters,
  setFilters,
  bas,
  searchPlaceholder
}) {
  return (
    <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
      <input
        value={filters.search}
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            search: event.target.value
          }))
        }
        placeholder={searchPlaceholder}
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />

      <select
        value={filters.status}
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            status: event.target.value
          }))
        }
        className="rounded-lg border border-slate-300 px-3 py-2"
      >
        <option value="all">All Statuses</option>
        <option value="shortlisted">Not Selected</option>
        <option value="selected">Selected</option>
        <option value="joined">Joined</option>
        <option value="rejected">Rejected</option>
      </select>

      <select
        value={filters.ba}
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            ba: event.target.value
          }))
        }
        className="rounded-lg border border-slate-300 px-3 py-2"
      >
        <option value="all">All BAs</option>

        {bas.map((ba) => (
          <option
            key={ba.userId?._id || ba._id}
            value={ba.userId?._id}
          >
            {ba.userId?.name || ba.fullName}
          </option>
        ))}
      </select>
    </div>
  )
}
