import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Handshake,
  MessageSquare,
  Upload,
  UserRound,
  Users,
  X
} from 'lucide-react'
import api from '../../api/axios'
import { ConfirmDialog } from '../../components/ActionDialogs'

const MAX_RESUME_SIZE = 10 * 1024 * 1024
const resumeAccept = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
const resumeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const optionalText = z.string().optional()
const optionalPhone = z.string().regex(/^\d{10}$/, 'Number must be 10 digits').or(z.literal('')).optional()
const optionalNumber = z.union([z.literal(''), z.coerce.number()]).optional()
const optionalPan = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Enter a valid PAN number').or(z.literal('')).optional()

const schema = z.object({
  formMeta: z
    .object({
      day: optionalText,
      receiptNo: optionalText,
      rcWrc: optionalText,
      date: optionalText
    })
    .optional(),
  candidateName: z.string().min(1, 'Candidate name is required'),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  whatsappNo: optionalPhone,
  emailId: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  gender: optionalText,
  currentAge: optionalNumber,
  marriageStatus: optionalText,
  aadhaarNo: z.string().regex(/^\d{12}$/, 'Aadhaar number must be 12 digits').or(z.literal('')).optional(),
  panNo: optionalPan,
  currentAddress: optionalText,
  permanentAddress: optionalText,
  collegeName: optionalText,
  education: optionalText,
  yearOfHigherEducation: optionalText,
  computerCourses: optionalText,
  otherAchievements: optionalText,
  placementReference: z
    .object({
      professorName: optionalText,
      professorContactNumber: optionalPhone,
      referenceBy: optionalText,
      referenceContactNumber: optionalPhone
    })
    .optional(),
  appliedFor: optionalText,
  interestedDepartment: optionalText,
  lookingForField: optionalText,
  preferredIndustry: optionalText,
  preferredJobLocation: optionalText,
  currentJobLocation: optionalText,
  availabilityForInterview: optionalText,
  totalExperience: optionalNumber,
  experienceDepartment: optionalText,
  currentCompany: optionalText,
  keyResponsibilities: optionalText,
  currentSalary: optionalText,
  expectedSalary: optionalText,
  noticePeriod: optionalNumber,
  careerSummary: optionalText,
  reasonForJobChange: optionalText,
  familyDetails: z
    .object({
      fatherOrHusbandName: optionalText,
      fatherOccupation: optionalText,
      fatherMobileNumber: optionalPhone,
      motherOrWifeName: optionalText,
      motherOccupation: optionalText,
      motherMobileNumber: optionalPhone,
      siblingName: optionalText,
      siblingEducationOccupation: optionalText
    })
    .optional(),
  goalAim: optionalText,
  feedback: optionalText,
  suggestion: optionalText
})

const defaultValues = {
  formMeta: {
    day: '',
    receiptNo: '',
    rcWrc: '',
    date: ''
  },
  candidateName: '',
  mobileNumber: '',
  whatsappNo: '',
  emailId: '',
  gender: '',
  currentAge: '',
  marriageStatus: '',
  aadhaarNo: '',
  panNo: '',
  currentAddress: '',
  permanentAddress: '',
  collegeName: '',
  education: '',
  yearOfHigherEducation: '',
  computerCourses: '',
  otherAchievements: '',
  placementReference: {
    professorName: '',
    professorContactNumber: '',
    referenceBy: '',
    referenceContactNumber: ''
  },
  appliedFor: '',
  interestedDepartment: '',
  lookingForField: '',
  preferredIndustry: '',
  preferredJobLocation: '',
  currentJobLocation: '',
  availabilityForInterview: '',
  totalExperience: '',
  experienceDepartment: '',
  currentCompany: '',
  keyResponsibilities: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: '',
  careerSummary: '',
  reasonForJobChange: '',
  familyDetails: {
    fatherOrHusbandName: '',
    fatherOccupation: '',
    fatherMobileNumber: '',
    motherOrWifeName: '',
    motherOccupation: '',
    motherMobileNumber: '',
    siblingName: '',
    siblingEducationOccupation: ''
  },
  goalAim: '',
  feedback: '',
  suggestion: ''
}

const detailPanels = [
  {
    title: 'Personal Details',
    icon: UserRound,
    fields: [
      { name: 'candidateName', label: 'Candidate Name', required: true },
      { name: 'mobileNumber', label: 'Mobile Number', required: true, inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { name: 'whatsappNo', label: 'WhatsApp Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { name: 'emailId', label: 'Email ID', type: 'email' },
      { name: 'gender', label: 'Gender', options: ['', 'Male', 'Female', 'Other'] },
      { name: 'currentAge', label: 'Current Age', type: 'number' },
      { name: 'aadhaarNo', label: 'Aadhar Card Number', inputMode: 'numeric', maxLength: 12, digitsOnly: true },
      { name: 'panNo', label: 'PAN Number', maxLength: 10, uppercase: true },
      { name: 'marriageStatus', label: 'Marital Status', options: ['', 'Married', 'Unmarried', 'Single'] },
      { name: 'currentAddress', label: 'Current Address', kind: 'area' },
      { name: 'permanentAddress', label: 'Permanent Address', kind: 'area' }
    ]
  },
  {
    title: 'Education Details',
    icon: GraduationCap,
    fields: [
      { name: 'collegeName', label: 'Institute / College Name' },
      { name: 'education', label: 'Qualification in Details', kind: 'area' },
      { name: 'yearOfHigherEducation', label: 'Year of Higher Education' },
      { name: 'computerCourses', label: 'Computer Courses', kind: 'area' },
      { name: 'otherAchievements', label: 'Other Achievements', kind: 'area' }
    ]
  },
  {
    title: 'Placement / Reference Details',
    icon: Handshake,
    fields: [
      { name: 'placementReference.professorName', label: 'Professor / Staff / TPO Name' },
      { name: 'placementReference.professorContactNumber', label: 'Professor / Staff / TPO Contact Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { name: 'placementReference.referenceBy', label: 'Reference By' },
      { name: 'placementReference.referenceContactNumber', label: 'Reference Contact Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true }
    ]
  },
  {
    title: 'Job Preferences',
    icon: ClipboardList,
    fields: [
      { name: 'appliedFor', label: 'Applied For' },
      { name: 'interestedDepartment', label: 'Interested Department' },
      { name: 'lookingForField', label: 'Looking For Jobs In Which Field?' },
      { name: 'preferredIndustry', label: 'Preferred Industry' },
      { name: 'preferredJobLocation', label: 'Preferred Job Location' },
      { name: 'currentJobLocation', label: 'Current Job Location' },
      { name: 'availabilityForInterview', label: 'Availability For Interview' }
    ]
  },
  {
    title: 'Professional Details',
    icon: BriefcaseBusiness,
    fields: [
      { name: 'totalExperience', label: 'Total Years of Experience', type: 'number' },
      { name: 'experienceDepartment', label: 'Current / Last Job Profile / Department' },
      { name: 'currentCompany', label: 'Current / Last Company Name' },
      { name: 'keyResponsibilities', label: 'Key Responsibilities In Previous Job', kind: 'area' },
      { name: 'currentSalary', label: 'Current CTC / Salary' },
      { name: 'expectedSalary', label: 'Expected Salary' },
      { name: 'noticePeriod', label: 'Notice Period', type: 'number' },
      { name: 'careerSummary', label: 'Career Summary', kind: 'area' },
      { name: 'reasonForJobChange', label: 'Reason For Job Change', kind: 'area' }
    ]
  },
  {
    title: 'Family Details',
    icon: Users,
    fields: [
      { name: 'familyDetails.fatherOrHusbandName', label: 'Father / Husband Name' },
      { name: 'familyDetails.fatherOccupation', label: 'Father Occupation' },
      { name: 'familyDetails.fatherMobileNumber', label: 'Father Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { name: 'familyDetails.motherOrWifeName', label: 'Mother / Wife Name' },
      { name: 'familyDetails.motherOccupation', label: 'Mother Occupation' },
      { name: 'familyDetails.motherMobileNumber', label: 'Mother Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { name: 'familyDetails.siblingName', label: 'Sibling Name' },
      { name: 'familyDetails.siblingEducationOccupation', label: 'Sibling Education / Occupation', kind: 'area' }
    ]
  },
  {
    title: 'Additional Information',
    icon: MessageSquare,
    fields: [
      { name: 'goalAim', label: 'Goal / Aim', kind: 'area' },
      { name: 'feedback', label: 'Feedback', kind: 'area' },
      { name: 'suggestion', label: 'Any Suggestion', kind: 'area' },
      { name: 'formMeta.day', label: 'Day' },
      { name: 'formMeta.receiptNo', label: 'Receipt No' },
      { name: 'formMeta.rcWrc', label: 'RC / WRC' },
      { name: 'formMeta.date', label: 'Receipt Date', type: 'date' }
    ]
  },
  {
    title: 'Upload Resume',
    icon: Upload,
    type: 'resume'
  }
]

const toNumberOrUndefined = (value) => (value === '' || value === null || value === undefined ? undefined : Number(value))
const onlyDigits = (value) => String(value || '').replace(/\D/g, '')
const formatFileSize = (size) => {
  if (!size) return '0 KB'
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const normalizeFieldValue = (field, value) => {
  let next = String(value ?? '')
  if (field.digitsOnly) next = onlyDigits(next)
  if (field.uppercase) next = next.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (field.maxLength) next = next.slice(0, field.maxLength)
  return next
}

const pathValue = (source, path) =>
  path.split('.').reduce((current, part) => (current && current[part] !== undefined ? current[part] : ''), source)

const normalizeResumeUploadFile = (file) => {
  if (!file || /resume/i.test(file.name)) return file
  return new File([file], `resume-${file.name}`, {
    type: file.type,
    lastModified: file.lastModified
  })
}

export default function StudentForm() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [pendingValues, setPendingValues] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues
  })

  const watchedValues = watch()
  const progress = Math.round(((currentStep + 1) / detailPanels.length) * 100)
  const completedRequired = useMemo(
    () => ['candidateName', 'mobileNumber'].filter((name) => String(pathValue(watchedValues, name) || '').trim()).length,
    [watchedValues]
  )

  const submit = async (values) => {
    setSubmitting(true)

    try {
      const payload = {
        ...values,
        formMeta: {
          ...values.formMeta,
          date: values.formMeta?.date || undefined
        },
        gender: values.gender || undefined,
        marriageStatus: values.marriageStatus || undefined,
        aadhaarNo: onlyDigits(values.aadhaarNo) || undefined,
        panNo: String(values.panNo || '').trim().toUpperCase() || undefined,
        whatsappNo: onlyDigits(values.whatsappNo) || undefined,
        totalExperience: toNumberOrUndefined(values.totalExperience),
        noticePeriod: toNumberOrUndefined(values.noticePeriod),
        currentAge: toNumberOrUndefined(values.currentAge),
        placementReference: {
          ...values.placementReference,
          professorContactNumber: onlyDigits(values.placementReference?.professorContactNumber) || undefined,
          referenceContactNumber: onlyDigits(values.placementReference?.referenceContactNumber) || undefined
        },
        familyDetails: {
          ...values.familyDetails,
          fatherMobileNumber: onlyDigits(values.familyDetails?.fatherMobileNumber) || undefined,
          motherMobileNumber: onlyDigits(values.familyDetails?.motherMobileNumber) || undefined
        }
      }

      const { data } = await api.post('/students', payload)

      if (resumeFile) {
        try {
          const formData = new FormData()
          formData.append('documents', normalizeResumeUploadFile(resumeFile))
          await api.post(`/students/${data._id}/docs`, formData)
          toast.success('Reference submitted successfully with resume!')
        } catch (uploadError) {
          toast.error(uploadError.response?.data?.message || 'Candidate created, but resume upload failed')
        }
      } else {
        toast.success('Reference submitted successfully!')
      }

      navigate('/ba/students')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit reference')
    } finally {
      setSubmitting(false)
    }
  }

  const requestSubmit = (values) => {
    setPendingValues(values)
  }

  const handleResumeSelect = (files) => {
    const file = files?.[0]
    if (!file) return

    const extensionAllowed = /\.(pdf|jpe?g|png)$/i.test(file.name)
    if (!resumeTypes.has(file.type) && !extensionAllowed) {
      setResumeFile(null)
      setResumeError('Upload PDF, JPG, or PNG resume only.')
      return
    }

    if (file.size > MAX_RESUME_SIZE) {
      setResumeFile(null)
      setResumeError('Resume must be 10 MB or smaller.')
      return
    }

    setResumeFile(file)
    setResumeError('')
  }

  const activePanel = detailPanels[currentStep]
  const ActiveIcon = activePanel.icon

  return (
    <form onSubmit={handleSubmit(requestSubmit)} className="space-y-4 sm:space-y-6">
      <div>
        <Link to="/ba/students" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          {'<- My Candidates'}
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">Add Candidate Reference</h1>
        <p className="mt-1 text-sm text-slate-500">Submit candidate details in the Candidate Management format.</p>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="h-fit rounded-lg bg-white p-4 ring-1 ring-slate-200 lg:sticky lg:top-4">
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <nav className="grid gap-1 sm:grid-cols-2 lg:block lg:space-y-1">
            {detailPanels.map((panel, index) => {
              const PanelIcon = panel.icon
              const active = index === currentStep
              const complete = index < currentStep

              return (
                <button
                  key={panel.title}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={`flex min-h-11 w-full min-w-0 items-center gap-3 rounded-md px-3 text-left text-sm transition ${
                    active
                      ? 'bg-sky-600 text-white shadow-sm'
                      : complete
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${active ? 'bg-white/15' : 'bg-white ring-1 ring-slate-200'}`}>
                    <PanelIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 leading-5">{panel.title}</span>
                </button>
              )
            })}
          </nav>

          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <div className="flex justify-between gap-3">
              <span>Required</span>
              <strong className="text-slate-950">{completedRequired}/2</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>Reference</span>
                <strong className="min-w-0 truncate text-slate-950">{pathValue(watchedValues, 'placementReference.referenceBy') || 'Walk-in'}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>Resume</span>
                <strong className="min-w-0 truncate text-slate-950">{resumeFile ? 'Selected' : 'Optional'}</strong>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
            <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <ActiveIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-sky-700">Step {currentStep + 1} of {detailPanels.length}</p>
                  <h2 className="mt-0.5 break-words text-lg font-bold leading-7 text-slate-950 sm:text-xl">{activePanel.title}</h2>
                </div>
              </div>
            </header>
            {activePanel.type === 'resume' ? (
              <ResumeUploadPanel
                file={resumeFile}
                error={resumeError}
                onSelect={handleResumeSelect}
                onRemove={() => {
                  setResumeFile(null)
                  setResumeError('')
                }}
              />
            ) : (
              <div className="grid gap-4 px-4 py-5 md:grid-cols-2 sm:px-6">
                {activePanel.fields.map((field) => (
                  <FormField key={field.name} field={field} register={register} error={pathValue(errors, field.name)?.message} />
                ))}
              </div>
            )}
          </section>

          <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
            <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                disabled={currentStep === 0}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-32"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {currentStep === detailPanels.length - 1 ? (
                <button
                  type="submit"
                  disabled={submitting}
                    className="inline-flex h-11 w-full items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70 sm:w-auto sm:min-w-44"
                >
                  {submitting ? 'Submitting...' : 'Submit Reference'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentStep((step) => Math.min(step + 1, detailPanels.length - 1))}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 sm:w-auto sm:min-w-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingValues)}
        title="Submit Candidate Reference"
        message={`Create candidate reference for ${pendingValues?.candidateName || 'this candidate'}?`}
        confirmText="Submit Reference"
        onCancel={() => setPendingValues(null)}
        onConfirm={async () => {
          const values = pendingValues
          setPendingValues(null)
          if (values) {
            await submit(values)
          }
        }}
      />
    </form>
  )
}

function ResumeUploadPanel({ file, error, onSelect, onRemove }) {
  return (
    <div className="px-4 py-5 sm:px-6">
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white text-sky-700 ring-1 ring-slate-200">
          <Upload className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-base font-bold text-slate-950">Upload Resume</h3>
        <p className="mt-1 text-sm text-slate-500">PDF, JPG, or PNG up to 10 MB.</p>

        <label className="mt-4 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 sm:w-auto">
          Choose Resume
          <input
            type="file"
            accept={resumeAccept}
            className="sr-only"
            onChange={(event) => {
              onSelect(Array.from(event.target.files || []))
              event.target.value = ''
            }}
          />
        </label>

        {file ? (
          <div className="mx-auto mt-4 flex max-w-xl items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
              aria-label="Remove resume"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
      </div>
    </div>
  )
}

function FormField({ field, register, error }) {
  const registerOptions = {
    setValueAs: (value) => normalizeFieldValue(field, value)
  }
  const className = field.kind === 'area' ? 'md:col-span-2' : ''

  return (
    <label className={`block min-w-0 text-sm font-semibold text-slate-700 ${className}`}>
      {field.label} {field.required ? <span className="text-rose-500">*</span> : null}
      {field.options ? (
        <select
          {...register(field.name, registerOptions)}
          className="mt-1 h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          {field.options.map((option) => (
            <option key={option || 'empty'} value={option}>
              {option || 'Select'}
            </option>
          ))}
        </select>
      ) : field.kind === 'area' ? (
        <textarea
          rows={4}
          {...register(field.name, registerOptions)}
          className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      ) : (
        <input
          type={field.type || 'text'}
          inputMode={field.inputMode}
          maxLength={field.maxLength}
          min={field.type === 'number' ? '0' : undefined}
          {...register(field.name, registerOptions)}
          className="mt-1 h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      )}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  )
}
