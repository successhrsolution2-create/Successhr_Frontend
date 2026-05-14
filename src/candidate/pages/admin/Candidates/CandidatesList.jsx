import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, Download, Eye, Filter, Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2, UserRoundPlus, Users } from 'lucide-react'
import { ConfirmDialog, ExportRangeDialog } from '../../../components/ActionDialogs'
import Pagination from '../../../components/Pagination'
import api from '../../../api/axios'
import {
  PERSONALITY_RATING_FIELDS,
  PROFESSIONAL_RATING_FIELDS,
  formatQuestionSummary,
  formatRatingSummary,
  formatSelectionSummary
} from './candidateFormModel'

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

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

const fallbackCode = (item) => {
  if (item?.candidateCode) return item.candidateCode
  const date = item?.createdAt ? new Date(item.createdAt) : new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const tail = String(item?._id || '').slice(-4).toUpperCase().padStart(4, '0')
  return `C${yy}${mm}${tail}`
}

const toLegacyShape = (item) => ({
  id: item._id,
  code: fallbackCode(item),
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

function MetricChip({ icon: Icon, label, value, tone = 'violet', active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border px-2.5 transition hover:-translate-y-px hover:shadow-sm ${
        active ? 'ring-2 ring-indigo-200' : ''
      } ${metricTone[tone]}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </button>
  )
}

export default function CandidatesList() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [dateFilter, setDateFilter] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [tileFilter, setTileFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/cms/candidates')
        setCandidates((Array.isArray(data) ? data : []).map(toLegacyShape))
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load candidates')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return candidates
      .filter((candidate) => {
        if (tileFilter === 'today') return dateKey(candidate.createdAt) === dateKey(new Date())
        if (tileFilter === 'selected') return isSelectedCandidate(candidate)
        if (tileFilter === 'interviews') return hasInterviewActivity(candidate)
        return true
      })
      .filter((candidate) => {
        if (!dateFilter) return true
        return dateKey(candidate.createdAt) === dateFilter
      })
      .filter((candidate) => {
        if (!query) return true
      const fields = [
        candidate.code,
        candidate.id,
        candidate.fullName,
        candidate.collegeName,
        candidate.mobile,
        candidate.whatsappNo,
        candidate.email,
        candidate.appliedFor,
        candidate.preferredLocation,
        candidate.currentJobLocation,
        ...(candidate.skills || [])
      ]
      return fields.some((value) => String(value || '').toLowerCase().includes(query))
      })
  }, [candidates, search, dateFilter, tileFilter])

  const stats = useMemo(() => {
    const total = candidates.length
    const todayKey = dateKey(new Date())
    const newToday = candidates.filter((item) => dateKey(item.createdAt) === todayKey).length
    const selected = candidates.filter(isSelectedCandidate).length
    const activeInterviews = candidates.filter(hasInterviewActivity).length
    return { total, newToday, selected, activeInterviews }
  }, [candidates])

  useEffect(() => {
    setPage(1)
  }, [search, dateFilter, pageSize, tileFilter])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const resetFilters = () => {
    setDateFilter('')
    setSearch('')
    setTileFilter('all')
  }

  const handleDelete = async () => {
    if (!deleting?.id) return
    try {
      await api.delete(`/cms/candidates/${deleting.id}`)
      const next = candidates.filter((item) => item.id !== deleting.id)
      setCandidates(next)
      toast.success('Candidate deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete candidate')
    } finally {
      setDeleting(null)
    }
  }

  const exportCsv = ({ fromDate: exportFromDate = '', toDate: exportToDate = '' } = {}) => {
    try {
      const data = candidates

      const fromDate = exportFromDate ? new Date(`${exportFromDate}T00:00:00`) : null
      const toDate = exportToDate ? new Date(`${exportToDate}T23:59:59.999`) : null

      if (!exportFromDate || !exportToDate) {
        toast.error('Select From and To dates for export')
        return
      }
      if (fromDate && Number.isNaN(fromDate.getTime())) {
        toast.error('Invalid From date')
        return
      }
      if (toDate && Number.isNaN(toDate.getTime())) {
        toast.error('Invalid To date')
        return
      }
      if (fromDate && toDate && fromDate > toDate) {
        toast.error('From date must be before To date')
        return
      }

      const withinRange = (item) => {
        if (!fromDate && !toDate) return true
        const created = item?.createdAt ? new Date(item.createdAt) : null
        if (!created || Number.isNaN(created.getTime())) return false
        if (fromDate && created < fromDate) return false
        if (toDate && created > toDate) return false
        return true
      }

      const filteredData = data.filter(withinRange)

      const interviewsToText = (rows) =>
        (Array.isArray(rows) ? rows : [])
          .map((r) => {
            const bits = [r.companyName, r.referencePerson, r.date, r.status].filter(Boolean)
            return bits.join(' | ')
          })
          .filter(Boolean)
          .join(' ; ')

      const checkedFlag = isChecked
      const dateCell = (value) => (value ? String(value).slice(0, 10) : '')

      const headers = [
        'ID',
        'Created At',
        'Day',
        'Receipt No',
        'RC / WRC',
        'Form Date',
        'Full Name',
        'College Name',
        'Mobile',
        'WhatsApp',
        'Aadhaar',
        'Email',
        'DOB',
        'Gender',
        'Education',
        'Applied For',
        'Preferred Job Location',
        'Experience',
        'Experience Department',
        'Current Salary',
        'Expected Salary',
        'Notice Period',
        'Current Job Location',
        'Reason Of Job Change',
        'Father Occupation',
        'Mother Occupation',
        'Brother Occupation',
        'Sister Occupation',
        'Goal / Aim',
        'Suitable Industry',
        'Suitable Department',
        'HR Interviewer',
        'Interview Remark',
        'Professional Ratings',
        'Personality Ratings',
        'IQ',
        'TQ',
        'Grade',
        'Interview Questions and Answers',
        'Skills',
        'Languages',
        'Reference Source',
        'Additional Notes',
        'Remark Note',
        'Remarks (Tags)',
        'Success Update (Tags)',
        'Final Joining Date',
        'Final Package',
        'Interviewer Remark',
        'Interviews'
      ]

      const rows = filteredData.map((item) => {
        const remarks = item.remarks || {}
        const success = item.successUpdate || {}
        const formMeta = item.formMeta || {}
        const familyDetails = item.familyDetails || {}
        const interviewForm = item.interviewForm || {}
        const remarkTags = [
          checkedFlag(remarks.verified) ? 'Verified' : null,
          checkedFlag(remarks.active) ? 'Active' : null,
          checkedFlag(remarks.priority) ? 'Priority' : null,
          checkedFlag(remarks.blacklisted) ? 'Blacklisted' : null,
          checkedFlag(remarks.experienced) ? 'Experienced' : null,
          checkedFlag(remarks.fresher) ? 'Fresher' : null,
          checkedFlag(remarks.available) ? 'Available' : null,
          checkedFlag(remarks.onHold) ? 'On Hold' : null,
          checkedFlag(remarks.shortlisted) ? 'Shortlisted' : null,
          checkedFlag(remarks.caseClosed) ? 'Case Closed' : null
        ]
          .filter(Boolean)
          .join(', ')

        const successTags = [
          checkedFlag(success.selected) ? 'Selected' : null,
          checkedFlag(success.offerReceived) ? 'Offer Received' : null,
          checkedFlag(success.offerReleased) ? 'Offer Released' : null,
          checkedFlag(success.joined) ? 'Joined' : null,
          checkedFlag(success.notJoined) ? 'Not Joined' : null,
          checkedFlag(success.rejected) ? 'Rejected' : null,
          checkedFlag(success.withdrawn) ? 'Withdrawn' : null,
          checkedFlag(success.docsVerified) ? 'Docs Verified' : null,
          checkedFlag(success.bgvInitiated) ? 'BGV Initiated' : null,
          checkedFlag(success.bgvDone) ? 'BGV Done' : null,
          checkedFlag(success.trainingStarted) ? 'Training Started' : null,
          checkedFlag(success.confirmed) ? 'Confirmed' : null,
          checkedFlag(success.relieved) ? 'Relieved' : null,
          checkedFlag(success.onHold) ? 'On Hold' : null,
          checkedFlag(success.blacklisted) ? 'Blacklisted' : null,
          checkedFlag(success.reApplied) ? 'Re-applied' : null,
          checkedFlag(success.followUpPending) ? 'Follow Up Pending' : null,
          checkedFlag(success.refCheckDone) ? 'Ref Check Done' : null,
          checkedFlag(success.salaryNegotiated) ? 'Salary Negotiated' : null,
          checkedFlag(success.caseClosed) ? 'Case Closed' : null
        ]
          .filter(Boolean)
          .join(', ')

        return [
          item.code,
          item.createdAt,
          formMeta.day,
          formMeta.receiptNo,
          formMeta.rcWrc,
          dateCell(formMeta.date),
          item.fullName,
          item.collegeName,
          item.mobile,
          item.whatsappNo,
          item.aadhaarNo || item.aadhaarNumber || item.aadhaar,
          item.email,
          item.dob,
          item.gender,
          item.education,
          item.jobType,
          item.preferredLocation,
          item.experience,
          item.experienceDepartment,
          item.currentSalary,
          item.expectedSalary,
          item.noticePeriod,
          item.currentJobLocation,
          item.reasonForJobChange,
          familyDetails.fatherOccupation,
          familyDetails.motherOccupation,
          familyDetails.brotherOccupation,
          familyDetails.sisterOccupation,
          item.goalAim,
          interviewForm.suitableIndustry,
          interviewForm.suitableDepartment,
          interviewForm.hrInterviewer,
          interviewForm.remark,
          formatRatingSummary(interviewForm.professionalRatings, PROFESSIONAL_RATING_FIELDS),
          formatRatingSummary(interviewForm.personalityRatings, PERSONALITY_RATING_FIELDS),
          formatSelectionSummary(interviewForm.iqSelections),
          formatSelectionSummary(interviewForm.tqSelections),
          interviewForm.grade,
          formatQuestionSummary(interviewForm.questions),
          (item.skills || []).join(' | '),
          (item.languages || []).join(' | '),
          item.referenceSource,
          item.additionalNotes,
          remarks.remarkNote,
          remarkTags,
          successTags,
          success.finalJoiningDate,
          success.finalPackage,
          success.interviewerRemark,
          interviewsToText(item.interviews)
        ]
      })

      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const suffix = `-${exportFromDate}_to_${exportToDate}`
      link.download = `candidates${suffix}-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
      setExportOpen(false)
      toast.success('CSV exported')
    } catch (_error) {
      toast.error('Could not export CSV')
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight text-slate-950 sm:text-2xl">Candidates</h1>
              <p className="mt-1 text-xs font-medium text-slate-500">Candidate Management System</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/cms/candidates/add')}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto lg:min-w-44"
            >
              <Plus className="h-4 w-4" />
              Add Candidate
            </button>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <MetricChip icon={Users} label="Total" value={stats.total} tone="violet" active={tileFilter === 'all'} onClick={() => setTileFilter('all')} />
              <MetricChip icon={CalendarDays} label="Today" value={stats.newToday} tone="blue" active={tileFilter === 'today'} onClick={() => setTileFilter('today')} />
              <MetricChip icon={ShieldCheck} label="Selected" value={stats.selected} tone="emerald" active={tileFilter === 'selected'} onClick={() => setTileFilter('selected')} />
              <MetricChip icon={UserRoundPlus} label="Interviews" value={stats.activeInterviews} tone="orange" active={tileFilter === 'interviews'} onClick={() => setTileFilter('interviews')} />
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,190px)_auto] xl:justify-end">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                aria-label="Filter candidates by registration date"
              />
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
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

      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ID, name, mobile, email, skills"
              className="h-10 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button type="button" className="hidden">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button type="button" onClick={resetFilters} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 lg:w-auto">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="px-5 py-10 text-center text-slate-500">Loading candidates...</div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full table-fixed text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="w-28 px-4 py-3 whitespace-nowrap">ID</th>
                <th className="w-56 px-4 py-3 whitespace-nowrap">Name</th>
                <th className="w-32 px-4 py-3 whitespace-nowrap">Mobile</th>
                <th className="w-56 px-4 py-3 whitespace-nowrap">Job Role/Department</th>
                <th className="w-60 px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((candidate) => (
                <tr key={candidate.id} className="odd:bg-white even:bg-slate-50 hover:bg-indigo-50/40">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-700">{candidate.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${avatarPalette[candidate.fullName.length % avatarPalette.length]}`}>
                        {(candidate.fullName || 'C').charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold leading-5 text-slate-900">{candidate.fullName}</span>
                        <span className="block truncate text-xs font-semibold text-slate-500">{candidate.mobile || '-'}</span>
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-800">{candidate.mobile}</td>
                  <td className="px-4 py-3 leading-5 text-slate-800">{candidate.jobRole || candidate.appliedFor || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${candidate.id}`)}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-600 hover:bg-violet-100"
                        aria-label="View candidate"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${candidate.id}/edit`)}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#1890d8] px-3 text-xs font-semibold text-white hover:bg-[#0f82c8]"
                        aria-label="Edit candidate"
                      >
                        <Pencil className="h-4 w-4" />
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(candidate)}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg bg-rose-50 px-3 text-xs font-semibold text-rose-500 hover:bg-rose-100"
                        aria-label="Delete candidate"
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
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
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
          total={filtered.length}
          itemLabel="candidates"
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Candidate"
        message={`Delete ${deleting?.fullName || 'this candidate'}?`}
        confirmText="Delete"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
      <ExportRangeDialog
        open={exportOpen}
        title="Export Candidates"
        message="Select registration date range for the candidates export."
        onCancel={() => setExportOpen(false)}
        onConfirm={exportCsv}
      />
    </div>
  )
}
