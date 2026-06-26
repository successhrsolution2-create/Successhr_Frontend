import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, Download, Eye, Filter, Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2, Upload, UserRoundPlus, Users } from 'lucide-react'
import { PromptDialog } from '../../../components/ActionDialogs'
import Pagination from '../../../components/Pagination'
import api from '../../../api/axios'
import { createCandidateBlankTemplatePdf, downloadBlob } from './AddCandidate'

const isChecked = (value) => Boolean(value?.checked ?? value)

const dateKey = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const registrationDateTime = (value) => {
  if (!value) return { date: '-', time: '' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: '-', time: '' }

  return {
    date: date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}

const fallbackCode = (item, index = 0, total = 0) => {
  const storedCode = String(item?.candidateCode || '').trim().toUpperCase()
  if (/^SC-\d+$/.test(storedCode)) return storedCode

  const sequence = total > 0 ? total - index : index + 1
  return `SC-${Math.max(sequence, 1)}`
}

const textValue = (value) => String(value ?? '').trim()

const selectedOptionValue = (value, otherValue) => {
  const text = textValue(value)
  return text === 'Other' ? textValue(otherValue) : text
}

const visitHasContent = (visit = {}) =>
  Boolean(
    textValue(visit.visitDateTime || visit.dateTime || visit.date) ||
      textValue(visit.purpose) ||
      textValue(visit.purposeOther) ||
      textValue(visit.meetingStaffName || visit.staffName) ||
      textValue(visit.communicationDetails || visit.communication)
  )

const candidateVisitsFromItem = (item = {}) => {
  const rootVisits = Array.isArray(item.candidateVisits) ? item.candidateVisits : []
  const applicationVisits = Array.isArray(item.applicationDetails?.candidateVisits)
    ? item.applicationDetails.candidateVisits
    : []
  return (rootVisits.length ? rootVisits : applicationVisits)
    .map((visit) => ({
      id: visit?._id || visit?.id || '',
      visitDateTime: textValue(visit?.visitDateTime || visit?.dateTime || visit?.date),
      purpose: textValue(visit?.purpose),
      purposeOther: textValue(visit?.purposeOther),
      meetingStaffName: textValue(visit?.meetingStaffName || visit?.staffName),
      communicationDetails: textValue(visit?.communicationDetails || visit?.communication)
    }))
    .filter(visitHasContent)
}

const lastCandidateVisit = (visits = []) => {
  const filledVisits = (Array.isArray(visits) ? visits : []).filter(visitHasContent)
  return filledVisits.length ? filledVisits[filledVisits.length - 1] : null
}

const formatVisitDateTime = (value) => {
  const raw = textValue(value)
  if (!raw) return { date: '-', time: '' }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return { date: raw, time: '' }

  return {
    date: date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}

const highestEducationFromText = (value) => {
  const education = textValue(value)
  const match = education.match(
    /Highest Education(?: Like Graduate, Post Graduate)?:\s*(.*?)(?:\s*(?:Passing Year of Education|Education Branch|Education Specialization):|$)/is
  )

  return textValue(match?.[1] || education)
}

const highestEducationFromCandidate = (item) => {
  const educationDetails = item?.applicationDetails?.education || {}
  const explicitValue = [
    educationDetails.highestEducation,
    selectedOptionValue(educationDetails.educationSector, educationDetails.educationSectorOther),
    selectedOptionValue(item?.educationSector, item?.educationSectorOther)
  ]
    .map(textValue)
    .find(Boolean)

  if (explicitValue) return explicitValue

  return highestEducationFromText(item?.education)
}

const uniqueSortedText = (values) => {
  const seen = new Set()
  return (Array.isArray(values) ? values : [])
    .map((value) => textValue(value))
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
}

const toLegacyShape = (item, index = 0, total = 0) => ({
  id: item._id,
  code: fallbackCode(item, index, total),
  formMeta: item.formMeta || {},
  fullName: item.fullName || '',
  collegeName: item.collegeName || '',
  mobile: item.mobileNumber || '',
  aadhaarNo: item.aadhaarNo || '',
  whatsappNo: item.whatsappNo || '',
  email: item.emailId || '',
  dob: item.dateOfBirth ? String(item.dateOfBirth).slice(0, 10) : '',
  gender: item.gender || '',
  currentLocation: item.currentAddress || '',
  education: item.education || '',
  highestEducation: highestEducationFromCandidate(item),
  experience: item.totalExperience ?? '',
  experienceDepartment: item.experienceDepartment || '',
  currentSalary: item.currentSalary || '',
  expectedSalary: item.expectedSalary || '',
  noticePeriod: item.noticePeriod || '',
  jobType: item.currentDesignation || item.appliedFor || '',
  jobRole: item.appliedFor || item.currentDesignation || '',
  appliedFor: item.appliedFor || item.currentDesignation || '',
  department: item.interestedDepartment || item.specialization || '',
  preferredLocation: item.preferredJobLocation || item.preferredLocation || '',
  currentJobLocation: item.currentJobLocation || '',
  currentJobLocationOther: item.currentJobLocationOther || '',
  currentJobLocationMidcArea: item.currentJobLocationMidcArea || '',
  currentJobLocationMidcAreaOther: item.currentJobLocationMidcAreaOther || '',
  reasonForJobChange: item.reasonForJobChange || '',
  familyDetails: item.familyDetails || {},
  goalAim: item.goalAim || '',
  interviewForm: item.interviewForm || {},
  skills: Array.isArray(item.keySkills) ? item.keySkills : [],
  languages: Array.isArray(item.languagesKnown) ? item.languagesKnown : [],
  referenceSource:
    item.referenceName ||
    item.advisor?.name ||
    (item.intakeType === 'advisor' ? 'Advisor' : item.intakeType === 'walkin' ? 'Walk-in' : ''),
  additionalNotes: item.careerSummary || '',
  remarks: item.remarks || {},
  successUpdate: item.successUpdate || item.successRemarks || {},
  selectionStatus: item.selectionStatus || item.placement?.selectionStatus || '',
  candidateVisits: candidateVisitsFromItem(item),
  interviews: Array.isArray(item.interviews) ? item.interviews.map(toLegacyInterviewShape) : [],
  interviewCount: Number(item.interviewCount || item.interviews?.length || 0),
  createdAt: item.createdAt
})

const toLegacyInterviewShape = (row) => ({
  id: row?._id || row?.id || '',
  companyName: row?.companyName || '',
  jobRole: row?.jobRole || '',
  referencePerson: row?.referencePerson || row?.reference || '',
  attendInterview: row?.attendInterview || '',
  interestedForJoin: row?.interestedForJoin || '',
  date: row?.date || (row?.interviewDate ? String(row.interviewDate).slice(0, 10) : ''),
  selectionChances: row?.selectionChances || '',
  ratingForCompany: row?.ratingForCompany ?? '',
  notAttendRemark: row?.notAttendRemark || '',
  notInterestedReason: row?.notInterestedReason || '',
  replyFromCompany: row?.replyFromCompany || '',
  positiveFeedback: row?.positiveFeedback || '',
  negativeFeedback: row?.negativeFeedback || '',
  overallDiscussion: row?.overallDiscussion || row?.remark || '',
  note: row?.note || '',
  updatedBy: row?.updatedBy || '',
  status: row?.status || row?.result || 'Pending'
})

const hasInterviewActivity = (candidate) =>
  Number(candidate.interviewCount || 0) > 0 || (Array.isArray(candidate.interviews) && candidate.interviews.length > 0)

const isSelectedCandidate = (candidate) => {
  const success = candidate.successUpdate || {}
  const stage = String(candidate.selectionStatus || '').toLowerCase()
  return isChecked(success.selected) || stage === 'selected'
}

const avatarPalette = [
  'bg-violet-100 text-violet-600',
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-fuchsia-100 text-fuchsia-600'
]

const metricTone = {
  violet: 'border-violet-100 bg-violet-50 text-violet-700',
  blue: 'border-blue-100 bg-blue-50 text-blue-700',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  orange: 'border-orange-100 bg-orange-50 text-orange-700'
}

const defaultCandidateFilters = {
  candidateId: '',
  jobRole: '',
  gender: '',
  education: ''
}

const defaultFilterOptions = {
  candidateIds: [],
  jobRoles: [],
  genders: [],
  educations: []
}

const defaultDateRange = {
  from: '',
  to: ''
}

const fallbackGenderOptions = ['Male', 'Female', 'Other']

const importText = (value) => {
  if (value === null || value === undefined) return '-'
  if (Array.isArray(value)) return value.join(', ') || '-'
  return String(value).trim() || '-'
}

function MetricChip({ icon: Icon, label, value, tone = 'violet', active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition hover:border-[#0b65ac] hover:bg-[#eef6ff] ${
        active ? 'border-[#0b65ac] bg-[#eef6ff] ring-2 ring-[#d9ecff]' : ''
      } ${metricTone[tone]}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      <span className="text-xs font-bold text-slate-950">{value}</span>
    </button>
  )
}

function CandidateFilterSelect({ label, value, options, onChange }) {
  return (
    <select
      aria-label={`Filter by ${label}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 min-w-0 rounded-md border border-[#d4dde8] bg-white px-3 text-[13px] font-medium text-slate-900 outline-none transition focus:border-[#0b65ac] focus:ring-2 focus:ring-[#d9ecff]"
    >
      <option value="">All {label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function ImportPreviewDialog({ preview, confirming, onCancel, onConfirm, onRemoveRow }) {
  if (!preview) return null

  const rows = Array.isArray(preview.previewRows) ? preview.previewRows : []
  const failedRows = Array.isArray(preview.failedRows) ? preview.failedRows : []
  const skippedRows = Array.isArray(preview.skippedRows) ? preview.skippedRows : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-950">Import Preview</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review Excel rows before adding them to candidate records.
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-400">{preview.fileName}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-600 sm:flex">
              <span className="rounded-lg bg-slate-100 px-3 py-2">Total {preview.totalRows || 0}</span>
              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">Ready {rows.length}</span>
              <span className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">Issues {failedRows.length + skippedRows.length}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 py-3">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-[32%] px-3 py-3">Candidate</th>
                    <th className="w-[18%] px-3 py-3">Mobile</th>
                    <th className="w-[34%] px-3 py-3">Email</th>
                    <th className="w-[16%] px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => {
                    const payload = row.payload || {}
                    return (
                      <tr key={`${row.rowNumber}-${index}`} className="odd:bg-white even:bg-slate-50">
                        <td className="px-3 py-3">
                          <span className="block truncate font-semibold text-slate-950" title={importText(payload.fullName)}>
                            {importText(payload.fullName)}
                          </span>
                          <span className="mt-0.5 block text-xs font-semibold text-slate-400">Excel row {row.rowNumber}</span>
                        </td>
                        <td className="truncate px-3 py-3 text-slate-700" title={importText(payload.mobileNumber)}>
                          {importText(payload.mobileNumber)}
                        </td>
                        <td className="truncate px-3 py-3 text-slate-700" title={importText(payload.emailId)}>
                          {importText(payload.emailId)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            disabled={confirming}
                            onClick={() => onRemoveRow(index)}
                            className="inline-flex h-8 min-w-20 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-rose-50 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                        No valid rows selected for import.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {(failedRows.length || skippedRows.length) ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <p className="font-bold">Rows not ready for import</p>
              <div className="mt-2 grid gap-2 lg:grid-cols-2">
                {skippedRows.map((row, index) => (
                  <p key={`skipped-${row.row}-${index}`} className="rounded-md bg-white/70 px-2 py-1">
                    Row {row.row}: {row.reason}
                  </p>
                ))}
                {failedRows.map((row, index) => (
                  <p key={`failed-${row.row}-${index}`} className="rounded-md bg-white/70 px-2 py-1">
                    Row {row.row}: {(row.errors || []).join(', ') || 'Could not import'}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={confirming}
            onClick={onCancel}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={confirming || rows.length === 0}
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {confirming ? 'Importing...' : `OK, Import ${rows.length} Record${rows.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CandidatesList() {
  const navigate = useNavigate()
  const importInputRef = useRef(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [candidateFilters, setCandidateFilters] = useState(defaultCandidateFilters)
  const [filterOptions, setFilterOptions] = useState(defaultFilterOptions)
  const [deleting, setDeleting] = useState(null)
  const [deletingWithPassword, setDeletingWithPassword] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [visitDateRange, setVisitDateRange] = useState(defaultDateRange)
  const [importing, setImporting] = useState(false)
  const [confirmingImport, setConfirmingImport] = useState(false)
  const [importPreview, setImportPreview] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [tileFilter, setTileFilter] = useState('all')
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [stats, setStats] = useState({ total: 0, newToday: 0, selected: 0, activeInterviews: 0 })
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([])

  const loadCandidates = useCallback(async (targetPage = page) => {
    try {
      setLoading(true)
      const { data } = await api.get('/cms/candidates', {
        params: {
          paginated: 'true',
          page: targetPage,
          pageSize,
          search: search.trim() || undefined,
          candidateId: candidateFilters.candidateId || undefined,
          jobRole: candidateFilters.jobRole || undefined,
          gender: candidateFilters.gender || undefined,
          education: candidateFilters.education || undefined,
          dateFrom: dateRange.from || undefined,
          dateTo: dateRange.to || undefined,
          visitDateFrom: visitDateRange.from || undefined,
          visitDateTo: visitDateRange.to || undefined,
          tile: tileFilter === 'all' ? undefined : tileFilter
        }
      })
      const rows = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
      const total = Number(data?.total ?? rows.length)
      const totalPages = Math.max(1, Math.ceil(total / pageSize))

      if (targetPage > totalPages) {
        setPage(totalPages)
        return
      }

      setCandidates(rows.map((item, index) => toLegacyShape(item, index, total)))
      setTotalCandidates(total)
      setStats(data?.stats || { total, newToday: 0, selected: 0, activeInterviews: 0 })
      setFilterOptions({
        candidateIds: Array.isArray(data?.filterOptions?.candidateIds) ? data.filterOptions.candidateIds : [],
        jobRoles: Array.isArray(data?.filterOptions?.jobRoles) ? data.filterOptions.jobRoles : [],
        genders: Array.isArray(data?.filterOptions?.genders) ? data.filterOptions.genders : [],
        educations: uniqueSortedText(
          Array.isArray(data?.filterOptions?.educations) ? data.filterOptions.educations.map(highestEducationFromText) : []
        )
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }, [candidateFilters, dateRange, page, pageSize, search, tileFilter, visitDateRange])

  useEffect(() => {
    loadCandidates(page)
  }, [loadCandidates, page])

  useEffect(() => {
    setPage(1)
  }, [candidateFilters, search, dateRange, pageSize, tileFilter, visitDateRange])

  const paginated = candidates
  const visibleCandidateIds = paginated.map((candidate) => candidate.id).filter(Boolean)
  const selectedVisibleCandidateIds = selectedCandidateIds.filter((id) => visibleCandidateIds.includes(id))
  const allVisibleCandidatesSelected = visibleCandidateIds.length > 0 && selectedVisibleCandidateIds.length === visibleCandidateIds.length

  useEffect(() => {
    const visibleIds = new Set(candidates.map((candidate) => candidate.id).filter(Boolean))
    setSelectedCandidateIds((current) => current.filter((id) => visibleIds.has(id)))
  }, [candidates])

  const resetFilters = () => {
    setDateRange(defaultDateRange)
    setVisitDateRange(defaultDateRange)
    setSearch('')
    setCandidateFilters(defaultCandidateFilters)
    setTileFilter('all')
  }

  const updateCandidateFilter = (key, value) => {
    setCandidateFilters((current) => ({
      ...current,
      [key]: value
    }))
  }

  const updateDateRange = (key, value) => {
    setDateRange((current) => ({
      ...current,
      [key]: value
    }))
  }

  const updateVisitDateRange = (key, value) => {
    setVisitDateRange((current) => ({
      ...current,
      [key]: value
    }))
  }

  const toggleCandidateSelection = (candidateId, checked) => {
    if (!candidateId) return

    setSelectedCandidateIds((current) => {
      if (checked) return current.includes(candidateId) ? current : [...current, candidateId]
      return current.filter((id) => id !== candidateId)
    })
  }

  const toggleVisibleCandidateSelection = (checked) => {
    const visibleIds = new Set(visibleCandidateIds)

    setSelectedCandidateIds((current) => {
      if (checked) return Array.from(new Set([...current, ...visibleCandidateIds]))
      return current.filter((id) => !visibleIds.has(id))
    })
  }

  const handleDelete = async (password) => {
    if (!deleting?.id) return
    const superAdminPassword = String(password || '').trim()
    if (!superAdminPassword) {
      toast.error('Super admin password is required')
      return
    }

    setDeletingWithPassword(true)
    try {
      const { data } = await api.post('/auth/director-assessment-unlock', { password: superAdminPassword })
      const approvalToken = data?.token
      if (!approvalToken) {
        toast.error('Super admin approval failed')
        return
      }

      await api.delete(`/cms/candidates/${deleting.id}`, {
        headers: {
          'x-director-assessment-approval': approvalToken
        }
      })
      await loadCandidates(page)
      setSelectedCandidateIds((current) => current.filter((id) => id !== deleting.id))
      toast.success('Candidate deleted')
      setDeleting(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete candidate')
    } finally {
      setDeletingWithPassword(false)
    }
  }

  const requestBulkDelete = () => {
    if (selectedVisibleCandidateIds.length === 0) {
      toast.error('Select candidates to delete')
      return
    }

    setBulkDeleteOpen(true)
  }

  const handleBulkDelete = async (password) => {
    const idsToDelete = [...selectedVisibleCandidateIds]
    if (idsToDelete.length === 0) {
      toast.error('Select candidates to delete')
      return
    }

    const superAdminPassword = String(password || '').trim()
    if (!superAdminPassword) {
      toast.error('Super admin password is required')
      return
    }

    setBulkDeleting(true)
    try {
      const { data } = await api.post('/auth/director-assessment-unlock', { password: superAdminPassword })
      const approvalToken = data?.token
      if (!approvalToken) {
        toast.error('Super admin approval failed')
        return
      }

      const response = await api.delete('/cms/candidates/bulk', {
        data: { ids: idsToDelete },
        headers: {
          'x-director-assessment-approval': approvalToken
        }
      })

      const nextPage = idsToDelete.length >= visibleCandidateIds.length && page > 1 ? page - 1 : page
      setSelectedCandidateIds([])
      setBulkDeleteOpen(false)
      setPage(nextPage)
      await loadCandidates(nextPage)

      const deletedCount = Number(response.data?.deletedCount || idsToDelete.length)
      toast.success(`${deletedCount} candidate${deletedCount === 1 ? '' : 's'} deleted`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete selected candidates')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast.error('Please select a .xlsx Excel file')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    setImporting(true)

    try {
      const { data } = await api.post('/cms/candidates/import/preview', formData)
      setImportPreview({ ...data, fileName: file.name })
      const readyCount = Number(data.importableCount || data.previewRows?.length || 0)
      if (readyCount) {
        toast.success(`${readyCount} row${readyCount === 1 ? '' : 's'} ready to review`)
      } else {
        toast.error('No valid rows found for import')
      }
    } catch (error) {
      const message = error.response?.data?.message
      if (message) {
        toast.error(message)
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Backend is not running on port 5000')
      } else {
        toast.error('Could not import Excel')
      }
    } finally {
      setImporting(false)
    }
  }

  const removeImportPreviewRow = (indexToRemove) => {
    setImportPreview((current) => {
      if (!current) return current
      const rows = Array.isArray(current.previewRows) ? current.previewRows : []
      return {
        ...current,
        previewRows: rows.filter((_row, index) => index !== indexToRemove)
      }
    })
  }

  const cancelImportPreview = () => {
    if (confirmingImport) return
    setImportPreview(null)
  }

  const confirmImportPreview = async () => {
    const rows = Array.isArray(importPreview?.previewRows) ? importPreview.previewRows : []
    if (!rows.length) {
      toast.error('No rows selected for import')
      return
    }

    setConfirmingImport(true)
    try {
      const { data } = await api.post('/cms/candidates/import/confirm', { rows })
      if (data.createdCount) {
        setPage(1)
        await loadCandidates(1)
      }
      setImportPreview(null)
      toast.success(`${data.createdCount || 0} imported, ${data.skippedCount || 0} skipped, ${data.failedCount || 0} failed`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not import selected rows')
    } finally {
      setConfirmingImport(false)
    }
  }

  const downloadBlankTemplatePdf = () => {
    downloadBlob(createCandidateBlankTemplatePdf(), 'Candidate-Management-Blank-Template.pdf')
    toast.success('Blank template PDF downloaded')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={downloadBlankTemplatePdf}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d4dde8] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0b65ac] hover:bg-[#eef6ff] hover:text-[#00427d]"
        >
          <Download className="h-4 w-4" />
          Blank Template PDF
        </button>
        <button
          type="button"
          disabled={importing}
          onClick={() => importInputRef.current?.click()}
          className="inline-flex h-9 items-center justify-center rounded-md border border-[#d4dde8] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0b65ac] hover:bg-[#eef6ff] hover:text-[#00427d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {importing ? 'Scanning...' : 'Import Excel'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/cms/candidates/add')}
          className="inline-flex h-9 items-center justify-center rounded-md bg-[#0b65ac] px-4 text-sm font-semibold text-white transition hover:bg-[#00427d]"
        >
          Add Candidate
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx"
          className="sr-only"
          onChange={handleImportFile}
        />
      </div>

      <div className="hidden">
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
          <div className="mb-4 inline-flex rounded-full bg-violet-100 p-4 text-violet-600"><Users className="h-5 w-5" /></div>
          <p className="text-[13px] font-medium text-slate-500">Total Candidates</p>
          <p className="mt-1 text-[30px] font-bold leading-none text-slate-900">{stats.total}</p>
          <p className="mt-1 text-sm text-emerald-600">↑ 12.5% from last month</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
          <div className="mb-4 inline-flex rounded-full bg-blue-100 p-4 text-blue-600"><CalendarDays className="h-5 w-5" /></div>
          <p className="text-[13px] font-medium text-slate-500">New Today</p>
          <p className="mt-1 text-[30px] font-bold leading-none text-slate-900">{stats.newToday}</p>
          <p className="mt-1 text-sm text-emerald-600">↑ 8.4% from last month</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
          <div className="mb-4 inline-flex rounded-full bg-emerald-100 p-4 text-emerald-600"><ShieldCheck className="h-5 w-5" /></div>
          <p className="text-[13px] font-medium text-slate-500">Selected</p>
          <p className="mt-1 text-[30px] font-bold leading-none text-slate-900">{stats.selected}</p>
          <p className="mt-1 text-sm text-emerald-600">↑ 15.7% from last month</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
          <div className="mb-4 inline-flex rounded-full bg-orange-100 p-4 text-orange-600"><UserRoundPlus className="h-5 w-5" /></div>
          <p className="text-[13px] font-medium text-slate-500">Active Interviews</p>
          <p className="mt-1 text-[30px] font-bold leading-none text-slate-900">{stats.activeInterviews}</p>
          <p className="mt-1 text-sm text-emerald-600">↑ 10.2% from last month</p>
        </div>
      </div>

      <form className="rounded-md border border-[#d4dde8] bg-white p-3 shadow-sm" onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1.25fr)_repeat(4,minmax(0,1fr))]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ID, name, mobile, email, skills"
            className="h-9 w-full rounded-md border border-[#d4dde8] bg-white px-3 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b65ac] focus:ring-2 focus:ring-[#d9ecff]"
          />
          <CandidateFilterSelect
            label="ID"
            value={candidateFilters.candidateId}
            options={filterOptions.candidateIds}
            onChange={(value) => updateCandidateFilter('candidateId', value)}
          />
          <CandidateFilterSelect
            label="Job Role"
            value={candidateFilters.jobRole}
            options={filterOptions.jobRoles}
            onChange={(value) => updateCandidateFilter('jobRole', value)}
          />
          <CandidateFilterSelect
            label="Gender"
            value={candidateFilters.gender}
            options={filterOptions.genders.length ? filterOptions.genders : fallbackGenderOptions}
            onChange={(value) => updateCandidateFilter('gender', value)}
          />
          <CandidateFilterSelect
            label="Education"
            value={candidateFilters.education}
            options={filterOptions.educations}
            onChange={(value) => updateCandidateFilter('education', value)}
          />
        </div>

        <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <MetricChip icon={Users} label="Total" value={stats.total} tone="violet" active={tileFilter === 'all'} onClick={() => setTileFilter('all')} />
            <MetricChip icon={CalendarDays} label="Today" value={stats.newToday} tone="blue" active={tileFilter === 'today'} onClick={() => setTileFilter('today')} />
            <MetricChip icon={ShieldCheck} label="Selected" value={stats.selected} tone="emerald" active={tileFilter === 'selected'} onClick={() => setTileFilter('selected')} />
            <MetricChip icon={UserRoundPlus} label="Interviews" value={stats.activeInterviews} tone="orange" active={tileFilter === 'interviews'} onClick={() => setTileFilter('interviews')} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
            <label className="grid gap-1 text-xs font-semibold text-slate-500">
              Registration From
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => updateDateRange('from', e.target.value)}
                className="h-8 w-full rounded-md border border-[#d4dde8] bg-white px-2.5 text-[13px] text-slate-900 outline-none transition focus:border-[#0b65ac] focus:ring-2 focus:ring-[#d9ecff] sm:w-[140px]"
                aria-label="Filter candidates from registration date"
                title="From registration date"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-500">
              Registration To
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => updateDateRange('to', e.target.value)}
                className="h-8 w-full rounded-md border border-[#d4dde8] bg-white px-2.5 text-[13px] text-slate-900 outline-none transition focus:border-[#0b65ac] focus:ring-2 focus:ring-[#d9ecff] sm:w-[140px]"
                aria-label="Filter candidates to registration date"
                title="To registration date"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-500">
              Visit From
              <input
                type="date"
                value={visitDateRange.from}
                onChange={(e) => updateVisitDateRange('from', e.target.value)}
                className="h-8 w-full rounded-md border border-[#d4dde8] bg-white px-2.5 text-[13px] text-slate-900 outline-none transition focus:border-[#0b65ac] focus:ring-2 focus:ring-[#d9ecff] sm:w-[140px]"
                aria-label="Filter candidates from visit date"
                title="From visit date"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-500">
              Visit To
              <input
                type="date"
                value={visitDateRange.to}
                onChange={(e) => updateVisitDateRange('to', e.target.value)}
                className="h-8 w-full rounded-md border border-[#d4dde8] bg-white px-2.5 text-[13px] text-slate-900 outline-none transition focus:border-[#0b65ac] focus:ring-2 focus:ring-[#d9ecff] sm:w-[140px]"
                aria-label="Filter candidates to visit date"
                title="To visit date"
              />
            </label>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-8 items-center justify-center rounded-md border border-[#d4dde8] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0b65ac] hover:bg-[#eef6ff] hover:text-[#00427d]"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-[#00427d]">Active Candidates</h2>
          {selectedVisibleCandidateIds.length > 0 ? (
            <button
              type="button"
              onClick={requestBulkDelete}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto"
            >
              <Trash2 size={16} />
              Delete Selected ({selectedVisibleCandidateIds.length})
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-md border border-[#d4dde8] bg-white">
        {loading ? (
          <div className="border-b border-[#d4dde8] px-4 py-4 text-sm text-slate-600">Loading candidates...</div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] table-fixed text-[13px] text-slate-900">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[19%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead className="bg-white text-left text-xs font-semibold uppercase text-slate-600">
              <tr className="border-b border-[#d4dde8]">
                <th className="border-r border-[#d4dde8] px-3 py-3 text-center whitespace-nowrap">
                  <input
                    type="checkbox"
                    aria-label="Select all visible candidates"
                    checked={allVisibleCandidatesSelected}
                    disabled={!visibleCandidateIds.length}
                    onChange={(event) => toggleVisibleCandidateSelection(event.target.checked)}
                    className="h-4 w-4 rounded border-[#d4dde8] accent-[#0b65ac]"
                  />
                </th>
                <th className="border-r border-[#d4dde8] px-3 py-3 whitespace-nowrap">ID</th>
                <th className="border-r border-[#d4dde8] px-3 py-3 whitespace-nowrap">Registration</th>
                <th className="border-r border-[#d4dde8] px-3 py-3 whitespace-nowrap">Name</th>
                <th className="border-r border-[#d4dde8] px-3 py-3 whitespace-nowrap">Education</th>
                <th className="border-r border-[#d4dde8] px-3 py-3 whitespace-nowrap">Job Role/Department</th>
                <th className="border-r border-[#d4dde8] px-3 py-3 whitespace-nowrap">Visits</th>
                <th className="px-3 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((candidate) => (
                <tr key={candidate.id} className="border-b border-[#d4dde8] bg-white hover:bg-[#f8fbff]">
                  <td className="border-r border-[#d4dde8] px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Select ${candidate.fullName || 'candidate'}`}
                      checked={selectedCandidateIds.includes(candidate.id)}
                      disabled={!candidate.id}
                      onChange={(event) => toggleCandidateSelection(candidate.id, event.target.checked)}
                      className="h-4 w-4 rounded border-[#d4dde8] accent-[#0b65ac]"
                    />
                  </td>
                  <td className="whitespace-nowrap border-r border-[#d4dde8] px-3 py-3 font-semibold text-slate-700">{candidate.code}</td>
                  <td className="whitespace-nowrap border-r border-[#d4dde8] px-3 py-3">
                    {(() => {
                      const registered = registrationDateTime(candidate.createdAt)
                      return (
                        <span>
                          <span className="block font-semibold text-slate-900">{registered.date}</span>
                          {registered.time ? <span className="block text-xs font-semibold text-slate-500">{registered.time}</span> : null}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="border-r border-[#d4dde8] px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${avatarPalette[candidate.fullName.length % avatarPalette.length]}`}>
                        {(candidate.fullName || 'C').charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold leading-5 text-slate-900">{candidate.fullName}</span>
                        <span className="block truncate text-[11px] font-semibold text-slate-500">{candidate.mobile || '-'}</span>
                      </span>
                    </div>
                  </td>
                  <td className="truncate border-r border-[#d4dde8] px-3 py-3 text-slate-900" title={candidate.highestEducation || '-'}>
                    {candidate.highestEducation || '-'}
                  </td>
                  <td className="truncate border-r border-[#d4dde8] px-3 py-3 leading-5 text-slate-900" title={candidate.jobRole || candidate.appliedFor || '-'}>
                    {candidate.jobRole || candidate.appliedFor || '-'}
                  </td>
                  <td className="border-r border-[#d4dde8] px-3 py-3">
                    {(() => {
                      const visits = Array.isArray(candidate.candidateVisits) ? candidate.candidateVisits : []
                      const lastVisit = lastCandidateVisit(visits)
                      const visitDate = formatVisitDateTime(lastVisit?.visitDateTime)
                      const purpose = lastVisit ? selectedOptionValue(lastVisit.purpose, lastVisit.purposeOther) : ''
                      return (
                        <div className="min-w-0 space-y-1 leading-4">
                          <span className="inline-flex rounded-full bg-[#eef6ff] px-2 py-0.5 text-[11px] font-bold text-[#00427d]">
                            {visits.length} Visit{visits.length === 1 ? '' : 's'}
                          </span>
                          {lastVisit ? (
                            <div className="min-w-0 text-[11px] font-semibold text-slate-600">
                              <span className="block truncate text-slate-900" title={`${visitDate.date} ${visitDate.time}`.trim()}>
                                Last: {visitDate.date}{visitDate.time ? `, ${visitDate.time}` : ''}
                              </span>
                              <span className="block truncate" title={purpose || '-'}>
                                {purpose || '-'}
                              </span>
                              <span className="block truncate" title={lastVisit.meetingStaffName || '-'}>
                                Staff: {lastVisit.meetingStaffName || '-'}
                              </span>
                            </div>
                          ) : (
                            <span className="block text-[11px] font-semibold text-slate-400">No visit added</span>
                          )}
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${candidate.id}`)}
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-[#d4dde8] bg-white px-2.5 text-xs font-semibold text-[#00427d] transition hover:border-[#0b65ac] hover:bg-[#eef6ff]"
                        aria-label="View candidate"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${candidate.id}/edit`)}
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-[#d4dde8] bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-[#0b65ac] hover:bg-[#eef6ff] hover:text-[#00427d]"
                        aria-label="Edit candidate"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(candidate)}
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-rose-600 px-2.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                        aria-label="Delete candidate"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No candidates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalCandidates}
          itemLabel="candidates"
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        </div>
      </section>

      <PromptDialog
        open={Boolean(deleting)}
        title="Delete Candidate"
        message={`Enter super admin password to delete ${deleting?.fullName || 'this candidate'}.`}
        placeholder="Super admin password"
        confirmText="Delete"
        inputType="password"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
        confirmDisabled={deletingWithPassword}
      />
      <PromptDialog
        open={bulkDeleteOpen}
        title="Delete Selected Candidates"
        message={`Enter super admin password to delete ${selectedVisibleCandidateIds.length} selected candidate${selectedVisibleCandidateIds.length === 1 ? '' : 's'}.`}
        placeholder="Super admin password"
        confirmText="Delete Selected"
        inputType="password"
        danger
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        confirmDisabled={bulkDeleting}
      />
      <ImportPreviewDialog
        preview={importPreview}
        confirming={confirmingImport}
        onCancel={cancelImportPreview}
        onConfirm={confirmImportPreview}
        onRemoveRow={removeImportPreviewRow}
      />
    </div>
  )
}
