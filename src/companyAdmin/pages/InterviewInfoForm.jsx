import { forwardRef, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, Pencil, Plus, Save, Upload } from 'lucide-react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import companyAdminApi from '../api'

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const API_ROOT = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : `http://${defaultHost}:5000`)

const feedbackOptions = ['Yes', 'No', 'Pending']
const statusOptions = ['Selected', 'Rejected', 'Hold', 'Pending']
const genderOptions = ['Male', 'Female', 'Other']
const yesNoOptions = ['Yes', 'No']

const emptyForm = (companyName = '') => ({
  companyName,
  candidateName: '',
  gender: 'Male',
  education: '',
  candidateDepartment: '',
  interviewDateTime: '',
  attendedInterview: 'Yes',
  interestedForJoin: 'Yes',
  notInterestedReason: '',
  feedbackFromCompany: 'Pending',
  feedbackFromPlacement: 'Pending',
  interviewStatus: 'Pending',
  netSalary: '',
  grossSalary: '',
  ctc: '',
  offerDepartment: '',
  expectedDoj: '',
  jobProfile: '',
  vacancyDepartment: '',
  numberOfVacancy: '',
  vacancyEducation: '',
  experience: '',
  salaryRange: '',
  jobTime: '',
  shift: '',
  jobLocation: '',
  requiredKeySkills: [],
  rolesAndResponsibility: '',
  facilities: [],
  weeklyOff: [],
  manpower: '',
  turnover: '',
  plant: ''
})

const toDateTimeInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const toDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const valuesFromRecord = (record, companyName) => {
  const candidate = record?.candidateInterview || {}
  const offer = candidate.offerDetails || {}
  const vacancy = record?.manpowerVacancy || {}
  const legacyJob = record?.jobRequirements || {}
  const legacyAbout = record?.aboutCompany || {}

  return {
    ...emptyForm(record?.companyName || companyName),
    candidateName: candidate.candidateName || '',
    gender: candidate.gender || 'Male',
    education: candidate.education || '',
    candidateDepartment: candidate.department || '',
    interviewDateTime: toDateTimeInput(candidate.interviewDateTime),
    attendedInterview: candidate.attendedInterview || 'Yes',
    interestedForJoin: candidate.interestedForJoin || 'Yes',
    notInterestedReason: candidate.notInterestedReason || '',
    feedbackFromCompany: candidate.feedbackFromCompany || 'Pending',
    feedbackFromPlacement: candidate.feedbackFromPlacement || 'Pending',
    interviewStatus: candidate.interviewStatus || 'Pending',
    netSalary: offer.netSalary ?? '',
    grossSalary: offer.grossSalary ?? '',
    ctc: offer.ctc ?? '',
    offerDepartment: offer.department || '',
    expectedDoj: toDateInput(offer.expectedDoj),
    jobProfile: vacancy.jobProfile || legacyJob.jobProfile || '',
    vacancyDepartment: vacancy.department || '',
    numberOfVacancy: vacancy.numberOfVacancy ?? legacyJob.numberOfVacancy ?? '',
    vacancyEducation: vacancy.education || legacyJob.education || '',
    experience: vacancy.experience || legacyJob.experience || '',
    salaryRange: vacancy.salaryRange || legacyJob.salaryRange || '',
    jobTime: vacancy.jobTime || legacyJob.jobTime || '',
    shift: vacancy.shift || legacyJob.shift || '',
    jobLocation: vacancy.jobLocation || legacyJob.jobLocation || '',
    requiredKeySkills: vacancy.requiredKeySkills || legacyJob.requiredKeySkills || [],
    rolesAndResponsibility: vacancy.rolesAndResponsibility || legacyJob.rolesAndResponsibility || '',
    facilities: vacancy.facilities || legacyJob.facilities || [],
    weeklyOff: vacancy.weeklyOff || legacyAbout.weeklyOff || [],
    manpower: vacancy.manpower || legacyAbout.manpower || '',
    turnover: vacancy.turnover || legacyAbout.turnover || '',
    plant: vacancy.plant || legacyAbout.plant || ''
  }
}

const fileHref = (file) => {
  const url = file?.fileUrl
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `${API_ROOT}${url}`
}

const fileLabel = (file) => file?.fileName || ''

export default function InterviewInfoForm() {
  const { companyAdmin } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(() => emptyForm(companyAdmin.companyName))
  const [files, setFiles] = useState({})
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(() => searchParams.get('action') === 'create')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const selectedRecord = useMemo(() => records.find((record) => record._id === editing?._id), [editing, records])
  const selectedCandidate = selectedRecord?.candidateInterview || {}

  const loadRecords = async () => {
    const { data } = await companyAdminApi.get('/interview-info')
    const list = Array.isArray(data.interviewInfo)
      ? data.interviewInfo
      : data.interviewInfo
        ? [data.interviewInfo]
        : []
    setRecords(list)
  }

  useEffect(() => {
    let active = true

    companyAdminApi
      .get('/interview-info')
      .then(({ data }) => {
        if (!active) return
        const list = Array.isArray(data.interviewInfo)
          ? data.interviewInfo
          : data.interviewInfo
            ? [data.interviewInfo]
            : []
        setRecords(list)
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || 'Could not load candidate interview information')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const resetForm = () => {
    setEditing(null)
    setForm(emptyForm(companyAdmin.companyName))
    setFiles({})
  }

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
    setSearchParams({ action: 'create' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    resetForm()
    setShowForm(false)
    setSearchParams({})
  }

  const editRecord = (record) => {
    setEditing(record)
    setForm(valuesFromRecord(record, companyAdmin.companyName))
    setFiles({})
    setShowForm(true)
    setSearchParams({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const appendFormData = () => {
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value))
      } else if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })

    if (files.resume) formData.append('resume', files.resume)
    if (files.offerLetter) formData.append('offerLetter', files.offerLetter)
    if (files.appointmentLetter) formData.append('appointmentLetter', files.appointmentLetter)
    return formData
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.candidateName.trim()) {
      toast.error('Candidate name is required')
      return
    }

    setSaving(true)
    try {
      const payload = appendFormData()
      if (editing?._id) {
        await companyAdminApi.put(`/interview-info/${editing._id}`, payload)
      } else {
        await companyAdminApi.post('/interview-info', payload)
      }

      await loadRecords()
      closeForm()
      toast.success(editing?._id ? 'Candidate interview information updated' : 'Candidate interview information saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save candidate interview information')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm font-semibold text-slate-500">Loading candidate interview information...</p>

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Candidate Interview Form</h2>
          <p className="mt-1 text-sm text-slate-500">Maintain candidate-wise interview information separately from company vacancies.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-700 hover:bg-sky-100"
          >
            <Plus className="h-4 w-4" />
            Add New Candidate
          </button>
          <Link
            to="/company-admin/vacancies?action=create"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Add Vacancy
          </Link>
        </div>
      </div>

      {showForm ? (
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-5">
            <FormSection title={editing ? 'Update Candidate Interview Information' : 'Candidate Interview Information'}>
              <Input label="Company Name" value={form.companyName} onChange={(event) => update('companyName', event.target.value)} />
              <FileInput label="Attach Resume" file={files.resume} existing={selectedCandidate.resume} onChange={(file) => setFiles((current) => ({ ...current, resume: file }))} />
              <Input label="Candidate Name" required value={form.candidateName} onChange={(event) => update('candidateName', event.target.value)} />
              <Select label="Gender" value={form.gender} options={genderOptions} onChange={(value) => update('gender', value)} />
              <Input label="Education" value={form.education} onChange={(event) => update('education', event.target.value)} />
              <Input label="Department" value={form.candidateDepartment} onChange={(event) => update('candidateDepartment', event.target.value)} />
              <Input label="Interview Date and Time" type="datetime-local" value={form.interviewDateTime} onChange={(event) => update('interviewDateTime', event.target.value)} />
              <Select label="Attend Interview" value={form.attendedInterview} options={yesNoOptions} onChange={(value) => update('attendedInterview', value)} />
              <Select label="Interested For Join" value={form.interestedForJoin} options={yesNoOptions} onChange={(value) => update('interestedForJoin', value)} />
              {form.interestedForJoin === 'No' ? (
                <Textarea label="Reason / Remark" rows={3} value={form.notInterestedReason} onChange={(event) => update('notInterestedReason', event.target.value)} />
              ) : null}
              <Select label="Feedback From Company" value={form.feedbackFromCompany} options={feedbackOptions} onChange={(value) => update('feedbackFromCompany', value)} />
              <Select label="Feedback From Placement" value={form.feedbackFromPlacement} options={feedbackOptions} disabled onChange={() => {}} />
              <Select label="Interview Status" value={form.interviewStatus} options={statusOptions} onChange={(value) => update('interviewStatus', value)} />

              {form.interviewStatus === 'Selected' ? (
                <>
                  <Input label="Net Salary" type="number" min="0" value={form.netSalary} onChange={(event) => update('netSalary', event.target.value)} />
                  <Input label="Gross Salary" type="number" min="0" value={form.grossSalary} onChange={(event) => update('grossSalary', event.target.value)} />
                  <Input label="CTC" type="number" min="0" value={form.ctc} onChange={(event) => update('ctc', event.target.value)} />
                  <Input label="Offer Department" value={form.offerDepartment} onChange={(event) => update('offerDepartment', event.target.value)} />
                  <Input label="Expected DOJ" type="date" value={form.expectedDoj} onChange={(event) => update('expectedDoj', event.target.value)} />
                  <FileInput label="Attach Offer Letter" file={files.offerLetter} existing={selectedCandidate.offerDetails?.offerLetter} onChange={(file) => setFiles((current) => ({ ...current, offerLetter: file }))} />
                  <FileInput label="Attach Appointment Letter" file={files.appointmentLetter} existing={selectedCandidate.offerDetails?.appointmentLetter} onChange={(file) => setFiles((current) => ({ ...current, appointmentLetter: file }))} />
                </>
              ) : null}
            </FormSection>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : editing ? 'Update Candidate Form' : 'Save Candidate Form'}
            </button>
            <button type="button" onClick={closeForm} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-lg font-bold text-slate-950">Saved Candidate Forms</h3>
          <p className="mt-1 text-sm text-slate-500">Each entry is visible to the Success HR super admin.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {records.map((record) => {
            const candidate = record.candidateInterview || {}
            return (
              <article key={record._id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{candidate.candidateName || 'Unnamed Candidate'}</p>
                  <p className="mt-1 text-xs text-slate-500">{candidate.department || '-'} | {candidate.interviewStatus || 'Pending'} | Placement: {candidate.feedbackFromPlacement || 'Pending'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.resume?.fileUrl ? <FileLink file={candidate.resume} /> : null}
                  <button type="button" onClick={() => editRecord(record)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 text-xs font-semibold text-sky-700 hover:bg-sky-50">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </article>
            )
          })}
          {!records.length ? (
            <p className="px-4 py-10 text-center text-sm font-semibold text-slate-500">No candidate forms submitted yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function FormSection({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

const Input = forwardRef(function Input({ label, required, ...props }, ref) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required ? <span className="text-rose-500">*</span> : null}
      <input ref={ref} required={required} {...props} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100" />
    </label>
  )
})

function Select({ label, value, options, onChange, disabled = false }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

const Textarea = forwardRef(function Textarea({ label, className = '', ...props }, ref) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 sm:col-span-2 ${className}`}>
      {label}
      <textarea ref={ref} {...props} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100" />
    </label>
  )
})

function FileInput({ label, file, existing, onChange }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <span className="mt-1 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-sky-300 hover:bg-sky-50">
        <Upload className="h-4 w-4 text-sky-700" />
        <span className="min-w-0 flex-1 truncate">{file?.name || fileLabel(existing) || 'Choose file'}</span>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => onChange(event.target.files?.[0] || null)} />
      </span>
      {existing?.fileUrl ? <FileLink file={existing} className="mt-2" /> : null}
    </label>
  )
}

function FileLink({ file, className = '' }) {
  return (
    <a href={fileHref(file)} target="_blank" rel="noreferrer" className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 ${className}`}>
      <FileText className="h-3.5 w-3.5" />
      {fileLabel(file) || 'View file'}
    </a>
  )
}
