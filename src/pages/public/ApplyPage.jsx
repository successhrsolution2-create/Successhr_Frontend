import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  UploadCloud,
  UserRound,
  X
} from 'lucide-react'
import api from '../../api/axios'

const maxFileSize = 5 * 1024 * 1024

const initialForm = {
  candidateName: '',
  mobileNumber: '',
  whatsappNo: '',
  emailId: '',
  marriageStatus: '',
  appliedFor: '',
  interestedDepartment: '',
  preferredIndustry: '',
  preferredJobLocation: '',
  availabilityForInterview: '',
  education: '',
  totalExperience: '',
  currentCompany: '',
  careerSummary: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: '',
  reasonForJobChange: '',
  currentJobLocation: ''
}

const personalFields = [
  ['candidateName', 'Candidate Name', 'Your full name', true],
  ['mobileNumber', 'Mobile Number', '10 digit mobile number', true],
  ['whatsappNo', 'WhatsApp Number', 'If different from mobile'],
  ['emailId', 'Email ID', 'name@example.com']
]

const preferenceFields = [
  ['appliedFor', 'Applied For', 'Role or designation'],
  ['interestedDepartment', 'Interested Department', 'Department name'],
  ['preferredIndustry', 'Preferred Industry', 'Manufacturing, IT, sales...'],
  ['preferredJobLocation', 'Preferred Job Location', 'City or area'],
  ['availabilityForInterview', 'Availability For Interview', 'Weekdays after 4 PM']
]

const professionalFields = [
  ['education', 'Education', 'Highest qualification'],
  ['totalExperience', 'Total Experience', 'Years', false, 'number'],
  ['currentCompany', 'Current Company', 'Optional'],
  ['currentSalary', 'Current Salary', 'PM CTC'],
  ['expectedSalary', 'Expected Salary', 'PM CTC'],
  ['noticePeriod', 'Notice Period', 'Months', false, 'number'],
  ['currentJobLocation', 'Current Job Location', 'Current city or location']
]

export default function ApplyPage() {
  const { code } = useParams()
  const [advisor, setAdvisor] = useState(null)
  const [loadingAdvisor, setLoadingAdvisor] = useState(Boolean(code))
  const [codeInput, setCodeInput] = useState(code || '')
  const [codeError, setCodeError] = useState('')
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!code) {
      setLoadingAdvisor(false)
      return
    }

    lookupAdvisor(code)
  }, [code])

  const advisorCode = advisor?.advisorCode || ''
  const completedCore = useMemo(
    () => ['candidateName', 'mobileNumber', 'appliedFor', 'education'].filter((key) => form[key]?.trim()).length,
    [form]
  )

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const lookupAdvisor = async (raw) => {
    const next = String(raw || '').trim().toLowerCase()
    if (!next) {
      setCodeError('Please enter the advisor code shared with you.')
      return
    }

    setLoadingAdvisor(true)
    setCodeError('')
    try {
      const { data } = await api.get(`/public/advisor/${next}`)
      setAdvisor(data)
      setCodeInput(next)
    } catch (_error) {
      setAdvisor(null)
      setCodeError(code ? 'This advisor code is not valid.' : 'Invalid code. Please check with your advisor.')
    } finally {
      setLoadingAdvisor(false)
    }
  }

  const addFiles = (selectedFiles) => {
    const incoming = Array.from(selectedFiles || [])
    const accepted = []

    incoming.forEach((file) => {
      if (file.size > maxFileSize) {
        toast.error(`${file.name} is larger than 5MB`)
        return
      }
      accepted.push(file)
    })

    if (accepted.length) {
      setFiles((current) => [...current, ...accepted].slice(0, 10))
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!advisorCode) return

    if (!form.candidateName.trim() || !form.mobileNumber.trim()) {
      toast.error('Candidate name and mobile number are required')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      files.forEach((file) => formData.append('documents', file))

      const { data } = await api.post(`/public/apply/${advisorCode}`, formData)
      setDone({
        name: form.candidateName.trim(),
        ref: `STU-${new Date().getFullYear()}-${String(data.studentId || '').slice(-8).toUpperCase()}`
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit your application')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <PublicShell>
        <section className="mx-auto max-w-xl rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Application Submitted</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Thank you {done.name}. Your application has been received and will be reviewed by your advisor.
          </p>
          <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase text-slate-500">Reference ID</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-950">{done.ref}</p>
          </div>
        </section>
      </PublicShell>
    )
  }

  return (
    <PublicShell advisor={advisor}>
      {!advisor ? (
        <section className="mx-auto max-w-lg rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="rounded-xl bg-slate-50 px-4 py-4 text-center ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase text-sky-700">Candidate Application</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Enter Advisor Code</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the code shared by your SUCCESS HR business advisor to open your application form.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              lookupAdvisor(codeInput)
            }}
            className="mt-5 space-y-4"
          >
            <label className="block text-sm font-semibold text-slate-700">
              Advisor Code
              <input
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                placeholder="successba01"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
              />
            </label>
            {codeError ? (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
                {codeError}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loadingAdvisor}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-70"
            >
              {loadingAdvisor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {loadingAdvisor ? 'Checking code...' : 'Open Application Form'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">Do not have a code? Please contact your business advisor.</p>
        </section>
      ) : (
        <form onSubmit={submit} className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="rounded-xl bg-cyan-50 px-4 py-3 ring-1 ring-cyan-200">
              <p className="text-sm font-bold text-cyan-900">Applying under: {advisor.advisorName}</p>
              <p className="mt-1 text-xs font-medium text-cyan-800">Your information will be sent directly to this advisor.</p>
            </div>

            <FormSection icon={<UserRound className="h-5 w-5" />} title="Personal Details">
              <div className="grid gap-4 sm:grid-cols-2">
                {personalFields.map(([name, label, placeholder, required]) => (
                  <Field
                    key={name}
                    label={label}
                    placeholder={placeholder}
                    required={required}
                    value={form[name]}
                    onChange={(value) => update(name, name === 'mobileNumber' || name === 'whatsappNo' ? value.replace(/\D/g, '').slice(0, 10) : value)}
                  />
                ))}
                <SelectField
                  label="Marriage Status"
                  value={form.marriageStatus}
                  onChange={(value) => update('marriageStatus', value)}
                  options={['', 'Married', 'Unmarried', 'Single']}
                />
              </div>
            </FormSection>

            <FormSection icon={<MapPin className="h-5 w-5" />} title="Job Preferences">
              <div className="grid gap-4 sm:grid-cols-2">
                {preferenceFields.map(([name, label, placeholder]) => (
                  <Field key={name} label={label} placeholder={placeholder} value={form[name]} onChange={(value) => update(name, value)} />
                ))}
              </div>
            </FormSection>

            <FormSection icon={<BriefcaseBusiness className="h-5 w-5" />} title="Professional Details">
              <div className="grid gap-4 sm:grid-cols-2">
                {professionalFields.map(([name, label, placeholder, required, type]) => (
                  <Field
                    key={name}
                    label={label}
                    placeholder={placeholder}
                    required={required}
                    type={type || 'text'}
                    value={form[name]}
                    onChange={(value) => update(name, value)}
                  />
                ))}
                <Area label="Career Summary" value={form.careerSummary} onChange={(value) => update('careerSummary', value)} />
                <Area label="Reason For Job Change" value={form.reasonForJobChange} onChange={(value) => update('reasonForJobChange', value)} />
              </div>
            </FormSection>

            <FormSection icon={<FileText className="h-5 w-5" />} title="Documents">
              <div
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  addFiles(event.dataTransfer.files)
                }}
                className={`rounded-xl border border-dashed p-5 text-center transition ${
                  dragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <UploadCloud className="mx-auto h-8 w-8 text-sky-600" />
                <p className="mt-2 text-sm font-semibold text-slate-800">Upload resume and supporting documents</p>
                <p className="mt-1 text-xs text-slate-500">PDF, JPG, or PNG. Maximum 5MB per file.</p>
                <label className="mt-4 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100">
                  Choose files
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => addFiles(event.target.files)} />
                </label>
              </div>

              {files.length ? (
                <div className="mt-4 grid gap-2">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </FormSection>
          </div>

          <aside className="h-fit rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-6">
            <p className="text-base font-bold text-slate-950">Application Summary</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <SummaryRow label="Advisor" value={advisor.advisorName} />
              <SummaryRow label="Code" value={advisorCode} mono />
              <SummaryRow label="Core details" value={`${completedCore}/4`} />
              <SummaryRow label="Documents" value={`${files.length} selected`} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? 'Submitting...' : 'Submit My Application'}
            </button>
            <p className="mt-3 text-xs leading-5 text-slate-500">Please review your mobile number before submitting. Duplicate applications cannot be edited from this page.</p>
          </aside>
        </form>
      )}
    </PublicShell>
  )
}

function PublicShell({ children, advisor }) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/success-mark.svg" alt="SUCCESS HR Solution" className="h-11 w-11 rounded-xl object-contain ring-1 ring-slate-200" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-sky-700">SUCCESS HR Solution</p>
                <h1 className="truncate text-xl font-bold text-slate-950 sm:text-2xl">Candidate Application</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {advisor ? (
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-200">
                  {advisor.advisorCode}
                </span>
              ) : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                Secure public form
              </span>
            </div>
          </div>
        </header>

        {children}

        <footer className="py-7 text-center text-xs font-semibold text-slate-500">Powered by SUCCESS HR Solution</footer>
      </div>
    </main>
  )
}

function FormSection({ icon, title, children }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">{icon}</span>
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, value, onChange, placeholder, required = false, type = 'text' }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required ? <span className="text-rose-500">*</span> : null}
      <input
        type={type}
        value={value}
        required={required}
        min={type === 'number' ? '0' : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  )
}

function Area({ label, value, onChange }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
      {label}
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      >
        {options.map((option) => (
          <option key={option || 'empty'} value={option}>
            {option || 'Select'}
          </option>
        ))}
      </select>
    </label>
  )
}

function SummaryRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
      <span>{label}</span>
      <span className={`text-right font-semibold text-slate-950 ${mono ? 'font-mono' : ''}`}>{value || '-'}</span>
    </div>
  )
}

function formatSize(size) {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
